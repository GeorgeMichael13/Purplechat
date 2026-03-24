import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages = [] } = await req.json();
    
    // If no messages, just return a default
    if (!messages || messages.length === 0) {
      return NextResponse.json({ title: "New Chat" });
    }

    // Safety check for API key
    if (!process.env.GROQ_API_KEY) {
      console.error("❌ Title Error: GROQ_API_KEY is missing");
      return NextResponse.json({ title: "PurpleChat" });
    }

    const firstMessage = messages[0].content.substring(0, 50);
    const prompt = `Create a short 2-word title for this chat based on this message: "${firstMessage}". Return only the title text, no quotes.`;

    const groq = new OpenAI({ 
      apiKey: process.env.GROQ_API_KEY, 
      baseURL: "https://api.groq.com/openai/v1" 
    });

    const res = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant", // Using the 8b model because it's lightning fast for titles
      max_tokens: 10,
      temperature: 0.7,
    });

    const title = res.choices[0].message.content?.replace(/["*.]/g, "").trim() || "New Chat";

    console.log(`✅ Title Generated: ${title}`);

    return NextResponse.json({ title });

  } catch (error: any) {
    console.error("❌ Title Generation Failed:", error.message);
    // Fallback so the app doesn't crash if the title fails
    return NextResponse.json({ title: "New Chat" });
  }
}