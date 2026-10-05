import { describe, expect, it } from "vitest";
import { analyzeScript, analyzeStatement, overallRiskLevel } from "@/lib/protection/riskEngine";

describe("risk engine", () => {
  it("flags the spec's Khmer health/absolute-claim example as HIGH with safer wording", () => {
    const statement = "នេះជាផលិតផលល្អបំផុត 100% ហើយអាចព្យាបាលជំងឺបាន។";
    const findings = analyzeStatement(statement);

    expect(findings.length).toBeGreaterThan(0);
    const categories = findings.map((f) => f.category);
    expect(categories).toContain("Medical/health claim");
    expect(categories).toContain("Misleading claim");

    const healthFinding = findings.find((f) => f.category === "Medical/health claim")!;
    expect(healthFinding.riskLevel).toBe("HIGH");
    expect(healthFinding.saferAlternative).toContain("ផលិតផលនេះត្រូវបានផលិតសម្រាប់");

    expect(overallRiskLevel(findings)).toBe("HIGH");
  });

  it("flags an English absolute health claim as HIGH", () => {
    const findings = analyzeStatement("This product cures disease and is 100% guaranteed.");
    const categories = findings.map((f) => f.category);
    expect(categories).toContain("Medical/health claim");
    expect(overallRiskLevel(findings)).toBe("HIGH");
  });

  it("returns no findings for an unremarkable statement", () => {
    const findings = analyzeStatement("Thanks for joining the stream today, let's get started.");
    expect(findings).toHaveLength(0);
    expect(overallRiskLevel(findings)).toBe("LOW");
  });

  it("splits and analyzes a multi-sentence script independently per statement", () => {
    const script =
      "Welcome to the stream. This product cures disease. Follow for follow and comment your number!";
    const findings = analyzeScript(script);
    const categories = findings.map((f) => f.category);
    expect(categories).toContain("Medical/health claim");
    expect(categories).toContain("Spam-like behavior");
  });

  it("handles empty input without throwing", () => {
    expect(analyzeScript("")).toEqual([]);
    expect(analyzeScript("   ")).toEqual([]);
  });

  it("never claims to know TikTok's private policy in its evidence sources", () => {
    const findings = analyzeStatement("This product cures disease.");
    for (const f of findings) {
      expect(f.evidenceSource.toLowerCase()).not.toContain("tiktok's private");
      expect(f.evidenceSource.toLowerCase()).toContain("general");
    }
  });
});
