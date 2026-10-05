"use client";

import { useState } from "react";
import type { RiskFindingResult, RiskLevel } from "@/lib/protection/riskEngine";

const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "#276749",
  MEDIUM: "#9c6b00",
  HIGH: "#9b2c2c",
  REVIEW_REQUIRED: "#9b2c2c",
};

export default function SpeakingPracticePage() {
  const [statement, setStatement] = useState(
    "នេះជាផលិតផលល្អបំផុត 100% ហើយអាចព្យាបាលជំងឺបាន។"
  );
  const [loading, setLoading] = useState(false);
  const [overall, setOverall] = useState<RiskLevel | null>(null);
  const [findings, setFindings] = useState<RiskFindingResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not analyze this statement.");
        return;
      }
      setOverall(data.overall);
      setFindings(data.findings);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "720px" }}>
      <h2 style={{ fontSize: "18px" }}>Speaking Practice</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Type or paste a line you plan to say during LIVE. This tool never simply says
        &quot;BAN&quot; — it explains the risk pattern and suggests safer wording.
      </p>

      <textarea
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        style={{
          width: "100%",
          minHeight: "90px",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          fontSize: "14px",
          marginTop: "10px",
        }}
      />

      <button
        onClick={handleAnalyze}
        disabled={loading || !statement.trim()}
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
        {loading ? "Analyzing..." : "Analyze statement"}
      </button>

      {error && <p style={{ color: "#9b2c2c", fontSize: "13px", marginTop: "10px" }}>{error}</p>}

      {overall && findings && (
        <div style={{ marginTop: "20px" }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: RISK_COLORS[overall] }}>
            Risk: {overall}
          </p>

          {findings.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#666" }}>
              No risk patterns detected by this heuristic engine for this statement.
            </p>
          ) : (
            findings.map((f, i) => (
              <div
                key={i}
                style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "14px", marginTop: "10px" }}
              >
                <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>{f.category}</p>
                <p style={{ fontSize: "14px", fontWeight: 600, margin: "6px 0 2px 0" }}>Reason</p>
                <p style={{ fontSize: "14px", margin: 0 }}>{f.reasoning}</p>
                <p style={{ fontSize: "14px", fontWeight: 600, margin: "10px 0 2px 0" }}>Suggested wording</p>
                <p style={{ fontSize: "14px", margin: 0 }}>{f.saferAlternative}</p>
                <p style={{ fontSize: "12px", color: "#888", marginTop: "8px", fontStyle: "italic" }}>
                  Risk-reduction suggestion — not a guarantee.
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
