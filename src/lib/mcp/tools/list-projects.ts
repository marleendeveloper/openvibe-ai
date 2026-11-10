import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_projects",
  title: "Projekte auflisten",
  description: "List the projects saved in the signed-in owner's studio account.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb.from("projects").select("id,name,updated_at").order("updated_at", { ascending: false }).limit(100);
    if (error) throw new ToolError(error.message);
    const projects = (data ?? []).map((p) => ({ id: p.id, name: p.name, updated_at: p.updated_at }));
    return {
      content: [{ type: "text", text: projects.length ? projects.map((p) => `${p.id}: ${p.name}`).join("\n") : "Keine Projekte gespeichert." }],
      structuredContent: { projects },
    };
  },
});
