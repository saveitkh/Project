"use client";

import { useEffect, useState } from "react";
import type { RiskLevel } from "@/lib/protection/riskEngine";

interface AuditSummary {
  id: string;
  liveTitle: string;
  product: string;
}

interface VersionView {
  id: string;
  versionNumber: number;
  scriptText: string;
  overallRiskLevel: RiskLevel;
  riskFindings: { category: string; reasoning: string; saferAlternative: string }[];
}

const LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: "#276749",
  MEDIUM: "#9c6b00",
  HIGH: "#9b2c2c",
  REVIEW_REQUIRED: "#7c3aed",
};

export default function PracticeLivePage() {
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [versions, setVersions] = useState<VersionView[]>([]);
  const [finalReport, setFinalReport] = useState<{ overallRiskScore: number; riskLevel: RiskLevel } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/pre-live")
      .then((r) => r.json())
      .then((d) => setAudits(d.audits ?? []))
      .catch(() => {});
  }, []);

  async function startSession() {
    if (!selectedAuditId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/practice-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preLiveAuditId: selectedAuditId, label: "Practice LIVE" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start a practice session.");
        return;
      }
      setSessionId(data.session.id);
      setVersions([]);
      setFinalReport(null);
    } finally {
      setBusy(false);
    }
  }

  async function submitTest() {
    if (!sessionId || !draft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/practice-sessions/${sessionId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptText: draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not analyze this test.");
        return;
      }
      setVersions((v) => [...v, data.version]);
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/practice-sessions/${sessionId}/finalize`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not generate final report.");
        return;
      }
      setFinalReport(data.readiness);
    } finally {
      setBusy(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px",
    marginTop: "4px",
  };

  return (
    <div style={{ maxWidth: "760px" }}>
      <h2 style={{ fontSize: "18px" }}>Practice LIVE</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Flow: Draft → Practice → Automated Risk Review → Fix Issues → Re-test → Final Readiness
        Report.
      </p>

      {!sessionId ? (
        <>
          <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginTop: "14px" }}>
            Select a Pre-LIVE Audit to practice against
          </label>
          <select style={fieldStyle} value={selectedAuditId} onChange={(e) => setSelectedAuditId(e.target.value)}>
            <option value="">— choose —</option>
            {audits.map((a) => (
              <option key={a.id} value={a.id}>
                {a.liveTitle} ({a.product})
              </option>
            ))}
          </select>
          <button
            onClick={startSession}
            disabled={!selectedAuditId || busy}
            style={{
              marginTop: "12px",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              borderRadius: "6px",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Start practice session
          </button>
          {audits.length === 0 && (
            <p style={{ fontSize: "13px", color: "#888", marginTop: "10px" }}>
              No Pre-LIVE Audits yet. Create one on the Pre-LIVE Test page first.
            </p>
          )}
        </>
      ) : (
        <>
          <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginTop: "14px" }}>
            Draft script (Test #{versions.length + 1})
          </label>
          <textarea style={{ ...fieldStyle, minHeight: "100px" }} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button
            onClick={submitTest}
            disabled={busy || !draft.trim()}
            style={{
              marginTop: "10px",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              borderRadius: "6px",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Run risk review
          </button>

          {versions.map((v) => (
            <div key={v.id} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "14px", marginTop: "14px" }}>
              <p style={{ margin: 0, fontWeight: 700 }}>
                Test #{v.versionNumber} — Risk:{" "}
                <span style={{ color: LEVEL_COLORS[v.overallRiskLevel] }}>{v.overallRiskLevel}</span>
              </p>
              <p style={{ fontSize: "13px", color: "#666", marginTop: "6px" }}>{v.scriptText}</p>
              {v.riskFindings.length > 0 && (
                <ul style={{ fontSize: "13px", marginTop: "8px" }}>
                  {v.riskFindings.map((f, i) => (
                    <li key={i}>
                      <strong>{f.category}:</strong> {f.reasoning} <em>Try: {f.saferAlternative}</em>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {versions.length > 0 && (
            <button
              onClick={finalize}
              disabled={busy}
              style={{
                marginTop: "16px",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: 600,
                border: "1px solid #111",
                borderRadius: "6px",
                background: "#fff",
                color: "#111",
                cursor: "pointer",
              }}
            >
              Generate final readiness report
            </button>
          )}

          {finalReport && (
            <div style={{ marginTop: "16px", border: "1px solid #ddd", borderRadius: "8px", padding: "14px" }}>
              <p style={{ fontWeight: 700, margin: 0 }}>
                Final Risk Assessment Score: {finalReport.overallRiskScore} ({finalReport.riskLevel})
              </p>
              <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
                Lower assessed risk does not guarantee that a third-party platform will not restrict the
                account.
              </p>
            </div>
          )}
        </>
      )}

      {error && <p style={{ color: "#9b2c2c", fontSize: "13px", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}
