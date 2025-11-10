import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

import { getSessionUser, toSafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const AVATAR_SUBDIR = path.join(process.cwd(), "public", "uploads", "avatars");

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Upload form data." }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Select an image to upload." }, { status: 400 });
    }

    if (file.type && !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Please upload a valid image." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.mkdir(AVATAR_SUBDIR, { recursive: true });

    const extFromName =
      (file.name && file.name.includes(".") && file.name.split(".").pop()) || "";
    const extFromType = file.type && file.type.includes("/") ? file.type.split("/").pop() : "";
    const ext = (extFromName || extFromType || "png").replace(/[^a-zA-Z0-9]/g, "") || "png";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const filepath = path.join(AVATAR_SUBDIR, filename);
    await fs.writeFile(filepath, buffer);

    const publicUrl = `/uploads/avatars/${filename}`;
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { profileImage: publicUrl },
    });

    return NextResponse.json({ user: toSafeUser(updated) });
  } catch (error) {
    console.error("[POST /api/users/profile-image] failed", error);
    return NextResponse.json({ error: "Unable to update profile image." }, { status: 500 });
  }
}
