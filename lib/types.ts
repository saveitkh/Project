// All types in this file describe a SIMULATED research lab.
// None of the data shapes here represent TikTok's real moderation system,
// real policy values, or real enforcement logic.

export type RegionName = "Indonesia" | "Malaysia" | "Singapore" | "Vietnam";

export const REGION_NAMES: RegionName[] = [
  "Indonesia",
  "Malaysia",
  "Singapore",
  "Vietnam",
];

/** Raw content a researcher wants to run through the simulator (Feature 1 input). */
export interface ContentInput {
  brand: string;
  product: string;
  liveTitle: string;
  liveScript: string;
  hashtags: string[];
  evidence: string;
}

export const EMPTY_CONTENT: ContentInput = {
  brand: "",
  product: "",
  liveTitle: "",
  liveScript: "",
  hashtags: [],
  evidence: "",
};

/**
 * A SIMULATED regional policy profile. Every number here is a mock weight
 * chosen for this research lab — it is NOT sourced from TikTok policy
 * documentation and must never be presented as such.
 */
export interface RegionPolicy {
  region: RegionName;
  /** 0-100: how strongly a bare brand-name mention raises risk (mock). */
  brandNameSensitivity: number;
  /** 0-100: how strongly trademark-style wording raises risk (mock). */
  trademarkSensitivity: number;
  /** 0-100: how strongly authenticity/genuineness claims raise risk (mock). */
  authenticityClaimSensitivity: number;
  /** 0-100: how restrictive this region's LIVE-content rules are (mock). */
  liveContentRestrictionLevel: number;
  /** 0-100: how much verifiable evidence is required before risk is reduced (mock). */
  evidenceRequirementLevel: number;
  /** 0-100: score at/above which content is treated as "flagged" in this simulation. */
  riskThreshold: number;
  /** Always present — reminds every consumer of this object that it is synthetic. */
  simulatedNotice: string;
}

/** A single trigger the risk engine detected, with a human explanation. */
export interface Trigger {
  code: string;
  label: string;
  explanation: string;
  weight: number;
}

/** Output of running one ContentInput through one RegionPolicy. */
export interface RiskResult {
  region: RegionName;
  riskScore: number;
  flagged: boolean;
  triggers: Trigger[];
  explanation: string;
  recommendedCompliantAction: string;
  simulated: true;
}

export type ExperimentVariable = "A" | "B" | "C" | "D" | "E";

export const EXPERIMENT_VARIABLE_LABELS: Record<ExperimentVariable, string> = {
  A: "Brand name included",
  B: "Brand name removed",
  C: "Authenticity evidence added",
  D: "Product description changed",
  E: "LIVE title changed",
};

/** A curated false-positive example for Feature 5. */
export interface FalsePositiveExample {
  id: string;
  title: string;
  content: ContentInput;
  trigger: string;
  possibleFalsePositive: string;
  clarifyingEvidence: string;
  compliantResponse: string;
}

/** A saved research report (Feature 6). */
export interface Report {
  id: string;
  createdAt: string;
  testConfig: RegionPolicy[];
  input: ContentInput;
  results: RiskResult[];
  generatedBy: "simulation";
}
