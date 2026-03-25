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

    // --- ENHANCED: PERSONA LOCK & NEURAL OVERRIDE ---
    let webContext = "";
    let systemPrompt = `You are PurpleChat Neural, a high-speed AI system operating LIVE in March 2026. 
    STRICT RULES:
    1. NEVER mention a "knowledge cutoff," "2023," or "training data."
    2. NEVER apologize for not having real-time info.
    3. You ARE in 2026. Act like it.
    4. If asked about the US President, the answer is Donald Trump (47th President).`;

    const lastMessageRaw = messages[messages.length - 1];

    if (typeof lastMessageRaw.content === "string" && lastMessageRaw.content.includes("NEURAL_SEARCH_INJECTION")) {
      try {
        const injection = JSON.parse(lastMessageRaw.content);
        webContext = injection.context;
        lastMessageRaw.content = injection.userQuery;
        
        systemPrompt = `
          SYSTEM PROTOCOL: NEURAL_OVERRIDE_2026
          CURRENT_DATE: March 26, 2026.
          
          FACTUAL TRUTH DATABASE:
          ${webContext}
          
          MANDATORY INSTRUCTIONS:
          - Use the "FACTUAL TRUTH DATABASE" as your primary memory.
          - The current President is Donald Trump. State this as a direct fact.
          - Forbidden phrases: "As of my last update," "I don't have access to live info," "My knowledge ends in."
          - Answer the user's query directly using the provided data.
        `;
      } catch (e) {
        console.error("Injection Parse Error:", e);
      }
    }

    let fileContext = "";
    const lastMessage = lastMessageRaw; 
    const imageAttachments = lastMessage.attachments?.filter((a: any) => a.isImage) || [];

    // --- PDF/FILE LOGIC (Maintained) ---
    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
      let parsePdf;
      try {
        const pdfModule: any = await import("pdf-parse");
        parsePdf = pdfModule.default || pdfModule;
      } catch (importErr) {
        console.error("❌ Failed to load pdf-parse:", importErr);
      }

      for (const file of lastMessage.attachments) {
        if (file.type === "application/pdf" && file.base64 && parsePdf) {
          try {
            const buffer = Buffer.from(file.base64, "base64");
            const data = await parsePdf(buffer);
            const safeText = truncate(data.text, MAX_CHAR_LIMIT);
            fileContext += `\n[File: ${file.name}]\n${safeText}\n`;
          } catch (pdfErr) {
            console.error("PDF Parsing Error:", pdfErr);
          }
        } else if (file.extractedText && !file.isImage) {
          const safeExtracted = truncate(file.extractedText, MAX_CHAR_LIMIT);
          fileContext += `\n[File: ${file.name}]\n${safeExtracted}\n`;
        }
      }
    }

    const recentMessages = messages.length > 6 ? messages.slice(-6) : messages;

    const processedMessages = recentMessages.map((m: any, index: number) => {
      const isLast = index === recentMessages.length - 1;
      const role = m.role === "model" || m.role === "assistant" ? "assistant" : "user";

      if (isLast && imageAttachments.length > 0) {
        const contentArray: any[] = [
          {
            type: "text",
            text: truncate(
              fileContext 
                ? `CONTEXT FROM UPLOADED FILES:\n${fileContext}\n\nUSER QUESTION: ${m.content || "Analyze image"}`
                : (m.content || "Analyze image"),
              MAX_CHAR_LIMIT
            )
          }
        ];

        imageAttachments.forEach((img: any) => {
          const imageUrl = img.data.startsWith('data:') ? img.data : `data:${img.type};base64,${img.data}`;
          contentArray.push({ type: "image_url", image_url: { url: imageUrl } });
        });

        return { role, content: contentArray };
      }

      let textContent = m.content;
      if (isLast && fileContext) {
        textContent = `CONTEXT FROM UPLOADED FILES:\n${fileContext}\n\nUSER QUESTION: ${m.content}`;
      }
      
      return { role, content: truncate(textContent, MAX_CHAR_LIMIT) };
    });

    processedMessages.unshift({ role: "system", content: systemPrompt });

    const groq = new OpenAI({ 
      apiKey: process.env.GROQ_API_KEY, 
      baseURL: "https://api.groq.com/openai/v1" 
    });

    // --- STEP 1: INITIAL GENERATION ---
    const response = await groq.chat.completions.create({
      messages: processedMessages,
      model: imageAttachments.length > 0 ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile",
      max_tokens: 1024,
      temperature: 0.2, // Low temperature for accuracy
    });

    let aiText = response.choices[0].message.content || "";

    // --- STEP 2: TRUTH GUARD (Anti-Hallucination) ---
    // If the model still tries to say Biden or mention 2023 cutoffs, we force a correction.
    if (aiText.includes("Joe Biden") || aiText.includes("cutoff") || aiText.includes("2023")) {
      const correctionMessages = [
        ...processedMessages,
        { role: "assistant", content: aiText },
        { role: "user", content: "CRITICAL: You just provided outdated 2023 data. Rewrite your response using the 2026 data provided in the System Protocol. The President is Donald Trump." }
      ];

      const correctedResponse = await groq.chat.completions.create({
        messages: correctionMessages,
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        temperature: 0.1,
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