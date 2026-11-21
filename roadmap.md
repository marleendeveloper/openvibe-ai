# Phase 2

## Kostenloses Startmodell
- [ ] Lightning anhand vollständiger Live-Preise bevorzugen, alten Standard umstellen und kostenlose Ausweichmodelle beibehalten.
- [ ] Modellregeln testen und echte Projekterstellung mit angemeldetem Eigentümer prüfen.

## Benutzerfreundliche App-Erstellung
- [ ] Schnellstarter starten echte KI-Erstellung in einem neuen Projekt, mit ausdrücklicher Übertragungszustimmung.
- [ ] Kurzer Assistent: Typ, Thema/Name, Stil; bestehende Projekte bleiben unverändert.
- [ ] Generierungsregeln für vollständige, passend gestaltete und bedienbare Ergebnisse statt Platzhalter.
- [ ] Automatische Tests und angemeldete Handy-/Desktop-Prüfung mit echtem Anbieter.

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
- [~] Entfallen (nicht getestet): Registrierungs-Rundlauf – Registrierung ist seit Phase 6 (Nur-Entwickler-Zugang) abgeschaltet.
- [x] Complete OpenRouter end-to-end… done: linked OpenRouter connection; Nemotron generated counter (desktop) and todo list (mobile), applied, preview verified incl. adding an item.

# Phase 4

- [x] Cloud-Speicher für Projekte: Tabellen mit Kontozugriff, serverseitige Speicher-/Ladefunktionen, Konto-Bereich im Dateien-Tab.
- [x] Chat-Verlauf pro Projekt in der Datenbank, beim Laden wiederhergestellt (mit Testnachricht auf dem Handy geprüft).
- [x] Apps veröffentlichen: öffentlicher Link /p/<name>, öffentliche Ansicht ohne Anmeldung, Aktualisieren und Zurücknehmen geprüft.
- [x] Tests: 55 automatische Prüfungen fehlerfrei; Handy-Browserprüfung von Speichern, Laden, Verlauf, Veröffentlichen und Zurücknehmen.
- [~] Entfallen (nicht getestet): Anmelde-Rundlauf mit Registrierung – Registrierung ist seit Phase 6 abgeschaltet.

# End-to-end brief (real Nemotron, mobile)

- [x] Multi-file generation + delete applied, preview rendered.
- [x] Real repair after broken first version: Nemotron created missing file, preview fixed.
- [x] Undo restores previous state; 48 automated tests pass.
- [x] Accept delete-then-rewrite of the same file as a replacement (was wrongly rejected).

## Phase 6 – Nur-ich-Zugang
- [x] Passkey-Anmeldung hinzufügen und nur ein Konto (Besitzerin) zulassen; dort alle Features + verbundener API-Key
- [x] Phase 5: Retries, Schrittplan, Bilder, Vorlagen, Startbildschirm, Chat-Design, Animationen

## Qualitätsprogramm Phase A (Stand ~17:20 UTC)
- [x] A.1 Fortsetzen ab fehlgeschlagenem Plan-Schritt mit Projekt-/Revisionsprüfung (nur Mock-Tests, 81 Tests)
- [x] A.2 Berichte/Plan auf belegten Stand gebracht; PHASE2/3 als historisch markiert
- [x] A.3 Retry-Test mit abbrechendem Mock-Stream; Teilantworten nicht mehr als Kontext (nur Mock, 85 Tests)
- [x] Echter Retry-/Fortsetzungstest mit Nemotron im Studio (Retry und Fortsetzen real beobachtet)
- [x] Planschritt „bereits erledigt“ ohne Dateien bricht nicht mehr ab (Mock-Tests)
- [ ] Kompletter Mehrschritt-Plan real bis zum Ende. Blocker: Nemotron bricht Schritt 1 derzeit wiederholt ab
- [ ] 11 Lint-Warnungen prüfen (exhaustive-deps, only-export-components)
- [x] Prettier in agent.ts, store.ts, Chat.tsx behoben (0 Meldungen; 85 Tests, TS 0, Build 0)
- [x] Vollständiger Lint-Lauf abgeschlossen (ohne `.oj-cache`): 1084 vorbestehende Fehler, 11 Warnungen in anderen Dateien
- [x] Lint vollständig bestanden: 0 Fehler, 11 Warnungen (Ignores für Cache und erzeugte Dateien, Formatierung, 3 echte Fehler begründet)

## Phase B/C (offen)
- [ ] Passkey auf echtem Gerät, E-Mail-Notfalllink, MCP mit echtem Client (Nutzeraktionen nötig)
- [ ] Browserprüfung: 4 weitere Vorlagen, Bild-Auftrag mit Vorschau, Desktop 1280 px, Reduced Motion
- [ ] CI; GitHub-Sicherung vorerst zurückgestellt
- [x] Demos live per KI erstellbar (z. B. Merch-Shop sieht wie echter Shop aus); Anbieter-Überlastung (503) abfangen
