interface RiskFindingView {
  id: string;
  riskLevel: string;
  category: string;
  reasoning: string;
  saferAlternative: string;
}

const LEVEL_COLORS: Record<string, string> = {
  LOW: "#276749",
  MEDIUM: "#9c6b00",
  HIGH: "#9b2c2c",
  REVIEW_REQUIRED: "#7c3aed",
};

export default function RiskAlertBanner({ finding }: { finding: RiskFindingView }) {
  return (
    <div
      style={{
        border: `1px solid ${LEVEL_COLORS[finding.riskLevel] ?? "#ccc"}`,
        borderLeftWidth: "6px",
        borderRadius: "6px",
        padding: "10px 12px",
        marginTop: "8px",
        background: "#fff",
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, color: LEVEL_COLORS[finding.riskLevel] ?? "#111" }}>
        RISK ALERT — {finding.riskLevel} · {finding.category}
      </p>
      <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>{finding.reasoning}</p>
      <p style={{ margin: "4px 0 0 0", fontSize: "13px", fontStyle: "italic" }}>
        Suggested action: {finding.saferAlternative}
      </p>
      <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#888" }}>
        Risk-reduction suggestion — not a guarantee.
      </p>
    </div>
  );
}
