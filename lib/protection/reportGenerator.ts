import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { RiskFindingResult, RiskLevel } from "./riskEngine";

export const REPORT_LIMITATION_NOTICE =
  "Successful completion of this test means the submitted material passed our risk assessment criteria. It does not guarantee that TikTok will not take future enforcement action.";

export interface ProtectionReportData {
  customerName: string;
  username: string;
  testDate: string;
  market: string;
  product: string;
  practiceTestResults: RiskFindingResult[];
  detectedRisks: RiskFindingResult[];
  corrections: string[];
  finalRiskAssessment: { overallRiskScore: number; riskLevel: RiskLevel };
  evidence: string[];
  recommendations: string[];
  limitations: string[];
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function findingsToHtml(findings: RiskFindingResult[]): string {
  if (findings.length === 0) return "<p>No findings.</p>";
  return `<table border="1" cellpadding="6" cellspacing="0" style="width:100%;font-size:13px;">
    <thead><tr>
      <th>Statement</th><th>Risk Level</th><th>Category</th><th>Reasoning</th><th>Safer Alternative</th><th>Evidence/Source</th><th>Confidence</th>
    </tr></thead>
    <tbody>
      ${findings
        .map(
          (f) => `<tr>
        <td>${escapeHtml(f.statement)}</td>
        <td>${escapeHtml(f.riskLevel)}</td>
        <td>${escapeHtml(f.category)}</td>
        <td>${escapeHtml(f.reasoning)}</td>
        <td>${escapeHtml(f.saferAlternative)}</td>
        <td>${escapeHtml(f.evidenceSource)}</td>
        <td>${f.confidence.toFixed(2)}</td>
      </tr>`
        )
        .join("\n")}
    </tbody>
  </table>`;
}

/** Renders a full, XSS-safe HTML report. All customer-provided text is escaped. */
export function renderReportHtml(data: ProtectionReportData): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Protection Report — ${escapeHtml(data.customerName)}</title>
<style>
  body { font-family: -apple-system, Arial, sans-serif; color: #111; max-width: 900px; margin: 24px auto; }
  h1 { font-size: 20px; }
  h2 { font-size: 16px; margin-top: 24px; }
  table { border-collapse: collapse; }
  .notice { background: #fff4e5; border: 1px solid #e0a94f; padding: 10px; font-weight: 600; }
  .limitation { background: #f6f6f6; border: 1px solid #ddd; padding: 10px; font-size: 13px; }
</style>
</head>
<body>
  <h1>Protection Report</h1>
  <p class="notice">${escapeHtml(REPORT_LIMITATION_NOTICE)}</p>

  <h2>Customer</h2>
  <p>${escapeHtml(data.customerName)}</p>

  <h2>Username</h2>
  <p>${escapeHtml(data.username)}</p>

  <h2>Test Date</h2>
  <p>${escapeHtml(data.testDate)}</p>

  <h2>Market</h2>
  <p>${escapeHtml(data.market)}</p>

  <h2>Product</h2>
  <p>${escapeHtml(data.product)}</p>

  <h2>Practice Test Results</h2>
  ${findingsToHtml(data.practiceTestResults)}

  <h2>Detected Risks</h2>
  ${findingsToHtml(data.detectedRisks)}

  <h2>Corrections</h2>
  <ul>${data.corrections.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>

  <h2>Final Risk Assessment</h2>
  <p>Overall Risk Score: ${data.finalRiskAssessment.overallRiskScore} — Risk Level: ${escapeHtml(
    data.finalRiskAssessment.riskLevel
  )}</p>

  <h2>Evidence</h2>
  <ul>${data.evidence.map((e) => `<li>${escapeHtml(e)}</li>`).join("") || "<li>None on file</li>"}</ul>

  <h2>Recommendations</h2>
  <ul>${data.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>

  <h2>Limitations</h2>
  <div class="limitation">
    <ul>${data.limitations.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>
  </div>
</body>
</html>`;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Generates a real PDF binary (not a mockup) for the protection report. */
export async function generateReportPdf(data: ProtectionReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  const pageWidth = 612;
  const pageHeight = 792;
  const lineHeight = 14;
  const maxCharsPerLine = 95;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  let hadUnsupportedScript = false;

  function ensureSpace(linesNeeded = 1) {
    if (y - linesNeeded * lineHeight < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  // The bundled standard fonts only support WinAnsi (~Latin-1) encoding.
  // Khmer and other non-Latin scripts — which this service explicitly
  // supports in its risk analysis (see the spec's own Khmer example) —
  // cannot be drawn with them. Rather than crash the whole PDF export,
  // substitute a placeholder per-character and flag it; the HTML report
  // (no such limitation) always carries the exact original text.
  function sanitizeForFont(f: PDFFont, text: string): string {
    const chars = Array.from(text);
    let changed = false;
    const out = chars.map((ch) => {
      try {
        f.encodeText(ch);
        return ch;
      } catch {
        changed = true;
        return "?";
      }
    });
    if (changed) hadUnsupportedScript = true;
    return out.join("");
  }

  function writeLine(text: string, opts: { bold?: boolean; size?: number } = {}) {
    ensureSpace();
    const useFont = opts.bold ? bold : font;
    page.drawText(sanitizeForFont(useFont, text), {
      x: margin,
      y,
      size: opts.size ?? 11,
      font: useFont,
      color: rgb(0.07, 0.07, 0.07),
    });
    y -= lineHeight;
  }

  function writeWrapped(text: string) {
    for (const line of wrapText(text, maxCharsPerLine)) {
      writeLine(line);
    }
  }

  function writeSection(title: string, body: string[]) {
    y -= 6;
    writeLine(title, { bold: true, size: 13 });
    for (const line of body) writeWrapped(line);
  }

  writeLine("Protection Report", { bold: true, size: 16 });
  y -= 4;
  writeWrapped(REPORT_LIMITATION_NOTICE);

  writeSection("Customer", [data.customerName]);
  writeSection("Username", [data.username]);
  writeSection("Test Date", [data.testDate]);
  writeSection("Market", [data.market]);
  writeSection("Product", [data.product]);

  writeSection(
    "Practice Test Results",
    data.practiceTestResults.length === 0
      ? ["No findings."]
      : data.practiceTestResults.map(
          (f) =>
            `[${f.riskLevel}] ${f.category} — "${f.statement}" — ${f.reasoning} Safer alternative: ${f.saferAlternative} (Source: ${f.evidenceSource}, confidence ${f.confidence.toFixed(2)})`
        )
  );

  writeSection(
    "Detected Risks",
    data.detectedRisks.length === 0
      ? ["No findings."]
      : data.detectedRisks.map((f) => `[${f.riskLevel}] ${f.category} — "${f.statement}"`)
  );

  writeSection("Corrections", data.corrections.length === 0 ? ["None recorded."] : data.corrections);

  writeSection("Final Risk Assessment", [
    `Overall Risk Score: ${data.finalRiskAssessment.overallRiskScore} — Risk Level: ${data.finalRiskAssessment.riskLevel}`,
  ]);

  writeSection("Evidence", data.evidence.length === 0 ? ["None on file."] : data.evidence);

  writeSection("Recommendations", data.recommendations);

  const limitations = hadUnsupportedScript
    ? [
        ...data.limitations,
        "Some non-Latin script text (e.g., Khmer) could not be rendered in this PDF and appears as '?' placeholders, because the embedded standard font only supports Latin-script characters. The online report view always shows the exact original text.",
      ]
    : data.limitations;
  writeSection("Limitations", limitations);

  return pdfDoc.save();
}
