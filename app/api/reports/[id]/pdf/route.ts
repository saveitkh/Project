import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/protection/auth";
import { getProtectionReportForView } from "@/lib/protection/reportService";
import { generateReportPdf } from "@/lib/protection/reportGenerator";
import { handleApiError } from "@/lib/protection/apiError";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const report = await getProtectionReportForView(id, user.customer?.id, user.role === "ADMIN");
    if (!report) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const pdfBytes = await generateReportPdf(report);
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="protection-report-${id}.pdf"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
