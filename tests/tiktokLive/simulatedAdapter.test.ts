import { describe, expect, it, vi } from "vitest";
import { SimulatedAdapter } from "@/lib/tiktok-live/simulatedAdapter";

describe("SimulatedAdapter (Phase 10 item 7: simulated mode)", () => {
  it("connect() reports dataSource SIMULATED, never REAL", async () => {
    const adapter = new SimulatedAdapter({ intervalMs: 1_000_000 });
    const result = await adapter.connect("@demo");
    expect(result.connected).toBe(true);
    expect(result.dataSource).toBe("SIMULATED");
    await adapter.disconnect();
  });

  it("emits scripted events to the registered callback via emitNext()", async () => {
    const events = [
      { type: "COMMENT", username: "a", text: "hi" },
      { type: "LIKE", username: "a", count: 1 },
    ];
    const adapter = new SimulatedAdapter({ events, intervalMs: 1_000_000 });
    await adapter.connect("@demo");
    const received: unknown[] = [];
    adapter.onEvent((raw) => received.push(raw));

    adapter.emitNext();
    adapter.emitNext();
    adapter.emitNext(); // cycles back to the first event

    expect(received).toEqual([events[0], events[1], events[0]]);
    await adapter.disconnect();
  });

  it("stops emitting after disconnect()", async () => {
    vi.useFakeTimers();
    const adapter = new SimulatedAdapter({ events: [{ type: "LIKE", username: "a", count: 1 }], intervalMs: 100 });
    await adapter.connect("@demo");
    const received: unknown[] = [];
    adapter.onEvent((raw) => received.push(raw));

    vi.advanceTimersByTime(250);
    expect(received.length).toBeGreaterThan(0);

    await adapter.disconnect();
    const countAfterDisconnect = received.length;
    vi.advanceTimersByTime(500);
    expect(received.length).toBe(countAfterDisconnect);
    vi.useRealTimers();
  });
});
