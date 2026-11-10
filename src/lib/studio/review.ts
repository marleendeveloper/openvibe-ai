import { z } from "zod";
import { validateFiles, safePath } from "./limits";

export const reviewInput = z.object({
  projectId: z.string().min(1).max(100),
  revision: z.string().min(1).max(100),
  consent: z.literal(true),
  files: z.record(z.string(), z.string()),
}).strict().transform((value) => {
  const files = validateFiles(value.files);
  if (!Object.keys(files).length) throw new Error("Mindestens eine Datei auswählen.");
  return { ...value, files };
});

export const reviewReport = z.object({
  summary: z.string().max(4000),
  findings: z.array(z.object({
    priority: z.enum(["P0", "P1", "P2", "P3"]),
    category: z.enum(["bug", "security"]),
    file: z.string().max(240),
    line: z.number().int().min(1),
    title: z.string().max(300),
    evidence: z.string().max(4000),
    impact: z.string().max(4000),
    fix: z.string().max(8000),
  }).strict()).max(30),
}).strict();
export type ReviewReport = z.infer<typeof reviewReport>;
export type ReviewResult = { projectId: string; revision: string; files: string[]; report: ReviewReport };

export function validateReview(value: unknown, files: Record<string, string>): ReviewReport {
  const report = reviewReport.parse(value);
  for (const finding of report.findings) {
    const path = safePath(finding.file);
    const content = files[path];
    if (content === undefined || finding.line > content.split("\n").length) throw new Error("Prüfergebnis verweist auf nicht bereitgestellten Code.");
    finding.file = path;
  }
  report.findings.sort((a, b) => a.priority.localeCompare(b.priority));
  return report;
}

export const reviewJsonSchema = {
  type: "object", additionalProperties: false, required: ["summary", "findings"],
  properties: {
    summary: { type: "string" },
    findings: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["priority", "category", "file", "line", "title", "evidence", "impact", "fix"],
      properties: {
        priority: { type: "string", enum: ["P0", "P1", "P2", "P3"] },
        category: { type: "string", enum: ["bug", "security"] }, file: { type: "string" },
        line: { type: "integer" }, title: { type: "string" }, evidence: { type: "string" },
        impact: { type: "string" }, fix: { type: "string" },
      },
    } },
  },
};