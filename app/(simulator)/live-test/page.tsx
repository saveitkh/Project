"use client";

import { useMemo, useState } from "react";
import ContentForm from "@/components/ContentForm";
import RegionResultTable from "@/components/RegionResultTable";
import { loadPolicies } from "@/lib/regions";
import { evaluateContent } from "@/lib/riskEngine";
import { ContentInput, EMPTY_CONTENT, RegionName, REGION_NAMES } from "@/lib/types";

export default function LiveTestPage() {
  const [content, setContent] = useState<ContentInput>({
    ...EMPTY_CONTENT,
    brand: "Example Brand",
    product: "Authentic handbag",
    liveTitle: "Example Brand handbag",
    liveScript: "This is a genuine Example Brand handbag, authentic and guaranteed real.",
    hashtags: ["#examplebrand", "#authentic"],
    evidence: "Purchase invoice",
  });
  const [selectedRegion, setSelectedRegion] = useState<RegionName>("Indonesia");

  const policies = useMemo(() => loadPolicies(), []);
  const result = useMemo(
    () => evaluateContent(content, policies[selectedRegion]),
    [content, policies, selectedRegion]
  );

  return (
    <div>
      <h2 style={{ fontSize: "18px" }}>LIVE Test</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Enter content and pick one simulated region to see a mock risk evaluation.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div>
          <ContentForm value={content} onChange={setContent} />

          <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginTop: "14px" }}>
            Simulated region
          </label>
          <select
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              marginTop: "4px",
              fontSize: "14px",
            }}
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as RegionName)}
          >
            {REGION_NAMES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <RegionResultTable results={[result]} />
        </div>
      </div>
    </div>
  );
}
