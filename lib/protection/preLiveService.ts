import { prisma } from "./prisma";
import { analyzeScript, overallRiskLevel } from "./riskEngine";
import { computeReadinessScore } from "./readinessScore";
import { PreLiveAuditInput } from "./validation";

export async function createPreLiveAudit(customerId: string, input: PreLiveAuditInput) {
  // No unique constraint on (customerId, usernameHandle) — a customer may
  // legitimately test multiple handles — so look up the first match and
  // create only if none exists yet.
  const existingAccount = await prisma.tikTokAccount.findFirst({
    where: { customerId, usernameHandle: input.tiktokUsername },
  });
  const tiktokAccount =
    existingAccount ??
    (await prisma.tikTokAccount.create({
      data: { customerId, usernameHandle: input.tiktokUsername },
    }));

  const audit = await prisma.preLiveAudit.create({
    data: {
      customerId,
      tiktokAccountId: tiktokAccount.id,
      liveTitle: input.liveTitle,
      product: input.product,
      productDescription: input.productDescription,
      promotionalClaims: input.promotionalClaims,
      plannedScript: input.plannedScript,
      talkingPoints: input.talkingPoints,
      targetAudience: input.targetAudience,
      market: input.market,
      plannedDurationMins: input.plannedDurationMins,
      status: "TESTED",
    },
  });

  const combinedText = [input.plannedScript, input.promotionalClaims, input.talkingPoints]
    .filter(Boolean)
    .join(". ");
  const findings = analyzeScript(combinedText);

  const practiceSession = await prisma.practiceSession.create({
    data: { preLiveAuditId: audit.id, label: "Initial submission" },
  });

  const scriptVersion = await prisma.scriptVersion.create({
    data: {
      practiceSessionId: practiceSession.id,
      versionNumber: 1,
      scriptText: input.plannedScript,
      overallRiskLevel: overallRiskLevel(findings),
      riskFindings: {
        create: findings.map((f) => ({
          statement: f.statement,
          riskLevel: f.riskLevel,
          category: f.category,
          reasoning: f.reasoning,
          saferAlternative: f.saferAlternative,
          evidenceSource: f.evidenceSource,
          confidence: f.confidence,
        })),
      },
    },
    include: { riskFindings: true },
  });

  const readiness = computeReadinessScore({
    scriptFindings: findings,
    productFindings: [],
    hasTikTokAccountLinked: true,
    officialApiLinked: tiktokAccount.officialApiLinked,
    plannedDurationMins: input.plannedDurationMins,
    hasEvidenceDocuments: false,
  });

  const report = await prisma.protectionReport.create({
    data: {
      customerId,
      preLiveAuditId: audit.id,
      overallRiskScore: readiness.overallRiskScore,
      riskLevel: readiness.riskLevel,
      topRisksJson: JSON.stringify(readiness.topRisks),
      recommendedActionsJson: JSON.stringify(readiness.recommendedActions),
      remainingUnknownsJson: JSON.stringify(readiness.remainingUnknowns),
    },
  });

  return { audit, tiktokAccount, scriptVersion, findings, readiness, reportId: report.id };
}

export async function getPreLiveAudit(customerId: string, auditId: string, isAdmin: boolean) {
  const audit = await prisma.preLiveAudit.findUnique({
    where: { id: auditId },
    include: {
      practiceSessions: { include: { scriptVersions: { include: { riskFindings: true } } } },
      protectionReports: true,
      tiktokAccount: true,
    },
  });
  if (!audit) return null;
  if (!isAdmin && audit.customerId !== customerId) return null;
  return audit;
}

export async function listPreLiveAudits(customerId: string) {
  return prisma.preLiveAudit.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: { protectionReports: true },
  });
}
