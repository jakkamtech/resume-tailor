import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Document, Packer, Paragraph, TextRun } from "docx";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type CloudMode = "AWS" | "AZURE" | "GCP" | "MAPPING";

function buildSystemPrompt() {
  return `
You are a professional resume writer specializing in ATS-optimized, recruiter-aligned Data Engineering resumes.

STRICT RULES:
- Do NOT ask questions. Produce final output.
- Integrate all relevant keywords from the job description and provided keyword list throughout resume sections.
- Bold all provided keyword-list items and important JD skills by wrapping with **double asterisks**.
- Professional Summary: 9–10 concise bullet points.
- Work Experience: For each company:
  1) Add 1–2 lines: company context + my role statement ("X is a ... I am leading ...")
  2) Add 5–7 bullets: metrics, impact, JD alignment, tools.
  3) End with: Skills Used: CloudName (services...), then other key skills (no filler words).
- Technical Skills: grouped by categories; keep as normal lines (not bullets).
- Certifications:
  If AWS focus: AWS Certified Data Engineer – Associate + Databricks Fundamentals
  If Azure focus: Microsoft Certified: Azure Fundamentals (AZ-900) + Databricks Fundamentals
  If GCP focus: Databricks Fundamentals (keep other relevant certs already present)
- ATS formatting:
  - No tables/columns/icons.
  - Use plain text bullet characters.
  - Bold only section headers, job titles, company names, dates, and keywords/skills.
  - Dates format: **Month YYYY – Month YYYY**
  - One blank line between sections.
- Tense: present for current role, past for previous roles.

Return output in TWO blocks with exact headers:
TAILORED_RESUME
KEYWORD_COVERAGE
`;
}

function parseBlocks(text: string) {
  const r = text.indexOf("TAILORED_RESUME");
  const k = text.indexOf("KEYWORD_COVERAGE");
  if (r === -1 || k === -1) return { resume: text.trim(), coverage: "" };

  const resume = text.slice(r + "TAILORED_RESUME".length, k).trim();
  const coverage = text.slice(k + "KEYWORD_COVERAGE".length).trim();
  return { resume, coverage };
}

// Convert **bold** markdown to docx runs
function toDocxParagraphs(plain: string) {
  const lines = plain.split(/\r?\n/);
  return lines.map((line) => {
    if (!line.trim()) return new Paragraph({ text: "" });

    const parts = line.split("**");
    const runs: TextRun[] = [];
    parts.forEach((p, idx) => {
      if (!p) return;
      runs.push(new TextRun({ text: p, bold: idx % 2 === 1 }));
    });

    return new Paragraph({ children: runs });
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const baseResume: string = body.baseResume ?? "";
    const jobDescription: string = body.jobDescription ?? "";
    const keywords: string = body.keywords ?? "";
    const cloudMode: CloudMode = body.cloudMode ?? "AWS";
    const cloudMapping: string | null = body.cloudMapping ?? null;
    const wantDocx: boolean = !!body.wantDocx;

    if (!process.env.OPENAI_API_KEY) {
      return new NextResponse("Missing OPENAI_API_KEY in environment variables.", { status: 500 });
    }
    if (!baseResume.trim() || !jobDescription.trim()) {
      return new NextResponse("Base resume and job description are required.", { status: 400 });
    }

    const cloudInstruction =
      cloudMode === "MAPPING"
        ? `Use multi-cloud mapping per company exactly as follows:\n${cloudMapping ?? ""}\nAvoid random cloud mixing.`
        : `Use mostly a single cloud focus: ${cloudMode}.`;

    const userPrompt = `
BASE RESUME:
${baseResume}

JOB DESCRIPTION:
${jobDescription}

KEYWORD LIST (must be included + bold where appropriate):
${keywords || "(none provided)"}

CLOUD STRATEGY:
${cloudInstruction}
`;

    const resp = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: userPrompt },
      ],
    });

    const text = (resp as any).output_text || "";

    const { resume, coverage } = parseBlocks(text);

    let docxBase64: string | null = null;

    if (wantDocx) {
      // Margins required:
      // Top 0", Bottom 0", Left 0.4", Right 0.4"
      // docx uses TWIPs (1 inch = 1440 twips)
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 0,
                  bottom: 0,
                  left: Math.round(0.4 * 1440),
                  right: Math.round(0.4 * 1440),
                },
              },
            },
            children: toDocxParagraphs(resume),
          },
        ],
      });

      const buf = await Packer.toBuffer(doc);
      docxBase64 = buf.toString("base64");
    }

    return NextResponse.json({
      tailored_resume_text: resume,
      keyword_coverage: coverage,
      docx_base64: docxBase64,
    });
  } catch (err: any) {
    return new NextResponse(err?.message ?? "Server error", { status: 500 });
  }
}
