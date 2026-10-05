import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/protection/auth";
import { prisma } from "@/lib/protection/prisma";
import { createIncident } from "@/lib/protection/incidentService";
import { incidentSchema } from "@/lib/protection/validation";
import { handleApiError } from "@/lib/protection/apiError";

export async function POST(req: NextRequest) {
  try {
    const user = await requireCustomer();
    const body = await req.json();
    const input = incidentSchema.parse(body);
    const incident = await createIncident(user.customer!.id, input);
    return NextResponse.json({ incident }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET() {
  try {
    const user = await requireCustomer();
    const incidents = await prisma.incident.findMany({
      where: { customerId: user.customer!.id },
      orderBy: { createdAt: "desc" },
      include: { evidence: true, appealCase: true },
    });
    return NextResponse.json({ incidents });
  } catch (err) {
    return handleApiError(err);
  }
}
