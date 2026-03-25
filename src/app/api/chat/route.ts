import OpenAI from "openai";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

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
    
    // --- NEW: Detect Images for Vision Support ---
    const imageAttachments = lastMessage.attachments?.filter((a: any) => a.isImage) || [];

    // --- FILE INTELLIGENCE LOGIC (Original Maintained with TS Fix) ---
    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
      let parsePdf;
      try {
        // FIXED: Added @ts-ignore and any cast to satisfy Netlify's build engine
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
            // Maintained: Trim text to avoid 413 errors
            const safeText = data.text.length > 12000 ? data.text.slice(0, 12000) + "..." : data.text;
            fileContext += `\n[File: ${file.name}]\n${safeText}\n`;
          } catch (pdfErr) {
            console.error("PDF Parsing Error:", pdfErr);
          }
        } else if (file.extractedText && !file.isImage) {
          const safeExtracted = file.extractedText.length > 12000 ? file.extractedText.slice(0, 12000) + "..." : file.extractedText;
          fileContext += `\n[File: ${file.name}]\n${safeExtracted}\n`;
        }
      }
    }

    // --- ENHANCED: Prepare messages for Groq with Multimodal support ---
    const processedMessages = messages.map((m: any, index: number) => {
      const isLast = index === messages.length - 1;
      const role = m.role === "model" ? "assistant" : m.role;

      if (isLast && imageAttachments.length > 0) {
        const contentArray: any[] = [
          {
            type: "text",
            text: fileContext 
              ? `CONTEXT FROM UPLOADED FILES:\n${fileContext}\n\nUSER QUESTION: ${m.content}`
              : m.content
          }
        ];

        imageAttachments.forEach((img: any) => {
          contentArray.push({
            type: "image_url",
            image_url: {
              url: img.data // Base64 string from client
            }
          });
        });

        return { role, content: contentArray };
      }

      let content = m.content;
      if (isLast && fileContext) {
        content = `CONTEXT FROM UPLOADED FILES:\n${fileContext}\n\nUSER QUESTION: ${m.content}`;
      }
      return { role, content: content };
    });

    const groq = new OpenAI({ 
      apiKey: process.env.GROQ_API_KEY, 
      baseURL: "https://api.groq.com/openai/v1" 
    });

    // --- 2026 UPDATED MODEL SELECTION ---
    const selectedModel = imageAttachments.length > 0 
      ? "meta-llama/llama-4-scout-17b-16e-instruct" // Current Vision Standard
      : "llama-3.3-70b-versatile";                 // Current Text Standard

    const response = await groq.chat.completions.create({
      messages: processedMessages,
      model: selectedModel,
    });

    return NextResponse.json({ 
      text: response.choices[0].message.content, 
      provider: imageAttachments.length > 0 ? "Groq Vision" : "Groq" 
    });

  } catch (error: any) {
    console.error("❌ API Error:", error.message);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: error.message },
      { status: 503 }
    );
  }
}