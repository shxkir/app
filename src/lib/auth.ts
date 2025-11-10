import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";

import { Role, User } from "@prisma/client";

import { prisma } from "./prisma";

export const SESSION_COOKIE_NAME = "session_token";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SafeUser = {
  id: string;
  email: string;
  username: string;
  profileImage: string | null;
  displayName: string | null;
  bio: string | null;
  role: Role;
  isVerified: boolean;
  createdAt: string;
};

export const toSafeUser = (user: User): SafeUser => ({
  id: user.id,
  email: user.email,
  username: user.username,
  profileImage: user.profileImage,
  displayName: user.displayName,
  bio: user.bio,
  role: user.role,
  isVerified: user.isVerified,
  createdAt: user.createdAt.toISOString(),
});

const isProduction = process.env.NODE_ENV === "production";

export async function createSession(userId: string) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export async function writeSessionCookie(token: string, expires: Date) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
    expires,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) {
    await clearSessionCookie();
    return null;
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    await clearSessionCookie();
    return null;
  }

  return session.user;
}

export async function requireAuth(options?: { mustBeAdmin?: boolean }) {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  if (options?.mustBeAdmin && user.role !== Role.ADMIN) {
    return null;
  }

  return user;
}
