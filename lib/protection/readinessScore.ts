import { RiskFindingResult, RiskLevel } from "./riskEngine";

/**
 * "Risk Assessment Score" — deliberately NOT called a "Ban Probability".
 * TikTok's private enforcement probability is unknown and unknowable to
 * this service; this score only reflects how many risk-reduction
 * opportunities this system's own heuristics found across the inputs the
 * customer controls.
 */

export interface CategoryScore {
  category: string;
  riskScore: number; // 0-100, higher = more risk
  riskLevel: RiskLevel;
  detail: string;
}

export interface ReadinessInput {
  scriptFindings: RiskFindingResult[];
  productFindings: RiskFindingResult[];
  hasTikTokAccountLinked: boolean;
  officialApiLinked: boolean;
  plannedDurationMins: number;
  hasEvidenceDocuments: boolean;
}

export interface ReadinessResult {
  overallRiskScore: number;
  riskLevel: RiskLevel;
  categories: CategoryScore[];
  topRisks: string[];
  recommendedActions: string[];
  remainingUnknowns: string[];
}

const SEVERITY_WEIGHT: Record<RiskLevel, number> = {
  LOW: 5,
  MEDIUM: 15,
  HIGH: 30,
  REVIEW_REQUIRED: 25,
};

function scoreFromFindings(findings: RiskFindingResult[]): number {
  const raw = findings.reduce((sum, f) => sum + SEVERITY_WEIGHT[f.riskLevel], 0);
  return Math.min(100, raw);
}

function levelFromScore(score: number): RiskLevel {
  if (score >= 70) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

const CONTENT_SAFETY_CATEGORIES = new Set([
  "Dangerous activity",
  "Harassment/hate",
  "Adult/sensitive content",
  "Scam/fraud indicators",
  "Spam-like behavior",
  "Copyright concern",
  "Other policy/compliance concern",
]);

const PRODUCT_CLAIM_CATEGORIES = new Set([
  "Misleading claim",
  "Unverified claim",
  "Medical/health claim",
  "Financial claim",
  "Product authenticity claim",
  "Trademark/brand wording",
]);

export function computeReadinessScore(input: ReadinessInput): ReadinessResult {
  const allFindings = [...input.scriptFindings, ...input.productFindings];

  const contentSafetyFindings = allFindings.filter((f) => CONTENT_SAFETY_CATEGORIES.has(f.category));
  const productClaimFindings = allFindings.filter((f) => PRODUCT_CLAIM_CATEGORIES.has(f.category));
  const promoFindings = allFindings.filter((f) => f.category === "Promotion/discount claim");

  const contentSafetyScore = scoreFromFindings(contentSafetyFindings);
  const productClaimsScore = scoreFromFindings(productClaimFindings);
  const promotionalScore = scoreFromFindings(promoFindings);

  const accountConfigScore = input.hasTikTokAccountLinked ? 10 : 50;
  const authenticationScore = input.officialApiLinked ? 5 : 40;
  const technicalReadinessScore =
    input.plannedDurationMins > 180 ? 40 : input.plannedDurationMins <= 0 ? 60 : 10;
  const evidenceAvailabilityScore = input.hasEvidenceDocuments ? 10 : 45;

  const categories: CategoryScore[] = [
    {
      category: "Content Safety",
      riskScore: contentSafetyScore,
      riskLevel: levelFromScore(contentSafetyScore),
      detail: `${contentSafetyFindings.length} content-safety finding(s) detected in script/talking points.`,
    },
    {
      category: "Product Claims",
      riskScore: productClaimsScore,
      riskLevel: levelFromScore(productClaimsScore),
      detail: `${productClaimFindings.length} product-claim finding(s) detected (authenticity, health, financial, trademark, etc.).`,
    },
    {
      category: "Promotional Claims",
      riskScore: promotionalScore,
      riskLevel: levelFromScore(promotionalScore),
      detail: `${promoFindings.length} promotional/urgency-claim finding(s) detected.`,
    },
    {
      category: "Account Configuration",
      riskScore: accountConfigScore,
      riskLevel: levelFromScore(accountConfigScore),
      detail: input.hasTikTokAccountLinked
        ? "A TikTok account identifier is on file for this audit."
        : "No TikTok account identifier is on file for this audit.",
    },
    {
      category: "Authentication",
      riskScore: authenticationScore,
      riskLevel: levelFromScore(authenticationScore),
      detail: input.officialApiLinked
        ? "An official API authorization is recorded for this account."
        : "No official API authorization is configured; account status cannot be independently verified by this system.",
    },
    {
      category: "Technical Readiness",
      riskScore: technicalReadinessScore,
      riskLevel: levelFromScore(technicalReadinessScore),
      detail: `Planned LIVE duration: ${input.plannedDurationMins} minutes.`,
    },
    {
      category: "Evidence Availability",
      riskScore: evidenceAvailabilityScore,
      riskLevel: levelFromScore(evidenceAvailabilityScore),
      detail: input.hasEvidenceDocuments
        ? "Supporting evidence (e.g., invoice, authorization) is on file."
        : "No supporting evidence is currently on file for the claims made.",
    },
  ];

  // A simple average across 7 categories would let one severe finding get
  // diluted into an overall LOW score. Blend the average with the worst
  // single category so a genuine high-severity finding still moves the
  // overall score meaningfully, while still reflecting the full picture.
  const average = categories.reduce((sum, c) => sum + c.riskScore, 0) / categories.length;
  const worst = Math.max(...categories.map((c) => c.riskScore));
  const overallRiskScore = Math.round(0.5 * average + 0.5 * worst);
  const riskLevel = levelFromScore(overallRiskScore);

  const topRisks = [...categories]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3)
    .filter((c) => c.riskScore > 0)
    .map((c) => `${c.category}: ${c.detail}`);

  const recommendedActions: string[] = [];
  for (const c of categories) {
    if (c.riskLevel === "HIGH" || c.riskLevel === "REVIEW_REQUIRED") {
      recommendedActions.push(`Address ${c.category.toLowerCase()} before going LIVE: ${c.detail}`);
    }
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push("No high-priority actions identified by this assessment. Continue to monitor during LIVE.");
  }

  const remainingUnknowns = [
    "TikTok's actual private moderation/enforcement logic and thresholds are unknown to this system.",
    "This score cannot account for moderation decisions based on context outside the submitted text (tone of voice, visuals, viewer reports, account history on TikTok's side, etc.).",
    "Any future change to TikTok's own policies is outside this system's visibility.",
  ];

  return { overallRiskScore, riskLevel, categories, topRisks, recommendedActions, remainingUnknowns };
}
