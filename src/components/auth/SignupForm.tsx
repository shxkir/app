"use client";

import { useState } from "react";

type FormState = {
  email: string;
  username: string;
  displayName: string;
  password: string;
  bio: string;
};

export function SignupForm() {
  const [form, setForm] = useState<FormState>({
    email: "",
    username: "",
    displayName: "",
    password: "",
    bio: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        const errorText = typeof data.error === "string" ? data.error : "Could not sign you up.";
        setMessage(errorText);
        return;
      }

      setMessage(data.message ?? "Account created. You can log in now.");
    } catch (error) {
      console.error(error);
      setMessage("Signup failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-white/70">
          Email
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-white"
          />
        </label>
        <label className="text-sm text-white/70">
          Username
          <input
            name="username"
            required
            value={form.username}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-white"
          />
        </label>
        <label className="text-sm text-white/70">
          Display name
          <input
            name="displayName"
            value={form.displayName}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-white"
          />
        </label>
        <label className="text-sm text-white/70">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-white"
          />
        </label>
      </div>
      <label className="text-sm text-white/70">
        Bio
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          rows={3}
          className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-white"
        />
      </label>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-fuchsia-500/80 py-3 font-semibold text-white transition hover:bg-fuchsia-500 disabled:opacity-60"
      >
        {isSubmitting ? "Creating account..." : "Sign up"}
      </button>
      {message && <p className="text-sm text-white/70">{message}</p>}
    </form>
  );
}
