import OpenAI from "openai";
import { NextResponse } from "next/server";

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

    // --- FILE INTELLIGENCE LOGIC ---
    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
      let parsePdf;
      try {
        // Robust dynamic import for CommonJS compatibility
        const pdfModule = await import("pdf-parse");
        parsePdf = pdfModule.default || pdfModule;
      } catch (importErr) {
        console.error("❌ Failed to load pdf-parse:", importErr);
      }

      for (const file of lastMessage.attachments) {
        if (file.type === "application/pdf" && file.base64 && parsePdf) {
          try {
            const buffer = Buffer.from(file.base64, "base64");
            const data = await parsePdf(buffer);
            fileContext += `\n[File: ${file.name}]\n${data.text}\n`;
          } catch (pdfErr) {
            console.error("PDF Parsing Error:", pdfErr);
          }
        } else if (file.extractedText) {
          fileContext += `\n[File: ${file.name}]\n${file.extractedText}\n`;
        }
      }
    }

    // Prepare messages for Groq
    const processedMessages = messages.map((m: any, index: number) => {
      const isLast = index === messages.length - 1;
      let content = m.content;
      if (isLast && fileContext) {
        content = `CONTEXT FROM UPLOADED FILES:\n${fileContext}\n\nUSER QUESTION: ${m.content}`;
      }
      return {
        role: m.role === "model" ? "assistant" : m.role,
        content: content
      };
    });

    const groq = new OpenAI({ 
      apiKey: process.env.GROQ_API_KEY, 
      baseURL: "https://api.groq.com/openai/v1" 
    });

    const response = await groq.chat.completions.create({
      messages: processedMessages,
      model: "llama-3.3-70b-versatile",
    });

    return NextResponse.json({ 
      text: response.choices[0].message.content, 
      provider: "Groq" 
    });

  } catch (error: any) {
    console.error("❌ API Error:", error.message);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: error.message },
      { status: 503 }
    );
  }
}