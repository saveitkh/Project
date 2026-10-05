import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/protection/prisma";
import {
  emitNextSimulatedEvent,
  flushPendingEvents,
  ingestManualEvent,
  startLiveSession,
  stopLiveSession,
} from "@/lib/tiktok-live/connector";
// Registers the order-suggestion reaction on the event bus for this test run.
import "@/lib/protection/orderSuggestionHandler";

async function createTestCustomer() {
  const email = `test-${randomUUID()}@example.com`;
  const user = await prisma.user.create({ data: { email, passwordHash: "test", role: "CUSTOMER" } });
  const customer = await prisma.customer.create({ data: { userId: user.id } });
  return customer;
}

describe("LIVE connector integration (real SQLite DB)", () => {
  let customerId: string;

  beforeAll(async () => {
    const customer = await createTestCustomer();
    customerId = customer.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Phase 10.6 — official API adapter reports UNAVAILABLE, never fakes a connection", async () => {
    const session = await prisma.liveSession.create({
      data: { customerId, status: "UNAVAILABLE", dataSource: "UNAVAILABLE", adapterMode: "OFFICIAL_API" },
    });
    const result = await startLiveSession(session.id, "@no_official_api", "OFFICIAL_API");
    expect(result.connected).toBe(false);
    expect(result.dataSource).toBe("UNAVAILABLE");
    expect(result.errorMessage).toBeTruthy();

    const updated = await prisma.liveSession.findUniqueOrThrow({ where: { id: session.id } });
    expect(updated.dataSource).toBe("UNAVAILABLE");
    expect(updated.status).toBe("UNAVAILABLE");
  });

  it("Phase 10.7/10.8 — SIMULATED session: events are persisted and labeled confidence SIMULATED, never REAL", async () => {
    const session = await prisma.liveSession.create({
      data: { customerId, status: "UNAVAILABLE", dataSource: "UNAVAILABLE", adapterMode: "SIMULATED" },
    });
    const result = await startLiveSession(session.id, "@demo_seller", "SIMULATED");
    expect(result.connected).toBe(true);
    expect(result.dataSource).toBe("SIMULATED");

    // DEFAULT_EVENTS[0] is LIVE_STARTED, [1] VIEWER_UPDATE, [2] a benign COMMENT.
    emitNextSimulatedEvent(session.id);
    await flushPendingEvents(session.id);

    const events = await prisma.liveEvent.findMany({ where: { liveSessionId: session.id } });
    expect(events.length).toBe(1);
    expect(events[0].confidence).toBe("SIMULATED");
    expect(events[0].source).toBe("SIMULATED_ADAPTER");

    await stopLiveSession(session.id);
  });

  it("Phase 10.2/10.3 — a HIGH-risk comment produces a RiskFinding via the EXISTING risk engine", async () => {
    const session = await prisma.liveSession.create({
      data: { customerId, status: "UNAVAILABLE", dataSource: "UNAVAILABLE", adapterMode: "SIMULATED" },
    });
    await startLiveSession(
      session.id,
      "@demo_seller",
      "SIMULATED"
    );

    await ingestManualEvent(session.id, {
      type: "COMMENT",
      username: "shopper",
      text: "This product cures disease and is 100% guaranteed.",
    });

    const event = await prisma.liveEvent.findFirstOrThrow({
      where: { liveSessionId: session.id, type: "COMMENT" },
      include: { riskFindings: true },
    });
    expect(event.riskFindings.length).toBeGreaterThan(0);
    expect(event.riskFindings.some((f) => f.riskLevel === "HIGH")).toBe(true);
    expect(event.riskFindings.some((f) => f.category === "Medical/health claim")).toBe(true);

    await stopLiveSession(session.id);
  });

  it("Phase 10.4 — a benign comment produces no risk findings (low risk)", async () => {
    const session = await prisma.liveSession.create({
      data: { customerId, status: "UNAVAILABLE", dataSource: "UNAVAILABLE", adapterMode: "SIMULATED" },
    });
    await startLiveSession(session.id, "@demo_seller", "SIMULATED");

    await ingestManualEvent(session.id, {
      type: "COMMENT",
      username: "shopper",
      text: "Thanks for the stream, see you next time!",
    });

    const event = await prisma.liveEvent.findFirstOrThrow({
      where: { liveSessionId: session.id, type: "COMMENT" },
      include: { riskFindings: true },
    });
    expect(event.riskFindings.length).toBe(0);

    await stopLiveSession(session.id);
  });

  it("Phase 10.8 — manual entry is labeled CUSTOMER_PROVIDED, never REAL or SIMULATED", async () => {
    const session = await prisma.liveSession.create({
      data: { customerId, status: "UNAVAILABLE", dataSource: "UNAVAILABLE", adapterMode: "SIMULATED" },
    });
    await startLiveSession(session.id, "@demo_seller", "SIMULATED");

    await ingestManualEvent(session.id, { type: "COMMENT", username: "manual_user", text: "hello" });

    const event = await prisma.liveEvent.findFirstOrThrow({
      where: { liveSessionId: session.id, username: "manual_user" },
    });
    expect(event.confidence).toBe("CUSTOMER_PROVIDED");
    expect(event.source).toBe("MANUAL_ENTRY");

    await stopLiveSession(session.id);
  });

  it("Phase 10.9 — starting and ending a session updates its status", async () => {
    const session = await prisma.liveSession.create({
      data: { customerId, status: "UNAVAILABLE", dataSource: "UNAVAILABLE", adapterMode: "SIMULATED" },
    });
    await startLiveSession(session.id, "@demo_seller", "SIMULATED");
    let current = await prisma.liveSession.findUniqueOrThrow({ where: { id: session.id } });
    expect(current.status).toBe("CONNECTED");

    await stopLiveSession(session.id);
    current = await prisma.liveSession.findUniqueOrThrow({ where: { id: session.id } });
    expect(current.status).toBe("ENDED");
    expect(current.endedAt).not.toBeNull();
  });

  it("order/pin suggestion handler creates an OrderSuggestion and flags suggestedPin for an order comment", async () => {
    const session = await prisma.liveSession.create({
      data: { customerId, status: "UNAVAILABLE", dataSource: "UNAVAILABLE", adapterMode: "SIMULATED" },
    });
    await startLiveSession(session.id, "@demo_seller", "SIMULATED");

    await ingestManualEvent(session.id, { type: "COMMENT", username: "buyer1", text: "order A1 x2" });

    const event = await prisma.liveEvent.findFirstOrThrow({
      where: { liveSessionId: session.id, username: "buyer1" },
    });
    expect(event.suggestedPin).toBe(true);

    const suggestions = await prisma.orderSuggestion.findMany({ where: { liveSessionId: session.id } });
    expect(suggestions.length).toBe(1);
    expect(suggestions[0].detectedProductCode).toBe("A1");
    expect(suggestions[0].detectedQuantity).toBe(2);
    expect(suggestions[0].status).toBe("PENDING_REVIEW");

    await stopLiveSession(session.id);
  });
});
