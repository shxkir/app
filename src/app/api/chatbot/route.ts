import { NextResponse } from "next/server";

import { genZResponse } from "@/lib/chatbot";
import { getSessionUser, toSafeUser } from "@/lib/auth";
import { countPostsByAuthor } from "@/lib/posts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt : "";
    const user = await getSessionUser();
    const safeUser = user ? toSafeUser(user) : null;

    let userPostCount: number | null = null;
    if (safeUser && /\bpost\b/i.test(prompt)) {
      userPostCount = await countPostsByAuthor(safeUser.id);
    }
    const answer = await genZResponse(prompt, {
      user: safeUser,
      userPostCount,
    });

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Chatbot error", error);
    return NextResponse.json(
      { answer: "uhhh my brain buffer glitched. try again womp womp." },
      { status: 500 }
    );
  }
}
