# Phase 3 — Free coding setup and cost protection

> **Historischer Bericht** vom damaligen Prüfzeitpunkt. Aktueller Stand: Abschnitt „Aktualisierung“ am Ende und `.lovable/plan.md`.

Checked on 2026-11-10.

## Delivered

- OpenRouter's live catalog returns `nvidia/nemotron-3-ultra-550b-a55b:free` with zero pricing. Selected it as the preferred coding option when no model is already selected. This is a practical preference, not a verified claim that it is the strongest model.
- Existing user-selected models are not overwritten. Settings includes a command to choose the current free coding preference.
- Zero-cost protection defaults on. Both generation and connection tests verify the current catalog before a completion request. All advertised pricing fields must be zero, not just input/output: music models with a nonzero per-request price are excluded.
- Missing pricing, changed prices, absent models, or failed catalog requests block generation. No automatic paid fallback.
- Other providers require intentionally disabling the guard because their zero pricing cannot be verified through this OpenRouter catalog.
- Credentials remain encrypted per-provider HttpOnly cookies; no new shared workspace credential, browser-readable key persistence, or database storage was added.

## Evidence

- 39 automated tests passed across five files: parsing, server credential security, streaming, mocked generation and repair, project isolation, routing, and five new cost/model checks.
- Preview build reports `build OK` after the changes.
- Actual desktop (1280×1800) and phone (393×706) browser checks: current catalog loaded; preferred model chosen through Settings; zero-cost checkbox enabled; no horizontal page overflow; mobile files/code/preview/chat navigation exercised.
- A real request through the studio's AI endpoint without a provider credential returned HTTP 401. No external generation was performed and no generated preview success is claimed.

## Remaining blocker

The workspace connection list is empty. A valid provider-issued API key is required for real external generation. The app cannot issue OpenRouter/Hugging Face keys itself, and a random app-generated string would not authenticate with either service. No key was created, copied from another workspace, or exposed in chat.

Free pricing does not guarantee capacity, an unlimited quota, or account eligibility. Cost checks reflect the catalog at request time, not an independent billing guarantee. Phase 3 has started with cost protection; the uploaded brief defines Phase 2 only, so no broader Phase 3 completion is claimed.

## Files changed

`src/lib/studio/providers.ts`, `store.ts`, `provider.server.ts`, `provider-client.ts`, `ai.ts`, `agent.ts`, `free-models.test.ts`, `src/routes/api/public/ai.ts`, `provider.ts`, `src/components/studio/Settings.tsx`, `Studio.tsx`, `AGENTS.md`, `roadmap.md`.
## Aktualisierung 10.11.2026, ~17:20 UTC (Qualitätsprogramm A.1–A.3)

> Die Abschnitte oben sind ein **historischer Bericht vom damaligen Prüfzeitpunkt** und wurden nicht rückwirkend geändert.

- **Echte Provider-Tests (historisch, nach diesem Bericht):** Über die verknüpfte OpenRouter-Verbindung hat Nemotron reale Aufträge umgesetzt (Zähler, Todo-Liste, Notizen mit Reparatur und Rückgängig, Wetter-Karte, RaveSafe-Seite im 3. Versuch). Diese Läufe wurden **im aktuellen Programm nicht erneut ausgeführt**.
- **Automatischer Retry (implementiert, Mock-getestet):** Nach Transportfehlern wird **derselbe vollständige Schritt** bis zu 2-mal neu angefragt; Teilantworten werden verworfen und nie angewendet. Kein Weiterschreiben „nur des offenen Teils“.
- **Fortsetzen (implementiert, Mock-getestet):** Scheitert ein Mehrschritt-Auftrag, speichert die Fehlermeldung Plan, fehlgeschlagenen Schritt, Projekt-ID und Datei-Revision. „Ab Schritt N fortsetzen“ startet dort, nur bei gleichem Projekt und identischer Revision; sonst klare Abbruchmeldung. Aufträge mit Bildern und Einzelschritt-Aufträge starten komplett neu.
- **Behobener Kontextfehler:** Fehlgeschlagene Assistant-Nachrichten (mit Teilantwort) werden nicht mehr als Kontext an das Modell gesendet. Der zugehörige Test schlug ohne Fix fehl.
- **Belegte Läufe:** A.1: 81 Tests bestanden (11 Dateien). A.3: 85 Tests bestanden (12 Dateien). TypeScript 0 Fehler, Production Build Exit 0. **Lint nicht bestanden:** vorbestehende Prettier-Formatfehler (agent.ts 75, store.ts 24, Chat.tsx 61, keine neuen); ein vollständiger `eslint .`-Lauf wurde nicht abgeschlossen.
- **Nachtrag ~17:45 UTC:** Die drei genannten Dateien sind jetzt formatiert (0 Lint-Meldungen). Vollständiger Lint ohne `.oj-cache` abgeschlossen: weiterhin **nicht bestanden** (1084 vorbestehende Fehler in anderen Dateien, siehe `.lovable/plan.md` Abschnitt 10).
- **Nachtrag ~18:20 UTC:** `eslint .` jetzt bestanden (0 Fehler, 11 Warnungen), 87 Tests. Retry und Fortsetzen wurden real mit Nemotron im Browser beobachtet; ein kompletter Mehrschritt-Plan lief wegen wiederholter Nemotron-Abbrüche nicht durch (Abschnitt 11 in `.lovable/plan.md`).
- **Nicht geprüft:** echter Passkey auf einem Gerät, E-Mail-Notfalllink, MCP mit echtem Client.
