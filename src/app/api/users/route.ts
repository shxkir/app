import { NextResponse } from "next/server";

import { getSessionUser, toSafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const currentUser = await getSessionUser();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      ...toSafeUser(user),
      followerCount: user._count.followers,
      followingCount: user._count.following,
      isCurrentUser: currentUser ? user.id === currentUser.id : false,
    })),
  });
}

