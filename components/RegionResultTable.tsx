import { RiskResult } from "@/lib/types";

export default function RegionResultTable({ results }: { results: RiskResult[] }) {
  const th: React.CSSProperties = {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "2px solid #ddd",
    fontSize: "13px",
    color: "#555",
  };
  const td: React.CSSProperties = {
    padding: "10px 12px",
    borderBottom: "1px solid #eee",
    fontSize: "13px",
    verticalAlign: "top",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Region</th>
            <th style={th}>Risk Score</th>
            <th style={th}>Trigger(s)</th>
            <th style={th}>Explanation</th>
            <th style={th}>Recommended Compliant Action</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.region}>
              <td style={td}>
                <strong>{r.region}</strong>
              </td>
              <td style={td}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontWeight: 600,
                    background: r.flagged ? "#fde2e2" : "#e3f5e6",
                    color: r.flagged ? "#9b2c2c" : "#276749",
                  }}
                >
                  {r.riskScore}
                </span>
              </td>
              <td style={td}>
                {r.triggers.filter((t) => t.weight > 0).map((t) => t.label).join(", ") || "—"}
              </td>
              <td style={td}>{r.explanation}</td>
              <td style={td}>{r.recommendedCompliantAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
        Simulated results only — not TikTok&apos;s actual moderation outcomes.
      </p>
    </div>
  );
}
