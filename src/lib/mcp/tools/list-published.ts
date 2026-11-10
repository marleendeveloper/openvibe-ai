import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_published_apps",
  title: "Veröffentlichte Apps",
  description: "List the owner's published apps with their public link names.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb.from("published_apps").select("slug,title,project_id").eq("user_id", ctx.getUserId()!).limit(100);
    if (error) throw new ToolError(error.message);
    const apps = (data ?? []).map((a) => ({ slug: a.slug, title: a.title, project_id: a.project_id }));
    return {
      content: [{ type: "text", text: apps.length ? apps.map((a) => `${a.title} → /p/${a.slug}`).join("\n") : "Keine Apps veröffentlicht." }],
      structuredContent: { apps },
    };
  },
});
