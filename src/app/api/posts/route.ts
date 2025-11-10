import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

import { getSessionUser } from "@/lib/auth";
import { createPostRecord, fetchRecentPosts, serializePost } from "@/lib/posts";

export async function GET(request: Request) {
  const viewer = await getSessionUser();
  const { searchParams } = new URL(request.url);
  const authorId = searchParams.get("authorId") ?? undefined;
  const posts = await fetchRecentPosts(20, {
    authorId: authorId || undefined,
    viewerId: viewer?.id,
  });
  return NextResponse.json({
    posts: posts.map(serializePost),
  });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "You must be logged in to post." }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    let imageUrl = "";
    let caption = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image");
      caption = ((formData.get("caption") as string) ?? "").trim();
      if (file instanceof File && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });
        const extFromName =
          (file.name && file.name.includes(".") && file.name.split(".").pop()) || "";
        const extFromType =
          file.type && file.type.includes("/") ? file.type.split("/").pop() : "";
        const ext = (extFromName || extFromType || "jpg").replace(/[^a-zA-Z0-9]/g, "") || "jpg";
        const filename = `${crypto.randomUUID()}.${ext}`;
        await fs.writeFile(path.join(uploadsDir, filename), buffer);
        imageUrl = `/uploads/${filename}`;
      }
    } else {
      const body = await request.json();
      imageUrl = ((body.imageUrl as string) ?? "").trim();
      caption = ((body.caption as string) ?? "").trim();
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "Please upload an image." }, { status: 400 });
    }

    const post = await createPostRecord({
      authorId: user.id,
      imageUrl,
      caption: caption || null,
    });

    return NextResponse.json({
      post: serializePost(post),
    });
  } catch (error) {
    console.error("[POST /api/posts] failed", error);
    return NextResponse.json({ error: "Unable to share post." }, { status: 500 });
  }
}
