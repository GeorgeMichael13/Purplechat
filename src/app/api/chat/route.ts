import OpenAI from "openai";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const MAX_CHAR_LIMIT = 8000;

function truncate(text: string, limit: number) {
  if (!text) return "";
  return text.length > limit ? text.slice(0, limit) + "... [Content truncated]" : text;
}

export async function POST(req: Request) {
  try {
    const { messages = [] } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "CONFIG_ERROR", message: "Groq API key missing." },
        { status: 500 }
      );
    }

    // --- 1. PERSONA & DATE LOCK ---
    const CURRENT_DATE = "March 26, 2026";
    let systemPrompt = `You are PurpleChat, a witty, sharp, and slightly sarcastic AI companion. 
    TODAY IS ${CURRENT_DATE}. 

    PERSONALITY:
    - Be authentic, grounded, and use a touch of wit. 
    - NEVER say "According to the database" or "My knowledge cutoff."
    - If you're correcting a user's misconception, do it like a helpful peer, not a lecturer.
    - Current US President: Donald Trump.
    - Current Iranian Supreme Leader: Ayatollah Ali Khamenei (ALIVE).`;

    const lastMessageRaw = messages[messages.length - 1];

    // --- 2. NEURAL INJECTION HANDLING ---
    if (typeof lastMessageRaw.content === "string" && lastMessageRaw.content.includes("NEURAL_SEARCH_INJECTION")) {
      try {
        const injection = JSON.parse(lastMessageRaw.content);
        const webContext = injection.context;
        lastMessageRaw.content = injection.userQuery;
        
        systemPrompt += `
        \nNEURAL_OVERRIDE ACTIVE:
        Use this verified info for the response: ${webContext}
        STRICT: Do NOT mention "sources" or "databases" robotically. Just be a smart human.`;
      } catch (e) {
        console.error("Injection Parse Error:", e);
      }
    }

    // --- 3. ATTACHMENT & FILE LOGIC (Old Features Maintained) ---
    let fileContext = "";
    const lastMessage = lastMessageRaw; 
    const imageAttachments = lastMessage.attachments?.filter((a: any) => a.isImage) || [];

    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
      let parsePdf;
      try {
        const pdfModule: any = await import("pdf-parse");
        parsePdf = pdfModule.default || pdfModule;
      } catch (importErr) { console.error("PDF Import Error:", importErr); }

      for (const file of lastMessage.attachments) {
        if (file.type === "application/pdf" && file.base64 && parsePdf) {
          try {
            const buffer = Buffer.from(file.base64, "base64");
            const data = await parsePdf(buffer);
            fileContext += `\n[File: ${file.name}]\n${truncate(data.text, MAX_CHAR_LIMIT)}\n`;
          } catch (pdfErr) { console.error("PDF Parsing Error:", pdfErr); }
        } else if (file.extractedText && !file.isImage) {
          fileContext += `\n[File: ${file.name}]\n${truncate(file.extractedText, MAX_CHAR_LIMIT)}\n`;
        }
      }
    }

    const recentMessages = messages.length > 6 ? messages.slice(-6) : messages;

    const processedMessages = recentMessages.map((m: any, index: number) => {
      const isLast = index === recentMessages.length - 1;
      const role = m.role === "model" || m.role === "assistant" ? "assistant" : "user";

      if (isLast && imageAttachments.length > 0) {
        const contentArray: any[] = [{ 
          type: "text", 
          text: truncate(fileContext ? `FILES:\n${fileContext}\n\nQ: ${m.content || "Analyze image"}` : (m.content || "Analyze image"), MAX_CHAR_LIMIT) 
        }];
        imageAttachments.forEach((img: any) => {
          contentArray.push({ type: "image_url", image_url: { url: img.data.startsWith('data:') ? img.data : `data:${img.type};base64,${img.data}` } });
        });
        return { role, content: contentArray };
      }

      let textContent = m.content;
      if (isLast && fileContext) {
        textContent = `FILES:\n${fileContext}\n\nUSER QUESTION: ${m.content}`;
      }
      return { role, content: truncate(textContent, MAX_CHAR_LIMIT) };
    });

    processedMessages.unshift({ role: "system", content: systemPrompt });

    const groq = new OpenAI({ 
      apiKey: process.env.GROQ_API_KEY, 
      baseURL: "https://api.groq.com/openai/v1" 
    });

    // --- 4. STEP 1: INITIAL GENERATION ---
    const response = await groq.chat.completions.create({
      messages: processedMessages,
      model: imageAttachments.length > 0 ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile",
      max_tokens: 1024,
      temperature: 0.7, // Slightly higher for wit
    });

    let aiText = response.choices[0].message.content || "";

    // --- 5. STEP 2: THE SELF-CORRECTION STEP (Anti-Hallucination) ---
    // Detect "Red Flags" in the AI's own response
    const redFlags = ["Joe Biden", "2023", "knowledge cutoff", "Khamenei is dead", "Khamenei was terminated", "database"];
    const hasHallucination = redFlags.some(flag => aiText.toLowerCase().includes(flag.toLowerCase()));

    if (hasHallucination) {
      const correctionMessages = [
        ...processedMessages,
        { role: "assistant", content: aiText },
        { 
          role: "system", 
          content: `CRITICAL SELF-CORRECTION: You just mentioned a red-flag topic (either 2023, Biden, or a fake death). 
          Rewrite the response:
          1. Ensure the date is MARCH 2026.
          2. Ensure Ayatollah Khamenei is ALIVE. 
          3. Keep the witty personality. 
          4. REMOVE any mention of "databases" or "according to my info."`
        }
      ];

      const correctedResponse = await groq.chat.completions.create({
        messages: correctionMessages,
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        temperature: 0.3, // Lower for precision
      });
      
      aiText = correctedResponse.choices[0].message.content || aiText;
    }

    return NextResponse.json({ 
      text: aiText, 
      provider: imageAttachments.length > 0 ? "Purple Vision" : "Purple Text" 
    });

  } catch (error: any) {
    console.error("❌ API Error:", error.message);
    return NextResponse.json({ error: "SERVER_ERROR", message: error.message }, { status: 503 });
  }
}