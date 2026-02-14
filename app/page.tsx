"use client";

import { useEffect, useMemo, useState } from "react";

type CloudMode = "AWS" | "AZURE" | "GCP" | "MAPPING";

export default function Home() {
  const [baseResume, setBaseResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [cloudMode, setCloudMode] = useState<CloudMode>("AWS");
  const [cloudMapping, setCloudMapping] = useState(
    "Corewell: AWS\nLineage: AWS\nDXC: AWS\nVisa: AWS"
  );

  const [loading, setLoading] = useState(false);
  const [tailoredText, setTailoredText] = useState("");
  const [keywordCoverage, setKeywordCoverage] = useState("");
  const [docxB64, setDocxB64] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Persist base resume for daily use
  useEffect(() => {
    const saved = localStorage.getItem("base_resume_v1");
    if (saved) setBaseResume(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("base_resume_v1", baseResume);
  }, [baseResume]);

  const canRun = useMemo(() => {
    return baseResume.trim() && jobDescription.trim();
  }, [baseResume, jobDescription]);

  async function runTailor() {
    setError("");
    setLoading(true);
    setTailoredText("");
    setKeywordCoverage("");
    setDocxB64(null);

    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseResume,
          jobDescription,
          keywords,
          cloudMode,
          cloudMapping: cloudMode === "MAPPING" ? cloudMapping : null,
          wantDocx: true
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Request failed");
      }
      const data = await res.json();
      setTailoredText(data.tailored_resume_text || "");
      setKeywordCoverage(data.keyword_coverage || "");
      setDocxB64(data.docx_base64 || null);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function downloadDocx() {
    if (!docxB64) return;
    const bytes = Uint8Array.from(atob(docxB64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Tailored_Resume.docx";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main style={{ maxWidth: 1120, margin: "24px auto", padding: 16, fontFamily: "Arial, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>Daily Resume Tailoring</h1>
          <p style={{ marginTop: 0, color: "#444" }}>
            Paste your base resume once (it auto-saves). Each day paste the job description + keywords, choose cloud, and generate ATS output + DOCX.
          </p>
        </div>
      </header>

      {error && (
        <div style={{ background: "#ffe8e8", padding: 12, borderRadius: 10, marginBottom: 12 }}>
          <b>Error:</b> {error}
        </div>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label><b>Base Resume (saved locally in your browser)</b></label>
          <textarea
            value={baseResume}
            onChange={(e) => setBaseResume(e.target.value)}
            rows={18}
            style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            placeholder="Paste your master/base resume here once..."
          />
          <small style={{ color: "#666" }}>
            Tip: This is stored in your browser (localStorage). If you clear browser data, paste again.
          </small>
        </div>

        <div>
          <label><b>Job Description</b></label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={18}
            style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            placeholder="Paste the full job description here..."
          />
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div>
          <label><b>Keyword List (must be included + bolded)</b></label>
          <textarea
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            rows={8}
            style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            placeholder="Paste your keyword list here (one per line or comma-separated). If empty, the system will still extract from JD."
          />
        </div>

        <div>
          <label><b>Cloud Focus</b></label>
          <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
            {(["AWS", "AZURE", "GCP", "MAPPING"] as CloudMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setCloudMode(m)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #ccc",
                  background: cloudMode === m ? "#111" : "#fff",
                  color: cloudMode === m ? "#fff" : "#111",
                  cursor: "pointer",
                  fontWeight: 700
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {cloudMode === "MAPPING" && (
            <div style={{ marginTop: 10 }}>
              <label><b>Company-wise Cloud Mapping</b></label>
              <textarea
                value={cloudMapping}
                onChange={(e) => setCloudMapping(e.target.value)}
                rows={6}
                style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
              />
              <small style={{ color: "#555" }}>
                Example: Corewell: AWS (Glue, Redshift) — Visa: Azure (ADF, Databricks)
              </small>
            </div>
          )}
        </div>
      </section>

      <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={runTailor}
          disabled={!canRun || loading}
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            border: "none",
            background: !canRun || loading ? "#bbb" : "#2563eb",
            color: "white",
            cursor: !canRun || loading ? "not-allowed" : "pointer",
            fontWeight: 800,
          }}
        >
          {loading ? "Tailoring..." : "Tailor Resume"}
        </button>

        <button
          onClick={downloadDocx}
          disabled={!docxB64}
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid #ccc",
            background: docxB64 ? "#fff" : "#f2f2f2",
            cursor: docxB64 ? "pointer" : "not-allowed",
            fontWeight: 800,
          }}
        >
          Download DOCX
        </button>

        <span style={{ color: "#555", fontSize: 12 }}>
          DOCX margins: Top 0&quot;, Bottom 0&quot;, Left 0.4&quot;, Right 0.4&quot;
        </span>
      </div>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 20, marginBottom: 6 }}>Tailored Resume (ATS Plain Text)</h2>
        <textarea
          value={tailoredText}
          readOnly
          rows={18}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          placeholder="Your tailored resume will appear here..."
        />
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 20, marginBottom: 6 }}>Keyword Coverage Report</h2>
        <textarea
          value={keywordCoverage}
          readOnly
          rows={10}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          placeholder="Keyword coverage will appear here..."
        />
      </section>
    </main>
  );
}
