import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/protection/auth";
import { addScriptVersion, getPracticeSession } from "@/lib/protection/practiceService";
import { handleApiError } from "@/lib/protection/apiError";
import { z } from "zod";

const schema = z.object({ scriptText: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const session = await getPracticeSession(id);
    if (!session) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (user.role !== "ADMIN" && session.preLiveAudit.customerId !== user.customer?.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const body = await req.json();
    const { scriptText } = schema.parse(body);
    const version = await addScriptVersion(id, scriptText);
    return NextResponse.json({ version }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
