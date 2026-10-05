import { EventEmitter } from "events";
import { NormalizedLiveEvent } from "./types";
import { RiskFindingResult } from "@/lib/protection/riskEngine";

/** What's actually published: a normalized event, optionally carrying the
 * risk findings produced for it (populated only for COMMENT events). */
export type PublishedLiveEvent = NormalizedLiveEvent & { riskFindings?: RiskFindingResult[] };

/**
 * Protection Event Bus — one in-process EventEmitter per LIVE session.
 *
 * This is in-process only: it fans events out to SSE subscribers within
 * this single Node.js server instance. If this app is ever scaled to
 * multiple instances, a subscriber connected to a different instance than
 * the one running the adapter would miss events — at that point, replace
 * this module's internals with a shared pub/sub (e.g., Redis) behind the
 * same `publish`/`subscribe` functions, without touching any caller.
 */
const buses = new Map<string, EventEmitter>();

function getOrCreateBus(sessionId: string): EventEmitter {
  let bus = buses.get(sessionId);
  if (!bus) {
    bus = new EventEmitter();
    bus.setMaxListeners(50);
    buses.set(sessionId, bus);
  }
  return bus;
}

export function publish(sessionId: string, event: PublishedLiveEvent): void {
  getOrCreateBus(sessionId).emit("event", event);
}

/** Returns an unsubscribe function. */
export function subscribe(sessionId: string, listener: (event: PublishedLiveEvent) => void): () => void {
  const bus = getOrCreateBus(sessionId);
  bus.on("event", listener);
  return () => bus.off("event", listener);
}

export function closeBus(sessionId: string): void {
  const bus = buses.get(sessionId);
  if (bus) {
    bus.removeAllListeners();
    buses.delete(sessionId);
  }
}

export function hasBus(sessionId: string): boolean {
  return buses.has(sessionId);
}
