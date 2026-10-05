import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/protection/auth";
import { getProtectionReportForView } from "@/lib/protection/reportService";
import { handleApiError } from "@/lib/protection/apiError";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const report = await getProtectionReportForView(id, user.customer?.id, user.role === "ADMIN");
    if (!report) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ report });
  } catch (err) {
    return handleApiError(err);
  }
}
