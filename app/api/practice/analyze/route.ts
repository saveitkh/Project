import { NextRequest, NextResponse } from "next/server";
import { practiceStatementSchema } from "@/lib/protection/validation";
import { analyzeStatement, overallRiskLevel } from "@/lib/protection/riskEngine";
import { handleApiError } from "@/lib/protection/apiError";

/**
 * Stateless single-statement practice analysis. No auth/DB write required —
 * this is a lightweight tool for drafting/practicing a line before it goes
 * into a saved Pre-LIVE Audit or Practice Session.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { statement } = practiceStatementSchema.parse(body);
    const findings = analyzeStatement(statement);
    const overall = overallRiskLevel(findings);
    return NextResponse.json({ overall, findings });
  } catch (err) {
    return handleApiError(err);
  }
}
