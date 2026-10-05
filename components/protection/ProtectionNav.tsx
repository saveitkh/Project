"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/pre-live", label: "Pre-LIVE Test" },
  { href: "/pre-live/practice", label: "Speaking Practice" },
  { href: "/pre-live/product", label: "Product Test" },
  { href: "/pre-live/practice-live", label: "Practice LIVE" },
  { href: "/live-monitor", label: "Live Monitor" },
  { href: "/protection/incidents", label: "Incidents" },
  { href: "/protection/plans", label: "Plans" },
  { href: "/admin", label: "Admin" },
];

export default function ProtectionNav() {
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
