import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/protection/auth";
import { prisma } from "@/lib/protection/prisma";
import { endLiveSessionById } from "@/lib/protection/liveSessionService";
import { handleApiError } from "@/lib/protection/apiError";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const session = await prisma.liveSession.findUnique({ where: { id } });
    if (!session) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (user.role !== "ADMIN" && session.customerId !== user.customer?.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const result = await endLiveSessionById(id);
    return NextResponse.json({ ok: true, report: result.report, readiness: result.readiness });
  } catch (err) {
    return handleApiError(err);
  }
}
