import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/protection/auth";
import { prepareAppealDraft, getIncidentWithEvidence } from "@/lib/protection/incidentService";
import { handleApiError } from "@/lib/protection/apiError";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const incident = await getIncidentWithEvidence(id);
    if (!incident) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (user.role !== "ADMIN" && incident.customerId !== user.customer?.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const appeal = await prepareAppealDraft(id);
    return NextResponse.json({ appeal });
  } catch (err) {
    return handleApiError(err);
  }
}
