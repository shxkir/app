import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { togglePostLike } from "@/lib/posts";

type Params = {
  postId: string;
};

export async function POST(_: Request, { params }: { params: Params | Promise<Params> }) {
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
    const result = await togglePostLike(postId, user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/posts/[postId]/like] failed", error);
    return NextResponse.json({ error: "Unable to toggle like." }, { status: 500 });
  }
}
