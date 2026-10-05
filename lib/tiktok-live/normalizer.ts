import { randomUUID } from "crypto";
import {
  EventConfidence,
  EventSource,
  NormalizedLiveEvent,
  RawAdapterEvent,
} from "./types";

/**
 * Converts whatever an adapter emits into a strict NormalizedLiveEvent.
 * Adapters are expected to emit a reasonably consistent raw shape (see
 * adapter.ts / simulatedAdapter.ts); this function is the single place
 * that validates and narrows that shape before anything downstream
 * (event bus, risk engine, DB, UI) ever sees it.
 *
 * Returns null for a raw event it cannot recognize, rather than guessing —
 * downstream code should treat null as "drop this event" and may log it.
 */
export function normalizeEvent(
  raw: RawAdapterEvent,
  source: EventSource,
  confidence: EventConfidence
): NormalizedLiveEvent | null {
  const base = {
    id: typeof raw.id === "string" ? raw.id : randomUUID(),
    timestamp: typeof raw.timestamp === "string" ? raw.timestamp : new Date().toISOString(),
    source,
    confidence,
  };

  switch (raw.type) {
    case "COMMENT":
      if (typeof raw.username !== "string" || typeof raw.text !== "string") return null;
      return { ...base, type: "COMMENT", username: raw.username, text: raw.text };

    case "LIKE":
      if (typeof raw.username !== "string") return null;
      return {
        ...base,
        type: "LIKE",
        username: raw.username,
        count: typeof raw.count === "number" ? raw.count : 1,
      };

    case "GIFT":
      if (typeof raw.username !== "string" || typeof raw.giftName !== "string") return null;
      return {
        ...base,
        type: "GIFT",
        username: raw.username,
        giftName: raw.giftName,
        giftValue: typeof raw.giftValue === "number" ? raw.giftValue : null,
      };

    case "FOLLOW":
      if (typeof raw.username !== "string") return null;
      return { ...base, type: "FOLLOW", username: raw.username };

    case "VIEWER_UPDATE":
      if (typeof raw.viewerCount !== "number") return null;
      return { ...base, type: "VIEWER_UPDATE", viewerCount: raw.viewerCount };

    case "LIVE_STARTED":
      return {
        ...base,
        type: "LIVE_STARTED",
        username: typeof raw.username === "string" ? raw.username : null,
      };

    case "LIVE_ENDED":
      return {
        ...base,
        type: "LIVE_ENDED",
        username: typeof raw.username === "string" ? raw.username : null,
        reason: typeof raw.reason === "string" ? raw.reason : null,
      };

    case "SYSTEM_EVENT":
      if (typeof raw.message !== "string") return null;
      return { ...base, type: "SYSTEM_EVENT", message: raw.message };

    default:
      return null;
  }
}
