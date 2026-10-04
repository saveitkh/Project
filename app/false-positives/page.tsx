"use client";

import { useMemo, useState } from "react";
import RegionResultTable from "@/components/RegionResultTable";
import { FALSE_POSITIVE_EXAMPLES } from "@/lib/falsePositiveLibrary";
import { loadPolicies } from "@/lib/regions";
import { evaluateContent } from "@/lib/riskEngine";
import { REGION_NAMES } from "@/lib/types";

export default function FalsePositivesPage() {
  const [selectedId, setSelectedId] = useState(FALSE_POSITIVE_EXAMPLES[0].id);
  const policies = useMemo(() => loadPolicies(), []);
  const example = FALSE_POSITIVE_EXAMPLES.find((e) => e.id === selectedId)!;

  const results = useMemo(
    () => REGION_NAMES.map((r) => evaluateContent(example.content, policies[r])),
    [example, policies]
  );

  const box: React.CSSProperties = {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "14px",
    marginBottom: "12px",
  };

  return (
    <div>
      <h2 style={{ fontSize: "18px" }}>False Positive Lab</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        These are fictional, legitimate branded-product examples that a mock policy in
        this simulator could still flag — illustrating how aggressive sensitivity settings
        can produce false positives against genuine sellers.
      </p>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "16px 0" }}>
        {FALSE_POSITIVE_EXAMPLES.map((e) => (
          <button
            key={e.id}
            onClick={() => setSelectedId(e.id)}
            style={{
              padding: "8px 14px",
              borderRadius: "6px",
              border: e.id === selectedId ? "2px solid #111" : "1px solid #ccc",
              background: e.id === selectedId ? "#111" : "#fff",
              color: e.id === selectedId ? "#fff" : "#111",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {e.title}
          </button>
        ))}
      </div>

      <div style={box}>
        <strong>Trigger</strong>
        <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>{example.trigger}</p>
      </div>
      <div style={box}>
        <strong>Possible false positive</strong>
        <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>{example.possibleFalsePositive}</p>
      </div>
      <div style={box}>
        <strong>Evidence that could clarify legitimacy</strong>
        <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>{example.clarifyingEvidence}</p>
      </div>
      <div style={box}>
        <strong>Compliant response</strong>
        <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>{example.compliantResponse}</p>
      </div>

      <h3 style={{ fontSize: "15px", marginTop: "24px" }}>Simulated result across regions</h3>
      <RegionResultTable results={results} />
    </div>
  );
}
