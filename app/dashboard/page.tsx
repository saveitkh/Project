import Link from "next/link";
import LocationVsServerDiagram from "@/components/LocationVsServerDiagram";

const CARDS = [
  {
    href: "/live-test",
    title: "LIVE Test",
    desc: "Run one piece of branded LIVE content through a simulated region's mock policy.",
  },
  {
    href: "/region-comparison",
    title: "Region Comparison",
    desc: "Run the same content through all simulated regions side by side.",
  },
  {
    href: "/experiments",
    title: "Experiments",
    desc: "Change one variable at a time (brand name, evidence, title, description) and compare.",
  },
  {
    href: "/false-positives",
    title: "False Positive Lab",
    desc: "Legitimate branded examples that a mock policy could still flag, and why.",
  },
  {
    href: "/reports",
    title: "Reports",
    desc: "Generate and review structured research reports from past simulation runs.",
  },
  {
    href: "/settings",
    title: "Settings",
    desc: "Edit the mock sensitivity and threshold values for each simulated region.",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <section
        style={{
          background: "#f6f6f6",
          border: "1px solid #e3e3e3",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
          fontSize: "14px",
          lineHeight: 1.5,
        }}
      >
        <strong>Scope &amp; ethics.</strong> This tool is a local, educational
        research lab. It studies, in the abstract, how differing content-moderation
        policy configurations could produce different outcomes for the same branded
        LIVE content across markets. All region names are used only as labels on
        synthetic policy data — there is no real TikTok integration, no real account
        or device data, no geo-location or IP manipulation, and no automated
        interaction with any live platform. Every score and policy value is
        invented for this lab and must not be treated as TikTok&apos;s real rules
        or real behavior.
      </section>

      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "16px", marginBottom: "4px" }}>
          Location vs. Server vs. Moderation
        </h2>
        <p style={{ fontSize: "13px", color: "#666", marginTop: 0 }}>
          An educational diagram showing why a server&apos;s region is not the same
          thing as a user&apos;s physical location, account market, or the policy
          applied to their content.
        </p>
        <LocationVsServerDiagram />
      </section>

      <h2 style={{ fontSize: "16px", marginBottom: "4px" }}>Features</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
        }}
      >
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            style={{
              display: "block",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "16px",
              textDecoration: "none",
              color: "#111",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>{c.title}</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
