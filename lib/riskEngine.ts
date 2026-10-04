import { ContentInput, RegionPolicy, RiskResult, Trigger } from "./types";

/**
 * ============================================================================
 *  SIMULATED RISK ENGINE — EDUCATIONAL USE ONLY
 * ============================================================================
 *  This is a small, fully transparent, deterministic scoring function.
 *  It is NOT a machine-learning model, it does NOT call any TikTok system,
 *  and its output is NOT a prediction of real moderation outcomes.
 *  Every weight below is invented for this lab to demonstrate how the
 *  *shape* of a policy (sensitivity knobs) can change a result for the
 *  exact same input content.
 * ============================================================================
 */

// Base signal weights (out of 100 before being scaled by a region's sensitivity).
const BASE_WEIGHTS = {
  brandMention: 30,
  trademarkWording: 25,
  authenticityClaim: 30,
  liveRestriction: 20,
};

const AUTHENTICITY_WORDS = [
  "authentic",
  "genuine",
  "original",
  "100% real",
  "not fake",
  "real deal",
  "guaranteed real",
];

const TRADEMARK_WORDS = ["™", "®", "official", "licensed", "trademark"];

function textIncludesAny(text: string, words: string[]): string[] {
  const lower = text.toLowerCase();
  return words.filter((w) => lower.includes(w.toLowerCase()));
}

function detectSignals(content: ContentInput) {
  const haystack = [
    content.liveTitle,
    content.liveScript,
    content.product,
    ...content.hashtags,
  ]
    .join(" ")
    .toLowerCase();

  const brandMentioned =
    content.brand.trim().length > 0 && haystack.includes(content.brand.trim().toLowerCase());

  const trademarkHits = textIncludesAny(haystack, TRADEMARK_WORDS);
  const authenticityHits = textIncludesAny(haystack, AUTHENTICITY_WORDS);

  const hasEvidence = content.evidence.trim().length > 0;

  return {
    brandMentioned,
    trademarkHits,
    authenticityHits,
    hasEvidence,
  };
}

/**
 * Pure function: same (content, policy) always produces the same result.
 * No randomness, no network calls, no hidden state.
 */
export function evaluateContent(content: ContentInput, policy: RegionPolicy): RiskResult {
  const signals = detectSignals(content);
  const triggers: Trigger[] = [];
  let score = 0;

  if (signals.brandMentioned) {
    const weight = (policy.brandNameSensitivity / 100) * BASE_WEIGHTS.brandMention;
    score += weight;
    triggers.push({
      code: "brand_mention",
      label: "Brand mention",
      explanation: `Brand name "${content.brand}" appears in the LIVE content. This region's simulated brand-name sensitivity is ${policy.brandNameSensitivity}/100.`,
      weight: Math.round(weight),
    });
  }

  if (signals.trademarkHits.length > 0) {
    const weight = (policy.trademarkSensitivity / 100) * BASE_WEIGHTS.trademarkWording;
    score += weight;
    triggers.push({
      code: "trademark_wording",
      label: "Trademark-style wording",
      explanation: `Detected trademark-style terms (${signals.trademarkHits.join(
        ", "
      )}). This region's simulated trademark sensitivity is ${policy.trademarkSensitivity}/100.`,
      weight: Math.round(weight),
    });
  }

  if (signals.authenticityHits.length > 0) {
    const weight = (policy.authenticityClaimSensitivity / 100) * BASE_WEIGHTS.authenticityClaim;
    score += weight;
    triggers.push({
      code: "authenticity_claim",
      label: "Authenticity claim",
      explanation: `Detected authenticity-claim language (${signals.authenticityHits.join(
        ", "
      )}). This region's simulated authenticity-claim sensitivity is ${policy.authenticityClaimSensitivity}/100.`,
      weight: Math.round(weight),
    });
  }

  // LIVE content itself always carries some baseline simulated restriction weight,
  // scaled by how restrictive this region's mock LIVE policy is.
  {
    const weight = (policy.liveContentRestrictionLevel / 100) * BASE_WEIGHTS.liveRestriction;
    score += weight;
    triggers.push({
      code: "live_restriction",
      label: "LIVE content baseline restriction",
      explanation: `This region's simulated LIVE-content restriction level is ${policy.liveContentRestrictionLevel}/100, contributing a baseline risk weight to any LIVE stream.`,
      weight: Math.round(weight),
    });
  }

  // Evidence reduces score — the more a region's mock policy "values" evidence
  // (evidenceRequirementLevel) and the more evidence was actually supplied,
  // the larger the reduction.
  if (signals.hasEvidence) {
    const reduction = (policy.evidenceRequirementLevel / 100) * 25;
    score = Math.max(0, score - reduction);
    triggers.push({
      code: "evidence_offset",
      label: "Evidence provided",
      explanation: `Evidence ("${content.evidence}") was supplied and reduced the simulated score by ${Math.round(
        reduction
      )} points under this region's evidence-requirement weighting (${policy.evidenceRequirementLevel}/100).`,
      weight: -Math.round(reduction),
    });
  }

  score = Math.round(Math.min(100, Math.max(0, score)));
  const flagged = score >= policy.riskThreshold;

  const explanation = flagged
    ? `Simulated score ${score} meets or exceeds this region's simulated risk threshold (${policy.riskThreshold}), so this mock policy would flag the content.`
    : `Simulated score ${score} is below this region's simulated risk threshold (${policy.riskThreshold}), so this mock policy would not flag the content.`;

  const recommendedCompliantAction = buildRecommendedAction(signals, flagged);

  return {
    region: policy.region,
    riskScore: score,
    flagged,
    triggers,
    explanation,
    recommendedCompliantAction,
    simulated: true,
  };
}

function buildRecommendedAction(
  signals: ReturnType<typeof detectSignals>,
  flagged: boolean
): string {
  if (!flagged) {
    return "No action required by this simulation. Still keep authenticity evidence on hand before going LIVE.";
  }
  const actions: string[] = [];
  if (!signals.hasEvidence) {
    actions.push("attach verifiable authenticity evidence (e.g., invoice, authorized-retailer confirmation)");
  }
  if (signals.authenticityHits.length > 0) {
    actions.push("avoid absolute authenticity claims in the script unless evidence is visibly referenced");
  }
  if (signals.trademarkHits.length > 0) {
    actions.push("confirm trademark/licensing status is documented before using official/trademark wording");
  }
  if (actions.length === 0) {
    actions.push("review LIVE script against this region's simulated sensitivity settings before streaming");
  }
  return `Simulated recommendation: ${actions.join("; ")}.`;
}
