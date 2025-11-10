import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const timeline = await prisma.message.findMany({
      where: {
        OR: [{ senderId: user.id }, { receiverId: user.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    });

    const seen = new Set<string>();
    const conversations = [];

    for (const message of timeline) {
      const peer = message.senderId === user.id ? message.receiver : message.sender;
      const key = [user.id, peer.id].sort().join(":");
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      conversations.push({
        id: peer.id,
        peer: {
          id: peer.id,
          username: peer.username,
          displayName: peer.displayName,
          profileImage: peer.profileImage,
        },
        lastMessage: {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          isMine: message.senderId === user.id,
        },
      });
    }

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("[GET /api/messages/conversations] failed", error);
    return NextResponse.json({ error: "Unable to load conversations." }, { status: 500 });
  }
}
