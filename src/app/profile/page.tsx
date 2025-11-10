import Link from "next/link";
import { redirect } from "next/navigation";

import { Avatar } from "@/components/Avatar";
import { ProfileImageUploader } from "@/components/ProfileImageUploader";
import { HomeFeedClient } from "@/components/home/HomeFeedClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchRecentPosts, serializePost } from "@/lib/posts";

export const metadata = {
  title: "Your Profile",
};

export default async function ProfilePage() {
  const viewer = await getSessionUser();
  if (!viewer) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: viewer.id },
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
    redirect("/auth/login");
  }

  const userPosts = await fetchRecentPosts(20, { authorId: user.id, viewerId: user.id });
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
        <div className="mt-6">
          <ProfileImageUploader
            initialImage={user.profileImage ?? null}
            displayName={user.displayName}
            username={user.username}
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-white/70">
          <span className="rounded-full border border-white/30 px-4 py-1 text-white">This is you</span>
        </div>
      </section>

      <section className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Your recent posts</h2>
          <Link href="/" className="text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white">
            Back home
          </Link>
        </div>
        <HomeFeedClient
          initialPosts={initialPosts}
          currentUserId={user.id}
          feedEndpoint={`/api/posts?authorId=${encodeURIComponent(user.id)}`}
          allowCreate
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
