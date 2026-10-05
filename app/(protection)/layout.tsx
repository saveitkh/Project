import ProtectionBanner from "@/components/protection/ProtectionBanner";
import ProtectionNav from "@/components/protection/ProtectionNav";

export default function ProtectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ProtectionBanner />
      <header style={{ padding: "16px 16px 0 16px" }}>
        <h1 style={{ fontSize: "20px", margin: 0 }}>LIVE Pre-Test &amp; Account Protection</h1>
        <p style={{ fontSize: "13px", color: "#666", margin: "4px 0 0 0" }}>
          Prevent · Test · Monitor · Document · Respond · Appeal
        </p>
      </header>
      <ProtectionNav />
      <main style={{ padding: "20px 16px", maxWidth: "1100px", margin: "0 auto" }}>{children}</main>
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
        We reduce preventable risk. We do not control TikTok&apos;s enforcement decisions and
        cannot guarantee any outcome.
      </footer>
    </div>
  );
}
