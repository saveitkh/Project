import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLiveSessionStatus } from "@/lib/protection/liveMonitoring";

describe("live monitoring (honesty-by-default + API failure handling)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.TIKTOK_OFFICIAL_API_BASE_URL;
    delete process.env.TIKTOK_OFFICIAL_API_CLIENT_ID;
    delete process.env.TIKTOK_OFFICIAL_API_CLIENT_SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("reports UNAVAILABLE with no fabricated data when no official API is configured", async () => {
    const result = await getLiveSessionStatus("account_1");
    expect(result.dataSource).toBe("UNAVAILABLE");
    expect(result.metrics).toBeNull();
    expect(result.apiErrorMessage).toContain("No official TikTok API integration");
  });

  it("handles an official-API network failure gracefully without throwing", async () => {
    process.env.TIKTOK_OFFICIAL_API_BASE_URL = "https://example-official-api.test";
    process.env.TIKTOK_OFFICIAL_API_CLIENT_ID = "client_id";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network unreachable"))
    );

    const result = await getLiveSessionStatus("account_1");
    expect(result.dataSource).toBe("UNAVAILABLE");
    expect(result.status).toBe("API_ERROR");
    expect(result.apiErrorMessage).toContain("network unreachable");
  });

  it("surfaces a non-2xx response from the official API as UNAVAILABLE, not fabricated success", async () => {
    process.env.TIKTOK_OFFICIAL_API_BASE_URL = "https://example-official-api.test";
    process.env.TIKTOK_OFFICIAL_API_CLIENT_ID = "client_id";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    );

    const result = await getLiveSessionStatus("account_1");
    expect(result.dataSource).toBe("UNAVAILABLE");
    expect(result.apiErrorMessage).toContain("500");
  });
});
