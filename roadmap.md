# Phase 2

- [x] Test the user-requested Nemotron model through the newly created OpenRouter connection. Live catalog showed zero prompt/completion pricing; real completion returned HTTP 200, complete React counter code, finish_reason stop, and reported cost 0.
- [x] Link the new OpenRouter… done: linked OpenRouter connection; Nemotron generated counter (desktop) and todo list (mobile), applied, preview verified incl. adding an item.

- [x] Inspect the existing studio, provider relay, parser, preview, persistence and current workspace connections.
- [x] Move provider credentials out of browser persistence and into encrypted server-only cookies; validate requests and load live model catalogs.
- [x] Harden SSE parsing, file operations, project isolation, snapshots and the bounded five-attempt repair loop.
- [x] Preserve the mobile design; add connection checks, agent progress, undo and data-transfer consent.
- [x] Run automated mock tests and desktop/mobile browser checks.
- [x] Run real external-provider… done: linked OpenRouter connection; Nemotron generated counter (desktop) and todo list (mobile), applied, preview verified incl. adding an item.
- [x] Write the final technical report with evidence, security limitations and credit balance (`PHASE2-REPORT.md`).

# Phase 3 — Free coding setup and cost protection

- [x] Select a currently zero-priced external coding model from the live catalog without claiming a proven strongest model.
- [x] Add a default-on zero-cost guard for OpenRouter generation and connection tests, with no paid fallback.
- [x] Verify automated rules and desktop/mobile setup through the studio.
- [x] Run real external-provider… done: linked OpenRouter connection; Nemotron generated counter (desktop) and todo list (mobile), applied, preview verified incl. adding an item.
- [x] Record results and remaining limitations (`PHASE3-REPORT.md`).

# Phase 3 — AI Gateway code review

- [x] Add key-creation links beside the existing secure provider input and test it first.
- [x] Add authenticated AI Gateway review of the current project or selected files, with prioritized bugs, security risks and concrete fixes.
- [x] Require explicit transfer consent, pin reports to project/revision, and never apply review suggestions automatically.
- [x] Test real AI Gateway review service with sample code, review validation, and mobile/desktop selection and sign-in gating.
- [x] Complete authenticated in-app review and verify result display. Real selected-file Gateway review displayed its report on mobile; no runtime errors observed.
- [x] Use the saved `OPENROUTER… done: linked OpenRouter connection; Nemotron generated counter (desktop) and todo list (mobile), applied, preview verified incl. adding an item.

# Complete account setup

- [x] Add email registration, login, confirmation state, password reset and existing social sign-in.
- [x] Add a private profile with display name and bio, automatic creation, and own-account access only.
- [x] Synchronize session state across studio, review and account controls; clear provider cookies on logout.
- [x] Test mobile/desktop registration controls, reserved-email rejection, reset view, profile validation and live schema/policies.
- [x] Verify an authenticated account, profile save and readback, and in-app Gateway review on mobile with a desktop rendering check.
- [ ] Test registration confirmation and login/logout roundtrip. Blocker: restored test session does not exercise the original registration/login flow; user's active account was not signed out.
- [x] Complete OpenRouter end-to-end… done: linked OpenRouter connection; Nemotron generated counter (desktop) and todo list (mobile), applied, preview verified incl. adding an item.

# Phase 4

- [ ] Cloud-Speicher für Projekte: Tabellen, serverseitige Speicher-/Ladefunktionen, Studio-Sync bei Anmeldung.
- [ ] Chat-Verlauf pro Projekt in der Datenbank, beim Laden wiederherstellen.
- [ ] Apps veröffentlichen: öffentlicher Link pro Projekt, öffentliche Ansicht, Veröffentlichung zurücknehmen.
- [ ] Tests: automatische Regeln plus Handy/Desktop-Browserprüfung des Speicherns, Ladens und Veröffentlichens.
- [ ] Anmelde-Rundlauf mit der E-Mail des Nutzers: Registrierung, Bestätigung, Login, Logout.

# End-to-end brief (real Nemotron, mobile)

- [x] Multi-file generation + delete applied, preview rendered.
- [x] Real repair after broken first version: Nemotron created missing file, preview fixed.
- [x] Undo restores previous state; 48 automated tests pass.
- [x] Accept delete-then-rewrite of the same file as a replacement (was wrongly rejected).
