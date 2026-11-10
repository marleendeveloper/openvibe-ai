import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwner } from "./owner-middleware";

async function challengeSession() {
  const { useSession } = await import("@tanstack/react-start/server");
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TanStack server session helper, not a React hook
  return useSession<{ challenge?: string; at?: number }>({
    password: process.env["OPENVIBE_CREDENTIAL_SECRET"]!,
    name: "openvibe-passkey",
    maxAge: 300,
    cookie: { httpOnly: true, secure: true, sameSite: "strict", path: "/" },
  });
}
async function rp() {
  const { getRequest } = await import("@tanstack/react-start/server");
  const req = getRequest();
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;
  return { origin, rpID: new URL(origin).hostname };
}
async function takeChallenge() {
  const s = await challengeSession();
  const c = s.data.challenge;
  const fresh = c && s.data.at && Date.now() - s.data.at < 300_000;
  await s.clear();
  if (!fresh) throw new Error("Passkey-Anfrage abgelaufen. Bitte erneut versuchen.");
  return c!;
}
const responseSchema = z.object({ id: z.string().max(1024) }).passthrough();

export const passkeyRegisterOptions = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .handler(async ({ context }) => {
    const { generateRegistrationOptions } = await import("@simplewebauthn/server");
    const { rpID } = await rp();
    const { data: existing } = await context.supabase
      .from("passkeys")
      .select("credential_id")
      .eq("rp_id", rpID);
    const email = String((context.claims as { email?: string }).email);
    const options = await generateRegistrationOptions({
      rpName: "OpenVibe",
      rpID,
      userName: email,
      userID: new TextEncoder().encode(context.userId),
      attestationType: "none",
      authenticatorSelection: { residentKey: "required", userVerification: "required" },
      excludeCredentials: (existing ?? []).map((c) => ({ id: c.credential_id })),
    });
    const s = await challengeSession();
    await s.update({ challenge: options.challenge, at: Date.now() });
    return JSON.parse(JSON.stringify(options));
  });

export const passkeyRegisterVerify = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .inputValidator((d: unknown) =>
    z.object({ response: responseSchema, label: z.string().trim().min(1).max(60) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { verifyRegistrationResponse } = await import("@simplewebauthn/server");
    const { isoBase64URL } = await import("@simplewebauthn/server/helpers");
    const { origin, rpID } = await rp();
    const v = await verifyRegistrationResponse({
      response: data.response as never,
      expectedChallenge: await takeChallenge(),
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
    if (!v.verified || !v.registrationInfo)
      throw new Error("Passkey konnte nicht bestätigt werden.");
    const cred = v.registrationInfo.credential;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("passkeys")
      .insert({
        user_id: context.userId,
        credential_id: cred.id,
        public_key: isoBase64URL.fromBuffer(cred.publicKey),
        counter: cred.counter,
        transports: cred.transports ?? [],
        rp_id: rpID,
        label: data.label,
      });
    if (error) throw new Error("Passkey konnte nicht gespeichert werden.");
    return { ok: true };
  });

export const listPasskeys = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("passkeys")
      .select("id, label, rp_id, created_at, last_used_at")
      .order("created_at");
    if (error) throw new Error("Passkeys konnten nicht geladen werden.");
    return data;
  });

export const deletePasskey = createServerFn({ method: "POST" })
  .middleware([requireOwner])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("passkeys").delete().eq("id", data.id);
    if (error) throw new Error("Löschen fehlgeschlagen.");
    return { ok: true };
  });

/** Public: starts a passkey sign-in (discoverable credentials, no account hints leaked). */
export const passkeyLoginOptions = createServerFn({ method: "POST" }).handler(async () => {
  const { generateAuthenticationOptions } = await import("@simplewebauthn/server");
  const { rpID } = await rp();
  const options = await generateAuthenticationOptions({ rpID, userVerification: "required" });
  const s = await challengeSession();
  await s.update({ challenge: options.challenge, at: Date.now() });
  return JSON.parse(JSON.stringify(options));
});

/** Public: verifies the passkey, only for the owner, and returns a one-time sign-in token hash. */
export const passkeyLoginVerify = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ response: responseSchema }).parse(d))
  .handler(async ({ data }) => {
    const fail = () => new Error("Passkey nicht erkannt.");
    const { verifyAuthenticationResponse } = await import("@simplewebauthn/server");
    const { isoBase64URL } = await import("@simplewebauthn/server/helpers");
    const { isOwnerEmail } = await import("./owner");
    const { origin, rpID } = await rp();
    const challenge = await takeChallenge();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pk } = await supabaseAdmin
      .from("passkeys")
      .select("*")
      .eq("credential_id", data.response.id)
      .eq("rp_id", rpID)
      .maybeSingle();
    if (!pk) throw fail();
    const v = await verifyAuthenticationResponse({
      response: data.response as never,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: pk.credential_id,
        publicKey: isoBase64URL.toBuffer(pk.public_key),
        counter: Number(pk.counter),
        transports: pk.transports as never,
      },
    });
    if (!v.verified) throw fail();
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(pk.user_id);
    if (!u.user?.email || !isOwnerEmail(u.user.email)) throw fail();
    await supabaseAdmin
      .from("passkeys")
      .update({ counter: v.authenticationInfo.newCounter, last_used_at: new Date().toISOString() })
      .eq("id", pk.id);
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: u.user.email,
    });
    if (error || !link.properties?.hashed_token)
      throw new Error("Anmeldung konnte nicht abgeschlossen werden.");
    return { tokenHash: link.properties.hashed_token };
  });
