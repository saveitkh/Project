import RiskAlertBanner from "./RiskAlertBanner";

export interface FeedRiskFinding {
  id: string;
  riskLevel: string;
  category: string;
  reasoning: string;
  saferAlternative: string;
}

export interface FeedEvent {
  id: string;
  type: string;
  timestamp: string;
  source: string;
  confidence: string;
  username?: string | null;
  text?: string | null;
  viewerCount?: number;
  giftName?: string;
  count?: number;
  riskFindings?: FeedRiskFinding[];
}

const CONFIDENCE_BADGE: Record<string, { bg: string; fg: string }> = {
  REAL: { bg: "#e3f5e6", fg: "#276749" },
  SIMULATED: { bg: "#fff4e5", fg: "#9c6b00" },
  CUSTOMER_PROVIDED: { bg: "#eef2ff", fg: "#28306b" },
};

function summarize(e: FeedEvent): string {
  switch (e.type) {
    case "COMMENT":
      return `${e.username}: "${e.text}"`;
    case "LIKE":
      return `${e.username} liked (${e.count ?? 1})`;
    case "GIFT":
      return `${e.username} sent a gift: ${e.giftName}`;
    case "FOLLOW":
      return `${e.username} followed`;
    case "VIEWER_UPDATE":
      return `Viewer count: ${e.viewerCount}`;
    case "LIVE_STARTED":
      return `LIVE started${e.username ? ` (${e.username})` : ""}`;
    case "LIVE_ENDED":
      return "LIVE ended";
    case "SYSTEM_EVENT":
      return e.text ?? "System event";
    default:
      return e.type;
  }
}

export default function LiveEventFeed({ events }: { events: FeedEvent[] }) {
  return (
    <div>
      {events.length === 0 && <p style={{ fontSize: "13px", color: "#888" }}>No events yet.</p>}
      {events.map((e) => {
        const badge = CONFIDENCE_BADGE[e.confidence] ?? { bg: "#eee", fg: "#555" };
        return (
          <div key={e.id} style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "#888", fontFamily: "monospace" }}>
                {new Date(e.timestamp).toLocaleTimeString()}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700 }}>{e.type}</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: "999px",
                  background: badge.bg,
                  color: badge.fg,
                }}
              >
                {e.confidence}
              </span>
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: "13px" }}>{summarize(e)}</p>
            {(e.riskFindings ?? []).map((f) => (
              <RiskAlertBanner key={f.id} finding={f} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
