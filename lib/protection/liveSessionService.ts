import { prisma } from "./prisma";
import {
  ConnectorMode,
  ingestManualEvent,
  startLiveSession,
  stopLiveSession,
} from "@/lib/tiktok-live/connector";
// Side-effect import: registers the order/pin-suggestion reaction on the
// connector's event bus without connector.ts needing to know about it.
import "./orderSuggestionHandler";

export async function createAndStartLiveSession(
  customerId: string,
  tiktokUsername: string,
  mode: ConnectorMode,
  preLiveAuditId?: string
) {
  const existingAccount = await prisma.tikTokAccount.findFirst({
    where: { customerId, usernameHandle: tiktokUsername },
  });
  const tiktokAccount =
    existingAccount ??
    (await prisma.tikTokAccount.create({ data: { customerId, usernameHandle: tiktokUsername } }));

  const session = await prisma.liveSession.create({
    data: {
      customerId,
      tiktokAccountId: tiktokAccount.id,
      preLiveAuditId,
      status: "CONNECTING",
      dataSource: "UNAVAILABLE",
      adapterMode: mode,
    },
  });

  const result = await startLiveSession(session.id, tiktokUsername, mode);

  const updated = await prisma.liveSession.findUniqueOrThrow({ where: { id: session.id } });
  return { session: updated, connectResult: result };
}

export async function endLiveSessionById(sessionId: string) {
  await stopLiveSession(sessionId);
  const { generateLiveSessionReport } = await import("./liveReportService");
  return generateLiveSessionReport(sessionId);
}

export async function listLiveSessions(customerId: string) {
  return prisma.liveSession.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: { tiktokAccount: true },
  });
}

export async function getLiveSessionWithEvents(sessionId: string) {
  return prisma.liveSession.findUnique({
    where: { id: sessionId },
    include: {
      tiktokAccount: true,
      events: {
        orderBy: { occurredAt: "asc" },
        include: { riskFindings: true, orderSuggestions: true },
      },
      orderSuggestions: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function addManualEvent(
  sessionId: string,
  raw: { type: string; username?: string; text?: string }
): Promise<void> {
  await ingestManualEvent(sessionId, raw);
}
