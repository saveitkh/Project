"use client";

import { useEffect, useState } from "react";

interface Overview {
  counts: {
    customers: number;
    preLiveAudits: number;
    practiceSessions: number;
    riskFindings: number;
    incidents: number;
    appeals: number;
  };
  systemHealth: { dbHealthy: boolean };
  apiHealth: { officialApiConfigured: boolean };
  recentCustomers: {
    id: string;
    companyName: string | null;
    market: string | null;
    protectionPlan: string;
    createdAt: string;
    user: { email: string; createdAt: string };
  }[];
}

const statBox: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center",
};

export default function AdminPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Admin access required.");
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ color: "#9b2c2c" }}>{error}</p>;
  if (!data) return <p>Loading…</p>;

  const stats: [string, number][] = [
    ["Customers", data.counts.customers],
    ["Pre-LIVE Tests", data.counts.preLiveAudits],
    ["Practice Sessions", data.counts.practiceSessions],
    ["Risk Events", data.counts.riskFindings],
    ["Incident Reports", data.counts.incidents],
    ["Appeals", data.counts.appeals],
  ];

  return (
    <div>
      <h2 style={{ fontSize: "18px" }}>Admin Dashboard</h2>
      <p style={{ fontSize: "12px", color: "#888" }}>
        Customer passwords are never shown here or stored in readable form anywhere in this
        system.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginTop: "16px" }}>
        {stats.map(([label, value]) => (
          <div key={label} style={statBox}>
            <div style={{ fontSize: "24px", fontWeight: 700 }}>{value}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>{label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: "15px", marginTop: "24px" }}>System Health</h3>
      <p style={{ fontSize: "13px" }}>
        Database: {data.systemHealth.dbHealthy ? "✅ healthy" : "❌ unreachable"}
      </p>

      <h3 style={{ fontSize: "15px", marginTop: "16px" }}>API Health</h3>
      <p style={{ fontSize: "13px" }}>
        Official TikTok API integration:{" "}
        {data.apiHealth.officialApiConfigured ? "✅ configured" : "⚠️ not configured (monitoring features report UNAVAILABLE)"}
      </p>

      <h3 style={{ fontSize: "15px", marginTop: "24px" }}>Recent Customers</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", fontSize: "12px", padding: "6px", borderBottom: "1px solid #eee" }}>Email</th>
            <th style={{ textAlign: "left", fontSize: "12px", padding: "6px", borderBottom: "1px solid #eee" }}>Company</th>
            <th style={{ textAlign: "left", fontSize: "12px", padding: "6px", borderBottom: "1px solid #eee" }}>Market</th>
            <th style={{ textAlign: "left", fontSize: "12px", padding: "6px", borderBottom: "1px solid #eee" }}>Plan</th>
            <th style={{ textAlign: "left", fontSize: "12px", padding: "6px", borderBottom: "1px solid #eee" }}>Joined</th>
          </tr>
        </thead>
        <tbody>
          {data.recentCustomers.map((c) => (
            <tr key={c.id}>
              <td style={{ fontSize: "13px", padding: "6px", borderBottom: "1px solid #f4f4f4" }}>{c.user.email}</td>
              <td style={{ fontSize: "13px", padding: "6px", borderBottom: "1px solid #f4f4f4" }}>{c.companyName ?? "—"}</td>
              <td style={{ fontSize: "13px", padding: "6px", borderBottom: "1px solid #f4f4f4" }}>{c.market ?? "—"}</td>
              <td style={{ fontSize: "13px", padding: "6px", borderBottom: "1px solid #f4f4f4" }}>{c.protectionPlan}</td>
              <td style={{ fontSize: "13px", padding: "6px", borderBottom: "1px solid #f4f4f4" }}>
                {new Date(c.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
