"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    setIsPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("logout failed", error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex items-center rounded-full border border-white/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:opacity-80 hover:underline disabled:opacity-60"
    >
      {isPending ? "..." : "Logout"}
    </button>
  );
}
