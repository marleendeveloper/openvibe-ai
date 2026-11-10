<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## OpenVibe architecture
- Keep the existing TanStack studio, Zustand project store, CodeMirror editor and Sandpack preview; extend these modules rather than adding duplicate implementations.
- External AI requests go only through same-origin server routes; provider credentials use AES-GCM encrypted HttpOnly per-provider cookies, with origin checks and no JavaScript-readable key persistence, to retain a database-free private studio.
- Generic provider base URLs are server-configured, never browser-supplied, to prevent the relay becoming an arbitrary network proxy.
- Pin every agent task, message, patch and preview check to its original project and file revision; reject stale patches to avoid overwriting concurrent edits.
- Validate file operations atomically before snapshots and use bounded repair attempts with duplicate-error detection; preview success must match the changed revision.
- Check live, complete OpenRouter pricing before zero-cost generation and connection tests; never infer free pricing from a model name or fall back to a paid model.
- Keep code review separate from external-provider coding: authenticated server functions call the AI Gateway SDK, review only consented files, pin reports to project revisions, and never automatically apply suggestions.
- Activate saved workspace provider credentials only through authenticated server actions that issue encrypted browser-scoped cookies; never return the credential or expose it to public AI requests without the cookie.
- Keep one root account-session provider for account, studio and review state; private profiles are scoped to authenticated user IDs and signup triggers, while project code remains local.
