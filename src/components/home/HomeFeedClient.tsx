"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { CreatePostForm } from "@/components/CreatePostForm";
import type { FeedPost } from "@/types/posts";

type HomeFeedClientProps = {
  initialPosts: FeedPost[];
  currentUserId: string | null;
  feedEndpoint?: string;
  allowCreate?: boolean;
};

export function HomeFeedClient({
  initialPosts,
  currentUserId,
  feedEndpoint = "/api/posts",
  allowCreate = true,
}: HomeFeedClientProps) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likePending, setLikePending] = useState<string | null>(null);
  const [commentPending, setCommentPending] = useState<string | null>(null);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const fetchPosts = useCallback(async () => {
    const response = await fetch(feedEndpoint);
    let data: { posts?: FeedPost[]; error?: string } | null = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) {
      const message = data && typeof data.error === "string" ? data.error : "Unable to load feed.";
      console.error(message);
      return [];
    }
    if (!data || !Array.isArray(data.posts)) {
      return [];
    }
    return data.posts;
  }, [feedEndpoint]);

  const refreshPosts = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const latest = await fetchPosts();
      setPosts(latest);
    } catch (refreshError) {
      console.error(refreshError);
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh feed.");
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPosts]);

  useEffect(() => {
    const interval = setInterval(() => {
      void refreshPosts();
    }, 8000);
    return () => clearInterval(interval);
  }, [refreshPosts]);

  const handlePostCreated = (post: FeedPost) => {
    setPosts((prev) => {
      const filtered = prev.filter((existing) => existing.id !== post.id);
      return [post, ...filtered];
    });
  };

  const updatePost = useCallback((postId: string, updater: (post: FeedPost) => FeedPost) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? updater(post) : post)));
  }, []);

  const handleToggleLike = useCallback(
    async (postId: string) => {
      if (!currentUserId) {
        setError("Log in to interact with posts.");
        return;
      }
      setLikePending(postId);
      updatePost(postId, (post) => ({
        ...post,
        viewerHasLiked: !post.viewerHasLiked,
        likeCount: Math.max(0, post.likeCount + (post.viewerHasLiked ? -1 : 1)),
      }));
      try {
        const response = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "Unable to like that post.");
        }
        updatePost(postId, (post) => ({
          ...post,
          viewerHasLiked: data.liked,
          likeCount: data.likeCount,
        }));
      } catch (likeError) {
        console.error(likeError);
        await refreshPosts();
      } finally {
        setLikePending(null);
      }
    },
    [currentUserId, refreshPosts, updatePost]
  );

  const handleAddComment = useCallback(
    async (postId: string, content: string) => {
      if (!currentUserId) {
        setError("Log in to comment.");
        return { success: false };
      }
      setCommentPending(postId);
      try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "Unable to comment.");
        }
        updatePost(postId, (post) => ({
          ...post,
          commentCount: data.commentCount,
          comments: [data.comment, ...post.comments].slice(0, 3),
        }));
        return { success: true };
      } catch (commentError) {
        console.error(commentError);
        setError(commentError instanceof Error ? commentError.message : "Unable to comment.");
        return { success: false };
      } finally {
        setCommentPending(null);
      }
    },
    [currentUserId, updatePost]
  );

  const groupedPosts = useMemo(() => posts, [posts]);

  return (
    <section className="space-y-4">
      {allowCreate && currentUserId && <CreatePostForm onPostCreated={handlePostCreated} />}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Latest posts</h2>
        <button
          onClick={() => void refreshPosts()}
          disabled={isRefreshing}
          className="text-xs uppercase tracking-widest text-white/60 hover:text-white disabled:opacity-60"
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {error && <p className="text-xs text-rose-300">{error}</p>}
      <div className="space-y-4">
        {groupedPosts.length === 0 && (
          <p className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            No posts yet. Be the first to share something.
          </p>
        )}
        {groupedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isMine={post.author.id === currentUserId}
            currentUserId={currentUserId}
            onToggleLike={() => void handleToggleLike(post.id)}
            onAddComment={(content) => handleAddComment(post.id, content)}
            likePending={likePending === post.id}
            commentPending={commentPending === post.id}
          />
        ))}
      </div>
    </section>
  );
}

type PostCardProps = {
  post: FeedPost;
  isMine: boolean;
  currentUserId: string | null;
  likePending: boolean;
  commentPending: boolean;
  onToggleLike: () => Promise<void> | void;
  onAddComment: (content: string) => Promise<{ success: boolean }>;
};

function PostCard({
  post,
  isMine,
  currentUserId,
  likePending,
  commentPending,
  onToggleLike,
  onAddComment,
}: PostCardProps) {
  const [comment, setComment] = useState("");
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const timestamp = useMemo(() => {
    const date = new Date(post.createdAt);
    const formatter = new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
    return formatter.format(date);
  }, [post.createdAt]);

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!comment.trim() || commentPending) {
      return;
    }
    const result = await onAddComment(comment.trim());
    if (result.success) {
      setComment("");
    }
  };

  const handleShare = async () => {
    if (!currentUserId) {
      setShareStatus("Log in to share posts.");
      setTimeout(() => setShareStatus(null), 2500);
      return;
    }
    const shareUrl = `${window.location.origin}/users/${post.author.username}?post=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.author.displayName ?? post.author.username} on Pulse`,
          text: post.caption ?? undefined,
          url: shareUrl,
        });
        setShareStatus("Shared!");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus("Link copied");
      } else {
        setShareStatus("Copy the link: " + shareUrl);
      }
    } catch (shareError) {
      if ((shareError as DOMException)?.name === "AbortError") {
        setShareStatus("Share canceled");
      } else {
        console.error(shareError);
        setShareStatus("Unable to share");
      }
    } finally {
      setTimeout(() => setShareStatus(null), 2500);
    }
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 text-sm text-white/80 shadow-xl shadow-black/30">
      <header className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-sm font-semibold text-white">
          {post.author.displayName?.[0]?.toUpperCase() ?? post.author.username[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-white">{post.author.displayName ?? `@${post.author.username}`}</p>
          <p className="text-xs text-white/50">
            @{post.author.username} · {timestamp}
          </p>
        </div>
        {isMine && <span className="text-xs uppercase tracking-widest text-emerald-300">you</span>}
      </header>
      {post.imageUrl && (
        <div className="relative aspect-[4/5] w-full bg-black/30">
          <Image
            src={post.imageUrl}
            alt={post.caption ?? "Pulse post"}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <footer className="space-y-4 px-5 py-4">
        <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.3em] text-white/60">
          <button
            disabled={!currentUserId || likePending}
            onClick={() => void onToggleLike()}
            className={`transition hover:text-white ${!currentUserId ? "opacity-40" : ""}`}
          >
            {post.viewerHasLiked ? "Liked" : "Like"} · {post.likeCount}
          </button>
          <span>Comments · {post.commentCount}</span>
          <button
            onClick={() => void handleShare()}
            disabled={!currentUserId}
            className={`transition hover:text-white ${!currentUserId ? "opacity-40" : ""}`}
          >
            Share
          </button>
          {shareStatus && <span className="text-[10px] uppercase tracking-widest text-emerald-300">{shareStatus}</span>}
        </div>
        {post.caption && (
          <p className="text-sm text-white">
            <span className="font-semibold mr-2">{post.author.username}</span>
            {post.caption}
          </p>
        )}

        <div className="space-y-3">
          {post.comments.length > 0 && (
            <div className="space-y-2">
              {post.comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
                  <p className="text-white">
                    <span className="font-semibold mr-1">{comment.author.displayName ?? `@${comment.author.username}`}</span>
                    {comment.content}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40">
                    {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(comment.createdAt))}
                  </p>
                </div>
              ))}
            </div>
          )}

          {currentUserId ? (
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={500}
                placeholder="Write a comment..."
                className="flex-1 rounded-2xl border border-white/20 bg-transparent px-3 py-2 text-xs text-white placeholder:text-white/40 focus:border-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={commentPending || !comment.trim()}
                className="rounded-2xl bg-white/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-white disabled:opacity-60"
              >
                {commentPending ? "..." : "Send"}
              </button>
            </form>
          ) : (
            <p className="text-xs text-white/50">Log in to comment or share posts.</p>
          )}
        </div>
      </footer>
    </article>
  );
}
