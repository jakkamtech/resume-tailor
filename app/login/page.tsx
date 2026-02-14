"use client";

import { useState } from "react";

export default function LoginPage() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.href = "/";
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: "80px auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginBottom: 6 }}>Resume Tailor</h1>
      <p style={{ marginTop: 0, color: "#444" }}>Enter your password to access your private tailoring workspace.</p>

      {err && (
        <div style={{ background: "#ffe8e8", padding: 12, borderRadius: 10, marginBottom: 12 }}>
          <b>Error:</b> {err}
        </div>
      )}

      <label style={{ fontWeight: 700 }}>Password</label>
      <input
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        type="password"
        placeholder="Your site password"
        style={{ width: "100%", padding: 12, marginTop: 6, borderRadius: 10, border: "1px solid #ccc" }}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />

      <button
        onClick={submit}
        disabled={!pw || loading}
        style={{
          marginTop: 14,
          padding: "12px 16px",
          borderRadius: 12,
          border: "none",
          background: !pw || loading ? "#bbb" : "#111",
          color: "white",
          cursor: !pw || loading ? "not-allowed" : "pointer",
          fontWeight: 800,
          width: "100%",
        }}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p style={{ color: "#666", marginTop: 16, fontSize: 12 }}>
        Tip: You set the password in your hosting environment variable <b>APP_PASSWORD</b>.
      </p>
    </main>
  );
}
