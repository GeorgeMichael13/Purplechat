import OpenAI from "openai";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const MAX_CHAR_LIMIT = 8000;

function truncate(text: any, limit: number): string {
  if (!text || typeof text !== "string") return "";
  return text.length > limit ? text.slice(0, limit) + "... [Truncated]" : text;
}

export async function POST(req: Request) {
  // Start a simple timer
  const startTime = Date.now();

  try {
    const { messages = [] } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "CONFIG_ERROR", message: "API key missing." }, { status: 500 });
    }

    const groq = new OpenAI({ 
      apiKey: process.env.GROQ_API_KEY, 
      baseURL: "https://api.groq.com/openai/v1" 
    });

    const CURRENT_DATE = "March 26, 2026";
    let systemPrompt = `You are PurpleChat, a witty Gen Z AI. TODAY IS ${CURRENT_DATE}. Current Pres: Trump. Khamenei is ALIVE. Use emojis ✨💀. No 'AI' talk.`;

    const lastMessageRaw = messages[messages.length - 1] || { content: "" };

    // --- NEURAL INJECTION ---
    if (typeof lastMessageRaw.content === "string" && lastMessageRaw.content.includes("NEURAL_SEARCH_INJECTION")) {
      try {
        const injection = JSON.parse(lastMessageRaw.content);
        lastMessageRaw.content = injection.userQuery;
        systemPrompt += `\nNEURAL_OVERRIDE: ${injection.context}`;
      } catch (e) { console.error("JSON Parse Error"); }
    }

    // --- PDF/FILE HANDLING (Simplified for speed) ---
    let fileContext = "";
    if (lastMessageRaw.attachments?.length > 0) {
      for (const file of lastMessageRaw.attachments) {
        if (file.extractedText) {
          fileContext += `\n[File: ${file.name}]\n${truncate(file.extractedText, 2000)}\n`;
        }
      }
    }

    // --- MESSAGE PROCESSING (Defensive against undefined) ---
    const imageAttachments = lastMessageRaw.attachments?.filter((a: any) => a?.isImage) || [];
    const recentMessages = messages.slice(-6);

    const processedMessages = recentMessages.map((m: any) => {
      const role = m.role === "model" || m.role === "assistant" ? "assistant" : "user";
      const safeContent = m.content || ""; // Fixes the undefined issue

      if (m === lastMessageRaw && imageAttachments.length > 0) {
        const contentArray: any[] = [{ 
          type: "text", 
          text: truncate(fileContext ? `FILES:\n${fileContext}\n\nQ: ${safeContent}` : safeContent, MAX_CHAR_LIMIT)
        }];

        imageAttachments.forEach((img: any) => {
          if (img.data) {
            const url = img.data.startsWith("data:") ? img.data : `data:${img.type || "image/jpeg"};base64,${img.data}`;
            contentArray.push({ type: "image_url", image_url: { url } });
          }
        });
        return { role, content: contentArray };
      }

      return { role, content: truncate(safeContent, MAX_CHAR_LIMIT) };
    });

    processedMessages.unshift({ role: "system", content: systemPrompt });

    // --- AI CALL ---
    const response = await groq.chat.completions.create({
      messages: processedMessages,
      model: imageAttachments.length > 0 ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile",
      max_tokens: 1024,
      temperature: 0.8,
    });

    let aiText = response.choices[0]?.message?.content || "";

    // --- OPTIMIZED SELF-CORRECTION ---
    // Only correct if we have plenty of time left (under 6 seconds spent)
    const timeElapsed = (Date.now() - startTime) / 1000;
    const redFlags = ["Joe Biden", "knowledge cutoff", "Khamenei is dead", "as an AI"];
    
    if (timeElapsed < 6 && redFlags.some(flag => aiText.toLowerCase().includes(flag))) {
      const corrected = await groq.chat.completions.create({
        messages: [
          ...processedMessages,
          { role: "assistant", content: aiText },
          { role: "system", content: "CORRECTION: You used old data. Fix it now. Khamenei is ALIVE. Trump is Pres. Be witty." }
        ],
        model: "llama-3.3-70b-versatile",
        max_tokens: 800,
      });
      aiText = corrected.choices[0]?.message?.content || aiText;
    }

    return NextResponse.json({ 
      text: aiText || "I'm drawing a blank, try again? 🧠", 
      provider: imageAttachments.length > 0 ? "Purple Vision 👁️" : "Purple Neural 🧠" 
    });

  } catch (error: any) {
    console.error("❌ CRITICAL API ERROR:", error);
    // Return a 500 but with a JSON message so the UI doesn't crash
    return NextResponse.json({ 
      error: "SERVER_ERROR", 
      text: "Ugh, my brain just glitched. (API Error) 💀",
      message: error.message 
    }, { status: 500 });
  }
}