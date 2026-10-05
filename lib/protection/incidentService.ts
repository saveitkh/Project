import { prisma } from "./prisma";
import { saveUploadedFile } from "./fileStorage";
import { IncidentInput } from "./validation";

export async function createIncident(customerId: string, input: IncidentInput) {
  return prisma.incident.create({
    data: {
      customerId,
      tiktokAccountId: input.tiktokAccountId,
      type: input.type,
      description: input.description,
      officialNotificationText: input.officialNotificationText,
      status: "OPEN",
    },
  });
}

export async function addEvidence(
  incidentId: string,
  type: "SCREENSHOT" | "LOG" | "DOCUMENT" | "OFFICIAL_NOTIFICATION" | "OTHER",
  description: string,
  file: File | null
) {
  let filePath: string | null = null;
  if (file && file.size > 0) {
    const saved = await saveUploadedFile(file);
    filePath = saved.path;
  }
  const evidence = await prisma.evidence.create({
    data: { incidentId, type, description, filePath },
  });
  await prisma.incident.update({ where: { id: incidentId }, data: { status: "EVIDENCE_COLLECTED" } });
  return evidence;
}

export interface IncidentReportInput {
  id: string;
  type: string;
  description: string;
  officialNotificationText: string | null;
  createdAt: Date;
}

export interface EvidenceInput {
  type: string;
  description: string;
  filePath: string | null;
}

export interface IncidentReportResult {
  incidentSummary: string;
  evidencePackage: string[];
  recommendedNextSteps: string[];
}

/** Pure, DB-free: builds the incident report/evidence-package summary. */
export function buildIncidentReport(
  incident: IncidentReportInput,
  evidence: EvidenceInput[]
): IncidentReportResult {
  const incidentSummary = `Incident ${incident.id} (${incident.type}) reported on ${incident.createdAt.toISOString()}. Description: ${incident.description}`;

  const evidencePackage = evidence.map(
    (e) => `${e.type}: ${e.description}${e.filePath ? ` (file: ${e.filePath})` : ""}`
  );
  if (incident.officialNotificationText) {
    evidencePackage.push(`OFFICIAL_NOTIFICATION text on file: "${incident.officialNotificationText}"`);
  }

  const recommendedNextSteps = [
    "Do not create a replacement account or attempt to bypass the restriction — this can worsen the outcome and is outside what this service will help with.",
    "Collect every piece of evidence available (screenshots, the official notification text, relevant script/product information, timestamps) before contacting the platform.",
    "If TikTok provides an official appeal/review process for this type of action, use that process directly and attach the evidence package prepared here.",
    "Keep all customer-provided evidence and this report for your own records regardless of the outcome.",
  ];

  return { incidentSummary, evidencePackage, recommendedNextSteps };
}

export async function getIncidentWithEvidence(incidentId: string) {
  return prisma.incident.findUnique({
    where: { id: incidentId },
    include: { evidence: true, appealCase: true },
  });
}

/**
 * Prepares a draft appeal text for the customer to review and submit
 * themselves through TikTok's official process. This service never
 * submits anything to TikTok on the customer's behalf and never promises
 * reinstatement.
 */
export async function prepareAppealDraft(incidentId: string) {
  const incident = await getIncidentWithEvidence(incidentId);
  if (!incident) throw new Error("Incident not found.");

  const evidenceLines = incident.evidence.map((e) => `- ${e.type}: ${e.description}`).join("\n");
  const preparedText = `Appeal preparation draft for incident ${incident.id}

Summary of what happened:
${incident.description}

${incident.officialNotificationText ? `Official notification received:\n${incident.officialNotificationText}\n` : ""}
Evidence available:
${evidenceLines || "(no evidence recorded yet)"}

Suggested structure for your appeal (to submit yourself through TikTok's official appeal/review process):
1. State the account/content affected and the date of the action.
2. Explain, factually and without speculation, why you believe this was a mistake or should be reconsidered.
3. Reference the specific evidence above that supports your explanation.
4. Avoid promises about future behavior you cannot keep; be concise and factual.

This draft is a preparation aid only. This service cannot submit the appeal for you, cannot guarantee any outcome, and does not attempt to bypass or influence TikTok's enforcement systems.`;

  return prisma.appealCase.upsert({
    where: { incidentId },
    update: { preparedText, status: "READY_FOR_CUSTOMER_REVIEW" },
    create: { incidentId, preparedText, status: "READY_FOR_CUSTOMER_REVIEW" },
  });
}
