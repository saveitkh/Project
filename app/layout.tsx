import type { Metadata } from "next";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Regional Moderation Research Lab (Simulation)",
  description:
    "A local educational simulator for studying how regional policy differences could affect moderation outcomes for branded LIVE content. Synthetic data only.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#111",
          background: "#fff",
        }}
      >
        <DisclaimerBanner />
        <header style={{ padding: "16px 16px 0 16px" }}>
          <h1 style={{ fontSize: "20px", margin: 0 }}>
            Regional Moderation Research Lab
          </h1>
          <p style={{ fontSize: "13px", color: "#666", margin: "4px 0 0 0" }}>
            Educational / defensive research simulator — synthetic regions and policies only.
          </p>
        </header>
        <Nav />
        <main style={{ padding: "20px 16px", maxWidth: "1100px", margin: "0 auto" }}>
          {children}
        </main>
        <footer
          style={{
            padding: "16px",
            textAlign: "center",
            fontSize: "12px",
            color: "#888",
            borderTop: "1px solid #eee",
            marginTop: "40px",
          }}
        >
          Simulation only — results do not represent TikTok&apos;s actual moderation rules.
        </footer>
      </body>
    </html>
  );
}
