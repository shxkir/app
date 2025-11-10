"use client";

import { FormEvent, useRef, useState } from "react";

import type { FeedPost } from "@/types/posts";

type CreatePostFormProps = {
  onPostCreated?: (post: FeedPost) => void;
};

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    try {
      const formData = new FormData();
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        formData.append("image", file);
      }
      formData.append("caption", caption);

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        const message = typeof data.error === "string" ? data.error : "Could not share that post.";
        setStatus(message);
        return;
      }
      const post: FeedPost = data.post;
      onPostCreated?.(post);
      setCaption("");
      setPreviewName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setStatus("Shared!");
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = () => {
    const file = fileInputRef.current?.files?.[0];
    setPreviewName(file ? file.name : null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white shadow-lg shadow-black/20"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Create Post</h3>
        {status && <span className="text-xs text-white/60">{status}</span>}
      </div>
      <div className="mt-4 space-y-4 text-sm text-white/80">
        <label className="flex flex-col gap-2 rounded-2xl border border-dashed border-white/20 p-4">
          <span className="text-xs uppercase tracking-widest text-white/60">Upload image</span>
          <input
            ref={fileInputRef}
            onChange={handleFileChange}
            type="file"
            accept="image/*"
            required
            className="text-white/80 file:mr-3 file:rounded-full file:border-none file:bg-white/90 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-slate-900"
          />
          {previewName && <p className="text-xs text-white/60">Selected: {previewName}</p>}
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-white/60">Caption</span>
          <textarea
            value={caption}
            maxLength={280}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Write a caption..."
            className="min-h-[80px] rounded-2xl border border-white/15 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-white/90 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:opacity-60"
        >
          {isSubmitting ? "Posting..." : "Share now"}
        </button>
      </div>
    </form>
  );
}
