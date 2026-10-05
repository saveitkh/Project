import { analyzeScript, overallRiskLevel, RiskFindingResult, RiskLevel } from "./riskEngine";

export interface ProductReviewInput {
  productName: string;
  category: string;
  manufacturer: string;
  description: string;
  claims: string;
  hasSupportingDocuments: boolean;
}

export interface ProductReviewResult {
  riskLevel: RiskLevel;
  findings: RiskFindingResult[];
  notice: string;
}

const ESCALATE_TO_REVIEW: string[] = ["Medical/health claim", "Financial claim", "Scam/fraud indicators"];

/**
 * Reviews a product's description/claims for compliance concerns. This
 * NEVER returns an approval verdict — only a risk level and the specific
 * findings a human should look at. "REVIEW_REQUIRED" is used for legally
 * sensitive categories (health, financial, fraud-adjacent) regardless of
 * how confident the pattern match is, because those categories warrant
 * human review even at low confidence.
 */
export function reviewProduct(input: ProductReviewInput): ProductReviewResult {
  const text = [input.description, input.claims].filter(Boolean).join(". ");
  const findings = analyzeScript(text);
  let riskLevel = overallRiskLevel(findings);

  const touchesSensitiveCategory = findings.some((f) => ESCALATE_TO_REVIEW.includes(f.category));
  if (touchesSensitiveCategory) {
    riskLevel = "REVIEW_REQUIRED";
  }

  const authenticityOrTrademark = findings.some(
    (f) => f.category === "Product authenticity claim" || f.category === "Trademark/brand wording"
  );
  if (authenticityOrTrademark && !input.hasSupportingDocuments && riskLevel !== "REVIEW_REQUIRED") {
    riskLevel = "REVIEW_REQUIRED";
  }

  const notice =
    "This result is a risk-assessment aid, not a product approval. No product is ever automatically declared 'TikTok approved' by this system.";

  return { riskLevel, findings, notice };
}
