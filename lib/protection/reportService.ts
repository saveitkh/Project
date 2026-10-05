import { prisma } from "./prisma";
import { LiveTimelineEntry, ProtectionReportData, REPORT_LIMITATION_NOTICE } from "./reportGenerator";
import { RiskFindingResult } from "./riskEngine";

function summarizeLiveEvent(e: {
  type: string;
  username: string | null;
  text: string | null;
  payloadJson: string;
}): string {
  if (e.type === "COMMENT") return `${e.username}: "${e.text}"`;
  try {
    const payload = JSON.parse(e.payloadJson) as Record<string, unknown>;
    switch (e.type) {
      case "LIKE":
        return `${e.username} liked (${payload.count ?? 1})`;
      case "GIFT":
        return `${e.username} sent a gift: ${payload.giftName ?? "unknown"}`;
      case "FOLLOW":
        return `${e.username} followed`;
      case "VIEWER_UPDATE":
        return `Viewer count: ${payload.viewerCount ?? "unknown"}`;
      case "LIVE_STARTED":
        return `LIVE started${e.username ? ` (${e.username})` : ""}`;
      case "LIVE_ENDED":
        return "LIVE ended";
      case "SYSTEM_EVENT":
        return String(payload.message ?? "System event");
      default:
        return e.type;
    }
  } catch {
    return e.type;
  }
}

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
      liveSession: {
        include: {
          tiktokAccount: true,
          events: { include: { riskFindings: true }, orderBy: { occurredAt: "asc" } },
        },
      },
    },
  });
  if (!report) return null;
  if (!isAdmin && report.customerId !== customerId) return null;

  const toFindingResult = (f: {
    statement: string;
    riskLevel: string;
    category: string;
    reasoning: string;
    saferAlternative: string;
    evidenceSource: string;
    confidence: number;
  }): RiskFindingResult => ({
    statement: f.statement,
    riskLevel: f.riskLevel as RiskFindingResult["riskLevel"],
    category: f.category as RiskFindingResult["category"],
    reasoning: f.reasoning,
    saferAlternative: f.saferAlternative,
    evidenceSource: f.evidenceSource,
    confidence: f.confidence,
  });

  if (report.liveSession) {
    const findings = report.liveSession.events.flatMap((e) => e.riskFindings.map(toFindingResult));
    const liveEventTimeline: LiveTimelineEntry[] = report.liveSession.events.map((e) => ({
      timestamp: e.occurredAt.toISOString(),
      type: e.type,
      summary: summarizeLiveEvent(e),
      source: e.source,
      confidence: e.confidence,
    }));

    return {
      customerName: report.customer.companyName || report.customer.user.email,
      username: report.liveSession.tiktokAccount?.usernameHandle ?? "(not on file)",
      testDate: report.createdAt.toISOString(),
      market: report.customer.market ?? "(not on file)",
      product: "(LIVE session — see timeline)",
      practiceTestResults: findings,
      detectedRisks: findings,
      corrections: findings.map((f) => f.saferAlternative),
      finalRiskAssessment: { overallRiskScore: report.overallRiskScore, riskLevel: report.riskLevel },
      evidence: liveEventTimeline.map((t) => `${t.type} (${t.confidence}): ${t.summary}`),
      recommendations: JSON.parse(report.recommendedActionsJson) as string[],
      limitations: [...(JSON.parse(report.remainingUnknownsJson) as string[]), REPORT_LIMITATION_NOTICE],
      liveEventTimeline,
    };
  }

  const allFindings =
    report.preLiveAudit?.practiceSessions.flatMap((s) => s.scriptVersions.flatMap((v) => v.riskFindings)) ?? [];
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
