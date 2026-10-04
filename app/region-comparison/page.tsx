"use client";

import { useMemo, useState } from "react";
import ContentForm from "@/components/ContentForm";
import RegionResultTable from "@/components/RegionResultTable";
import { loadPolicies } from "@/lib/regions";
import { evaluateContent } from "@/lib/riskEngine";
import { ContentInput, EMPTY_CONTENT, REGION_NAMES } from "@/lib/types";

export default function RegionComparisonPage() {
  const [content, setContent] = useState<ContentInput>({
    ...EMPTY_CONTENT,
    brand: "Example Brand",
    product: "Authentic handbag",
    liveTitle: "Example Brand handbag",
    liveScript: "This is a genuine Example Brand handbag, authentic and guaranteed real.",
    hashtags: ["#examplebrand", "#authentic"],
    evidence: "Purchase invoice",
  });

  const policies = useMemo(() => loadPolicies(), []);
  const results = useMemo(
    () => REGION_NAMES.map((r) => evaluateContent(content, policies[r])),
    [content, policies]
  );

  return (
    <div>
      <h2 style={{ fontSize: "18px" }}>Region Comparison</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Run the same content through every simulated region at once to see how a mock
        policy difference alone can change the outcome.
      </p>

      <ContentForm value={content} onChange={setContent} />

      <h3 style={{ fontSize: "15px", marginTop: "24px" }}>Results</h3>
      <RegionResultTable results={results} />
    </div>
  );
}
