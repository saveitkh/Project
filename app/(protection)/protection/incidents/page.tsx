"use client";

import { useEffect, useState } from "react";

interface Evidence {
  id: string;
  type: string;
  description: string;
  filePath: string | null;
}
interface Incident {
  id: string;
  type: string;
  description: string;
  status: string;
  officialNotificationText: string | null;
  evidence: Evidence[];
  appealCase: { preparedText: string; status: string } | null;
}

const INCIDENT_TYPES = ["WARNING", "RESTRICTION", "LIVE_INTERRUPTION", "ACCOUNT_SUSPENSION", "OTHER"];
const EVIDENCE_TYPES = ["SCREENSHOT", "LOG", "DOCUMENT", "OFFICIAL_NOTIFICATION", "OTHER"];

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "14px",
  marginTop: "4px",
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [type, setType] = useState(INCIDENT_TYPES[0]);
  const [description, setDescription] = useState("");
  const [officialNotificationText, setOfficialNotificationText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [evidenceDraft, setEvidenceDraft] = useState<Record<string, { type: string; description: string; file: File | null }>>({});
  const [reportByIncident, setReportByIncident] = useState<Record<string, { incidentSummary: string; evidencePackage: string[]; recommendedNextSteps: string[] }>>({});

  async function refresh() {
    const res = await fetch("/api/incidents");
    const data = await res.json();
    setIncidents(data.incidents ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, description, officialNotificationText: officialNotificationText || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create incident.");
        return;
      }
      setDescription("");
      setOfficialNotificationText("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleAddEvidence(incidentId: string) {
    const draft = evidenceDraft[incidentId];
    if (!draft || !draft.description) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("type", draft.type);
      fd.set("description", draft.description);
      if (draft.file) fd.set("file", draft.file);
      await fetch(`/api/incidents/${incidentId}/evidence`, { method: "POST", body: fd });
      setEvidenceDraft((prev) => ({ ...prev, [incidentId]: { type: EVIDENCE_TYPES[0], description: "", file: null } }));
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateReport(incidentId: string) {
    const res = await fetch(`/api/incidents/${incidentId}/report`);
    const data = await res.json();
    if (res.ok) {
      setReportByIncident((prev) => ({ ...prev, [incidentId]: data.report }));
    }
  }

  async function handlePrepareAppeal(incidentId: string) {
    await fetch(`/api/incidents/${incidentId}/appeal`, { method: "POST" });
    await refresh();
  }

  return (
    <div style={{ maxWidth: "820px" }}>
      <h2 style={{ fontSize: "18px" }}>Incidents</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Report a warning, restriction, LIVE interruption, or suspension. We help you organize
        evidence and prepare for TikTok&apos;s official appeal/review process — we do not bypass
        or interfere with enforcement, and we cannot guarantee reinstatement.
      </p>

      <form onSubmit={handleCreate} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", marginTop: "12px" }}>
        <label style={{ fontSize: "13px", fontWeight: 600 }}>Event type</label>
        <select style={fieldStyle} value={type} onChange={(e) => setType(e.target.value)}>
          {INCIDENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginTop: "12px" }}>
          What happened
        </label>
        <textarea style={{ ...fieldStyle, minHeight: "70px" }} required value={description} onChange={(e) => setDescription(e.target.value)} />

        <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginTop: "12px" }}>
          Official notification text (if any)
        </label>
        <textarea style={{ ...fieldStyle, minHeight: "50px" }} value={officialNotificationText} onChange={(e) => setOfficialNotificationText(e.target.value)} />

        {error && <p style={{ color: "#9b2c2c", fontSize: "13px", marginTop: "10px" }}>{error}</p>}

        <button
          type="submit"
          disabled={busy}
          style={{ marginTop: "12px", padding: "10px 16px", fontSize: "14px", fontWeight: 600, border: "none", borderRadius: "6px", background: "#111", color: "#fff", cursor: "pointer" }}
        >
          Report incident
        </button>
      </form>

      <h3 style={{ fontSize: "15px", marginTop: "28px" }}>Your incidents</h3>
      {incidents.map((incident) => (
        <div key={incident.id} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", marginTop: "12px" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>
            {incident.type} — {incident.status}
          </p>
          <p style={{ fontSize: "13px", margin: "6px 0" }}>{incident.description}</p>

          <h4 style={{ fontSize: "13px", marginTop: "10px" }}>Evidence ({incident.evidence.length})</h4>
          <ul style={{ fontSize: "13px" }}>
            {incident.evidence.map((e) => (
              <li key={e.id}>
                {e.type}: {e.description} {e.filePath && `(file: ${e.filePath})`}
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
            <select
              style={{ ...fieldStyle, width: "auto" }}
              value={evidenceDraft[incident.id]?.type ?? EVIDENCE_TYPES[0]}
              onChange={(e) =>
                setEvidenceDraft((prev) => ({
                  ...prev,
                  [incident.id]: { ...prev[incident.id], type: e.target.value, description: prev[incident.id]?.description ?? "", file: prev[incident.id]?.file ?? null },
                }))
              }
            >
              {EVIDENCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              style={{ ...fieldStyle, width: "auto", flex: 1 }}
              placeholder="Evidence description"
              value={evidenceDraft[incident.id]?.description ?? ""}
              onChange={(e) =>
                setEvidenceDraft((prev) => ({
                  ...prev,
                  [incident.id]: { type: prev[incident.id]?.type ?? EVIDENCE_TYPES[0], description: e.target.value, file: prev[incident.id]?.file ?? null },
                }))
              }
            />
            <input
              type="file"
              onChange={(e) =>
                setEvidenceDraft((prev) => ({
                  ...prev,
                  [incident.id]: {
                    type: prev[incident.id]?.type ?? EVIDENCE_TYPES[0],
                    description: prev[incident.id]?.description ?? "",
                    file: e.target.files?.[0] ?? null,
                  },
                }))
              }
            />
            <button
              onClick={() => handleAddEvidence(incident.id)}
              style={{ padding: "8px 12px", fontSize: "13px", border: "1px solid #ccc", borderRadius: "6px", background: "#fff", cursor: "pointer" }}
            >
              Add evidence
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button
              onClick={() => handleGenerateReport(incident.id)}
              style={{ padding: "8px 12px", fontSize: "13px", border: "1px solid #ccc", borderRadius: "6px", background: "#fff", cursor: "pointer" }}
            >
              Generate incident report
            </button>
            <button
              onClick={() => handlePrepareAppeal(incident.id)}
              style={{ padding: "8px 12px", fontSize: "13px", border: "1px solid #ccc", borderRadius: "6px", background: "#fff", cursor: "pointer" }}
            >
              Prepare appeal draft
            </button>
          </div>

          {reportByIncident[incident.id] && (
            <div style={{ marginTop: "12px", fontSize: "13px", background: "#f6f6f6", padding: "10px", borderRadius: "6px" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Incident Report</p>
              <p>{reportByIncident[incident.id].incidentSummary}</p>
              <p style={{ fontWeight: 600 }}>Evidence Package</p>
              <ul>
                {reportByIncident[incident.id].evidencePackage.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
              <p style={{ fontWeight: 600 }}>Recommended Next Steps</p>
              <ul>
                {reportByIncident[incident.id].recommendedNextSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {incident.appealCase && (
            <div style={{ marginTop: "12px", fontSize: "13px", background: "#eef2ff", padding: "10px", borderRadius: "6px", whiteSpace: "pre-wrap" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Appeal Draft ({incident.appealCase.status})</p>
              <p>{incident.appealCase.preparedText}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
