import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { toSafeUser, createSession, writeSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = loginSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    await prisma.session.deleteMany({ where: { userId: user.id } });
    const { token, expiresAt } = await createSession(user.id);
    await writeSessionCookie(token, expiresAt);

    return NextResponse.json({ user: toSafeUser(user) });
  } catch (error) {
    console.error("Login error", error);
    return NextResponse.json({ error: "Unable to log you in right now." }, { status: 500 });
  }
}
