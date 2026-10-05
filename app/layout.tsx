import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project",
  description: "Monorepo root shell — see nested route groups for the actual products.",
};

// This root layout is intentionally minimal: each product area in this
// repo ((simulator) and (protection)) defines its own nested layout with
// its own nav/banner/disclaimers, since they are two distinct products
// sharing one Next.js app.
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
        {children}
      </body>
    </html>
  );
}
