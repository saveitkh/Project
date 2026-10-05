"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ProtectionReportData } from "@/lib/protection/reportGenerator";

export default function ReportViewPage() {
  const params = useParams<{ id: string }>();
  const [report, setReport] = useState<ProtectionReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reports/${params.id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Not found.");
        setReport(data.report);
      })
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error) return <p style={{ color: "#9b2c2c" }}>{error}</p>;
  if (!report) return <p>Loading…</p>;

  const section: React.CSSProperties = { marginTop: "18px" };
  const label: React.CSSProperties = { fontSize: "12px", fontWeight: 700, color: "#555", textTransform: "uppercase" };

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ fontSize: "18px" }}>Protection Report</h2>
        <a
          href={`/api/reports/${params.id}/pdf`}
          style={{ fontSize: "13px", padding: "8px 12px", border: "1px solid #111", borderRadius: "6px", textDecoration: "none", color: "#111" }}
        >
          Download PDF
        </a>
      </div>

      <div style={section}>
        <p style={label}>Customer</p>
        <p>{report.customerName}</p>
      </div>
      <div style={section}>
        <p style={label}>Username</p>
        <p>{report.username}</p>
      </div>
      <div style={section}>
        <p style={label}>Test Date</p>
        <p>{new Date(report.testDate).toLocaleString()}</p>
      </div>
      <div style={section}>
        <p style={label}>Market</p>
        <p>{report.market}</p>
      </div>
      <div style={section}>
        <p style={label}>Product</p>
        <p>{report.product}</p>
      </div>

      <div style={section}>
        <p style={label}>Final Risk Assessment</p>
        <p>
          Overall Risk Score: {report.finalRiskAssessment.overallRiskScore} — Risk Level:{" "}
          {report.finalRiskAssessment.riskLevel}
        </p>
      </div>

      <div style={section}>
        <p style={label}>Detected Risks</p>
        {report.detectedRisks.length === 0 ? (
          <p style={{ fontSize: "13px" }}>None.</p>
        ) : (
          <ul style={{ fontSize: "13px" }}>
            {report.detectedRisks.map((f, i) => (
              <li key={i}>
                [{f.riskLevel}] {f.category}: {f.statement}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={section}>
        <p style={label}>Corrections</p>
        <ul style={{ fontSize: "13px" }}>
          {report.corrections.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      <div style={section}>
        <p style={label}>Evidence</p>
        <ul style={{ fontSize: "13px" }}>
          {report.evidence.length === 0 ? <li>None on file</li> : report.evidence.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      </div>

      <div style={section}>
        <p style={label}>Recommendations</p>
        <ul style={{ fontSize: "13px" }}>
          {report.recommendations.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      <div style={{ ...section, background: "#f6f6f6", border: "1px solid #ddd", borderRadius: "8px", padding: "12px" }}>
        <p style={label}>Limitations</p>
        <ul style={{ fontSize: "13px" }}>
          {report.limitations.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
