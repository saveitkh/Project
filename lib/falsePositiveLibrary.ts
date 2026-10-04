import { FalsePositiveExample } from "./types";

/**
 * Curated, entirely fictional "legitimate but could be flagged" examples
 * for the False Positive Lab (Feature 5). Brand names here are generic
 * placeholders — not references to any real company's actual moderation history.
 */
export const FALSE_POSITIVE_EXAMPLES: FalsePositiveExample[] = [
  {
    id: "fp-1",
    title: "Authorized reseller citing authenticity",
    content: {
      brand: "Example Brand",
      product: "Authentic leather handbag",
      liveTitle: "Example Brand handbag - authorized reseller LIVE",
      liveScript:
        "This is a genuine, authentic Example Brand handbag. We are an authorized reseller and this is guaranteed real.",
      hashtags: ["#examplebrand", "#authentic", "#authorizedreseller"],
      evidence: "",
    },
    trigger: "Repeated authenticity-claim language ('genuine', 'authentic', 'guaranteed real') with no attached evidence field filled in.",
    possibleFalsePositive:
      "A legitimate authorized reseller may describe their own stock this way as standard sales language, not as a deceptive claim.",
    clarifyingEvidence:
      "Authorized-dealer agreement, supplier invoice, or brand-issued reseller certificate.",
    compliantResponse:
      "Attach the authorization document in the evidence field and keep authenticity language proportionate (e.g., reference the specific certificate rather than repeating superlatives).",
  },
  {
    id: "fp-2",
    title: "Secondhand/resale listing with full disclosure",
    content: {
      brand: "Example Brand",
      product: "Pre-owned Example Brand sneakers, resold with original receipt",
      liveTitle: "Example Brand sneakers resale LIVE",
      liveScript:
        "Selling my pre-owned, authentic Example Brand sneakers. Original receipt included, trademark box and tags intact.",
      hashtags: ["#examplebrand", "#resale", "#preowned"],
      evidence: "Original purchase receipt",
    },
    trigger: "Brand mention plus trademark-style wording ('trademark', 'box and tags') combined with an authenticity claim.",
    possibleFalsePositive:
      "A fully disclosed, individual resale of a genuine item is a normal secondary-market transaction, not counterfeiting or brand impersonation.",
    clarifyingEvidence:
      "Original purchase receipt (already provided) plus photos of serial numbers or authentication marks if available.",
    compliantResponse:
      "Keep the disclosure of pre-owned condition prominent in the title and script, and reference the receipt explicitly rather than relying on claim language alone.",
  },
  {
    id: "fp-3",
    title: "Comparative/educational mention of a brand",
    content: {
      brand: "Example Brand",
      product: "Generic alternative compared to Example Brand original",
      liveTitle: "Comparing our product to the Example Brand original",
      liveScript:
        "We're not Example Brand — this is our own product, but we'll compare it honestly to the official Example Brand original so you can decide.",
      hashtags: ["#comparison", "#examplebrand"],
      evidence: "",
    },
    trigger: "Brand mention plus trademark-style wording ('official') even though the seller is explicitly disclaiming affiliation.",
    possibleFalsePositive:
      "Comparative advertising that clearly disclaims affiliation is a common, legitimate marketing practice, not an authenticity or trademark violation.",
    clarifyingEvidence:
      "Script excerpt showing the explicit non-affiliation disclaimer; packaging/labeling showing the seller's own brand.",
    compliantResponse:
      "State the non-affiliation disclaimer early and prominently in both the title and the opening seconds of the LIVE script, and avoid reusing the other brand's exact marketing phrases.",
  },
];
