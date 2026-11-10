import { describe, expect, it } from "vitest";
import { reviewInput, validateReview } from "./review";
const finding = { priority: "P1", category: "security", file: "/App.tsx", line: 1, title: "XSS", evidence: "innerHTML", impact: "Script execution", fix: "Use textContent" };
describe("code review rules", () => {
  it("requires explicit consent before sharing source", () => {
    expect(() => reviewInput.parse({ projectId: "p", revision: "r", consent: false, files: { "/App.tsx": "code" } })).toThrow();
  });
  it("requires at least one selected file", () => {
    expect(() => reviewInput.parse({ projectId: "p", revision: "r", consent: true, files: {} })).toThrow();
  });
  it("prioritizes critical findings before lower priority findings", () => {
    const report = validateReview({ summary: "Issues", findings: [{ ...finding, priority: "P3" }, { ...finding, priority: "P0" }] }, { "/App.tsx": "code" });
    expect(report.findings.map((f) => f.priority)).toEqual(["P0", "P3"]);
  });
  it("rejects findings about files not selected for review", () => {
    expect(() => validateReview({ summary: "Issues", findings: [finding] }, { "/other.ts": "code" })).toThrow();
  });
  it("rejects invented line numbers", () => {
    expect(() => validateReview({ summary: "Issues", findings: [{ ...finding, line: 2 }] }, { "/App.tsx": "code" })).toThrow();
  });
});