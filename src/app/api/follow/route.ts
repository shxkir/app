import { NextResponse } from "next/server";

import { getSessionUser, toSafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { followSchema } from "@/lib/validators";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [following, followers, suggestions] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: user.id },
      include: { following: true },
    }),
    prisma.follow.findMany({
      where: { followingId: user.id },
      include: { follower: true },
    }),
    prisma.user.findMany({
      where: {
        id: { not: user.id },
        followers: {
          none: {
            followerId: user.id,
          },
        },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    following: following.map((entry) => toSafeUser(entry.following)),
    followers: followers.map((entry) => toSafeUser(entry.follower)),
    suggestions: suggestions.map(toSafeUser),
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = followSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const targetId = parsed.data.userId;
    if (targetId === user.id) {
      return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetId,
        },
      },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return NextResponse.json({ message: "Unfollowed user." });
    }

    await prisma.follow.create({
      data: {
        followerId: user.id,
        followingId: targetId,
      },
    });

    return NextResponse.json({ message: "Now following this user." });
  } catch (error) {
    console.error("Follow error", error);
    return NextResponse.json({ error: "Unable to update follow state." }, { status: 500 });
  }
}
