"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FollowButtonProps = {
  targetUserId: string;
  currentUserId: string;
  initialFollowing?: boolean;
  className?: string;
  size?: "default" | "compact";
};

export function FollowButton({
  targetUserId,
  currentUserId,
  initialFollowing = false,
  className = "",
  size = "default",
}: FollowButtonProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUserId || !targetUserId || targetUserId === currentUserId) {
    return null;
  }

  const baseClass =
    "rounded-full border border-white/40 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/10 disabled:opacity-50";
  const sizeClass = size === "compact" ? "px-3 py-1" : "px-5 py-2";
  const buttonClasses = `${baseClass} ${sizeClass} ${className}`.trim();

  const handleToggle = async () => {
    setError(null);
    setIsPending(true);
    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Log in to follow people.");
        }
        const data = await response.json().catch(() => ({}));
        const message = typeof data.error === "string" ? data.error : "Unable to update follow.";
        throw new Error(message);
      }
      setIsFollowing((prev) => !prev);
      router.refresh();
    } catch (toggleError) {
      console.error(toggleError);
      setError(toggleError instanceof Error ? toggleError.message : "Unable to update follow.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button onClick={() => void handleToggle()} disabled={isPending} className={buttonClasses}>
        {isPending ? "..." : isFollowing ? "Following" : "Follow"}
      </button>
      {error && <span className="text-[10px] uppercase tracking-widest text-rose-300">{error}</span>}
    </div>
  );
}
