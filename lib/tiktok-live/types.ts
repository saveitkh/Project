/**
 * ============================================================================
 * TikTok LIVE connector — strict event types
 * ============================================================================
 * Everything in this module describes a NORMALIZED event shape, independent
 * of whatever adapter produced it. The rest of the application depends only
 * on these types — never on a specific third-party library's event shape.
 * ============================================================================
 */

export type LiveEventType =
  | "LIVE_STARTED"
  | "LIVE_ENDED"
  | "COMMENT"
  | "LIKE"
  | "GIFT"
  | "FOLLOW"
  | "VIEWER_UPDATE"
  | "SYSTEM_EVENT";

/**
 * Honesty label. "REAL" may ONLY be used for an event that genuinely
 * originated from a connected, authorized data source (an official API, or
 * an authorized connector). "SIMULATED" is for synthetic test data. Never
 * label simulated/mock events as REAL — this is enforced by construction:
 * each adapter can only ever produce one confidence value (see adapter.ts).
 */
export type EventConfidence = "REAL" | "SIMULATED" | "CUSTOMER_PROVIDED";

/** Which component produced this event. Free-form but conventionally one of these. */
export type EventSource =
  | "OFFICIAL_API_ADAPTER"
  | "SIMULATED_ADAPTER"
  | "MANUAL_ENTRY";

/** Session-level connectivity state — distinct from any single event's confidence. */
export type SessionDataSource = "REAL" | "SIMULATED" | "UNAVAILABLE";

export interface NormalizedLiveEventBase {
  id: string;
  type: LiveEventType;
  timestamp: string; // ISO 8601
  source: EventSource;
  confidence: EventConfidence;
}

export interface CommentEvent extends NormalizedLiveEventBase {
  type: "COMMENT";
  username: string;
  text: string;
}

export interface LikeEvent extends NormalizedLiveEventBase {
  type: "LIKE";
  username: string;
  count: number;
}

export interface GiftEvent extends NormalizedLiveEventBase {
  type: "GIFT";
  username: string;
  giftName: string;
  giftValue: number | null;
}

export interface FollowEvent extends NormalizedLiveEventBase {
  type: "FOLLOW";
  username: string;
}

export interface ViewerUpdateEvent extends NormalizedLiveEventBase {
  type: "VIEWER_UPDATE";
  viewerCount: number;
}

export interface LiveStartedEvent extends NormalizedLiveEventBase {
  type: "LIVE_STARTED";
  username: string | null;
}

export interface LiveEndedEvent extends NormalizedLiveEventBase {
  type: "LIVE_ENDED";
  username: string | null;
  reason: string | null;
}

export interface SystemEvent extends NormalizedLiveEventBase {
  type: "SYSTEM_EVENT";
  message: string;
}

export type NormalizedLiveEvent =
  | CommentEvent
  | LikeEvent
  | GiftEvent
  | FollowEvent
  | ViewerUpdateEvent
  | LiveStartedEvent
  | LiveEndedEvent
  | SystemEvent;

/** Raw, adapter-specific payload — shape is whatever the adapter's upstream source sends. */
export type RawAdapterEvent = Record<string, unknown>;

export interface AdapterConnectResult {
  connected: boolean;
  dataSource: SessionDataSource;
  errorMessage: string | null;
}

/**
 * The isolation boundary: the rest of the app depends ONLY on this
 * interface, never on a specific third-party library. Any adapter —
 * official API, authorized connector, simulated, or a future replacement —
 * must implement this contract.
 */
export interface TikTokLiveAdapter {
  /** A stable name for logging/labeling, e.g. "OFFICIAL_API", "SIMULATED". */
  readonly name: string;
  /** Attempts to connect to the LIVE source for this account. */
  connect(tiktokUsername: string): Promise<AdapterConnectResult>;
  /** Registers a callback invoked with each raw event as it arrives. */
  onEvent(callback: (raw: RawAdapterEvent) => void): void;
  /** Disconnects and releases resources. Safe to call even if never connected. */
  disconnect(): Promise<void>;
}
