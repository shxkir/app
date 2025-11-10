import { NextResponse } from "next/server";

import { genZResponse } from "@/lib/chatbot";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt : "";
    const answer = genZResponse(prompt);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Chatbot error", error);
    return NextResponse.json(
      { answer: "uhhh my brain buffer glitched. try again womp womp." },
      { status: 500 }
    );
  }
}
