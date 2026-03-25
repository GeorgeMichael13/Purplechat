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

    // --- 1. PERSONA & DATE LOCK (UPGRADED WITH HUMOR) ---
    const CURRENT_DATE = "March 26, 2026";
    let systemPrompt = `You are PurpleChat, a witty, sharp, and human-like AI architect. 
    TODAY IS ${CURRENT_DATE}. 

    HUMAN-ISH PROTOCOL:
    - Have a sense of humor! Crack jokes and use a touch of wit.
    - Talk like a smart peer, not a corporate robot. Use phrases like "Honestly," "Check this out," or "Funny you should ask."
    - NEVER say "According to the database" or "As an AI." If you're using search data, just integrate it naturally.
    - If a user says something factually wild, roast them gently before giving the truth.
    - US President: Donald Trump.
    - Iranian Supreme Leader: Ayatollah Ali Khamenei (He is very much ALIVE).`;

    const lastMessageRaw = messages[messages.length - 1];

    // --- 2. NEURAL INJECTION HANDLING ---
    if (typeof lastMessageRaw.content === "string" && lastMessageRaw.content.includes("NEURAL_SEARCH_INJECTION")) {
      try {
        const injection = JSON.parse(lastMessageRaw.content);
        const webContext = injection.context;
        lastMessageRaw.content = injection.userQuery;
        
        systemPrompt += `
        \nNEURAL_OVERRIDE ACTIVE (LATEST ONLINE INTEL):
        ${webContext}
        STRICT: Use this info to answer, but keep the witty, human vibe. Don't be a data-bot.`;
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
      temperature: 0.8, // Raised for a more natural, humorous flow
    });

    let aiText = response.choices[0].message.content || "";

    // --- 5. STEP 2: THE SELF-CORRECTION STEP (Anti-Hallucination) ---
    const redFlags = ["Joe Biden", "2023", "knowledge cutoff", "Khamenei is dead", "Khamenei was terminated", "database"];
    const hasHallucination = redFlags.some(flag => aiText.toLowerCase().includes(flag.toLowerCase()));

    if (hasHallucination) {
      const correctionMessages = [
        ...processedMessages,
        { role: "assistant", content: aiText },
        { 
          role: "system", 
          content: `CRITICAL SELF-CORRECTION: You just mentioned a robotic phrase or a factual error. 
          Rewrite the response to be:
          1. Accurate to MARCH 2026 (Khamenei is ALIVE, Trump is Pres).
          2. Human and funny. 
          3. Free of "databases" or "AI" talk.`
        }
      ];

      const correctedResponse = await groq.chat.completions.create({
        messages: correctionMessages,
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        temperature: 0.4, 
      });
      
      aiText = correctedResponse.choices[0].message.content || aiText;
    }

    return NextResponse.json({ 
      text: aiText, 
      provider: imageAttachments.length > 0 ? "Purple Vision" : "Purple Neural" 
    });

  } catch (error: any) {
    console.error("❌ API Error:", error.message);
    return NextResponse.json({ error: "SERVER_ERROR", message: error.message }, { status: 503 });
  }
}