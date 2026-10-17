import { NextResponse } from "next/server";

export async function POST() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let roomId = "";
  for (let i = 0; i < 4; i++) {
    roomId += chars[Math.floor(Math.random() * chars.length)];
  }

  const hostToken = `ht_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;

  return NextResponse.json({
    success: true,
    roomId,
    hostToken
  });
}
