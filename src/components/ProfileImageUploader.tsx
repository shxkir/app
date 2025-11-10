"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/Avatar";

type ProfileImageUploaderProps = {
  initialImage: string | null;
  displayName: string | null;
  username: string;
};

export function ProfileImageUploader({ initialImage, displayName, username }: ProfileImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(initialImage);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const nameForFallback = displayName ?? username;
  const avatarSrc = previewUrl ?? currentImage;

  const resetPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = () => {
    const selected = inputRef.current?.files?.[0] ?? null;
    setFile(selected);
    setStatus(null);
    resetPreview();
    if (selected) {
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setStatus("Choose an image first.");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/users/profile-image", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        const message = typeof data.error === "string" ? data.error : "Upload failed.";
        setStatus(message);
        return;
      }
      const nextImage = data?.user?.profileImage ?? null;
      setCurrentImage(nextImage);
      setStatus("Updated!");
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      resetPreview();
    } catch (error) {
      console.error(error);
      setStatus("Upload failed. Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-white">
      <div className="flex items-center gap-4">
        <Avatar src={avatarSrc} alt={`${username}'s avatar`} fallbackLabel={nameForFallback} size="lg" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Profile image</p>
          <p className="text-sm text-white/80">Upload a square image for best results.</p>
          {status && <p className="text-xs text-emerald-300">{status}</p>}
        </div>
      </div>
      <label className="flex flex-col gap-2 rounded-2xl border border-dashed border-white/20 p-4 text-sm text-white/80">
        <span className="text-xs uppercase tracking-[0.3em] text-white/50">Select image</span>
        <input
          ref={inputRef}
          onChange={handleFileChange}
          type="file"
          accept="image/*"
          className="text-white/80 file:mr-3 file:rounded-full file:border-none file:bg-white/90 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-slate-900"
        />
        {previewUrl && <span className="text-xs text-white/60">Preview ready – save to apply.</span>}
      </label>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="submit"
          disabled={isUploading || !file}
          className="rounded-full bg-white/90 px-6 py-2 font-semibold text-slate-900 transition hover:bg-white disabled:opacity-60"
        >
          {isUploading ? "Saving..." : "Save image"}
        </button>
        {!status && <span className="text-xs uppercase tracking-[0.3em] text-white/50">PNG or JPG</span>}
      </div>
    </form>
  );
}
