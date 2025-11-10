import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const peerId = searchParams.get("with");

  if (!peerId) {
    return NextResponse.json(
      { error: "Provide a user id via the `with` query parameter." },
      { status: 400 }
    );
  }

  const peerExists = await prisma.user.findUnique({ where: { id: peerId } });
  if (!peerExists) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: peerId },
        { senderId: peerId, receiverId: user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    messages: messages.map((message) => ({
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      createdAt: message.createdAt,
      isMine: message.senderId === user.id,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const parsed = messageSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { receiverId, content } = parsed.data;

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId,
        content,
      },
    });

    return NextResponse.json({
      message: {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        createdAt: message.createdAt,
        isMine: true,
      },
    });
  } catch (error) {
    console.error("Message error", error);
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }
}
