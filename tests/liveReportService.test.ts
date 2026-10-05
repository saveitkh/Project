import { randomUUID } from "crypto";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/protection/prisma";
import { ingestManualEvent, startLiveSession, stopLiveSession } from "@/lib/tiktok-live/connector";
import { generateLiveSessionReport } from "@/lib/protection/liveReportService";
import { getProtectionReportForView } from "@/lib/protection/reportService";

async function createTestCustomer() {
  const email = `test-${randomUUID()}@example.com`;
  const user = await prisma.user.create({ data: { email, passwordHash: "test", role: "CUSTOMER" } });
  return prisma.customer.create({ data: { userId: user.id } });
}

describe("LIVE session report generation (Phase 10 item 10 + evidence timeline item 5)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("builds a Protection Report with the full LIVE evidence timeline", async () => {
    const customer = await createTestCustomer();
    const session = await prisma.liveSession.create({
      data: { customerId: customer.id, status: "UNAVAILABLE", dataSource: "UNAVAILABLE", adapterMode: "SIMULATED" },
    });
    await startLiveSession(session.id, "@demo_seller", "SIMULATED");

    await ingestManualEvent(session.id, { type: "LIVE_STARTED", username: "demo_seller" });
    await ingestManualEvent(session.id, {
      type: "COMMENT",
      username: "shopper",
      text: "This product cures disease, 100% guaranteed!",
    });
    await ingestManualEvent(session.id, { type: "COMMENT", username: "shopper2", text: "nice product" });
    await stopLiveSession(session.id);

    const { report, readiness, eventCount } = await generateLiveSessionReport(session.id);
    expect(eventCount).toBe(3);
    expect(report.liveSessionId).toBe(session.id);
    expect(readiness.riskLevel).not.toBe(undefined);

    const view = await getProtectionReportForView(report.id, customer.id, false);
    expect(view).not.toBeNull();
    expect(view!.liveEventTimeline).toBeDefined();
    expect(view!.liveEventTimeline!.length).toBe(3);
    expect(view!.detectedRisks.some((f) => f.category === "Medical/health claim")).toBe(true);
    // Required disclaimer must always be present.
    expect(view!.limitations.join(" ")).toContain("does not guarantee that TikTok will not take future enforcement action");
  });

  it("denies access to a report belonging to a different customer", async () => {
    const customer = await createTestCustomer();
    const otherCustomer = await createTestCustomer();
    const session = await prisma.liveSession.create({
      data: { customerId: customer.id, status: "UNAVAILABLE", dataSource: "UNAVAILABLE", adapterMode: "SIMULATED" },
    });
    await startLiveSession(session.id, "@demo_seller", "SIMULATED");
    await ingestManualEvent(session.id, { type: "COMMENT", username: "a", text: "hi" });
    await stopLiveSession(session.id);

    const { report } = await generateLiveSessionReport(session.id);
    const view = await getProtectionReportForView(report.id, otherCustomer.id, false);
    expect(view).toBeNull();
  });
});
