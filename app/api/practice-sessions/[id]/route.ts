import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/protection/auth";
import { getPracticeSession } from "@/lib/protection/practiceService";
import { handleApiError } from "@/lib/protection/apiError";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const session = await getPracticeSession(id);
    if (!session) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (user.role !== "ADMIN" && session.preLiveAudit.customerId !== user.customer?.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch (err) {
    return handleApiError(err);
  }
}
