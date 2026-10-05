"use client";

import { useState } from "react";
import type { RiskFindingResult } from "@/lib/protection/riskEngine";
import type { ReadinessResult } from "@/lib/protection/readinessScore";

interface FormState {
  tiktokUsername: string;
  liveTitle: string;
  product: string;
  productDescription: string;
  promotionalClaims: string;
  plannedScript: string;
  talkingPoints: string;
  targetAudience: string;
  market: string;
  plannedDurationMins: string;
}

const EMPTY: FormState = {
  tiktokUsername: "",
  liveTitle: "",
  product: "",
  productDescription: "",
  promotionalClaims: "",
  plannedScript: "",
  talkingPoints: "",
  targetAudience: "",
  market: "",
  plannedDurationMins: "60",
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "14px",
  marginTop: "4px",
  fontFamily: "inherit",
};
const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  display: "block",
  marginTop: "14px",
};

export default function PreLivePage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [practiceMode, setPracticeMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [findings, setFindings] = useState<RiskFindingResult[] | null>(null);
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pre-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          plannedDurationMins: Number(form.plannedDurationMins),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not run the pre-LIVE audit.");
        return;
      }
      setFindings(data.findings);
      setReadiness(data.readiness);
    } finally {
      setLoading(false);
    }
  }

  const th: React.CSSProperties = { textAlign: "left", padding: "8px", borderBottom: "2px solid #ddd", fontSize: "12px" };
  const td: React.CSSProperties = { padding: "8px", borderBottom: "1px solid #eee", fontSize: "13px", verticalAlign: "top" };

  return (
    <div>
      <h2 style={{ fontSize: "18px" }}>Pre-LIVE Test</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Test your LIVE script, claims, and talking points before going LIVE. This identifies
        potentially risky statements using general compliance heuristics — it does not know
        or predict TikTok&apos;s private moderation decisions.
      </p>

      <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", fontSize: "13px" }}>
        <input type="checkbox" checked={practiceMode} onChange={(e) => setPracticeMode(e.target.checked)} />
        Practice Test mode (analyze what I plan to say)
      </label>

      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>TikTok username / account identifier</label>
        <input style={fieldStyle} required value={form.tiktokUsername} onChange={(e) => set("tiktokUsername", e.target.value)} />

        <label style={labelStyle}>LIVE title</label>
        <input style={fieldStyle} required value={form.liveTitle} onChange={(e) => set("liveTitle", e.target.value)} />

        <label style={labelStyle}>Product / service</label>
        <input style={fieldStyle} required value={form.product} onChange={(e) => set("product", e.target.value)} />

        <label style={labelStyle}>Product description</label>
        <textarea style={{ ...fieldStyle, minHeight: "60px" }} value={form.productDescription} onChange={(e) => set("productDescription", e.target.value)} />

        <label style={labelStyle}>Promotional claims</label>
        <textarea style={{ ...fieldStyle, minHeight: "60px" }} value={form.promotionalClaims} onChange={(e) => set("promotionalClaims", e.target.value)} />

        {practiceMode && (
          <>
            <label style={labelStyle}>Planned script (what you plan to say)</label>
            <textarea style={{ ...fieldStyle, minHeight: "120px" }} value={form.plannedScript} onChange={(e) => set("plannedScript", e.target.value)} />
          </>
        )}

        <label style={labelStyle}>Planned talking points</label>
        <textarea style={{ ...fieldStyle, minHeight: "60px" }} value={form.talkingPoints} onChange={(e) => set("talkingPoints", e.target.value)} />

        <label style={labelStyle}>Target audience</label>
        <input style={fieldStyle} value={form.targetAudience} onChange={(e) => set("targetAudience", e.target.value)} />

        <label style={labelStyle}>Country / market</label>
        <input style={fieldStyle} required value={form.market} onChange={(e) => set("market", e.target.value)} />

        <label style={labelStyle}>Planned LIVE duration (minutes)</label>
        <input style={fieldStyle} type="number" min={1} required value={form.plannedDurationMins} onChange={(e) => set("plannedDurationMins", e.target.value)} />

        {error && <p style={{ color: "#9b2c2c", fontSize: "13px", marginTop: "10px" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "16px",
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
          {loading ? "Running audit..." : "Run Pre-LIVE Audit"}
        </button>
      </form>

      {readiness && (
        <div style={{ marginTop: "28px", border: "1px solid #ddd", borderRadius: "8px", padding: "16px" }}>
          <h3 style={{ fontSize: "15px", marginTop: 0 }}>
            Risk Assessment Score: {readiness.overallRiskScore} ({readiness.riskLevel})
          </h3>
          <p style={{ fontSize: "12px", color: "#888" }}>
            This is a Risk Assessment Score, not a &quot;Ban Probability&quot; — TikTok&apos;s private
            enforcement probability is unknown to this system.
          </p>
        </div>
      )}

      {findings && (
        <div style={{ marginTop: "24px", overflowX: "auto" }}>
          <h3 style={{ fontSize: "15px" }}>Detected Findings</h3>
          {findings.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#666" }}>No findings detected by this heuristic engine.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Statement</th>
                  <th style={th}>Risk Level</th>
                  <th style={th}>Category</th>
                  <th style={th}>Why it may be risky</th>
                  <th style={th}>Safer alternative</th>
                  <th style={th}>Evidence/Source</th>
                  <th style={th}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f, i) => (
                  <tr key={i}>
                    <td style={td}>{f.statement}</td>
                    <td style={td}>{f.riskLevel}</td>
                    <td style={td}>{f.category}</td>
                    <td style={td}>{f.reasoning}</td>
                    <td style={td}>
                      {f.saferAlternative}
                      <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
                        Risk-reduction suggestion — not a guarantee.
                      </div>
                    </td>
                    <td style={td}>{f.evidenceSource}</td>
                    <td style={td}>{f.confidence.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
