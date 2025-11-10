import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    message: "Verification is no longer required. Please log in directly after signing up.",
  });
}
