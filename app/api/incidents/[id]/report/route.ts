import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/protection/auth";
import { buildIncidentReport, getIncidentWithEvidence } from "@/lib/protection/incidentService";
import { handleApiError } from "@/lib/protection/apiError";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const incident = await getIncidentWithEvidence(id);
    if (!incident) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (user.role !== "ADMIN" && incident.customerId !== user.customer?.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const report = buildIncidentReport(incident, incident.evidence);
    return NextResponse.json({ report });
  } catch (err) {
    return handleApiError(err);
  }
}
