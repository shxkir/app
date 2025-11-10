import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { createPostComment } from "@/lib/posts";

type Params = {
  postId: string;
};

export async function POST(request: Request, { params }: { params: Params | Promise<Params> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const rawPostId = resolvedParams?.postId;
  const postId = Array.isArray(rawPostId) ? rawPostId[0] : rawPostId;
  if (!postId) {
    return NextResponse.json({ error: "Invalid post." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const content = typeof body.content === "string" ? body.content : "";
    const result = await createPostComment(postId, user.id, content);
    return NextResponse.json({
      comment: {
        ...result.comment,
        createdAt: result.comment.createdAt.toISOString(),
      },
      commentCount: result.commentCount,
    });
  } catch (error) {
    console.error("[POST /api/posts/[postId]/comments] failed", error);
    return NextResponse.json({ error: "Unable to add comment." }, { status: 500 });
  }
}
