import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/protection/auth";
import { prisma } from "@/lib/protection/prisma";
import { createPracticeSession } from "@/lib/protection/practiceService";
import { handleApiError } from "@/lib/protection/apiError";
import { z } from "zod";

const createSchema = z.object({ preLiveAuditId: z.string().min(1), label: z.string().optional() });

export async function POST(req: NextRequest) {
  try {
    const user = await requireCustomer();
    const body = await req.json();
    const { preLiveAuditId, label } = createSchema.parse(body);

    const audit = await prisma.preLiveAudit.findUnique({ where: { id: preLiveAuditId } });
    if (!audit || audit.customerId !== user.customer!.id) {
      return NextResponse.json({ error: "Pre-LIVE audit not found." }, { status: 404 });
    }

    const session = await createPracticeSession(preLiveAuditId, label);
    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
