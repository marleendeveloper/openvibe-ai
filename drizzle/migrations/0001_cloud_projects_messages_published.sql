CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Projekt',
  files JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own projects" ON public.projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  ops JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_messages TO authenticated;
GRANT ALL ON public.project_messages TO service_role;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own messages" ON public.project_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own messages" ON public.project_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own messages" ON public.project_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.published_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT 'App',
  files JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.published_apps TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.published_apps TO authenticated;
GRANT ALL ON public.published_apps TO service_role;
ALTER TABLE public.published_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published apps" ON public.published_apps FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users publish own projects" ON public.published_apps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own publications" ON public.published_apps FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own publications" ON public.published_apps FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.valid_slug(_slug TEXT)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$ SELECT _slug ~ '^[a-z0-9][a-z0-9-]{2,59}$' $$;

CREATE OR REPLACE FUNCTION public.check_published_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.valid_slug(NEW.slug) THEN
    RAISE EXCEPTION 'Ungueltiger Link-Name: 3-60 Zeichen, Kleinbuchstaben, Ziffern und Bindestriche.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER published_apps_slug_check BEFORE INSERT OR UPDATE ON public.published_apps FOR EACH ROW EXECUTE FUNCTION public.check_published_slug();

CREATE OR REPLACE FUNCTION public.touch_project()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER projects_touch BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.touch_project();