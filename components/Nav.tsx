"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/live-test", label: "LIVE Test" },
  { href: "/region-comparison", label: "Region Comparison" },
  { href: "/experiments", label: "Experiments" },
  { href: "/false-positives", label: "False Positive Lab" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        display: "flex",
        gap: "4px",
        padding: "0 16px",
        borderBottom: "1px solid #ddd",
        background: "#fafafa",
        overflowX: "auto",
      }}
    >
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              padding: "12px 14px",
              fontSize: "14px",
              color: active ? "#111" : "#555",
              borderBottom: active ? "2px solid #111" : "2px solid transparent",
              whiteSpace: "nowrap",
              textDecoration: "none",
              fontWeight: active ? 600 : 400,
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
