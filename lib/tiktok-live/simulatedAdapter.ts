import { AdapterConnectResult, RawAdapterEvent, TikTokLiveAdapter } from "./types";

const DEFAULT_EVENTS: RawAdapterEvent[] = [
  { type: "LIVE_STARTED", username: "demo_seller" },
  { type: "VIEWER_UPDATE", viewerCount: 12 },
  { type: "COMMENT", username: "buyer_88", text: "How much is shipping to Phnom Penh?" },
  { type: "LIKE", username: "buyer_88", count: 5 },
  { type: "COMMENT", username: "shopper_kh", text: "This product cures disease, 100% guaranteed!" },
  { type: "GIFT", username: "fan_42", giftName: "Rose", giftValue: 1 },
  { type: "FOLLOW", username: "new_follower_1" },
  { type: "VIEWER_UPDATE", viewerCount: 18 },
  { type: "COMMENT", username: "shopper_kh", text: "order A1 x2 please" },
  { type: "COMMENT", username: "curious_viewer", text: "Is this the official brand store?" },
  { type: "VIEWER_UPDATE", viewerCount: 15 },
  { type: "SYSTEM_EVENT", message: "Simulated session heartbeat." },
];

/**
 * Always and only produces SIMULATED data — connect() reports
 * dataSource: "SIMULATED", never "REAL". Intended for demos, development,
 * and the dashboard's explicit "Practice with simulated events" mode. The
 * UI must never present its output as a real LIVE connection.
 */
export class SimulatedAdapter implements TikTokLiveAdapter {
  readonly name = "SIMULATED";
  private callback: ((raw: RawAdapterEvent) => void) | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private cursor = 0;
  private readonly events: RawAdapterEvent[];
  private readonly intervalMs: number;

  constructor(options?: { events?: RawAdapterEvent[]; intervalMs?: number }) {
    this.events = options?.events ?? DEFAULT_EVENTS;
    this.intervalMs = options?.intervalMs ?? 2500;
  }

  async connect(_tiktokUsername: string): Promise<AdapterConnectResult> {
    this.timer = setInterval(() => this.emitNext(), this.intervalMs);
    return { connected: true, dataSource: "SIMULATED", errorMessage: null };
  }

  onEvent(callback: (raw: RawAdapterEvent) => void): void {
    this.callback = callback;
  }

  async disconnect(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.callback = null;
  }

  /** Test/demo hook: emits the next scripted event immediately, bypassing the timer. */
  emitNext(): void {
    if (!this.callback || this.events.length === 0) return;
    const raw = this.events[this.cursor % this.events.length];
    this.cursor += 1;
    this.callback(raw);
  }
}
