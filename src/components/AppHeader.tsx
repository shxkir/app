import Link from "next/link";

import { getSessionUser, toSafeUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { LogoutButton } from "./LogoutButton";

const buttonBase =
  "inline-flex items-center rounded-full border border-white/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:opacity-80 hover:underline";
const navButton =
  "inline-flex items-center rounded-full border border-white/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:opacity-80 hover:underline";

export async function AppHeader() {
  const user = await getSessionUser();
  const safeUser = user ? toSafeUser(user) : null;
  const isAdmin = user?.role === Role.ADMIN;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 text-white backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-4 text-sm">
        <Link href="/" className="text-lg font-black uppercase tracking-[0.4em] text-white">
          pulse
        </Link>

        <div className="ml-auto flex items-center gap-4">
          <nav className="flex items-center gap-2 text-white">
            <Link href="/" className={navButton}>
              Home
            </Link>
            {safeUser && (
              <>
                <Link href="/messages" className={navButton}>
                  Messages
                </Link>
                <Link href="/profile" className={navButton}>
                  Profile
                </Link>
                <Link href="/dashboard" className={navButton}>
                  Dashboard
                </Link>
              </>
            )}
            {isAdmin && (
              <Link href="/admin" className={navButton}>
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {!safeUser ? (
              <>
                <Link href="/auth/login" className={buttonBase}>
                  Login
                </Link>
                <Link href="/auth/register" className={`${buttonBase} border-white/60`}>
                  Register
                </Link>
              </>
            ) : (
              <>
                <LogoutButton />
                <Link href="/auth/login" className={buttonBase}>
                  Switch Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
