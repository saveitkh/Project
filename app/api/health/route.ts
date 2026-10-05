import { NextResponse } from "next/server";
import { prisma } from "@/lib/protection/prisma";

// Without this, Next.js statically pre-renders this route at build time
// (it has no dynamic data access like cookies()) and would freeze the
// response — including the DB check — forever at the build-time result,
// defeating the point of a health check.
export const dynamic = "force-dynamic";

export async function GET() {
  let dbHealthy = true;
  let dbError: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbHealthy = false;
    dbError = err instanceof Error ? err.message : "Unknown DB error";
  }

  const officialApiConfigured = Boolean(
    process.env.TIKTOK_OFFICIAL_API_BASE_URL && process.env.TIKTOK_OFFICIAL_API_CLIENT_ID
  );

  const healthy = dbHealthy;
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks: {
        database: dbHealthy ? "ok" : "error",
        databaseError: dbError,
        officialTikTokApiConfigured: officialApiConfigured,
      },
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
