import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/protection/auth";
import { getPreLiveAudit } from "@/lib/protection/preLiveService";
import { handleApiError } from "@/lib/protection/apiError";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const audit = await getPreLiveAudit(user.customer?.id ?? "", id, user.role === "ADMIN");
    if (!audit) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ audit });
  } catch (err) {
    return handleApiError(err);
  }
}
