import { prisma } from "./prisma";
import { analyzeScript, overallRiskLevel, RiskCategory, RiskLevel } from "./riskEngine";
import { computeReadinessScore } from "./readinessScore";

export async function createPracticeSession(preLiveAuditId: string, label?: string) {
  return prisma.practiceSession.create({
    data: { preLiveAuditId, label: label ?? "Practice Session" },
  });
}

export async function addScriptVersion(practiceSessionId: string, scriptText: string) {
  const session = await prisma.practiceSession.findUnique({
    where: { id: practiceSessionId },
    include: { scriptVersions: true },
  });
  if (!session) throw new Error("Practice session not found.");

  const nextVersionNumber = session.scriptVersions.length + 1;
  const findings = analyzeScript(scriptText);

  const version = await prisma.scriptVersion.create({
    data: {
      practiceSessionId,
      versionNumber: nextVersionNumber,
      scriptText,
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

  return version;
}

export async function getPracticeSession(practiceSessionId: string) {
  return prisma.practiceSession.findUnique({
    where: { id: practiceSessionId },
    include: {
      scriptVersions: { include: { riskFindings: true }, orderBy: { versionNumber: "asc" } },
      preLiveAudit: { include: { tiktokAccount: true } },
    },
  });
}

export async function finalizePracticeSession(practiceSessionId: string) {
  const session = await getPracticeSession(practiceSessionId);
  if (!session) throw new Error("Practice session not found.");
  const latest = session.scriptVersions[session.scriptVersions.length - 1];
  if (!latest) throw new Error("No script versions to finalize.");

  const readiness = computeReadinessScore({
    scriptFindings: latest.riskFindings.map((f) => ({
      statement: f.statement,
      riskLevel: f.riskLevel as RiskLevel,
      category: f.category as RiskCategory,
      reasoning: f.reasoning,
      saferAlternative: f.saferAlternative,
      evidenceSource: f.evidenceSource,
      confidence: f.confidence,
    })),
    productFindings: [],
    hasTikTokAccountLinked: Boolean(session.preLiveAudit.tiktokAccountId),
    officialApiLinked: session.preLiveAudit.tiktokAccount?.officialApiLinked ?? false,
    plannedDurationMins: session.preLiveAudit.plannedDurationMins,
    hasEvidenceDocuments: false,
  });

  const report = await prisma.protectionReport.create({
    data: {
      customerId: session.preLiveAudit.customerId,
      preLiveAuditId: session.preLiveAuditId,
      overallRiskScore: readiness.overallRiskScore,
      riskLevel: readiness.riskLevel,
      topRisksJson: JSON.stringify(readiness.topRisks),
      recommendedActionsJson: JSON.stringify(readiness.recommendedActions),
      remainingUnknownsJson: JSON.stringify(readiness.remainingUnknowns),
    },
  });

  return { report, readiness, latestVersion: latest };
}

/** Pure helper: summarizes a version history's risk progression (testable without DB). */
export interface VersionProgressionEntry {
  versionNumber: number;
  riskLevel: RiskLevel;
  improvedFromPrevious: boolean | null;
}

const LEVEL_ORDER: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, REVIEW_REQUIRED: 2.5, HIGH: 3 };

export function buildVersionProgression(
  versions: { versionNumber: number; overallRiskLevel: RiskLevel }[]
): VersionProgressionEntry[] {
  return versions
    .slice()
    .sort((a, b) => a.versionNumber - b.versionNumber)
    .map((v, i, arr) => ({
      versionNumber: v.versionNumber,
      riskLevel: v.overallRiskLevel,
      improvedFromPrevious:
        i === 0 ? null : LEVEL_ORDER[v.overallRiskLevel] < LEVEL_ORDER[arr[i - 1].overallRiskLevel],
    }));
}
