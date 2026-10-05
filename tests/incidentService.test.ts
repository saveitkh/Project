import { describe, expect, it } from "vitest";
import { buildIncidentReport } from "@/lib/protection/incidentService";

describe("incident report building", () => {
  const incident = {
    id: "inc_1",
    type: "RESTRICTION",
    description: "LIVE was cut off mid-stream.",
    officialNotificationText: "Your content violates community guidelines.",
    createdAt: new Date("2026-01-01T00:00:00Z"),
  };

  it("includes the official notification text in the evidence package", () => {
    const report = buildIncidentReport(incident, []);
    expect(report.evidencePackage.some((e) => e.includes("Your content violates community guidelines."))).toBe(
      true
    );
  });

  it("includes all submitted evidence entries", () => {
    const report = buildIncidentReport(incident, [
      { type: "SCREENSHOT", description: "Screenshot of the ban message", filePath: "uploads/a.png" },
      { type: "LOG", description: "Stream log export", filePath: null },
    ]);
    expect(report.evidencePackage).toHaveLength(3); // 2 evidence + 1 official notification
    expect(report.evidencePackage[0]).toContain("Screenshot of the ban message");
  });

  it("never recommends bypassing enforcement or creating a replacement account", () => {
    const report = buildIncidentReport(incident, []);
    const allSteps = report.recommendedNextSteps.join(" ").toLowerCase();
    expect(allSteps).toContain("do not create a replacement account");
    expect(allSteps).toContain("do not");
    expect(allSteps).not.toContain("we can bypass");
  });

  it("summarizes the incident with its id and description", () => {
    const report = buildIncidentReport(incident, []);
    expect(report.incidentSummary).toContain("inc_1");
    expect(report.incidentSummary).toContain("LIVE was cut off mid-stream.");
  });
});
