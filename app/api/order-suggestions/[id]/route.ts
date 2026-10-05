import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/protection/auth";
import { prisma } from "@/lib/protection/prisma";
import { handleApiError } from "@/lib/protection/apiError";
import { z } from "zod";

const schema = z.object({ status: z.enum(["CONFIRMED", "DISMISSED"]) });

/**
 * Lets the seller confirm or dismiss a detected order suggestion. This
 * NEVER creates a real order on TikTok Shop or anywhere else — "CONFIRMED"
 * only means the seller has acknowledged it in their own fulfillment
 * process outside this system.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const suggestion = await prisma.orderSuggestion.findUnique({
      where: { id },
      include: { liveSession: true },
    });
    if (!suggestion) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (user.role !== "ADMIN" && suggestion.liveSession.customerId !== user.customer?.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const { status } = schema.parse(await req.json());
    const updated = await prisma.orderSuggestion.update({
      where: { id },
      data: { status, confirmedAt: status === "CONFIRMED" ? new Date() : null },
    });
    return NextResponse.json({ orderSuggestion: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
