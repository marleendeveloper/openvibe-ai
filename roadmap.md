# Phase 2

- [x] Inspect the existing studio, provider relay, parser, preview, persistence and current workspace connections.
- [x] Move provider credentials out of browser persistence and into encrypted server-only cookies; validate requests and load live model catalogs.
- [x] Harden SSE parsing, file operations, project isolation, snapshots and the bounded five-attempt repair loop.
- [x] Preserve the mobile design; add connection checks, agent progress, undo and data-transfer consent.
- [x] Run automated mock tests and desktop/mobile browser checks.
- [ ] Run real external-provider code generation through the preview. Blocker: saved OpenRouter credential exists, but no app user is signed in for the protected activation and test.
- [x] Write the final technical report with evidence, security limitations and credit balance (`PHASE2-REPORT.md`).

# Phase 3 — Free coding setup and cost protection

- [x] Select a currently zero-priced external coding model from the live catalog without claiming a proven strongest model.
- [x] Add a default-on zero-cost guard for OpenRouter generation and connection tests, with no paid fallback.
- [x] Verify automated rules and desktop/mobile setup through the studio.
- [ ] Run real external-provider generation. Blocker: saved OpenRouter credential exists, but no app user is signed in for the protected activation and test.
- [x] Record results and remaining limitations (`PHASE3-REPORT.md`).

# Phase 3 — AI Gateway code review

- [x] Add key-creation links beside the existing secure provider input and test it first.
- [x] Add authenticated AI Gateway review of the current project or selected files, with prioritized bugs, security risks and concrete fixes.
- [x] Require explicit transfer consent, pin reports to project/revision, and never apply review suggestions automatically.
- [x] Test real AI Gateway review service with sample code, review validation, and mobile/desktop selection and sign-in gating.
- [ ] Complete authenticated in-app review and verify result display. Blocker: there are no auth users; session minting cannot proceed before sign-in.
- [ ] Use the saved `OPENROUTER_API_KEY` through an authenticated action and run real external coding. Current blocker: no signed-in app user exists for a safe shared-secret test.

# Complete account setup

- [ ] Add email registration, login, confirmation state, password reset and existing social sign-in.
- [ ] Add a private profile with display name and bio, automatic creation, and own-account access only.
- [ ] Synchronize session state across studio, review and account controls; clear provider cookies on logout.
- [ ] Test profile persistence, login/logout and review/OpenRouter flows where authentication is available.