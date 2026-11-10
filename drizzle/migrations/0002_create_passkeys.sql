CREATE TABLE public.passkeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credential_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  transports text[] NOT NULL DEFAULT '{}',
  rp_id text NOT NULL,
  label text NOT NULL DEFAULT 'Passkey',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
GRANT SELECT, DELETE ON public.passkeys TO authenticated;
GRANT ALL ON public.passkeys TO service_role;
ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own passkeys readable" ON public.passkeys FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own passkeys deletable" ON public.passkeys FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX passkeys_user_idx ON public.passkeys (user_id);