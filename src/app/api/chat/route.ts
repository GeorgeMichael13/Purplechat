import OpenAI from "openai";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// --- NEW PERMANENT FIX HELPERS ---
const MAX_CHAR_LIMIT = 8000; // Approx 2k tokens, safe buffer for the 12k TPM limit

function truncate(text: string, limit: number) {
  if (!text) return "";
  return text.length > limit ? text.slice(0, limit) + "... [Content truncated for API limits]" : text;
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

    let fileContext = "";
    const lastMessage = messages[messages.length - 1];
    
    // --- DETECT IMAGES (Maintained) ---
    const imageAttachments = lastMessage.attachments?.filter((a: any) => a.isImage) || [];

    // --- PDF/FILE LOGIC (Maintained & Improved with Truncation) ---
    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
      let parsePdf;
      try {
        // @ts-ignore
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
            // IMPROVED: Truncate PDF text to stay under TPM limits
            const safeText = truncate(data.text, MAX_CHAR_LIMIT);
            fileContext += `\n[File: ${file.name}]\n${safeText}\n`;
          } catch (pdfErr) {
            console.error("PDF Parsing Error:", pdfErr);
          }
        } else if (file.extractedText && !file.isImage) {
          // IMPROVED: Truncate extracted text
          const safeExtracted = truncate(file.extractedText, MAX_CHAR_LIMIT);
          fileContext += `\n[File: ${file.name}]\n${safeExtracted}\n`;
        }
      }
    }

    // --- CONTEXT PRUNING: Only keep the last 6 messages to save tokens ---
    const recentMessages = messages.length > 6 ? messages.slice(-6) : messages;

    // --- PREPARE MESSAGES (Maintained with safe truncation) ---
    const processedMessages = recentMessages.map((m: any, index: number) => {
      const isLast = index === recentMessages.length - 1;
      const role = m.role === "model" || m.role === "assistant" ? "assistant" : "user";

      // Vision Logic (Maintained)
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

      // Standard Text Logic (Maintained with safe truncation)
      let textContent = m.content;
      if (isLast && fileContext) {
        textContent = `CONTEXT FROM UPLOADED FILES:\n${fileContext}\n\nUSER QUESTION: ${m.content}`;
      }
      
      return { role, content: truncate(textContent, MAX_CHAR_LIMIT) };
    });

    const groq = new OpenAI({ 
      apiKey: process.env.GROQ_API_KEY, 
      baseURL: "https://api.groq.com/openai/v1" 
    });

    const selectedModel = imageAttachments.length > 0 
      ? "meta-llama/llama-4-scout-17b-16e-instruct" 
      : "llama-3.3-70b-versatile"; 

    const response = await groq.chat.completions.create({
      messages: processedMessages,
      model: selectedModel,
      max_tokens: 1024,
    });

    return NextResponse.json({ 
      text: response.choices[0].message.content, 
      provider: imageAttachments.length > 0 ? "Purple Vision" : "Purple Text" 
    });

  } catch (error: any) {
    console.error("❌ API Error:", error.message);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: error.message },
      { status: 503 }
    );
  }
}