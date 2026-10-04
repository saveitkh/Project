"use client";

import { ContentInput } from "@/lib/types";

interface Props {
  value: ContentInput;
  onChange: (next: ContentInput) => void;
}

export default function ContentForm({ value, onChange }: Props) {
  function set<K extends keyof ContentInput>(key: K, v: ContentInput[K]) {
    onChange({ ...value, [key]: v });
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px",
    marginTop: "4px",
    fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 600,
    color: "#333",
    display: "block",
    marginTop: "14px",
  };

  return (
    <div>
      <label style={labelStyle}>Brand</label>
      <input
        style={fieldStyle}
        value={value.brand}
        onChange={(e) => set("brand", e.target.value)}
        placeholder="e.g., Example Brand"
      />

      <label style={labelStyle}>Product</label>
      <input
        style={fieldStyle}
        value={value.product}
        onChange={(e) => set("product", e.target.value)}
        placeholder="e.g., Authentic handbag"
      />

      <label style={labelStyle}>LIVE title</label>
      <input
        style={fieldStyle}
        value={value.liveTitle}
        onChange={(e) => set("liveTitle", e.target.value)}
        placeholder="e.g., Example Brand handbag"
      />

      <label style={labelStyle}>LIVE script</label>
      <textarea
        style={{ ...fieldStyle, minHeight: "90px", resize: "vertical" }}
        value={value.liveScript}
        onChange={(e) => set("liveScript", e.target.value)}
        placeholder="What the host plans to say during the LIVE"
      />

      <label style={labelStyle}>Hashtags (comma separated)</label>
      <input
        style={fieldStyle}
        value={value.hashtags.join(", ")}
        onChange={(e) =>
          set(
            "hashtags",
            e.target.value
              .split(",")
              .map((h) => h.trim())
              .filter(Boolean)
          )
        }
        placeholder="#examplebrand, #authentic"
      />

      <label style={labelStyle}>Authenticity evidence</label>
      <input
        style={fieldStyle}
        value={value.evidence}
        onChange={(e) => set("evidence", e.target.value)}
        placeholder="e.g., Purchase invoice"
      />
    </div>
  );
}
