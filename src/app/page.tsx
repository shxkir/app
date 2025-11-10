import Link from "next/link";

import { Role } from "@prisma/client";

import { FollowButton } from "@/components/FollowButton";
import { GenZChatbot } from "@/components/GenZChatbot";
import { HomeFeedClient } from "@/components/home/HomeFeedClient";
import { getSessionUser, toSafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchRecentPosts, serializePost } from "@/lib/posts";
import type { FeedPost } from "@/types/posts";

export default async function Home() {
  const user = await getSessionUser();
  const [memberCount, messagesSent, postResults] = await Promise.all([
    prisma.user.count(),
    prisma.message.count(),
    fetchRecentPosts(20, { viewerId: user?.id }),
  ]);

  const safeUser = user ? toSafeUser(user) : null;
  const isAdmin = safeUser?.role === Role.ADMIN;

  const suggestedUsers = await prisma.user.findMany({
    where: safeUser ? { id: { not: safeUser.id } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const followingMap = new Map<string, boolean>();
  if (safeUser && suggestedUsers.length > 0) {
    const followMatches = await prisma.follow.findMany({
      where: {
        followerId: safeUser.id,
        followingId: { in: suggestedUsers.map((person) => person.id) },
      },
      select: { followingId: true },
    });
    followMatches.forEach((entry) => followingMap.set(entry.followingId, true));
  }

  const initialPosts: FeedPost[] = (postResults ?? []).map((post) => serializePost(post));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-12">
      {isAdmin && (
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-900/70 via-purple-900/50 to-indigo-900/50 p-10 shadow-2xl shadow-fuchsia-900/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-white/50">Pulse</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Mini social network vibes: follow friends, send DMs, and keep the feed alive.
              </h1>
              <p className="mt-4 max-w-2xl text-white/70">
                Pulse gives you a dashboard with follows, messages, admin tools, and a chaotic Gen-Z chatbot — all out of the box.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm">
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
            </div>
            <dl className="grid grid-cols-3 gap-6 rounded-2xl border border-white/20 bg-white/5 p-4 text-center text-white/80">
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-white/50">Members</dt>
                <dd className="text-2xl font-semibold text-white">{memberCount}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-white/50">Messages</dt>
                <dd className="text-2xl font-semibold text-white">{messagesSent}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-white/50">Admin access</dt>
                <dd className="text-2xl font-semibold text-emerald-300">ready</dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <HomeFeedClient initialPosts={initialPosts} currentUserId={safeUser?.id ?? null} />
        <aside className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Suggested for you</h3>
              <span className="text-xs uppercase tracking-widest text-white/40">new</span>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              {suggestedUsers.length === 0 && <li>No suggestions yet.</li>}
              {suggestedUsers.map((suggested) => (
                <li key={suggested.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 px-3 py-3">
                  <div>
                    <p className="font-semibold text-white">
                      {suggested.displayName ?? `@${suggested.username}`}
                    </p>
                    <p className="text-xs text-white/50">@{suggested.username}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    <Link
                      href={`/users/${encodeURIComponent(suggested.username)}`}
                      className="text-[11px] uppercase tracking-[0.3em] text-white/70 hover:text-white"
                    >
                      View
                    </Link>
                    {safeUser ? (
                      <FollowButton
                        targetUserId={suggested.id}
                        currentUserId={safeUser.id}
                        initialFollowing={followingMap.get(suggested.id) ?? false}
                        size="compact"
                      />
                    ) : (
                      <Link
                        href="/auth/login"
                        className="text-[11px] uppercase tracking-[0.3em] text-white/70 hover:text-white"
                      >
                        Login to follow
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <GenZChatbot />
        </aside>
      </div>
    </div>
  );
}
