"use client";

import { useEffect, useState } from "react";
import { DEFAULT_POLICIES, loadPolicies, resetPolicies, savePolicies } from "@/lib/regions";
import { RegionName, RegionPolicy, REGION_NAMES } from "@/lib/types";

const SLIDER_FIELDS: { key: keyof RegionPolicy; label: string }[] = [
  { key: "brandNameSensitivity", label: "Brand-name sensitivity" },
  { key: "trademarkSensitivity", label: "Trademark sensitivity" },
  { key: "authenticityClaimSensitivity", label: "Authenticity-claim sensitivity" },
  { key: "liveContentRestrictionLevel", label: "LIVE content restriction level" },
  { key: "evidenceRequirementLevel", label: "Evidence requirement level" },
  { key: "riskThreshold", label: "Risk threshold" },
];

export default function SettingsPage() {
  const [policies, setPolicies] = useState<Record<RegionName, RegionPolicy>>(DEFAULT_POLICIES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPolicies(loadPolicies());
  }, []);

  function updateField(region: RegionName, key: keyof RegionPolicy, value: number) {
    setPolicies((prev) => ({
      ...prev,
      [region]: { ...prev[region], [key]: value },
    }));
    setSaved(false);
  }

  function handleSave() {
    savePolicies(policies);
    setSaved(true);
  }

  function handleReset() {
    setPolicies(resetPolicies());
    setSaved(false);
  }

  return (
    <div>
      <h2 style={{ fontSize: "18px" }}>Settings — Simulated Policy Configuration</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        All values below are SIMULATED policy weights invented for this research lab. They
        do not represent TikTok&apos;s actual policies. Edits are saved only in this browser.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginTop: "16px" }}>
        {REGION_NAMES.map((region) => (
          <div key={region} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px" }}>
            <h3 style={{ fontSize: "15px", marginTop: 0 }}>{region}</h3>
            {SLIDER_FIELDS.map((field) => (
              <div key={field.key} style={{ marginTop: "12px" }}>
                <label style={{ fontSize: "12px", color: "#555", display: "flex", justifyContent: "space-between" }}>
                  <span>{field.label}</span>
                  <span>{policies[region][field.key]}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={policies[region][field.key] as number}
                  onChange={(e) => updateField(region, field.key, Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          onClick={handleSave}
          style={{
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: 600,
            border: "none",
            borderRadius: "6px",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Save simulated policies
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: "10px 16px",
            fontSize: "14px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Reset to defaults
        </button>
        {saved && <span style={{ fontSize: "13px", color: "#276749" }}>Saved.</span>}
      </div>
    </div>
  );
}
