import { prisma } from "./prisma";
import { computeReadinessScore } from "./readinessScore";
import { RiskFindingResult, RiskLevel } from "./riskEngine";

/**
 * Builds a Protection Report from a finished LIVE session's event/evidence
 * timeline. Always carries the required disclaimer via REPORT_LIMITATION_NOTICE
 * at render time (see reportGenerator.ts) — this function only computes the
 * score and persists it.
 */
export async function generateLiveSessionReport(liveSessionId: string) {
  const session = await prisma.liveSession.findUniqueOrThrow({
    where: { id: liveSessionId },
    include: {
      tiktokAccount: true,
      events: { include: { riskFindings: true }, orderBy: { occurredAt: "asc" } },
    },
  });

  const scriptFindings: RiskFindingResult[] = session.events.flatMap((e) =>
    e.riskFindings.map((f) => ({
      statement: f.statement,
      riskLevel: f.riskLevel as RiskLevel,
      category: f.category as RiskFindingResult["category"],
      reasoning: f.reasoning,
      saferAlternative: f.saferAlternative,
      evidenceSource: f.evidenceSource,
      confidence: f.confidence,
    }))
  );

  const readiness = computeReadinessScore({
    scriptFindings,
    productFindings: [],
    hasTikTokAccountLinked: Boolean(session.tiktokAccountId),
    officialApiLinked: session.tiktokAccount?.officialApiLinked ?? false,
    plannedDurationMins: session.startedAt && session.endedAt
      ? Math.max(1, Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 60000))
      : 60,
    hasEvidenceDocuments: session.events.length > 0,
  });

  const report = await prisma.protectionReport.create({
    data: {
      customerId: session.customerId,
      liveSessionId: session.id,
      overallRiskScore: readiness.overallRiskScore,
      riskLevel: readiness.riskLevel,
      topRisksJson: JSON.stringify(readiness.topRisks),
      recommendedActionsJson: JSON.stringify(readiness.recommendedActions),
      remainingUnknownsJson: JSON.stringify(readiness.remainingUnknowns),
    },
  });

  return { report, readiness, eventCount: session.events.length };
}
