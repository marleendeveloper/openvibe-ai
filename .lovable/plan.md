# OpenVibe – Bestands- und Qualitätsaudit (Audit: 10.11.2026, 16:41 UTC; Gesamtstatus aktualisiert ~17:20 UTC)

> Abschnitte 1–6 sind der Audit-Stand von 16:41 UTC. Der aktuelle Stand steht in Abschnitt 0 sowie 7–9.

## 0. Aktueller Gesamtstatus (~17:20 UTC)

| Bereich | Implementiert | Mock-/Unit-getestet | Echter Provider-Test | Browser/E2E |
|---|---|---|---|---|
| Retry nach Transportfehler (voller Schritt, Teilantwort verworfen) | ja | ja (retry.test.ts) | historisch Abbrüche beobachtet, Retry nie real bestätigt | nein |
| Fortsetzen ab fehlgeschlagenem Plan-Schritt | ja (A.1) | ja (resume.test.ts) | nein | nein |
| Keine Teilantwort als Modellkontext | ja (A.3) | ja | nein | nein |
| Codegenerierung, Reparatur, Rückgängig | ja | ja | historisch belegt, aktuell nicht wiederholt | historisch (Playwright) |

Belegte Läufe: 85 Tests / 12 Dateien bestanden, TypeScript 0 Fehler, Build Exit 0. Lint **nicht bestanden** (nur vorbestehende Prettier-Fehler, 0 neue in geänderten Dateien; vollständiger `eslint .` nicht abgeschlossen).

Offen: echter Fortsetzungs-/Retry-Test mit Nemotron (braucht Freigabe zur Anmeldung als Marleen oder Justin), Phase B (Passkey-Gerät, Mail-Link, MCP, Vorlagen, Desktop, Reduced Motion), Phase C (GitHub zurückgestellt, CI), Prettier-Altlasten.

Dies ist eine reine Leseprüfung. Es wurden keine Dateien, Pakete oder Datenbankeinträge geändert und keine Geheimnisse gelesen. Ausgeführt wurde nur die vorhandene Testsuite (nur lesend). GitHub ist nicht verbunden, der Code ist also nirgends extern gesichert.

## 1. Projektübersicht (aktueller Stand)

- **Studio und Oberfläche:** `src/components/studio/` (Studio, Chat, CodeEditor, Preview, FileTree, Settings, Account, Passkeys, CloudSync, Publish, Overview, CodeReview, ui)
- **Zustand und Agent:** `store.ts` (Zustand, persist), `agent.ts` (Plan, Schritte, Reparatur), `runtime.ts`, `preview-state.ts`, `parse.ts` (File-Ops)
- **Provider-Relay:** `provider.server.ts`, `providers.ts`, `provider-client.ts`, `ai.ts`, Routen `api/public/ai.ts` und `api/public/provider.ts`
- **Zugang:** `owner.ts`, `owner-middleware.ts`, `passkey.functions.ts`, `auth-state.tsx`, `saved-provider.functions.ts`
- **Cloud:** `cloud.ts`, `cloud.functions.ts`, `cloud-sync.ts`, öffentliche Seite `routes/p/$slug.tsx`
- **Review:** `review.ts`, `review.server.ts`, `review.functions.ts`
- **Phase 5:** `phase5.ts`, `templates.ts`
- **MCP:** `src/lib/mcp/` (index, supabase, tools/list-projects, get-project, list-published), Route `api/public/mcp.ts`, OAuth-Consent-Route
- **Skripte:** `build`, `lint`, `test` (vitest). **Kein CI** (kein `.github`-Ordner).

## 2. Geprüfte Diskrepanzen

1. **Retry:** `streamWithRetry` ruft `streamChat` erneut mit **denselben Nachrichten** auf. Teilantworten werden verworfen (`reset()` leert den Text). Das ist ein **vollständiger Neuversuch des aktuellen Schritts**, keine Fortsetzung „nur des offenen Teils“. Die Aussage im Phase-5-Plan stimmt nicht. Sicher ist der Ablauf trotzdem: Teilantworten werden nie übernommen. Schlägt ein Schritt nach 2 Neuversuchen fehl, bricht der ganze Auftrag ab, und „Erneut versuchen“ startet von vorn statt beim fehlgeschlagenen Schritt.
2. **Belege zu echten Modelltests:** Historisch hatten PHASE2/3-REPORT noch keinen erfolgreichen Generierungstest (Ursachen damals: Hugging Face mit Fehler 402, Schlüssel nicht in der Laufzeit). Aktuell belegen die Chat-Protokolle echte Nemotron-Aufträge über die verknüpfte Verbindung: Zähler, Todo-Liste, Notizen mit Reparatur und Rückgängig, Wetter-Karte und RaveSafe (3. Versuch). Dafür gibt es Screenshots aus Playwright-Läufen, aber keine automatisierten Provider-Tests. Die Reports sind veraltet.
3. **Tests:** 10 Testdateien, **76 Testfälle, alle bestanden** (der Überblick nannte 75). Aufteilung: phase2 21, phase5 17, cloud 7, free-models 5, provider.server 5, review 5, owner 4, parse 4, profile 2, app-routing 1. **Alle sind Unit- oder Mock-Tests, 0 echte Provider-Tests.** Lint und Build laufen automatisch, aber ohne CI.
4. **Nicht end-to-end getestet:** echter Passkey auf dem iPhone, echte Zustellung und Klick des E-Mail-Links, MCP-Verbindung von ChatGPT oder Claude, 4 der 5 Vorlagen, Vorschau nach einem Bild-Auftrag, Desktop nach dem Redesign, Reduced-Motion-Ansicht, Retry im Ernstfall (nicht beobachtet), Registrierungs-Roundtrip für Justin, Label „Live“ in der Übersicht.

## 3. Statusmatrix

| Bereich | Vorhanden | Real getestet | Nur automatisiert/simuliert | Ungeprüft |
|---|---|---|---|---|
| Owner-Gating (2 E-Mails), Gast 403 | ja | Playwright als Gast und als Marleen | Unit-Tests | Justin-Login |
| Passkey | ja | – | virtueller CDP-Authenticator | echtes Gerät |
| Magic-Link-Notfall | ja | – | Regeltest | Mail und Klick |
| Credential-Cookie AES-GCM | ja | Nutzung im Studio | Unit-Tests | – |
| 0€-Guard | ja | Nemotron-Läufe | free-models-Tests | – |
| SSE, Abbruch, Retry | ja (voller Neuversuch) | Abbrüche beobachtet | isRetryableError (Stand 16:41; seit A.3 auch Mock-Stream-Tests) | Retry real |
| Mehrschritt-Plan | ja | Schritte 1–2 | parsePlan, needsPlan | kompletter Lauf |
| Atomare File-Ops, Reparatur, Pinning | ja | 1 Reparaturfall, Rückgängig | phase2-Tests | – |
| Bilder und Vision-Modell | ja | Auftrag ohne Fehler | Limits, Server-Schema | Vorschau |
| 5 Vorlagen | ja | 1 (Landingpage) | Anzahl = 5 | 4 Vorlagen |
| Cloud speichern/laden, Verlauf, Veröffentlichen | ja | ja | cloud-Tests | – |
| Code Review | ja | 1 echter Lauf | review-Tests | – |
| MCP, 3 read-only Tools | ja | – | 401 ohne Token | echter Client |
| Mobile / Desktop / Reduced Motion | ja | Mobile | – | Desktop, Reduced Motion |

## 4. Risiken

- **P0:** keine. Allerdings sollte der im Chat gepostete OpenRouter-Schlüssel ersetzt werden. Das kann nur der Nutzer, er gilt als offengelegt.
- **P1:** Kein Backup außerhalb von Lovable, weil GitHub fehlt. Lange Aufträge brechen bei Nemotron oft ab, und ohne Fortsetzung pro Schritt geht der Fortschritt verloren. Es fehlt ein Passkey auf einem echten Gerät, sodass der Zugang vom E-Mail-Notfall abhängt.
- **P2:** Die Reports (PHASE2/3, Phase-5-Plan) sind veraltet oder falsch. Es gibt kein CI. MCP und Mail-Zustellung sind ungeprüft. Die veröffentlichte App steht möglicherweise auf einem alten Stand.
- **P3:** Desktop, Reduced Motion und die restlichen Vorlagen sind visuell ungeprüft. Ein früher gemeldeter weißer Bildschirm ist nicht reproduziert.

## 5. Drei-Phasen-Plan

**Phase A – Zuverlässigkeit des Agenten**
1. „Erneut versuchen“ setzt beim fehlgeschlagenen Schritt fort. Abgeschlossene Schritte bleiben, der Plan wird gespeichert.
   Akzeptanz: Ein Abbruch in Schritt 3 führt bei einem neuen Versuch nur Schritt 3 und 4 aus. Dazu ein Unit-Test.
2. Phase-5-Plan und Reports korrigieren: „voller Neuversuch des Schritts“.
3. Retry-Test mit einem Mock-Stream, der einmal abbricht.
   Akzeptanz: Der Test bestätigt „Neuer Versuch 1/2“ und eine anschließend erfolgreiche Antwort.

**Phase B – Echte End-to-End-Belege**
1. Passkey auf dem iPhone in der veröffentlichten App anlegen (Nutzer) und damit anmelden.
2. E-Mail-Link für Justin senden und anklicken.
3. MCP mit Claude oder ChatGPT verbinden und alle 3 Tools aufrufen.
4. Playwright-Läufe für alle 5 Vorlagen, Bild-Auftrag mit Vorschau, Desktop mit 1280 px und Reduced Motion.
   Akzeptanz: Screenshots plus Protokoll ohne Seitenfehler.

**Phase C – Absicherung und Betrieb**
1. GitHub verbinden, damit der Code extern gesichert ist (Nutzer).
2. CI mit Lint, Test und Build über GitHub Actions.
3. Ein aktueller Bericht ersetzt PHASE2/3-REPORT. Danach neu veröffentlichen.

## 6. Kleinster sinnvoller nächster Schritt

Phase A, Punkt 1: Den Plan und den Index des fehlgeschlagenen Schritts in der Nachricht speichern. „Erneut versuchen“ startet dann ab diesem Schritt. Dazu ein Unit-Test. Betroffen sind nur `agent.ts`, `Chat.tsx` und ein neuer Test.

## 7. Umsetzung Phase A.1 (10.11.2026, 17:10 UTC)

- **Geändert:** `agent.ts` (`checkResume`, `runAgent(..., resume)`), `store.ts` (`Message.resume`, `ResumePoint`), `Chat.tsx` (Knopf „Ab Schritt N fortsetzen“), neu `resume.test.ts`.
- **Verhalten:** Bei Fehler in einem Mehrschritt-Auftrag speichert die Fehlermeldung Plan, Index des fehlgeschlagenen Schritts, Projekt-ID und Datei-Revision. Fortsetzung nur bei gleicher Projekt-ID und identischer Revision, sonst klare Abbruchmeldung ohne KI-Aufruf. Aufträge mit Bildern und Einzelschritt-Aufträge starten wie bisher komplett neu (Bilder werden nicht gespeichert).
- **Belege (ausgeführt):** `vitest run`: 11 Dateien, 81 Tests bestanden (neu 5, alle Mock-Tests mit gemocktem Stream). `tsgo -b --noEmit`: 0 Fehler. `vite build`: Exit 0. `eslint` auf geänderten Dateien: nur Prettier-Formatfehler, die schon vorher bestanden (alte agent.ts: 75).
- **Nicht getestet:** echter Abbruch mit Nemotron und Fortsetzung im Studio; Klick auf den neuen Knopf im Browser. Echte Provider-Tests: 0.
- **Restrisiko:** Wurde Schritt N vor dem Abbruch teilweise angewendet (z. B. Reparatur scheiterte), läuft Schritt N bei Fortsetzung auf dem aktuellen Stand erneut.

## 8. Umsetzung Phase A.3 (10.11.2026, ~17:15 UTC)

- **Geändert:** `agent.ts` (Verlauf für das Modell schließt Nachrichten mit Fehler aus, d. h. abgebrochene Teilantworten werden nie wieder als Kontext gesendet; Projekt-ID- und Revision-Pinning unverändert), neu `retry.test.ts`, `resume.test.ts` nur per Prettier formatiert.
- **Befund vorher:** Ja, fehlgeschlagene Teilantworten (mit `error`) gingen bei Resume und normalem Neuversuch als Assistant-Kontext an das Modell. Der neue Test schlug ohne den Fix nachweislich fehl (1 failed) und besteht mit ihm.
- **Mock-Tests (echter `streamChat`-SSE-Parser, `fetch` gemockt):** Abbruch nach Teil-Tokens -> „Neuer Versuch 1/2“, Teil-Datei wird nicht angewendet, zweiter Versuch: genau 1 Dateioperation und 1 Snapshot; zwei fehlgeschlagene Neuversuche -> 3 Anfragen, klare Fehlermeldung, Dateien unverändert; manueller Stopp -> 1 Anfrage, kein Neuversuch, „Abgebrochen.“; kein Teilantwort-Kontext in der Folgeanfrage.
- **Ergebnisse:** `vitest run` 12 Dateien, 85 Tests bestanden. `tsgo -b --noEmit` 0 Fehler. `vite build` Exit 0. ESLint pro geänderter Datei vs. Git-HEAD (HEAD enthält bereits A.1): agent.ts 75/75, store.ts 24/24, Chat.tsx 61/61, alles vorbestehende Prettier-Formatfehler, 0 neue; neue Testdateien 0 Fehler nach `--fix`. Vollständiger `eslint .` nicht ausgeführt (lief früher >200 s ohne Ergebnis).
- **Nicht getestet:** echter Abbruch bei Nemotron/OpenRouter, Browserlauf. Echte Provider-Tests: 0.

## 9. Phase A.2 – Dokumente (~17:20 UTC)

- PHASE2-REPORT.md und PHASE3-REPORT.md als historisch markiert, datierter Aktualisierungsabschnitt ergänzt.
- Phase-5-Plan (archiviert): datierte Korrektur zur falschen Retry-Aussage ergänzt.
- roadmap.md: Phase A zusammengefasst; zwei Registrierungs-Aufgaben als entfallen markiert, weil die Registrierung seit Phase 6 abgeschaltet ist (nicht als erledigt).
- Keine Codeänderung, daher keine Tests erneut ausgeführt.
