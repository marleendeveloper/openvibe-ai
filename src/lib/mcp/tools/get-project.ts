import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_project",
  title: "Projekt lesen",
  description: "Read the files of one saved project, optionally a single file.",
  inputSchema: {
    project_id: z.string().uuid().describe("Project id from list_projects."),
    path: z.string().max(300).optional().describe("Optional file path, e.g. /App.tsx."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, path }, ctx) => {
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("projects")
      .select("name,files")
      .eq("id", project_id)
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError("Projekt nicht gefunden.");
    const files = (data.files ?? {}) as Record<string, string>;
    if (path) {
      const file = files[path];
      if (typeof file !== "string") throw new ToolError(`Datei ${path} nicht gefunden.`);
      return { content: [{ type: "text", text: file }] };
    }
    const text = Object.entries(files)
      .map(([p, c]) => `<file path="${p}">\n${c}\n</file>`)
      .join("\n\n");
    return { content: [{ type: "text", text: `Projekt ${data.name}\n\n${text}` }] };
  },
});
