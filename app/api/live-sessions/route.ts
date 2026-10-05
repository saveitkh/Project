import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/protection/auth";
import { createAndStartLiveSession, listLiveSessions } from "@/lib/protection/liveSessionService";
import { startLiveSessionSchema } from "@/lib/protection/validation";
import { handleApiError } from "@/lib/protection/apiError";

export async function POST(req: NextRequest) {
  try {
    const user = await requireCustomer();
    const body = await req.json();
    const input = startLiveSessionSchema.parse(body);
    const result = await createAndStartLiveSession(
      user.customer!.id,
      input.tiktokUsername,
      input.mode,
      input.preLiveAuditId
    );
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET() {
  try {
    const user = await requireCustomer();
    const sessions = await listLiveSessions(user.customer!.id);
    return NextResponse.json({ sessions });
  } catch (err) {
    return handleApiError(err);
  }
}
