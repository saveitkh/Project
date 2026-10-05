import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/protection/auth";
import { prisma } from "@/lib/protection/prisma";
import { emitNextSimulatedEvent } from "@/lib/tiktok-live/connector";
import { handleApiError } from "@/lib/protection/apiError";

/**
 * Convenience endpoint for the /live-monitor "Simulate next event" button
 * and for manual testing. Only works for SIMULATED sessions — forcing an
 * event out of turn on a real connector session is not something this
 * system does.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const session = await prisma.liveSession.findUnique({ where: { id } });
    if (!session) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (user.role !== "ADMIN" && session.customerId !== user.customer?.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    if (session.adapterMode !== "SIMULATED") {
      return NextResponse.json({ error: "Only SIMULATED sessions support manual event stepping." }, { status: 400 });
    }

    const emitted = emitNextSimulatedEvent(id);
    return NextResponse.json({ emitted });
  } catch (err) {
    return handleApiError(err);
  }
}
