import { describe, expect, it } from "vitest";
import { buildVersionProgression } from "@/lib/protection/practiceService";

describe("practice session version progression", () => {
  it("marks later versions as improved when risk level decreases", () => {
    const progression = buildVersionProgression([
      { versionNumber: 1, overallRiskLevel: "HIGH" },
      { versionNumber: 2, overallRiskLevel: "MEDIUM" },
      { versionNumber: 3, overallRiskLevel: "LOW" },
    ]);

    expect(progression[0].improvedFromPrevious).toBeNull();
    expect(progression[1].improvedFromPrevious).toBe(true);
    expect(progression[2].improvedFromPrevious).toBe(true);
  });

  it("marks a version as not improved when risk level increases or stays the same", () => {
    const progression = buildVersionProgression([
      { versionNumber: 1, overallRiskLevel: "LOW" },
      { versionNumber: 2, overallRiskLevel: "HIGH" },
      { versionNumber: 3, overallRiskLevel: "HIGH" },
    ]);

    expect(progression[1].improvedFromPrevious).toBe(false);
    expect(progression[2].improvedFromPrevious).toBe(false);
  });

  it("sorts out-of-order input by version number", () => {
    const progression = buildVersionProgression([
      { versionNumber: 2, overallRiskLevel: "MEDIUM" },
      { versionNumber: 1, overallRiskLevel: "HIGH" },
    ]);
    expect(progression.map((p) => p.versionNumber)).toEqual([1, 2]);
  });
});
