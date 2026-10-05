import { prisma } from "./prisma";
import { ProtectionReportData, REPORT_LIMITATION_NOTICE } from "./reportGenerator";
import { RiskFindingResult } from "./riskEngine";

export async function getProtectionReportForView(
  reportId: string,
  customerId: string | undefined,
  isAdmin: boolean
): Promise<ProtectionReportData | null> {
  const report = await prisma.protectionReport.findUnique({
    where: { id: reportId },
    include: {
      customer: { include: { user: true } },
      preLiveAudit: {
        include: {
          tiktokAccount: true,
          practiceSessions: { include: { scriptVersions: { include: { riskFindings: true } } } },
        },
      },
      incident: { include: { evidence: true } },
    },
  });
  if (!report) return null;
  if (!isAdmin && report.customerId !== customerId) return null;

  const allFindings =
    report.preLiveAudit?.practiceSessions.flatMap((s) => s.scriptVersions.flatMap((v) => v.riskFindings)) ?? [];

  const toFindingResult = (f: (typeof allFindings)[number]): RiskFindingResult => ({
    statement: f.statement,
    riskLevel: f.riskLevel as RiskFindingResult["riskLevel"],
    category: f.category as RiskFindingResult["category"],
    reasoning: f.reasoning,
    saferAlternative: f.saferAlternative,
    evidenceSource: f.evidenceSource,
    confidence: f.confidence,
  });

  const findings = allFindings.map(toFindingResult);

  return {
    customerName: report.customer.companyName || report.customer.user.email,
    username: report.preLiveAudit?.tiktokAccount?.usernameHandle ?? "(not on file)",
    testDate: report.createdAt.toISOString(),
    market: report.preLiveAudit?.market ?? "(not on file)",
    product: report.preLiveAudit?.product ?? "(not on file)",
    practiceTestResults: findings,
    detectedRisks: findings,
    corrections: findings.map((f) => f.saferAlternative),
    finalRiskAssessment: { overallRiskScore: report.overallRiskScore, riskLevel: report.riskLevel },
    evidence: report.incident?.evidence.map((e) => `${e.type}: ${e.description}`) ?? [],
    recommendations: JSON.parse(report.recommendedActionsJson) as string[],
    limitations: [...(JSON.parse(report.remainingUnknownsJson) as string[]), REPORT_LIMITATION_NOTICE],
  };
}
