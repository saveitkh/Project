/**
 * ============================================================================
 * LIVE monitoring — pluggable, honest-by-default
 * ============================================================================
 * This module NEVER scrapes TikTok, uses an unofficial/private API, or
 * fabricates session data. By default (no official API configured) it
 * reports status "UNAVAILABLE" with dataSource "UNAVAILABLE".
 *
 * If a customer's business has its own official TikTok API authorization
 * (e.g., an approved partner integration), set TIKTOK_OFFICIAL_API_BASE_URL
 * and credentials in the environment and implement the request/response
 * mapping for that specific, documented API in `callOfficialApi` below. The
 * exact shape of that call cannot be written generically here because it
 * depends on the specific official integration the customer has been
 * granted — this file provides the plumbing, not a fabricated connection.
 * ============================================================================
 */

export type MonitoringDataSource =
  | "REAL"
  | "CUSTOMER_PROVIDED"
  | "CALCULATED"
  | "SIMULATED"
  | "OFFICIAL_API"
  | "UNAVAILABLE";

export interface LiveStatusResult {
  status: string;
  dataSource: MonitoringDataSource;
  metrics: Record<string, unknown> | null;
  apiErrorMessage: string | null;
}

function isOfficialApiConfigured(): boolean {
  return Boolean(process.env.TIKTOK_OFFICIAL_API_BASE_URL && process.env.TIKTOK_OFFICIAL_API_CLIENT_ID);
}

async function callOfficialApi(tiktokAccountId: string): Promise<LiveStatusResult> {
  const baseUrl = process.env.TIKTOK_OFFICIAL_API_BASE_URL!;
  try {
    // NOTE: This is deliberately generic plumbing. The real request shape,
    // auth headers, and response parsing must be implemented to match the
    // specific official API contract the customer has been granted — there
    // is no universal "TikTok LIVE status" endpoint this code can assume.
    const res = await fetch(`${baseUrl}/live-sessions/${encodeURIComponent(tiktokAccountId)}/status`, {
      headers: { Authorization: `Bearer ${process.env.TIKTOK_OFFICIAL_API_CLIENT_SECRET ?? ""}` },
    });
    if (!res.ok) {
      return {
        status: "API_ERROR",
        dataSource: "UNAVAILABLE",
        metrics: null,
        apiErrorMessage: `Official API returned HTTP ${res.status}`,
      };
    }
    const body = (await res.json()) as Record<string, unknown>;
    return {
      status: typeof body.status === "string" ? body.status : "UNKNOWN",
      dataSource: "OFFICIAL_API",
      metrics: body,
      apiErrorMessage: null,
    };
  } catch (err) {
    return {
      status: "API_ERROR",
      dataSource: "UNAVAILABLE",
      metrics: null,
      apiErrorMessage: err instanceof Error ? err.message : "Unknown error calling official API.",
    };
  }
}

/**
 * Returns the best available, honestly-labeled LIVE session status for a
 * TikTok account. Never returns fabricated metrics.
 */
export async function getLiveSessionStatus(tiktokAccountId: string): Promise<LiveStatusResult> {
  if (!isOfficialApiConfigured()) {
    return {
      status: "UNAVAILABLE",
      dataSource: "UNAVAILABLE",
      metrics: null,
      apiErrorMessage:
        "No official TikTok API integration is configured for this deployment. Connect an authorized, officially-documented integration to enable real LIVE monitoring.",
    };
  }
  return callOfficialApi(tiktokAccountId);
}
