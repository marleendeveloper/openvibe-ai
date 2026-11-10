import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { profileSchema } from "./profile";
export const loadProfile = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("profiles").select("display_name,bio").eq("id", context.userId).single();
  if (error) throw new Error(error.message);
  return data;
});
export const saveProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => profileSchema.parse(input)).handler(async ({ data, context }) => {
  const { data: profile, error } = await context.supabase.from("profiles").upsert({ id: context.userId, ...data }).select("display_name,bio").single();
  if (error) throw new Error(error.message);
  return profile;
});