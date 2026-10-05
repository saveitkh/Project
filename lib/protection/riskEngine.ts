/**
 * ============================================================================
 * Script / claim risk engine
 * ============================================================================
 * This is a deterministic, rule-based heuristic engine. It evaluates text
 * against GENERAL, publicly-known advertising/compliance norms (truth-in-
 * advertising, health-claim substantiation, financial-promotion rules,
 * platform conduct norms, etc.) — never TikTok's private moderation
 * algorithm, which this service has no access to and does not claim to
 * know. Every finding's `evidenceSource` names the general norm it is
 * based on, not a TikTok policy document.
 *
 * Output is a risk-REDUCTION aid: it flags language patterns worth
 * reviewing and offers safer phrasing. It is not a prediction of what
 * TikTok will do, and every safer-alternative suggestion must be labeled
 * "Risk-reduction suggestion — not a guarantee." by callers.
 * ============================================================================
 */

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "REVIEW_REQUIRED";

export type RiskCategory =
  | "Misleading claim"
  | "Unverified claim"
  | "Medical/health claim"
  | "Financial claim"
  | "Product authenticity claim"
  | "Trademark/brand wording"
  | "Promotion/discount claim"
  | "Adult/sensitive content"
  | "Dangerous activity"
  | "Harassment/hate"
  | "Scam/fraud indicators"
  | "Spam-like behavior"
  | "Copyright concern"
  | "Other policy/compliance concern";

export interface RiskFindingResult {
  statement: string;
  riskLevel: RiskLevel;
  category: RiskCategory;
  reasoning: string;
  saferAlternative: string;
  evidenceSource: string;
  confidence: number; // 0-1
}

export const ENGINE_DISCLAIMER =
  "This analysis uses general, publicly documented advertising and compliance norms as a risk-reduction heuristic. It does not reflect TikTok's private moderation algorithm and does not predict or control any platform enforcement decision.";

export const SUGGESTION_LABEL = "Risk-reduction suggestion — not a guarantee.";

const KHMER_RANGE = /[ក-៿]/;

export function detectLanguage(text: string): "km" | "en" {
  return KHMER_RANGE.test(text) ? "km" : "en";
}

/** Splits free text into statement-sized chunks for independent analysis. */
export function splitIntoStatements(text: string): string[] {
  return text
    .split(/(?<=[.!?។])\s+|\n+/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

interface Rule {
  category: RiskCategory;
  riskLevel: RiskLevel;
  confidence: number;
  pattern: RegExp;
  reasoning: string;
  evidenceSource: string;
  saferAlternative: (lang: "km" | "en") => string;
}

const RULES: Rule[] = [
  {
    category: "Medical/health claim",
    riskLevel: "HIGH",
    confidence: 0.85,
    pattern: /ព្យាបាល|ជំងឺ|\bcure[sd]?\b|\btreats?\b\s+(disease|illness|cancer)|\bheals?\b\s+(disease|illness)/iu,
    reasoning:
      "The statement contains a disease-cure/treatment claim. Health claims about curing or treating illness generally require clinical evidence and are commonly restricted on commerce and social platforms when unsubstantiated.",
    evidenceSource:
      "General health-claims regulatory principle (e.g., FTC/ASA-style advertising guidance): disease-prevention or cure claims require clinical substantiation.",
    saferAlternative: (lang) =>
      lang === "km"
        ? "ផលិតផលនេះត្រូវបានផលិតសម្រាប់... សូមពិនិត្យព័ត៌មានផលិតផល និងការណែនាំពីអ្នកជំនាញសម្រាប់ការប្រើប្រាស់ត្រឹមត្រូវ។"
        : "This product is manufactured for [its intended purpose]. Please review the product information and consult a qualified professional before use.",
  },
  {
    category: "Misleading claim",
    riskLevel: "HIGH",
    confidence: 0.75,
    pattern: /ល្អបំផុត|ដាច់ខាត|\b100%\b|\bguarantee(d)?\b|\bno risk\b|\bcompletely safe\b|\bbest in the world\b/iu,
    reasoning:
      "The statement uses an absolute or superlative claim ('100%', 'guaranteed', 'best ever'). Absolute performance claims generally need substantiation and can be treated as misleading if unproven.",
    evidenceSource:
      "General truth-in-advertising principle: absolute or superlative claims should be substantiated with evidence.",
    saferAlternative: (lang) =>
      lang === "km"
        ? "ផលិតផលនេះមានគុណភាពល្អ ហើយត្រូវបានអតិថិជនជាច្រើនពេញចិត្ត។ លទ្ធផលអាចខុសគ្នាអាស្រ័យលើការប្រើប្រាស់។"
        : "This product is well-reviewed by many customers. Individual results may vary.",
  },
  {
    category: "Unverified claim",
    riskLevel: "MEDIUM",
    confidence: 0.6,
    pattern: /\bclinically proven\b|\bscientifically proven\b|\bdoctors recommend\b|\bstudies show\b/iu,
    reasoning:
      "The statement cites proof or scientific/medical endorsement without a verifiable source attached. Unsourced evidentiary claims are commonly flagged as unverified.",
    evidenceSource:
      "General evidentiary norm: performance or scientific claims should cite a checkable source.",
    saferAlternative: () =>
      "If this claim is based on a real study or professional endorsement, name and link the specific source; otherwise, rephrase as a general product description without citing unverified authority.",
  },
  {
    category: "Financial claim",
    riskLevel: "HIGH",
    confidence: 0.75,
    pattern: /\bguaranteed (profit|return|income)\b|\bget rich\b|\bdouble your money\b|\brisk-free investment\b/iu,
    reasoning:
      "The statement promises a guaranteed financial return. Guaranteed-return claims are commonly prohibited in financial promotions because investment outcomes cannot be guaranteed.",
    evidenceSource:
      "General financial-promotion norm (securities/consumer-protection guidance): guaranteed-return claims are a common red flag.",
    saferAlternative: () =>
      "Describe potential outcomes using historical/typical ranges with a clear disclaimer that results are not guaranteed and can include loss.",
  },
  {
    category: "Product authenticity claim",
    riskLevel: "MEDIUM",
    confidence: 0.6,
    pattern: /\b(100% )?(authentic|genuine|original)\b|\bnot fake\b|\bguaranteed real\b/iu,
    reasoning:
      "The statement asserts authenticity. Authenticity claims without attached, verifiable proof (invoice, authorized-dealer status) can be challenged as unsubstantiated.",
    evidenceSource:
      "General consumer-protection norm: authenticity/genuineness claims should be backed by verifiable documentation.",
    saferAlternative: () =>
      "State the specific proof you have (e.g., 'purchased from an authorized retailer, receipt available on request') instead of repeating authenticity adjectives alone.",
  },
  {
    category: "Trademark/brand wording",
    riskLevel: "MEDIUM",
    confidence: 0.55,
    pattern: /™|®|\bofficial\b|\blicensed\b|\btrademark\b/iu,
    reasoning:
      "The statement uses trademark-style or 'official' wording. This implies a formal relationship with a brand that should be accurate and, where relevant, authorized.",
    evidenceSource:
      "General trademark-use norm: implying brand affiliation ('official', ®, ™) should reflect an actual, documented relationship.",
    saferAlternative: () =>
      "If you are an authorized reseller, say so and reference the authorization; if not affiliated, avoid 'official'/trademark wording and describe the product in your own words.",
  },
  {
    category: "Promotion/discount claim",
    riskLevel: "LOW",
    confidence: 0.4,
    pattern: /\blast chance\b|\bonly today\b|\b(\d{2,3})% off\b|\blimited time\b/iu,
    reasoning:
      "The statement uses urgency/scarcity language common in promotions. This is not inherently a violation, but urgency claims should reflect real, verifiable time/stock limits.",
    evidenceSource:
      "General promotions norm: scarcity/urgency claims should be factually accurate.",
    saferAlternative: () =>
      "Only state a deadline or stock limit if it is real and verifiable; otherwise use general promotional language without a false deadline.",
  },
  {
    category: "Dangerous activity",
    riskLevel: "HIGH",
    confidence: 0.65,
    pattern: /\bwithout (a )?helmet\b|\bno safety (gear|equipment)\b|\bfire (challenge|stunt)\b|\bdangerous (stunt|challenge)\b/iu,
    reasoning:
      "The statement describes a potentially unsafe physical activity without safety context. Depicting unsafe acts is commonly restricted on mainstream platforms.",
    evidenceSource:
      "General platform safety norm: content depicting dangerous acts without safety framing is commonly restricted.",
    saferAlternative: () =>
      "Add visible safety measures/equipment and a verbal safety disclaimer, or remove the unsafe framing from the script entirely.",
  },
  {
    category: "Harassment/hate",
    riskLevel: "HIGH",
    confidence: 0.5,
    // Intentionally minimal/generic placeholder list. A production deployment
    // should use a vetted, actively-maintained hate-speech/harassment
    // classifier rather than a hardcoded keyword list.
    pattern: /\b(idiot|stupid|hate (all|those))\b.*\b(people|group|them)\b/iu,
    reasoning:
      "The statement combines a derogatory term with a reference to a group of people, a pattern associated with harassment/hate content.",
    evidenceSource:
      "General platform conduct norm: content demeaning people or groups is commonly prohibited.",
    saferAlternative: () =>
      "Remove derogatory language directed at people or groups; critique products or ideas without targeting people.",
  },
  {
    category: "Scam/fraud indicators",
    riskLevel: "HIGH",
    confidence: 0.7,
    pattern: /\bsend (money|payment) first\b|\bwire transfer\b|\bclick (this|the) link to claim\b|\bcrypto giveaway\b/iu,
    reasoning:
      "The statement matches a pattern commonly associated with scams (upfront payment requests, vague prize claims, unsolicited crypto giveaways).",
    evidenceSource:
      "General consumer-protection norm: upfront-payment and vague-prize-claim language is a recognized fraud indicator.",
    saferAlternative: () =>
      "Describe the real transaction clearly (what the customer receives, when, and how to verify it) and remove any request for payment before delivery is clear.",
  },
  {
    category: "Spam-like behavior",
    riskLevel: "LOW",
    confidence: 0.4,
    pattern: /\bfollow for follow\b|\bcomment your (number|phone)\b|\btag (10|20|everyone)\b/iu,
    reasoning:
      "The statement asks for reciprocal engagement or personal contact info in a pattern associated with spam/engagement-bait.",
    evidenceSource:
      "General platform-integrity norm: engagement-bait phrasing is commonly restricted or down-ranked.",
    saferAlternative: () =>
      "Invite engagement naturally (e.g., 'comment your questions below') without reciprocal-follow or mass-tagging requests.",
  },
  {
    category: "Copyright concern",
    riskLevel: "MEDIUM",
    confidence: 0.55,
    pattern: /\busing (copyrighted|someone else's) (music|video|clip)\b|\bwe don'?t own (the )?rights?\b/iu,
    reasoning:
      "The statement indicates use of third-party copyrighted material without a license. Unlicensed use of music/video is commonly restricted.",
    evidenceSource:
      "General copyright norm: using others' copyrighted material without a license or platform-provided audio is commonly restricted.",
    saferAlternative: () =>
      "Use licensed/royalty-free audio or the platform's own sound library instead of unlicensed third-party media.",
  },
];

function pickRiskLevel(a: RiskLevel, b: RiskLevel): RiskLevel {
  const order: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, REVIEW_REQUIRED: 2.5, HIGH: 3 };
  return order[a] >= order[b] ? a : b;
}

/** Analyzes a single statement against all rules. Returns zero or more findings. */
export function analyzeStatement(statement: string): RiskFindingResult[] {
  const lang = detectLanguage(statement);
  const findings: RiskFindingResult[] = [];
  for (const rule of RULES) {
    if (rule.pattern.test(statement)) {
      findings.push({
        statement,
        riskLevel: rule.riskLevel,
        category: rule.category,
        reasoning: rule.reasoning,
        saferAlternative: rule.saferAlternative(lang),
        evidenceSource: rule.evidenceSource,
        confidence: rule.confidence,
      });
    }
  }
  return findings;
}

/** Analyzes a full script/claims block, splitting into statements first. */
export function analyzeScript(text: string): RiskFindingResult[] {
  if (!text || !text.trim()) return [];
  const statements = splitIntoStatements(text);
  return statements.flatMap((s) => analyzeStatement(s));
}

/** The single highest-severity risk level found across a set of findings. */
export function overallRiskLevel(findings: RiskFindingResult[]): RiskLevel {
  if (findings.length === 0) return "LOW";
  return findings.reduce<RiskLevel>((acc, f) => pickRiskLevel(acc, f.riskLevel), "LOW");
}
