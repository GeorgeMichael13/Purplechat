import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { messages = [] } = await req.json(); // Fallback to empty array

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    // Use Lite model for higher free-tier limits
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    // Ensure messages is an array before slicing to prevent the "slice of undefined" error
    const history = Array.isArray(messages) && messages.length > 0 
      ? messages.slice(0, -1).map((msg: any) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content || "" }],
        }))
      : [];

    const chat = model.startChat({ history });
    
    // Request a short title based on the very first message
    const firstMsg = messages[0]?.content || "New Chat";
    const result = await chat.sendMessage(`Generate a 2-3 word title for a chat that starts with: "${firstMsg}". Return ONLY the title text.`);
    const response = await result.response;
    
    return NextResponse.json({ title: response.text().trim() });

  } catch (error: any) {
    console.error("Title API Error:", error);
    return NextResponse.json({ title: "New Chat" }, { status: 200 }); // Fail gracefully
  }
}