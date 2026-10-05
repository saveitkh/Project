"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }
      router.push(data.user.role === "ADMIN" ? "/admin" : "/pre-live");
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div style={{ maxWidth: "420px" }}>
      <h2 style={{ fontSize: "18px" }}>Log in</h2>
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Email</label>
        <input
          style={fieldStyle}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label style={labelStyle}>Password</label>
        <input
          style={fieldStyle}
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

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
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p style={{ fontSize: "13px", marginTop: "16px" }}>
        No account yet? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
}
