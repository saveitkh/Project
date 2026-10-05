import { describe, expect, it } from "vitest";
import { computeReadinessScore } from "@/lib/protection/readinessScore";
import { analyzeScript } from "@/lib/protection/riskEngine";

describe("readiness score", () => {
  it("returns LOW overall risk when no findings and account/evidence are in good shape", () => {
    const result = computeReadinessScore({
      scriptFindings: [],
      productFindings: [],
      hasTikTokAccountLinked: true,
      officialApiLinked: true,
      plannedDurationMins: 60,
      hasEvidenceDocuments: true,
    });
    expect(result.riskLevel).toBe("LOW");
    expect(result.categories).toHaveLength(7);
  });

  it("raises overall risk when the script contains high-severity findings", () => {
    const findings = analyzeScript("This product cures disease and is 100% guaranteed.");
    const result = computeReadinessScore({
      scriptFindings: findings,
      productFindings: [],
      hasTikTokAccountLinked: true,
      officialApiLinked: true,
      plannedDurationMins: 60,
      hasEvidenceDocuments: true,
    });
    expect(result.riskLevel).not.toBe("LOW");
    expect(result.topRisks.length).toBeGreaterThan(0);
  });

  it("flags missing account link and missing evidence as contributing risks", () => {
    const result = computeReadinessScore({
      scriptFindings: [],
      productFindings: [],
      hasTikTokAccountLinked: false,
      officialApiLinked: false,
      plannedDurationMins: 60,
      hasEvidenceDocuments: false,
    });
    const categoryNames = result.categories.map((c) => c.category);
    expect(categoryNames).toEqual([
      "Content Safety",
      "Product Claims",
      "Promotional Claims",
      "Account Configuration",
      "Authentication",
      "Technical Readiness",
      "Evidence Availability",
    ]);
    const accountCategory = result.categories.find((c) => c.category === "Account Configuration")!;
    expect(accountCategory.riskScore).toBeGreaterThan(0);
  });

  it("always reports remaining unknowns about TikTok's private enforcement logic", () => {
    const result = computeReadinessScore({
      scriptFindings: [],
      productFindings: [],
      hasTikTokAccountLinked: true,
      officialApiLinked: true,
      plannedDurationMins: 60,
      hasEvidenceDocuments: true,
    });
    expect(result.remainingUnknowns.some((u) => u.toLowerCase().includes("unknown"))).toBe(true);
  });
});
