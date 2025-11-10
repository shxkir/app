import { NextResponse } from "next/server";

import { requireAuth, toSafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminUserActionSchema } from "@/lib/validators";

export async function GET() {
  const admin = await requireAuth({ mustBeAdmin: true });
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
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
    })),
  });
}

export async function POST(request: Request) {
  const admin = await requireAuth({ mustBeAdmin: true });
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const parsed = adminUserActionSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { userId, action } = parsed.data;

    if (userId === admin.id && action === "delete") {
      return NextResponse.json(
        { error: "You cannot delete your own admin account." },
        { status: 400 }
      );
    }

    if (action === "delete") {
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ message: "User deleted." });
    }

    const role = action === "promote" ? "ADMIN" : "USER";
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json({
      message: `User role updated to ${role}.`,
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error("Admin action error", error);
    return NextResponse.json({ error: "Unable to update user." }, { status: 500 });
  }
}
