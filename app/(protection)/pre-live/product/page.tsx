"use client";

import { useState } from "react";
import type { RiskFindingResult, RiskLevel } from "@/lib/protection/riskEngine";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "14px",
  marginTop: "4px",
};
const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  display: "block",
  marginTop: "14px",
};

const LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: "#276749",
  MEDIUM: "#9c6b00",
  HIGH: "#9b2c2c",
  REVIEW_REQUIRED: "#7c3aed",
};

export default function ProductTestPage() {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [description, setDescription] = useState("");
  const [claims, setClaims] = useState("");
  const [supportingDocuments, setSupportingDocuments] = useState<FileList | null>(null);
  const [productImages, setProductImages] = useState<FileList | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskLevel, setRiskLevel] = useState<RiskLevel | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [findings, setFindings] = useState<RiskFindingResult[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("productName", productName);
      fd.set("category", category);
      fd.set("manufacturer", manufacturer);
      fd.set("description", description);
      fd.set("claims", claims);
      for (const f of Array.from(supportingDocuments ?? [])) fd.append("supportingDocuments", f);
      for (const f of Array.from(productImages ?? [])) fd.append("productImages", f);

      const res = await fetch("/api/product-reviews", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not review this product.");
        return;
      }
      setRiskLevel(data.review.riskLevel);
      setNotice(data.notice);
      setFindings(data.review.riskFindings);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "720px" }}>
      <h2 style={{ fontSize: "18px" }}>Product Test</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Submit product details and claims for a compliance-concern check. This system never
        automatically declares a product &quot;TikTok approved.&quot;
      </p>

      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Product name</label>
        <input style={fieldStyle} required value={productName} onChange={(e) => setProductName(e.target.value)} />

        <label style={labelStyle}>Category</label>
        <input style={fieldStyle} required value={category} onChange={(e) => setCategory(e.target.value)} />

        <label style={labelStyle}>Manufacturer</label>
        <input style={fieldStyle} required value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />

        <label style={labelStyle}>Description</label>
        <textarea style={{ ...fieldStyle, minHeight: "70px" }} value={description} onChange={(e) => setDescription(e.target.value)} />

        <label style={labelStyle}>Claims</label>
        <textarea style={{ ...fieldStyle, minHeight: "70px" }} value={claims} onChange={(e) => setClaims(e.target.value)} />

        <label style={labelStyle}>Supporting documents</label>
        <input
          style={fieldStyle}
          type="file"
          multiple
          onChange={(e) => setSupportingDocuments(e.target.files)}
        />

        <label style={labelStyle}>Product images</label>
        <input style={fieldStyle} type="file" multiple accept="image/*" onChange={(e) => setProductImages(e.target.files)} />

        {error && <p style={{ color: "#9b2c2c", fontSize: "13px", marginTop: "10px" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "16px",
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: 600,
            border: "none",
            borderRadius: "6px",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {loading ? "Reviewing..." : "Run Product Test"}
        </button>
      </form>

      {riskLevel && (
        <div style={{ marginTop: "20px" }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: LEVEL_COLORS[riskLevel] }}>
            Result: {riskLevel}
          </p>
          <p style={{ fontSize: "12px", color: "#888" }}>{notice}</p>

          {findings && findings.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              {findings.map((f, i) => (
                <div key={i} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "12px", marginTop: "8px" }}>
                  <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>{f.category}</p>
                  <p style={{ fontSize: "13px", margin: "6px 0 0 0" }}>{f.reasoning}</p>
                  <p style={{ fontSize: "13px", margin: "6px 0 0 0", fontStyle: "italic" }}>
                    Safer alternative: {f.saferAlternative}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
