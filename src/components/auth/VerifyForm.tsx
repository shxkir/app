"use client";

import { useState } from "react";

export function VerifyForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (!response.ok) {
        const message = typeof data.error === "string" ? data.error : "Verification failed.";
        setStatus(message);
        return;
      }

      setStatus(data.message ?? "Email verified. You can log in now!");
    } catch (error) {
      console.error(error);
      setStatus("Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="text-sm text-white/70">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-white"
        />
      </label>
      <label className="text-sm text-white/70">
        6-digit code
        <input
          type="text"
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-white tracking-[0.3em]"
        />
      </label>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-indigo-500/80 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
      >
        {isSubmitting ? "Verifying..." : "Verify email"}
      </button>
      {status && <p className="text-sm text-white/70">{status}</p>}
    </form>
  );
}
