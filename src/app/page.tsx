import Link from "next/link";

import { GenZChatbot } from "@/components/GenZChatbot";
import { getSessionUser, toSafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const [user, memberCount, messagesSent] = await Promise.all([
    getSessionUser(),
    prisma.user.count(),
    prisma.message.count(),
  ]);

  const safeUser = user ? toSafeUser(user) : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-900/70 via-purple-900/50 to-indigo-900/50 p-10 shadow-2xl shadow-fuchsia-900/40">
        <p className="text-sm uppercase tracking-[0.4em] text-white/50">Pulse</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Mini social network with instant signups, follows, DMs, admin powers & a Gen-Z chatbot.
        </h1>
        <p className="mt-4 max-w-2xl text-white/70">
          Build a trusted community where people can join fast, follow friends, chat instantly, and let admins keep the orbit safe.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link
            href={safeUser ? "/dashboard" : "/auth/signup"}
            className="rounded-full border border-white/60 px-6 py-2 font-semibold text-white hover:bg-white/10"
          >
            {safeUser ? "Open dashboard" : "Create an account"}
          </Link>
          <Link
            href="/auth/login"
            className="rounded-full border border-white/60 px-6 py-2 font-semibold text-white hover:bg-white/10"
          >
            {safeUser ? "Switch account" : "Log in"}
          </Link>
        </div>
        <dl className="mt-10 grid grid-cols-2 gap-6 text-white/70 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-widest">Members</dt>
            <dd className="text-2xl font-semibold text-white">{memberCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest">Messages</dt>
            <dd className="text-2xl font-semibold text-white">{messagesSent}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest">Admin Access</dt>
            <dd className="text-lg font-semibold text-emerald-300">ready</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: safeUser ? "Invite a friend" : "Create account",
            body: safeUser
              ? "Share Pulse with your circle — invite friends straight to the dashboard."
              : "Jump in with a fresh profile so you can follow and message right away.",
            href: safeUser ? "/dashboard" : "/auth/signup",
            cta: safeUser ? "Go to dashboard" : "Sign up",
          },
          {
            title: safeUser ? "Switch account" : "Log in",
            body: safeUser
              ? "Need a different profile? Head to the auth page and sign in with another email."
              : "Already have an account? Drop back in and keep the conversations flowing.",
            href: "/auth/login",
            cta: safeUser ? "Switch" : "Log in",
          },
          {
            title: "Admin panel",
            body: "Moderators can manage users, follows, and messages directly from the control room.",
            href: "/admin",
            cta: "Open admin",
          },
        ].map((action) => (
          <article
            key={action.title}
            className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80 shadow-lg shadow-indigo-900/20"
          >
            <div>
              <h3 className="text-lg font-semibold text-white">{action.title}</h3>
              <p className="mt-2 text-white/70">{action.body}</p>
            </div>
            <Link
              href={action.href}
              className="mt-4 inline-flex items-center justify-center rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              {action.cta}
            </Link>
          </article>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Instant signups",
            body: "Create an account and access your dashboard immediately — no waiting for codes.",
          },
          {
            title: "Follow & message",
            body: "Build your orbit and slide into DMs with clean UI + secure APIs.",
          },
          {
            title: "Admin dashboard",
            body: "Built-in admin account to promote, demote, or purge trolls.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-white/5 bg-white/5 p-5 text-sm text-white/80"
          >
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-white/70">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <GenZChatbot />
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-white/80 shadow-2xl shadow-indigo-900/30">
          <p className="text-xs uppercase tracking-widest text-emerald-300">How it works</p>
          <ol className="mt-4 space-y-4">
            <li>
              <span className="font-semibold text-white">1. Sign up</span> · create an account and hop straight into the app—no email code required.
            </li>
            <li>
              <span className="font-semibold text-white">2. Follow & chat</span> · discover people, follow them, and send real-time messages inside your inbox.
            </li>
            <li>
              <span className="font-semibold text-white">3. Moderate</span> · log into the admin panel with the seeded credentials to manage every profile.
            </li>
          </ol>
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-white/60">
            <p>Need help? The chatbot is your Gen-Z copilot, and the dashboard surfaces everything else.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
