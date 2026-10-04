import { ContentInput, RegionPolicy, Report, RiskResult } from "./types";

const STORAGE_KEY = "simlab.reports.v1";

export function buildReport(
  input: ContentInput,
  testConfig: RegionPolicy[],
  results: RiskResult[]
): Report {
  return {
    id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    testConfig,
    input,
    results,
    generatedBy: "simulation",
  };
}

export function loadReports(): Report[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Report[];
  } catch {
    return [];
  }
}

export function saveReport(report: Report): Report[] {
  const existing = loadReports();
  const next = [report, ...existing];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function deleteReport(id: string): Report[] {
  const next = loadReports().filter((r) => r.id !== id);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}
