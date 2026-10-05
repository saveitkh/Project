import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/protection/auth";
import { prisma } from "@/lib/protection/prisma";
import { addManualEvent } from "@/lib/protection/liveSessionService";
import { manualLiveEventSchema } from "@/lib/protection/validation";
import { handleApiError } from "@/lib/protection/apiError";

/** Phase 8 fallback: manual event entry when the connector is unavailable. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const session = await prisma.liveSession.findUnique({ where: { id } });
    if (!session) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (user.role !== "ADMIN" && session.customerId !== user.customer?.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const body = await req.json();
    const input = manualLiveEventSchema.parse(body);
    await addManualEvent(id, input);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
