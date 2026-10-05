import { prisma } from "@/lib/protection/prisma";
import { analyzeStatement } from "@/lib/protection/riskEngine";
import { OfficialApiAdapter } from "./adapter";
import { normalizeEvent } from "./normalizer";
import { publish } from "./eventBus";
import { SimulatedAdapter } from "./simulatedAdapter";
import { EventConfidence, EventSource, NormalizedLiveEvent, TikTokLiveAdapter } from "./types";

export type ConnectorMode = "SIMULATED" | "OFFICIAL_API";

interface ActiveSession {
  adapter: TikTokLiveAdapter;
  mode: ConnectorMode;
}

const activeSessions = new Map<string, ActiveSession>();
const pendingIngestions = new Map<string, Promise<void>>();

/**
 * Test/observability helper: awaits any in-flight event ingestion for a
 * session. Event ingestion runs fire-and-forget off the adapter's
 * synchronous callback, so tests that drive an adapter manually (e.g. via
 * SimulatedAdapter.emitNext()) need a way to know when persistence +
 * risk-engine processing for that event has actually finished.
 */
export async function flushPendingEvents(liveSessionId: string): Promise<void> {
  await (pendingIngestions.get(liveSessionId) ?? Promise.resolve());
}

/**
 * Extension point for reactions to normalized events beyond the built-in
 * risk-engine wiring below (e.g., the order/pin-suggestion module
 * registers itself here). Each handler receives the normalized event and
 * the persisted LiveEvent row's id. Handlers run independently — one
 * throwing does not block the others or the core pipeline.
 */
type EventHandler = (event: NormalizedLiveEvent, liveEventId: string, liveSessionId: string) => Promise<void>;
const eventHandlers: EventHandler[] = [];

export function registerEventHandler(handler: EventHandler): void {
  eventHandlers.push(handler);
}

function buildAdapter(mode: ConnectorMode): TikTokLiveAdapter {
  return mode === "SIMULATED" ? new SimulatedAdapter() : new OfficialApiAdapter();
}

/**
 * Core reaction: for every COMMENT event, run it through the EXISTING
 * protection risk engine (lib/protection/riskEngine.ts) — never a second,
 * competing engine — and persist the findings linked to this LiveEvent.
 */
async function runRiskEngineOnComment(liveEventId: string, text: string) {
  const findings = analyzeStatement(text);
  if (findings.length === 0) return findings;
  await prisma.riskFinding.createMany({
    data: findings.map((f) => ({
      liveEventId,
      statement: f.statement,
      riskLevel: f.riskLevel,
      category: f.category,
      reasoning: f.reasoning,
      saferAlternative: f.saferAlternative,
      evidenceSource: f.evidenceSource,
      confidence: f.confidence,
    })),
  });
  return findings;
}

/**
 * Shared ingestion path for ANY raw event, whatever produced it (an
 * adapter, or a human typing into the Phase 8 manual-entry fallback UI).
 * Always normalizes, persists, runs the risk engine on comments,
 * publishes to the bus, and runs registered extension handlers.
 */
export async function ingestRawEvent(
  liveSessionId: string,
  raw: Record<string, unknown>,
  source: EventSource,
  confidence: EventConfidence
): Promise<void> {
  const event = normalizeEvent(raw, source, confidence);
  if (!event) return;

  if (event.type === "LIVE_STARTED") {
    await prisma.liveSession.update({
      where: { id: liveSessionId },
      data: { status: "LIVE", startedAt: new Date(event.timestamp) },
    });
  }
  if (event.type === "LIVE_ENDED") {
    await prisma.liveSession.update({
      where: { id: liveSessionId },
      data: { status: "ENDED", endedAt: new Date(event.timestamp) },
    });
  }

  const row = await prisma.liveEvent.create({
    data: {
      liveSessionId,
      type: event.type,
      username: "username" in event ? event.username : null,
      text: "text" in event ? event.text : null,
      payloadJson: JSON.stringify(event),
      source: event.source,
      confidence: event.confidence,
      occurredAt: new Date(event.timestamp),
    },
  });

  const riskFindings = event.type === "COMMENT" ? await runRiskEngineOnComment(row.id, event.text) : [];
  publish(liveSessionId, { ...event, riskFindings });

  for (const handler of eventHandlers) {
    try {
      await handler(event, row.id, liveSessionId);
    } catch (err) {
      // A reaction handler failing must never take down the core pipeline.
      console.error("tiktok-live event handler failed", err);
    }
  }
}

export interface StartSessionResult {
  connected: boolean;
  dataSource: string;
  errorMessage: string | null;
}

export async function startLiveSession(
  liveSessionId: string,
  tiktokUsername: string,
  mode: ConnectorMode
): Promise<StartSessionResult> {
  if (activeSessions.has(liveSessionId)) {
    throw new Error(`LIVE session ${liveSessionId} is already connected.`);
  }

  const adapter = buildAdapter(mode);
  const result = await adapter.connect(tiktokUsername);

  await prisma.liveSession.update({
    where: { id: liveSessionId },
    data: {
      adapterMode: mode,
      dataSource: result.dataSource,
      status: result.connected ? "CONNECTED" : "UNAVAILABLE",
      apiErrorMessage: result.errorMessage,
    },
  });

  if (!result.connected) {
    return { connected: false, dataSource: result.dataSource, errorMessage: result.errorMessage };
  }

  const source: EventSource = mode === "SIMULATED" ? "SIMULATED_ADAPTER" : "OFFICIAL_API_ADAPTER";
  const confidence: EventConfidence = mode === "SIMULATED" ? "SIMULATED" : "REAL";
  adapter.onEvent((raw) => {
    const promise = ingestRawEvent(liveSessionId, raw, source, confidence);
    pendingIngestions.set(liveSessionId, promise);
    void promise;
  });
  activeSessions.set(liveSessionId, { adapter, mode });

  return { connected: true, dataSource: result.dataSource, errorMessage: null };
}

/**
 * Phase 8 fallback: a human manually enters an event they observed on the
 * real LIVE (e.g., pasted a comment) when no connector is available.
 * Labeled source "MANUAL_ENTRY", confidence "CUSTOMER_PROVIDED" — never
 * "REAL" (this system did not independently observe it) and never
 * "SIMULATED" (it is not synthetic test data either).
 */
export async function ingestManualEvent(
  liveSessionId: string,
  raw: Record<string, unknown>
): Promise<void> {
  await ingestRawEvent(liveSessionId, raw, "MANUAL_ENTRY", "CUSTOMER_PROVIDED");
}

export async function stopLiveSession(liveSessionId: string): Promise<void> {
  const active = activeSessions.get(liveSessionId);
  if (active) {
    await active.adapter.disconnect();
    activeSessions.delete(liveSessionId);
  }
  await prisma.liveSession.update({
    where: { id: liveSessionId },
    data: { status: "ENDED", endedAt: new Date() },
  });
}

/** Test/demo hook for the SimulatedAdapter: forces the next scripted event immediately. */
export function emitNextSimulatedEvent(liveSessionId: string): boolean {
  const active = activeSessions.get(liveSessionId);
  if (!active || !(active.adapter instanceof SimulatedAdapter)) return false;
  active.adapter.emitNext();
  return true;
}

export function isSessionActive(liveSessionId: string): boolean {
  return activeSessions.has(liveSessionId);
}
