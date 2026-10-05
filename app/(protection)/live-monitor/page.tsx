"use client";

import { useEffect, useRef, useState } from "react";
import LiveEventFeed, { FeedEvent } from "@/components/protection/LiveEventFeed";

interface LiveSessionView {
  id: string;
  status: string;
  dataSource: string;
  adapterMode: string;
  apiErrorMessage: string | null;
  startedAt: string | null;
  tiktokAccount?: { usernameHandle: string } | null;
}

interface OrderSuggestionView {
  id: string;
  username: string;
  rawText: string;
  detectedProductCode: string | null;
  detectedQuantity: number | null;
  status: string;
}

interface PinSuggestionView {
  eventId: string;
  username: string | null;
  text: string | null;
  pinReason: string;
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "14px",
  marginTop: "4px",
};

export default function LiveMonitorPage() {
  const [tiktokUsername, setTiktokUsername] = useState("@demo_seller");
  const [mode, setMode] = useState<"SIMULATED" | "OFFICIAL_API">("SIMULATED");
  const [session, setSession] = useState<LiveSessionView | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [manualType, setManualType] = useState("COMMENT");
  const [manualUsername, setManualUsername] = useState("");
  const [manualText, setManualText] = useState("");
  const [orderSuggestions, setOrderSuggestions] = useState<OrderSuggestionView[]>([]);
  const [pinSuggestions, setPinSuggestions] = useState<PinSuggestionView[]>([]);
  const [finalReportId, setFinalReportId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Order/pin suggestions are detected server-side as a reaction to each
  // comment (lib/protection/orderSuggestionHandler.ts) but aren't pushed
  // over the SSE stream — poll the session periodically to pick them up.
  useEffect(() => {
    if (!session) return;
    const poll = async () => {
      const res = await fetch(`/api/live-sessions/${session.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setOrderSuggestions(data.session.orderSuggestions ?? []);
      setPinSuggestions(
        (data.session.events ?? [])
          .filter((e: { suggestedPin: boolean }) => e.suggestedPin)
          .map((e: { id: string; username: string | null; text: string | null; pinReason: string }) => ({
            eventId: e.id,
            username: e.username,
            text: e.text,
            pinReason: e.pinReason,
          }))
      );
    };
    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [session]);

  async function handleOrderAction(id: string, status: "CONFIRMED" | "DISMISSED") {
    await fetch(`/api/order-suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrderSuggestions((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  async function handleStart() {
    setBusy(true);
    setConnectError(null);
    try {
      const res = await fetch("/api/live-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiktokUsername, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setConnectError(data.error ?? "Could not start session.");
        return;
      }
      setSession(data.session);
      setEvents([]);
      setViewerCount(null);

      if (data.connectResult.connected) {
        const es = new EventSource(`/api/live-sessions/${data.session.id}/stream`);
        es.onmessage = (msg) => {
          const event = JSON.parse(msg.data) as FeedEvent;
          setEvents((prev) => [...prev, event]);
          if (event.type === "VIEWER_UPDATE" && typeof event.viewerCount === "number") {
            setViewerCount(event.viewerCount);
          }
        };
        eventSourceRef.current = es;
      } else {
        setConnectError(data.connectResult.errorMessage ?? "Live monitoring unavailable.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleEmitNext() {
    if (!session) return;
    await fetch(`/api/live-sessions/${session.id}/emit-next`, { method: "POST" });
  }

  async function handleEnd() {
    if (!session) return;
    const res = await fetch(`/api/live-sessions/${session.id}/end`, { method: "POST" });
    const data = await res.json();
    eventSourceRef.current?.close();
    setSession((s) => (s ? { ...s, status: "ENDED" } : s));
    if (data.report?.id) setFinalReportId(data.report.id);
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    await fetch(`/api/live-sessions/${session.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: manualType, username: manualUsername, text: manualText }),
    });
    setManualText("");
    // Manual entries aren't pushed over SSE for this session unless an SSE
    // subscriber is active; refetch the session's event history to show it.
    const res = await fetch(`/api/live-sessions/${session.id}`);
    const data = await res.json();
    type DbLiveEvent = {
      id: string;
      type: string;
      occurredAt: string;
      source: string;
      confidence: string;
      username: string | null;
      text: string | null;
      riskFindings: { id: string; riskLevel: string; category: string; reasoning: string; saferAlternative: string }[];
    };
    setEvents(
      (data.session.events as DbLiveEvent[]).map((row) => ({
        id: row.id,
        type: row.type,
        timestamp: row.occurredAt,
        source: row.source,
        confidence: row.confidence,
        username: row.username,
        text: row.text,
        riskFindings: row.riskFindings,
      }))
    );
  }

  const connected = session && session.status !== "UNAVAILABLE" && session.status !== "ENDED";

  return (
    <div style={{ maxWidth: "820px" }}>
      <h2 style={{ fontSize: "18px" }}>LIVE Monitor</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        You start/stop your real TikTok LIVE yourself in the TikTok app. This page only
        monitors — it never controls your account.
      </p>

      {!session && (
        <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", marginTop: "12px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600 }}>TikTok username / account identifier</label>
          <input style={fieldStyle} value={tiktokUsername} onChange={(e) => setTiktokUsername(e.target.value)} />

          <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginTop: "12px" }}>
            Connection mode
          </label>
          <select style={fieldStyle} value={mode} onChange={(e) => setMode(e.target.value as "SIMULATED" | "OFFICIAL_API")}>
            <option value="SIMULATED">Simulated (practice with test events)</option>
            <option value="OFFICIAL_API">Official API (requires configured credentials)</option>
          </select>

          <button
            onClick={handleStart}
            disabled={busy}
            style={{ marginTop: "14px", padding: "10px 16px", fontSize: "14px", fontWeight: 600, border: "none", borderRadius: "6px", background: "#111", color: "#fff", cursor: "pointer" }}
          >
            Connect
          </button>
        </div>
      )}

      {session && (
        <div style={{ marginTop: "16px" }}>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "13px",
              background: session.dataSource === "REAL" ? "#e3f5e6" : session.dataSource === "SIMULATED" ? "#fff4e5" : "#fde2e2",
              color: session.dataSource === "REAL" ? "#276749" : session.dataSource === "SIMULATED" ? "#9c6b00" : "#9b2c2c",
            }}
          >
            {session.dataSource === "REAL" && "REAL LIVE DATA — connected via official API"}
            {session.dataSource === "SIMULATED" && "SIMULATED TEST DATA — not a real TikTok LIVE connection"}
            {session.dataSource === "UNAVAILABLE" && "LIVE MONITORING UNAVAILABLE"}
          </div>

          <div style={{ marginTop: "12px", fontSize: "13px" }}>
            <p style={{ margin: 0 }}>
              <strong>Status:</strong> {connected ? "● Connected" : "○ " + session.status}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Account:</strong> {session.tiktokAccount?.usernameHandle ?? tiktokUsername}
            </p>
            {session.startedAt && (
              <p style={{ margin: 0 }}>
                <strong>Session started:</strong> {new Date(session.startedAt).toLocaleString()}
              </p>
            )}
            <p style={{ margin: 0 }}>
              <strong>Viewer count:</strong> {viewerCount ?? "not available"}
            </p>
          </div>

          {connectError && (
            <div style={{ marginTop: "12px", padding: "12px", border: "1px solid #f5c6cb", borderRadius: "8px", background: "#fde2e2", fontSize: "13px" }}>
              <strong>Live monitoring unavailable:</strong> {connectError}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            {session.adapterMode === "SIMULATED" && connected && (
              <button onClick={handleEmitNext} style={{ padding: "8px 12px", fontSize: "13px", border: "1px solid #ccc", borderRadius: "6px", background: "#fff", cursor: "pointer" }}>
                Simulate next event
              </button>
            )}
            {connected && (
              <button onClick={handleEnd} style={{ padding: "8px 12px", fontSize: "13px", border: "1px solid #ccc", borderRadius: "6px", background: "#fff", cursor: "pointer" }}>
                End session
              </button>
            )}
          </div>

          {!connected && (
            <form onSubmit={handleManualSubmit} style={{ marginTop: "16px", border: "1px solid #ddd", borderRadius: "8px", padding: "14px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, margin: 0 }}>
                Manual event entry (fallback mode)
              </p>
              <p style={{ fontSize: "12px", color: "#666" }}>
                Type or paste what you observed on your real LIVE — this is stored as
                customer-provided data, not an automated connection.
              </p>
              <select style={fieldStyle} value={manualType} onChange={(e) => setManualType(e.target.value)}>
                <option value="COMMENT">Comment</option>
                <option value="LIKE">Like</option>
                <option value="GIFT">Gift</option>
                <option value="FOLLOW">Follow</option>
                <option value="SYSTEM_EVENT">Other / note</option>
              </select>
              <input style={fieldStyle} placeholder="Username" value={manualUsername} onChange={(e) => setManualUsername(e.target.value)} />
              <input style={fieldStyle} placeholder="Comment text / note" value={manualText} onChange={(e) => setManualText(e.target.value)} />
              <button type="submit" style={{ marginTop: "10px", padding: "8px 12px", fontSize: "13px", border: "none", borderRadius: "6px", background: "#111", color: "#fff", cursor: "pointer" }}>
                Add event + analyze
              </button>
            </form>
          )}

          {finalReportId && (
            <div style={{ marginTop: "16px", padding: "12px", border: "1px solid #276749", background: "#e3f5e6", borderRadius: "8px" }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#276749" }}>
                Protection Report generated for this session.
              </p>
              <a href={`/protection/reports/${finalReportId}`} style={{ fontSize: "13px" }}>
                View report →
              </a>
            </div>
          )}

          {orderSuggestions.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h3 style={{ fontSize: "15px" }}>Order Suggestions (seller review required)</h3>
              <p style={{ fontSize: "12px", color: "#888", marginTop: "-4px" }}>
                Detected from comments — never submitted anywhere automatically. Confirm only
                after you&apos;ve verified it yourself.
              </p>
              {orderSuggestions.map((o) => (
                <div key={o.id} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "10px 12px", marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "13px" }}>
                      <strong>{o.username}</strong>: &quot;{o.rawText}&quot;
                    </p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#666" }}>
                      Detected: {o.detectedProductCode} × {o.detectedQuantity} — {o.status}
                    </p>
                  </div>
                  {o.status === "PENDING_REVIEW" && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => handleOrderAction(o.id, "CONFIRMED")} style={{ fontSize: "12px", padding: "6px 10px", border: "1px solid #276749", borderRadius: "6px", background: "#e3f5e6", color: "#276749", cursor: "pointer" }}>
                        Confirm
                      </button>
                      <button onClick={() => handleOrderAction(o.id, "DISMISSED")} style={{ fontSize: "12px", padding: "6px 10px", border: "1px solid #ccc", borderRadius: "6px", background: "#fff", cursor: "pointer" }}>
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {pinSuggestions.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <h3 style={{ fontSize: "15px" }}>Pin Suggestions</h3>
              <p style={{ fontSize: "12px", color: "#888", marginTop: "-4px" }}>
                Suggestions only — pin the comment yourself inside the TikTok app if you agree.
              </p>
              {pinSuggestions.map((p) => (
                <div key={p.eventId} style={{ border: "1px solid #eef2ff", background: "#eef2ff", borderRadius: "8px", padding: "10px 12px", marginTop: "8px" }}>
                  <p style={{ margin: 0, fontSize: "13px" }}>
                    <strong>{p.username}</strong>: &quot;{p.text}&quot;
                  </p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#28306b" }}>{p.pinReason}</p>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ fontSize: "15px", marginTop: "20px" }}>Events &amp; Evidence Timeline</h3>
          <LiveEventFeed events={events} />
        </div>
      )}
    </div>
  );
}
