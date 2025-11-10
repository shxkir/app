import { redirect } from "next/navigation";

import { MessagesClient } from "@/components/messages/MessagesClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function MessagesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

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
  const initialConversations = [];
  for (const message of timeline) {
    const peer = message.senderId === user.id ? message.receiver : message.sender;
    const key = [user.id, peer.id].sort().join(":");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    initialConversations.push({
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-white">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Inbox</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Messages</h1>
            <p className="text-white/60">Stay up to date with every DM.</p>
          </div>
        </div>
      </div>
      <MessagesClient initialConversations={initialConversations} />
    </div>
  );
}
