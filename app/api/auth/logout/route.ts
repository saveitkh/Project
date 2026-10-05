import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/protection/auth";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
