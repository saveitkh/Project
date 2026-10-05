import { getLiveSessionStatus } from "@/lib/protection/liveMonitoring";
import { AdapterConnectResult, RawAdapterEvent, TikTokLiveAdapter } from "./types";

export type { TikTokLiveAdapter } from "./types";

/**
 * Adapter backed by an officially authorized TikTok API. This reuses the
 * existing honest-by-default check in lib/protection/liveMonitoring.ts: if
 * no TIKTOK_OFFICIAL_API_* credentials are configured, connect() returns
 * connected: false, dataSource: "UNAVAILABLE" — never a fabricated success.
 *
 * IMPORTANT: even once credentials ARE configured, this class only proves
 * connectivity (via getLiveSessionStatus). Actually streaming real events
 * (comments, likes, gifts) from an official API requires implementing that
 * specific API's event-delivery mechanism (webhook callbacks, a websocket,
 * or polling an events endpoint) — which varies per integration and cannot
 * be written generically here. `onEvent` registers the callback, but no
 * implementation above calls it with real data until that integration-
 * specific piece is added. This is intentional: it's the clearly-marked
 * extension point, not a fabricated connection.
 */
export class OfficialApiAdapter implements TikTokLiveAdapter {
  readonly name = "OFFICIAL_API";
  private callback: ((raw: RawAdapterEvent) => void) | null = null;

  async connect(tiktokUsername: string): Promise<AdapterConnectResult> {
    const status = await getLiveSessionStatus(tiktokUsername);
    if (status.dataSource !== "OFFICIAL_API") {
      return {
        connected: false,
        dataSource: "UNAVAILABLE",
        errorMessage:
          status.apiErrorMessage ?? "Official TikTok API is not configured for this deployment.",
      };
    }
    return { connected: true, dataSource: "REAL", errorMessage: null };
    // NOTE: real event delivery (webhook/websocket/polling) for the
    // specific official integration goes here, calling this.callback(raw)
    // for each event it receives. Not implemented — see class docstring.
  }

  onEvent(callback: (raw: RawAdapterEvent) => void): void {
    this.callback = callback;
  }

  async disconnect(): Promise<void> {
    this.callback = null;
  }
}
