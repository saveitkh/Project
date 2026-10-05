import { describe, expect, it } from "vitest";
import { normalizeEvent } from "@/lib/tiktok-live/normalizer";

describe("event normalization", () => {
  it("normalizes a valid COMMENT raw event", () => {
    const event = normalizeEvent({ type: "COMMENT", username: "alice", text: "hello" }, "SIMULATED_ADAPTER", "SIMULATED");
    expect(event).toMatchObject({ type: "COMMENT", username: "alice", text: "hello", source: "SIMULATED_ADAPTER", confidence: "SIMULATED" });
    expect(event?.id).toBeTruthy();
    expect(event?.timestamp).toBeTruthy();
  });

  it("normalizes LIKE, GIFT, FOLLOW, VIEWER_UPDATE, LIVE_STARTED, LIVE_ENDED, SYSTEM_EVENT", () => {
    expect(normalizeEvent({ type: "LIKE", username: "bob", count: 3 }, "SIMULATED_ADAPTER", "SIMULATED")).toMatchObject({
      type: "LIKE",
      count: 3,
    });
    expect(normalizeEvent({ type: "GIFT", username: "carol", giftName: "Rose", giftValue: 5 }, "SIMULATED_ADAPTER", "SIMULATED")).toMatchObject({
      type: "GIFT",
      giftName: "Rose",
      giftValue: 5,
    });
    expect(normalizeEvent({ type: "FOLLOW", username: "dave" }, "SIMULATED_ADAPTER", "SIMULATED")).toMatchObject({ type: "FOLLOW" });
    expect(normalizeEvent({ type: "VIEWER_UPDATE", viewerCount: 42 }, "SIMULATED_ADAPTER", "SIMULATED")).toMatchObject({
      type: "VIEWER_UPDATE",
      viewerCount: 42,
    });
    expect(normalizeEvent({ type: "LIVE_STARTED", username: "seller" }, "SIMULATED_ADAPTER", "SIMULATED")).toMatchObject({
      type: "LIVE_STARTED",
    });
    expect(normalizeEvent({ type: "LIVE_ENDED", reason: "host ended" }, "SIMULATED_ADAPTER", "SIMULATED")).toMatchObject({
      type: "LIVE_ENDED",
      reason: "host ended",
    });
    expect(normalizeEvent({ type: "SYSTEM_EVENT", message: "heartbeat" }, "SIMULATED_ADAPTER", "SIMULATED")).toMatchObject({
      type: "SYSTEM_EVENT",
      message: "heartbeat",
    });
  });

  it("returns null for malformed or unrecognized raw events", () => {
    expect(normalizeEvent({ type: "COMMENT", username: "alice" }, "SIMULATED_ADAPTER", "SIMULATED")).toBeNull(); // missing text
    expect(normalizeEvent({ type: "NOT_A_TYPE" }, "SIMULATED_ADAPTER", "SIMULATED")).toBeNull();
    expect(normalizeEvent({}, "SIMULATED_ADAPTER", "SIMULATED")).toBeNull();
  });

  it("never upgrades a SIMULATED confidence to REAL, or vice versa — it only stamps what it's given", () => {
    const simulated = normalizeEvent({ type: "COMMENT", username: "x", text: "y" }, "SIMULATED_ADAPTER", "SIMULATED");
    const real = normalizeEvent({ type: "COMMENT", username: "x", text: "y" }, "OFFICIAL_API_ADAPTER", "REAL");
    expect(simulated?.confidence).toBe("SIMULATED");
    expect(real?.confidence).toBe("REAL");
  });
});
