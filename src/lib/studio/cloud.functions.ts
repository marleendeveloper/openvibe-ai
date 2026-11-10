import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cloudIdSchema, cloudProjectSchema, publishSchema, slugSchema, unpublishSchema } from "./cloud";
import { validateFiles } from "./limits";

export const saveCloudProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => cloudProjectSchema.parse(input))
  .handler(async ({ data, context }) => {
    const files = validateFiles(data.files);
    const row = { user_id: context.userId, name: data.name, files };
    const query = data.cloudId
      ? context.supabase.from("projects").update(row).eq("id", data.cloudId).eq("user_id", context.userId)
      : context.supabase.from("projects").insert(row);
    const { data: project, error } = await query.select("id").single();
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Projekt nicht gefunden oder kein Zugriff.");
    const { error: delError } = await context.supabase.from("project_messages").delete().eq("project_id", project.id).eq("user_id", context.userId);
    if (delError) throw new Error(delError.message);
    if (data.messages.length) {
      const rows = data.messages.map((m) => ({ project_id: project.id, user_id: context.userId, role: m.role, content: m.content, ops: m.ops ?? null }));
      const { error: msgError } = await context.supabase.from("project_messages").insert(rows);
      if (msgError) throw new Error(msgError.message);
    }
    return { cloudId: project.id };
  });

export const listCloudProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("projects").select("id,name,updated_at").eq("user_id", context.userId).order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const loadCloudProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => cloudIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: project, error } = await context.supabase.from("projects").select("id,name,files,updated_at").eq("id", data.cloudId).eq("user_id", context.userId).single();
    if (error) throw new Error(error.message);
    const { data: messages, error: msgError } = await context.supabase.from("project_messages").select("role,content,ops,created_at").eq("project_id", data.cloudId).order("created_at", { ascending: true });
    if (msgError) throw new Error(msgError.message);
    return { ...project, messages };
  });

export const deleteCloudProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => cloudIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("projects").delete().eq("id", data.cloudId).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const publishApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => publishSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: project, error } = await context.supabase.from("projects").select("files").eq("id", data.cloudId).eq("user_id", context.userId).single();
    if (error || !project) throw new Error("Projekt nicht gefunden oder kein Zugriff.");
    const { data: existing } = await context.supabase.from("published_apps").select("id,slug").eq("project_id", data.cloudId).maybeSingle();
    if (existing && existing.slug !== data.slug) throw new Error(`Dieses Projekt ist bereits unter "${existing.slug}" veröffentlicht. Erst zurücknehmen.`);
    const row = { project_id: data.cloudId, user_id: context.userId, slug: data.slug, title: data.title, files: project.files };
    const query = existing
      ? context.supabase.from("published_apps").update(row).eq("id", existing.id)
      : context.supabase.from("published_apps").insert(row);
    const { error: pubError } = await query;
    if (pubError) throw new Error(pubError.message.includes("unique") ? "Dieser Link-Name ist bereits vergeben." : pubError.message);
    return { slug: data.slug };
  });

export const unpublishApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => unpublishSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("published_apps").delete().eq("project_id", data.cloudId).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getPublication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => cloudIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: pub, error } = await context.supabase.from("published_apps").select("slug,title,published_at").eq("project_id", data.cloudId).eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    return pub;
  });

export const loadPublishedApp = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => slugSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabasePublic = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: app, error } = await supabasePublic.from("published_apps").select("slug,title,files,published_at").eq("slug", data.slug).maybeSingle();
    if (error) throw new Error(error.message);
    if (!app) return null;
    return app;
  });

/** Übersicht: alle Kontoprojekte mit Veröffentlichung und Verlaufsstatistik. */
export const projectOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [{ data: projects, error }, { data: pubs, error: pubError }, { data: msgs, error: msgError }] = await Promise.all([
      sb.from("projects").select("id,name,files,updated_at").eq("user_id", context.userId).order("updated_at", { ascending: false }),
      sb.from("published_apps").select("project_id,slug,title,published_at").eq("user_id", context.userId),
      sb.from("project_messages").select("project_id,role,content,created_at").order("created_at", { ascending: true }).limit(2000),
    ]);
    if (error || pubError || msgError) throw new Error("Übersicht konnte nicht geladen werden.");
    return (projects ?? []).map((p) => {
      const own = (msgs ?? []).filter((m) => m.project_id === p.id);
      const pub = (pubs ?? []).find((x) => x.project_id === p.id);
      return {
        id: p.id, name: p.name, updatedAt: p.updated_at,
        fileCount: Object.keys((p.files as Record<string, string>) ?? {}).length,
        messages: own.map((m) => ({ role: m.role, content: String(m.content).slice(0, 400), createdAt: m.created_at })),
        publication: pub ? { slug: pub.slug, title: pub.title, publishedAt: pub.published_at } : null,
      };
    });
  });
