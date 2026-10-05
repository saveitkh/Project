import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/protection/auth";
import { prisma } from "@/lib/protection/prisma";
import { handleApiError } from "@/lib/protection/apiError";

export async function GET() {
  try {
    await requireAdmin();

    const [customers, preLiveAudits, practiceSessions, riskFindings, incidents, appeals] = await Promise.all([
      prisma.customer.count(),
      prisma.preLiveAudit.count(),
      prisma.practiceSession.count(),
      prisma.riskFinding.count(),
      prisma.incident.count(),
      prisma.appealCase.count(),
    ]);

    let dbHealthy = true;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbHealthy = false;
    }

    const officialApiConfigured = Boolean(
      process.env.TIKTOK_OFFICIAL_API_BASE_URL && process.env.TIKTOK_OFFICIAL_API_CLIENT_ID
    );

    // Deliberately excludes User.passwordHash — no query here selects it,
    // and no customer-facing field surfaces it.
    const recentCustomers = await prisma.customer.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        companyName: true,
        market: true,
        protectionPlan: true,
        createdAt: true,
        user: { select: { email: true, createdAt: true } },
      },
    });

    return NextResponse.json({
      counts: { customers, preLiveAudits, practiceSessions, riskFindings, incidents, appeals },
      systemHealth: { dbHealthy },
      apiHealth: { officialApiConfigured },
      recentCustomers,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
