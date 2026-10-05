import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/protection/auth";
import { prisma } from "@/lib/protection/prisma";
import { addEvidence } from "@/lib/protection/incidentService";
import { handleApiError } from "@/lib/protection/apiError";

const VALID_TYPES = new Set(["SCREENSHOT", "LOG", "DOCUMENT", "OFFICIAL_NOTIFICATION", "OTHER"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (user.role !== "ADMIN" && incident.customerId !== user.customer?.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const formData = await req.formData();
    const type = String(formData.get("type") ?? "OTHER");
    if (!VALID_TYPES.has(type)) {
      return NextResponse.json({ error: "Invalid evidence type." }, { status: 400 });
    }
    const description = String(formData.get("description") ?? "");
    if (!description) {
      return NextResponse.json({ error: "Description is required." }, { status: 400 });
    }
    const file = formData.get("file");

    const evidence = await addEvidence(
      id,
      type as "SCREENSHOT" | "LOG" | "DOCUMENT" | "OFFICIAL_NOTIFICATION" | "OTHER",
      description,
      file instanceof File ? file : null
    );
    return NextResponse.json({ evidence }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
