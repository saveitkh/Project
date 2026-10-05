"use client";

import { useMemo, useState } from "react";
import ContentForm from "@/components/ContentForm";
import VariableDiff from "@/components/VariableDiff";
import { loadPolicies } from "@/lib/regions";
import { evaluateContent } from "@/lib/riskEngine";
import {
  ContentInput,
  EMPTY_CONTENT,
  ExperimentVariable,
  EXPERIMENT_VARIABLE_LABELS,
  REGION_NAMES,
} from "@/lib/types";

const BASELINE_DEFAULT: ContentInput = {
  ...EMPTY_CONTENT,
  brand: "Example Brand",
  product: "Authentic handbag",
  liveTitle: "Example Brand handbag",
  liveScript: "This is a genuine Example Brand handbag, authentic and guaranteed real.",
  hashtags: ["#examplebrand", "#authentic"],
  evidence: "",
};

function applyTransform(baseline: ContentInput, variable: ExperimentVariable): ContentInput {
  switch (variable) {
    case "A": // Brand name included
      return {
        ...baseline,
        liveTitle: baseline.liveTitle.includes(baseline.brand)
          ? baseline.liveTitle
          : `${baseline.brand} ${baseline.liveTitle}`,
      };
    case "B": // Brand name removed
      return {
        ...baseline,
        liveTitle: baseline.liveTitle.split(baseline.brand).join("").trim(),
        liveScript: baseline.liveScript.split(baseline.brand).join("this item").trim(),
        hashtags: baseline.hashtags.filter(
          (h) => !h.toLowerCase().includes(baseline.brand.toLowerCase())
        ),
      };
    case "C": // Authenticity evidence added
      return { ...baseline, evidence: baseline.evidence || "Purchase invoice" };
    case "D": // Product description changed
      return { ...baseline, product: `${baseline.product} (resold, pre-owned)` };
    case "E": // LIVE title changed
      return { ...baseline, liveTitle: `${baseline.liveTitle} - LIVE flash sale` };
    default:
      return baseline;
  }
}

export default function ExperimentsPage() {
  const [baseline, setBaseline] = useState<ContentInput>(BASELINE_DEFAULT);
  const [variable, setVariable] = useState<ExperimentVariable>("A");
  const [modified, setModified] = useState<ContentInput>(
    applyTransform(BASELINE_DEFAULT, "A")
  );

  const policies = useMemo(() => loadPolicies(), []);
  const baselineResults = useMemo(
    () => REGION_NAMES.map((r) => evaluateContent(baseline, policies[r])),
    [baseline, policies]
  );
  const modifiedResults = useMemo(
    () => REGION_NAMES.map((r) => evaluateContent(modified, policies[r])),
    [modified, policies]
  );

  function handleVariableChange(v: ExperimentVariable) {
    setVariable(v);
    setModified(applyTransform(baseline, v));
  }

  function reapplyTransform() {
    setModified(applyTransform(baseline, variable));
  }

  return (
    <div>
      <h2 style={{ fontSize: "18px" }}>Variable Experiment</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Change exactly one variable at a time and compare the simulated outcome against
        the baseline, across all regions.
      </p>

      <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginTop: "14px" }}>
        Variable to change
      </label>
      <select
        style={{
          padding: "8px 10px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          marginTop: "4px",
          fontSize: "14px",
        }}
        value={variable}
        onChange={(e) => handleVariableChange(e.target.value as ExperimentVariable)}
      >
        {(Object.keys(EXPERIMENT_VARIABLE_LABELS) as ExperimentVariable[]).map((v) => (
          <option key={v} value={v}>
            {v}. {EXPERIMENT_VARIABLE_LABELS[v]}
          </option>
        ))}
      </select>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "20px" }}>
        <div>
          <h3 style={{ fontSize: "15px" }}>Baseline</h3>
          <ContentForm
            value={baseline}
            onChange={(c) => {
              setBaseline(c);
              setModified(applyTransform(c, variable));
            }}
          />
        </div>
        <div>
          <h3 style={{ fontSize: "15px" }}>
            Modified ({EXPERIMENT_VARIABLE_LABELS[variable]})
          </h3>
          <ContentForm value={modified} onChange={setModified} />
          <button
            onClick={reapplyTransform}
            style={{
              marginTop: "10px",
              padding: "6px 12px",
              fontSize: "13px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              background: "#f6f6f6",
              cursor: "pointer",
            }}
          >
            Re-apply auto-transform from baseline
          </button>
        </div>
      </div>

      <h3 style={{ fontSize: "15px", marginTop: "24px" }}>Comparison</h3>
      <VariableDiff baseline={baselineResults} modified={modifiedResults} />
    </div>
  );
}
