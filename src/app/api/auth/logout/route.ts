import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { clearSessionCookie, deleteSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await deleteSession(token);
    }
    await clearSessionCookie();
    return NextResponse.json({ message: "Logged out." });
  } catch (error) {
    console.error("Logout error", error);
    return NextResponse.json({ error: "Unable to log out." }, { status: 500 });
  }
}
