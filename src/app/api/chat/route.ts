import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1].content;

    // Timeout logic to prevent the request from hanging
    const result = await Promise.race([
      chat.sendMessage(lastMessage),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000))
    ]) as any;

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    // We log the real error for you in the terminal
    console.error("Gemini API Error:", error.message);
    
    // We send a generic 500 status so the frontend can trigger a friendly message
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}