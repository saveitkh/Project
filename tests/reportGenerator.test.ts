import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  generateReportPdf,
  REPORT_LIMITATION_NOTICE,
  renderReportHtml,
  ProtectionReportData,
} from "@/lib/protection/reportGenerator";

const baseData: ProtectionReportData = {
  customerName: "Acme Corp",
  username: "@acme_live",
  testDate: new Date("2026-01-01").toISOString(),
  market: "Vietnam",
  product: "Water bottle",
  practiceTestResults: [],
  detectedRisks: [],
  corrections: [],
  finalRiskAssessment: { overallRiskScore: 20, riskLevel: "LOW" },
  evidence: [],
  recommendations: ["No action needed."],
  limitations: ["Some limitation."],
};

describe("report generator", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;"
    );
    expect(escapeHtml(`"quoted" & 'single'`)).toBe("&quot;quoted&quot; &amp; &#39;single&#39;");
  });

  it("never renders unescaped customer-provided text into the HTML report (XSS safety)", () => {
    const malicious: ProtectionReportData = {
      ...baseData,
      customerName: '<script>alert("xss")</script>',
      product: '<img src=x onerror=alert(1)>',
    };
    const html = renderReportHtml(malicious);
    expect(html).not.toContain("<script>alert(");
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("always includes the required limitation notice verbatim", () => {
    const html = renderReportHtml(baseData);
    expect(html).toContain(REPORT_LIMITATION_NOTICE);
  });

  it("generates a real, valid PDF binary", async () => {
    const bytes = await generateReportPdf(baseData);
    expect(bytes.byteLength).toBeGreaterThan(100);
    const header = Buffer.from(bytes.slice(0, 5)).toString("utf-8");
    expect(header).toBe("%PDF-");
  });

  it("generates a PDF for non-Latin script content (Khmer) without throwing", async () => {
    const khmerData: ProtectionReportData = {
      ...baseData,
      practiceTestResults: [
        {
          statement: "នេះជាផលិតផលល្អបំផុត 100% ហើយអាចព្យាបាលជំងឺបាន។",
          riskLevel: "HIGH",
          category: "Medical/health claim",
          reasoning: "Contains a disease-cure claim.",
          saferAlternative: "ផលិតផលនេះត្រូវបានផលិតសម្រាប់...",
          evidenceSource: "General health-claims principle.",
          confidence: 0.85,
        },
      ],
    };
    const bytes = await generateReportPdf(khmerData);
    const header = Buffer.from(bytes.slice(0, 5)).toString("utf-8");
    expect(header).toBe("%PDF-");
  });
});
