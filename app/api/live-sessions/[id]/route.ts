import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/protection/auth";
import { getLiveSessionWithEvents } from "@/lib/protection/liveSessionService";
import { handleApiError } from "@/lib/protection/apiError";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const session = await getLiveSessionWithEvents(id);
    if (!session) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (user.role !== "ADMIN" && session.customerId !== user.customer?.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch (err) {
    return handleApiError(err);
  }
}
