const STEPS = [
  {
    label: "Physical Location",
    detail: "Where the person actually is in the real world (GPS, SIM registration, Wi-Fi network).",
  },
  {
    label: "Network / IP Location",
    detail: "The location a network address appears to be coming from — can be a proxy, VPN, or a cloud region, and may not match physical location.",
  },
  {
    label: "Server Region",
    detail: "Where the application backend or hosting infrastructure happens to run. This is an infrastructure choice, not a statement about the user.",
  },
  {
    label: "Platform Account / Market",
    detail: "The market/region a platform has assigned to an account, typically set at signup and tied to identity, payment, and compliance signals — not to server location.",
  },
  {
    label: "Content",
    detail: "What is actually posted or streamed: text, audio, video, product claims.",
  },
  {
    label: "Moderation",
    detail: "The policy and enforcement actually applied — driven by the account's market/policy context and the content itself, not by which server rendered a page.",
  },
];

export default function LocationVsServerDiagram() {
  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0",
          maxWidth: "640px",
        }}
      >
        {STEPS.map((step, i) => (
          <div key={step.label}>
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "10px 14px",
                background: "#fafafa",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "14px" }}>{step.label}</div>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                {step.detail}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "16px",
                  color: "#999",
                  padding: "4px 0",
                }}
                aria-hidden
              >
                ↓
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "16px", fontSize: "13px", lineHeight: 1.6, color: "#333" }}>
        <strong>Why changing a server&apos;s region does not change the outcome:</strong>{" "}
        A server region is an infrastructure detail — it describes where a backend happens
        to run, not who the user is or where they physically are. A platform account&apos;s
        assigned market is set independently (at signup, via identity/payment/compliance
        signals) and generally persists regardless of which server answered a given request.
        Moderation policy is applied based on the account&apos;s market and the content itself —
        not on which data-center region served the page. So moving a server, or routing traffic
        through a different network location, does not by itself change a person&apos;s physical
        location, does not change their platform account&apos;s market, and does not change which
        policy set is applied to their content. This simulator only ever changes which mock
        policy object is applied to test content — it never touches network, device, or
        account-location data.
      </div>
    </div>
  );
}
