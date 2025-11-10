import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { HomeFeedClient } from "@/components/home/HomeFeedClient";
import { ProfileImageUploader } from "@/components/ProfileImageUploader";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchRecentPosts, serializePost } from "@/lib/posts";

type UserProfilePageProps = {
  params: { username: string };
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const rawParam = (params?.username ?? "") as string | string[];
  const username = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  if (!username) {
    notFound();
  }
  const viewerPromise = getSessionUser();

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const viewer = await viewerPromise;
  const isSelf = viewer?.id === user.id;
  let viewerFollowsUser = false;
  if (viewer && !isSelf) {
    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewer.id,
          followingId: user.id,
        },
      },
      select: { id: true },
    });
    viewerFollowsUser = Boolean(followRecord);
  }

  const userPosts = await fetchRecentPosts(20, { authorId: user.id, viewerId: viewer?.id });
  const initialPosts = userPosts.map((post) => serializePost(post));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-white">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-5">
            <Avatar
              src={user.profileImage}
              alt={`${user.username}'s avatar`}
              fallbackLabel={user.displayName ?? user.username}
              size="lg"
              className="h-14 w-14 md:h-16 md:w-16"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Profile</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                {user.displayName ?? user.username}
              </h1>
              <p className="text-white/60">@{user.username}</p>
              {user.bio && <p className="mt-4 text-sm text-white/70">{user.bio}</p>}
            </div>
          </div>
          <div className="flex gap-4">
            <Stat label="Followers" value={user._count.followers} />
            <Stat label="Following" value={user._count.following} />
            <Stat label="Posts" value={user._count.posts} />
          </div>
        </div>
        {isSelf && (
          <div className="mt-6">
            <ProfileImageUploader
              initialImage={user.profileImage ?? null}
              displayName={user.displayName}
              username={user.username}
            />
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-white/70">
          {isSelf ? (
            <span className="rounded-full border border-white/30 px-4 py-1 text-white">This is you</span>
          ) : viewer ? (
            <>
              <FollowButton
                targetUserId={user.id}
                currentUserId={viewer.id}
                initialFollowing={viewerFollowsUser}
                size="compact"
              />
              <Link href="/messages" className="rounded-full border border-white/30 px-4 py-1 text-white hover:bg-white/10">
                Message
              </Link>
            </>
          ) : (
            <Link href="/auth/login" className="rounded-full border border-white/30 px-4 py-1 text-white hover:bg-white/10">
              Login to follow
            </Link>
          )}
        </div>
      </section>

      <section className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {isSelf ? "Your recent posts" : `${user.displayName ?? `@${user.username}`} · feed`}
          </h2>
          <Link href="/" className="text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white">
            Back home
          </Link>
        </div>
        <HomeFeedClient
          initialPosts={initialPosts}
          currentUserId={viewer?.id ?? null}
          feedEndpoint={`/api/posts?authorId=${encodeURIComponent(user.id)}`}
          allowCreate={isSelf}
        />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/15 px-4 py-2 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
