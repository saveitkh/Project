import { RegionName, RiskResult } from "@/lib/types";

interface Props {
  baseline: RiskResult[];
  modified: RiskResult[];
}

export default function VariableDiff({ baseline, modified }: Props) {
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
            <th style={th}>Baseline Score</th>
            <th style={th}>Modified Score</th>
            <th style={th}>Delta</th>
            <th style={th}>Baseline Flagged</th>
            <th style={th}>Modified Flagged</th>
          </tr>
        </thead>
        <tbody>
          {baseline.map((b, i) => {
            const m = modified[i];
            const delta = m.riskScore - b.riskScore;
            return (
              <tr key={b.region as RegionName}>
                <td style={td}>
                  <strong>{b.region}</strong>
                </td>
                <td style={td}>{b.riskScore}</td>
                <td style={td}>{m.riskScore}</td>
                <td
                  style={{
                    ...td,
                    color: delta > 0 ? "#9b2c2c" : delta < 0 ? "#276749" : "#555",
                    fontWeight: 600,
                  }}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </td>
                <td style={td}>{b.flagged ? "Yes" : "No"}</td>
                <td style={td}>{m.flagged ? "Yes" : "No"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
        Simulated comparison only — not TikTok&apos;s actual moderation outcomes.
      </p>
    </div>
  );
}
