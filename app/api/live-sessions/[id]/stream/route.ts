import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/protection/auth";
import { prisma } from "@/lib/protection/prisma";
import { subscribe } from "@/lib/tiktok-live/eventBus";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream of live-session events for /live-monitor.
 * Transport detail only — the honesty labeling (REAL/SIMULATED/
 * CUSTOMER_PROVIDED) lives on each event itself (see lib/tiktok-live),
 * unaffected by how it's delivered to the browser.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const { id } = await params;

  const session = await prisma.liveSession.findUnique({ where: { id } });
  if (!session) return new Response("Not found", { status: 404 });
  if (user.role !== "ADMIN" && session.customerId !== user.customer?.id) {
    return new Response("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      unsubscribe = subscribe(id, (event) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      });
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, 15000);
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
