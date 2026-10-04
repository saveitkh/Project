"use client";

import { useEffect, useMemo, useState } from "react";
import ContentForm from "@/components/ContentForm";
import { loadPolicies } from "@/lib/regions";
import { evaluateContent } from "@/lib/riskEngine";
import { buildReport, deleteReport, loadReports, saveReport } from "@/lib/reportGenerator";
import { ContentInput, EMPTY_CONTENT, Report, REGION_NAMES } from "@/lib/types";

export default function ReportsPage() {
  const [content, setContent] = useState<ContentInput>({
    ...EMPTY_CONTENT,
    brand: "Example Brand",
    product: "Authentic handbag",
    liveTitle: "Example Brand handbag",
    liveScript: "This is a genuine Example Brand handbag, authentic and guaranteed real.",
    hashtags: ["#examplebrand", "#authentic"],
    evidence: "Purchase invoice",
  });
  const [reports, setReports] = useState<Report[]>([]);

  const policies = useMemo(() => loadPolicies(), []);

  useEffect(() => {
    setReports(loadReports());
  }, []);

  function handleGenerate() {
    const policyList = REGION_NAMES.map((r) => policies[r]);
    const results = REGION_NAMES.map((r) => evaluateContent(content, policies[r]));
    const report = buildReport(content, policyList, results);
    setReports(saveReport(report));
  }

  function handleDelete(id: string) {
    setReports(deleteReport(id));
  }

  const sectionStyle: React.CSSProperties = {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  };
  const fieldLabel: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 700,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  };

  return (
    <div>
      <h2 style={{ fontSize: "18px" }}>Reports</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Generate a structured research report from a simulation run, saved locally in your
        browser only.
      </p>

      <ContentForm value={content} onChange={setContent} />
      <button
        onClick={handleGenerate}
        style={{
          marginTop: "14px",
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
        Generate report
      </button>

      <h3 style={{ fontSize: "15px", marginTop: "32px" }}>Saved reports ({reports.length})</h3>
      {reports.length === 0 && (
        <p style={{ fontSize: "13px", color: "#888" }}>No reports generated yet.</p>
      )}
      {reports.map((report) => (
        <div key={report.id} style={sectionStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: "13px", color: "#888" }}>
              {new Date(report.createdAt).toLocaleString()} — {report.id}
            </div>
            <button
              onClick={() => handleDelete(report.id)}
              style={{
                fontSize: "12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "#fff",
                padding: "4px 8px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>

          <div style={{ marginTop: "10px" }}>
            <div style={fieldLabel}>1. Test configuration (simulated)</div>
            <p style={{ fontSize: "13px", margin: "4px 0 10px 0" }}>
              {report.testConfig.length} simulated region policies applied:{" "}
              {report.testConfig.map((p) => p.region).join(", ")}.
            </p>

            <div style={fieldLabel}>3. Input content</div>
            <p style={{ fontSize: "13px", margin: "4px 0 10px 0" }}>
              Brand: {report.input.brand || "—"} · Product: {report.input.product || "—"} ·
              LIVE title: {report.input.liveTitle || "—"} · Hashtags:{" "}
              {report.input.hashtags.join(", ") || "—"}
            </p>

            <div style={fieldLabel}>7. Evidence available</div>
            <p style={{ fontSize: "13px", margin: "4px 0 10px 0" }}>
              {report.input.evidence ? report.input.evidence : "None supplied"}
            </p>

            <div style={fieldLabel}>2, 4, 5, 6, 8. Per-region results</div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "6px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", fontSize: "12px", padding: "6px", borderBottom: "1px solid #eee" }}>
                    Region
                  </th>
                  <th style={{ textAlign: "left", fontSize: "12px", padding: "6px", borderBottom: "1px solid #eee" }}>
                    Detected signals
                  </th>
                  <th style={{ textAlign: "left", fontSize: "12px", padding: "6px", borderBottom: "1px solid #eee" }}>
                    Risk score
                  </th>
                  <th style={{ textAlign: "left", fontSize: "12px", padding: "6px", borderBottom: "1px solid #eee" }}>
                    Explanation
                  </th>
                  <th style={{ textAlign: "left", fontSize: "12px", padding: "6px", borderBottom: "1px solid #eee" }}>
                    Recommended compliant action
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((r) => (
                  <tr key={r.region}>
                    <td style={{ fontSize: "13px", padding: "6px", borderBottom: "1px solid #f4f4f4" }}>
                      {r.region}
                    </td>
                    <td style={{ fontSize: "13px", padding: "6px", borderBottom: "1px solid #f4f4f4" }}>
                      {r.triggers.filter((t) => t.weight > 0).map((t) => t.label).join(", ") || "—"}
                    </td>
                    <td style={{ fontSize: "13px", padding: "6px", borderBottom: "1px solid #f4f4f4" }}>
                      {r.riskScore} {r.flagged ? "(flagged)" : "(not flagged)"}
                    </td>
                    <td style={{ fontSize: "13px", padding: "6px", borderBottom: "1px solid #f4f4f4" }}>
                      {r.explanation}
                    </td>
                    <td style={{ fontSize: "13px", padding: "6px", borderBottom: "1px solid #f4f4f4" }}>
                      {r.recommendedCompliantAction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
