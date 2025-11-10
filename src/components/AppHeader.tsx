import Link from "next/link";

import { getSessionUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { LogoutButton } from "./LogoutButton";

export async function AppHeader() {
  const user = await getSessionUser();
  const isAdmin = user?.role === Role.ADMIN;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-sm">
        <Link href="/" className="font-semibold uppercase tracking-[0.2em] text-white">
          pulse
        </Link>
        <nav className="flex items-center gap-4 text-white/80">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
          {isAdmin && (
            <Link href="/admin" className="hover:text-white">
              Admin
            </Link>
          )}
          {!user && (
            <>
              <Link
                href="/auth/signup"
                className="rounded-full border border-white/40 px-3 py-1 hover:bg-white/10"
              >
                Create Account
              </Link>
              <Link href="/auth/login" className="rounded-full border border-white/40 px-3 py-1">
                Log In
              </Link>
            </>
          )}
          {user && (
            <div className="flex items-center gap-3">
              <span className="hidden text-white/60 sm:block">
                {user.displayName ?? user.username}
              </span>
              <LogoutButton />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
