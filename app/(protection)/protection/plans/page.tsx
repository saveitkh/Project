const PLANS = [
  {
    name: "BASIC",
    features: ["Pre-LIVE audit", "Script review", "Risk report"],
  },
  {
    name: "PRO",
    features: [
      "Everything in BASIC",
      "Practice LIVE",
      "Product/content review",
      "Risk history",
      "Monitoring where officially available",
    ],
  },
  {
    name: "ADVANCED",
    features: [
      "Everything in PRO",
      "Continuous monitoring where officially supported",
      "Incident evidence package",
      "Appeal preparation assistance",
      "Priority review",
    ],
  },
];

export default function PlansPage() {
  return (
    <div>
      <h2 style={{ fontSize: "18px" }}>Protection Plans</h2>
      <p style={{ fontSize: "13px", color: "#666", maxWidth: "640px" }}>
        Every plan reduces preventable risk and helps you prepare for incidents. No plan
        guarantees immunity from TikTok enforcement — we do not control TikTok&apos;s
        decisions.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginTop: "20px" }}>
        {PLANS.map((plan) => (
          <div key={plan.name} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px" }}>
            <h3 style={{ fontSize: "16px", marginTop: 0 }}>{plan.name}</h3>
            <ul style={{ fontSize: "13px", paddingLeft: "18px" }}>
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
