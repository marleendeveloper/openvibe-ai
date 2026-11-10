# OpenVibe – Phase-2-Bericht

> **Historischer Bericht** vom damaligen Prüfzeitpunkt. Aktueller Stand: Abschnitt „Aktualisierung“ am Ende und `.lovable/plan.md`.

Stand: 10. November 2026. Phase 2 ist technisch wesentlich weiterentwickelt, aber die Definition of Done ist ohne erfolgreichen echten KI-Anbieter-Test noch nicht vollständig erreicht.

## Bestandsaufnahme

Bestehende Implementierung beibehalten: TanStack Start, React 19, CodeMirror 6, Sandpack und Zustand. Das tatsächlich installierte Projekt verwendet Vite 8 und Tailwind 4, nicht mehr Vite 7. Keine neue Abhängigkeit installiert und keine zweite Studio-Implementierung erstellt.

Gefundene Probleme: API-Schlüssel wurden im LocalStorage gespeichert; beliebige kompatible Endpunkte direkt im Browser aufgerufen; SSE-Endereignisse konnten verloren gehen; unvollständige Mehrdateiantworten konnten teilweise angewendet werden; Agent-Nachrichten und Änderungen waren nicht fest an das ursprüngliche Projekt gebunden; Reparaturen prüften nach einer festen Wartezeit ohne Versionsbezug; Sandpack aktualisierte anfangs generierte Dateien nicht zuverlässig und eine hängenbleibende Ladeüberlagerung blockierte die Vorschau.

## Implementiert

- OpenRouter als Standardanbieter, Hugging Face und serverseitig konfigurierte OpenAI-kompatible Endpunkte.
- Aktueller Modellkatalog statt fest angenommener Gratis-Modelle; OpenRouter-Filter für nach Anbieterangaben kostenlose Eingabe-/Ausgabetokens. Verfügbarkeit und Kontingente bleiben Anbieterbedingungen.
- Schlüssel werden nur kurz im Eingabefeld gehalten und anschließend serverseitig AES-GCM-verschlüsselt in HttpOnly-/SameSite-Strict-Cookies gespeichert. Secure auf HTTPS, 30 Tage Gültigkeit. Bestehende LocalStorage-Schlüssel werden bei Migration entfernt.
- Echter Modell-Verbindungstest mit kurzer Anfrage. Diagnosen für HTTP 401, 402, 403, 429 und 5xx sowie manuelle Anbieterwechsel.
- Alle KI-Aufrufe laufen über denselben serverseitigen Vermittler; keine Provider-Schlüssel in Requests des normalen Chat-Clients.
- SSE-Verarbeitung für fragmentierte UTF-8-Daten, CRLF, abschließende Ereignisse ohne Zeilenumbruch, Reasoning, Fehler, Abbruch und Tokenlimit-Trunkierung.
- Atomare Mehrdateiänderungen; gefährliche Pfade, geheime Dateien, doppelte Operationen und zu große Projekte werden abgewiesen.
- Agent-Plan als Modellanweisung, sichtbare Arbeitsschritte, festes ursprüngliches Projekt, Schutz vor veralteten Änderungen, Auto-Apply und Wiederherstellungspunkte.
- Höchstens fünf automatische Reparaturen nach dem ersten Generierungsversuch; Abbruch bei identischen Fehlern. Vorschauprüfung erfolgt anhand der Projekt- und Dateiversion.
- Undo, Snapshot-Restore, erneute Datenübertragungszustimmung beim Projektwechsel.
- Smartphone-Navigation und bestehendes Design erhalten; Vorschau lädt auch im Hintergrund. Neue Vorschauinstanz pro Dateiversion verhindert veraltete Dateien; Ladeüberlagerung wird nach tatsächlichem Abschluss entfernt.

## Tatsächlich durchgeführte Tests

### Automatisiert

34 Tests in vier Dateien erfolgreich:

- `parse.test.ts`: bestehender Parser.
- `phase2.test.ts`: Mehrdateioperationen und Löschung, unvollständige Antworten, Pfade, Projektgrößen, Undo, Projektisolation, konkurrierende Änderungen, Schlüsselmigration, Datenzustimmung, SSE, Reasoning, simulierte Codegenerierung und Reparaturgrenzen.
- `provider.server.test.ts`: Origin-Prüfung, Verschlüsselung, HttpOnly/Secure/SameSite, Trennung der Anbieter, Manipulationsschutz, Eingabegrenzen und kein browsergesteuertes Proxyziel.
- `app-routing.test.tsx`: Startseite.

### Browser – Smartphone 390 × 844 und Desktop 1280 × 1800

Simulierte KI-Antwort → zwei echte Projektdateien → echte Sandpack-Ausführung → absichtlich ausgelöster React-Laufzeitfehler → zweite simulierte KI-Antwort → funktionsfähige Zähler-App. Der Button wurde wirklich von „Count 0“ auf „Count 1“ geklickt. Anschließendes Undo stellte die vorherige fehlerhafte Datei wieder her. Dieser Ablauf war auf beiden Bildschirmgrößen erfolgreich; die KI selbst war dabei ein Mock, nicht ein echtes Modell.

Separat geprüft: Editor, Chat und Dateinavigation auf Smartphone; kein horizontales Seitenüberlaufen; aktueller OpenRouter-Modellkatalog; verschlüsseltes HttpOnly-Cookie nach Speicherung eines ungültigen Testschlüssels; kein Testschlüssel im LocalStorage; reale OpenRouter-Anfrage mit ungültigem Schlüssel liefert HTTP 401. Testschlüssel anschließend entfernt. Keine beobachteten Studio-Laufzeitfehler bei diesen Navigationsprüfungen.

Der automatisch ausgeführte Projekt-Prüfstand meldet zuletzt `build OK`; Produktionsbuild und TypeScript-Prüfung wurden nicht zusätzlich manuell gestartet.

## Provider und getestete Modelle

- OpenRouter: öffentlicher Katalog live geladen; gültige erfolgreiche Modellanfrage mangels Zugang nicht getestet.
- Hugging Face: implementiert, aber im neuen Workspace nicht verbunden und nicht erfolgreich getestet. Frühere Workspace-Verbindungen gelten nicht mehr.
- Eigener Anbieter: benötigt serverseitig `OPENVIBE_CUSTOM_BASE_URL`; kein realer Endpunkt konfiguriert.
- Kein reales Modell wurde erfolgreich zur Codegenerierung getestet. `mock/model` bezeichnet ausschließlich simulierte Antworten.

## Sicherheitsstatus und Grenzen

Provider-Schlüssel werden nicht öffentlich ausgeliefert. Die Schlüssel-Eingabe selbst sendet den Wert einmal über eine Same-Origin-HTTPS-Verbindung an den Server; danach nutzt JavaScript nur den Verbindungsstatus. Der Browser speichert verschlüsseltes Cookie-Material, nicht den lesbaren Schlüssel. Keine Datenbank für Projektdaten oder Schlüssel nötig.

Origin-Prüfung, serverseitige Eingabevalidierung, feste Provider-Ziele, Redirect-Sperre sowie Grenzen: 1,5 MB Request, 2 MB Antwort, 500 KB pro Datei, 1 MB Projekt, 100 Dateien/Operationen, 32.768 maximale Ausgabetokens. Kein Server-Shellzugriff durch den Agenten.

Systemanweisungen sind von als nicht vertrauenswürdig markierten Projektdateien getrennt. Das reduziert Prompt-Injection-Risiken, garantiert aber keine Immunität eines Sprachmodells. Generierter Anwendungscode läuft weiterhin in einer externen Sandpack-Sandbox; Netzwerkaufrufe aus generiertem Browsercode werden nicht vollständig unterbunden. Vor vertraulichen Projekten externe Datenübertragung berücksichtigen.

Das Studio bleibt lokal und ohne neu eingeführte Kontenverwaltung; es ist keine Mehrbenutzer-Administrationsplattform. Cookie-Sitzungen dürfen nicht geteilt werden. Workspace-Connectoren werden nicht automatisch allen Studio-Besuchern zur Verfügung gestellt. Ein frei wählbarer eigener Endpunkt im Browser wurde bewusst durch eine vertrauenswürdige Serverkonfiguration ersetzt.

Auto-Fix wartet auf ein passendes Vorschauergebnis und meldet einen Timeout als nicht verifiziert. Später auftretende Fehler nach dem kurzen Stabilitätsfenster sind dadurch nicht ausgeschlossen. Snapshot-Historie bleibt auf die bestehenden 30 Einträge begrenzt; Undo ist innerhalb dieser Historie möglich, keine unbegrenzte Versionsverwaltung. HTML, CSS und TSX sind als Dateien/Editorformate unterstützt; vollständige HTML-only-Projekte sind nicht als eigenständige Sandpack-Vorlage getestet. Externe npm-Abhängigkeiten sind ebenfalls noch nicht end-to-end getestet. Snapshot-Schutz besteht für Agentänderungen, Löschungen und Umbenennungen; jede einzelne manuelle Texteingabe erzeugt keinen separaten Snapshot.

## Geänderte/neu hinzugefügte Dateien

`src/lib/studio/{limits.ts,providers.ts,provider-client.ts,provider.server.ts,provider.server.test.ts,ai.ts,parse.ts,runtime.ts,store.ts,preview-state.ts,agent.ts,phase2.test.ts}`

`src/routes/api/public/{ai.ts,provider.ts}`, `src/routes/__root.tsx`

`src/components/studio/{Settings.tsx,Chat.tsx,Studio.tsx,FileTree.tsx,Preview.tsx}`

`src/styles.css`, `AGENTS.md`, `roadmap.md`, dieser Bericht. Projektpräferenzen zusätzlich in privatem Projektspeicher festgehalten.

## Budget

Erste Abfrage dieser Phase: 113,60 Credits verfügbar. Letzte Abfrage: 103,50 Credits verfügbar; Differenz 10,10 Credits. Abrechnung zeigt 11,603 verbrauchte Credits für den laufenden Zeitraum und 115,00 insgesamt gewährt. Diese Zahlen haben verschiedene Abrechnungssichten; Differenz und Zeitraumverbrauch sind deshalb nicht identisch. Die letzte Antwort und Berichtsfertigstellung können danach noch verbucht werden. Das Budget ist nicht ausgeschöpft.

## Offener Abschluss

Ein gültiger externer Anbieterzugang fehlt. Sobald ein gültiger OpenRouter- oder Hugging-Face-Schlüssel im Studio hinterlegt ist, muss derselbe Ablauf mit einem tatsächlich verfügbaren Modell erneut durchgeführt werden. Erst dieser erfolgreiche reale Smartphone-Test erfüllt die vollständige Definition of Done. Keine erfolgreiche reale Modellanfrage behauptet und kein kostenpflichtiger Dienst vorausgesetzt.
## Aktualisierung 10.11.2026, ~17:20 UTC (Qualitätsprogramm A.1–A.3)

> Die Abschnitte oben sind ein **historischer Bericht vom damaligen Prüfzeitpunkt** und wurden nicht rückwirkend geändert.

- **Echte Provider-Tests (historisch, nach diesem Bericht):** Über die verknüpfte OpenRouter-Verbindung hat Nemotron reale Aufträge umgesetzt (Zähler, Todo-Liste, Notizen mit Reparatur und Rückgängig, Wetter-Karte, RaveSafe-Seite im 3. Versuch). Diese Läufe wurden **im aktuellen Programm nicht erneut ausgeführt**.
- **Automatischer Retry (implementiert, Mock-getestet):** Nach Transportfehlern wird **derselbe vollständige Schritt** bis zu 2-mal neu angefragt; Teilantworten werden verworfen und nie angewendet. Kein Weiterschreiben „nur des offenen Teils“.
- **Fortsetzen (implementiert, Mock-getestet):** Scheitert ein Mehrschritt-Auftrag, speichert die Fehlermeldung Plan, fehlgeschlagenen Schritt, Projekt-ID und Datei-Revision. „Ab Schritt N fortsetzen“ startet dort, nur bei gleichem Projekt und identischer Revision; sonst klare Abbruchmeldung. Aufträge mit Bildern und Einzelschritt-Aufträge starten komplett neu.
- **Behobener Kontextfehler:** Fehlgeschlagene Assistant-Nachrichten (mit Teilantwort) werden nicht mehr als Kontext an das Modell gesendet. Der zugehörige Test schlug ohne Fix fehl.
- **Belegte Läufe:** A.1: 81 Tests bestanden (11 Dateien). A.3: 85 Tests bestanden (12 Dateien). TypeScript 0 Fehler, Production Build Exit 0. **Lint nicht bestanden:** vorbestehende Prettier-Formatfehler (agent.ts 75, store.ts 24, Chat.tsx 61, keine neuen); ein vollständiger `eslint .`-Lauf wurde nicht abgeschlossen.
- **Nicht geprüft:** Retry/Fortsetzen mit echtem Anbieter und im Browser; echter Passkey auf einem Gerät, E-Mail-Notfalllink, MCP mit echtem Client.
