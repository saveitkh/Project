import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/protection/auth";
import { preLiveAuditSchema } from "@/lib/protection/validation";
import { createPreLiveAudit, listPreLiveAudits } from "@/lib/protection/preLiveService";
import { handleApiError } from "@/lib/protection/apiError";

export async function POST(req: NextRequest) {
  try {
    const user = await requireCustomer();
    const body = await req.json();
    const input = preLiveAuditSchema.parse(body);
    const result = await createPreLiveAudit(user.customer!.id, input);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET() {
  try {
    const user = await requireCustomer();
    const audits = await listPreLiveAudits(user.customer!.id);
    return NextResponse.json({ audits });
  } catch (err) {
    return handleApiError(err);
  }
}
