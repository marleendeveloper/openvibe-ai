# Phase 5: Stabilere KI, Bilder, Vorlagen und neues Design

## Funktionen

1. **Stabilere KI bei großen Aufträgen**
   - Bricht die Verbindung ab, bevor eine Antwort ankommt, versucht das Studio es automatisch bis zu 2-mal neu, mit kurzer Pause. Im Chat steht dann „Neuer Versuch 1/2“.
   - Bei großen Aufträgen bittet das Studio die KI zuerst um einen kurzen Plan mit höchstens 4 Schritten. Danach setzt es jeden Schritt einzeln um und prüft jeweils die Vorschau.
   - Kommt eine Antwort nur teilweise an, wird nichts davon übernommen. Ein neuer Versuch schickt dann nur den noch offenen Teil.
2. **Bilder hochladen**
   - Neben dem Eingabefeld im Chat kommt ein Bild-Knopf für PNG, JPG oder WebP bis 2 MB, höchstens 3 Bilder pro Auftrag. Die Bilder erscheinen als kleine Vorschaubilder.
   - Bilder werden nur an Modelle geschickt, die laut OpenRouter Bilder verstehen und dort 0 € kosten. Nemotron kann keine Bilder lesen. Ist Nemotron gewählt, bietet das Studio ein kostenloses Bildmodell an, falls es eines gibt. Sonst ist der Bild-Knopf gesperrt und ein Hinweis erklärt den Grund.
   - Die Bilder werden nur mit dem Auftrag geschickt und weder im Konto noch im Verlauf gespeichert.
3. **Startvorlagen**
   - 5 Vorlagen, die mit einem Klick als neues Projekt starten: Landingpage im Ravesafe-Stil, Todo-App, Dashboard, Portfolio und kleiner Shop.
   - Die Vorlagen sind fest eingebaut und laufen ohne KI, also sofort und kostenlos.

## Design

4. **Startbildschirm**: Bei einem leeren Projekt zeigt der KI-Tab eine Begrüßung, die Vorlagen als Karten und 4 Beispiel-Aufträge zum Antippen.
5. **Schönerer Chat**: Eigene Nachrichten erscheinen als violette Sprechblasen, die KI-Antworten als Karten. Eine Fortschrittsleiste zeigt die Schritte Planen → Schreiben → Prüfen → Fertig. Neben jeder Antwort stehen die geänderten Dateien als Chips. Fehler bekommen einen „Erneut versuchen“-Knopf.
6. **Animationen**: Neue Nachrichten und Dialoge blenden sanft ein, beim Laden schimmern Platzhalter, und Tabs wechseln mit einem kurzen Übergang. Wer am Gerät reduzierte Bewegung eingestellt hat, sieht keine Animationen.

## Tests

- Automatische Prüfungen für: Wiederholungen nur bei Verbindungsabbruch, Grenzen für Bilder (Größe, Anzahl, Format) und Bilder nur für kostenlose Bildmodelle.
- Echter Test auf dem Handy als marleendeveloper@gmail.com: ein großer Auftrag in Schritten, eine Vorlage starten und, falls es ein kostenloses Bildmodell gibt, ein Auftrag mit Bild. Danach Screenshots.

## Technical details

- `agent.ts`: retry wrapper around `streamChat` for network or stream-abort errors only, not for 4xx responses or the zero-cost guard. Optional plan phase (JSON step list), then per-step loop that reuses revision pinning and repair.
- `ai.ts` and the `/api/public/ai` schema: messages may carry OpenAI-style content parts (`text` and `image_url` data URLs), validated server-side for MIME type, size and count. `provider.server.ts` checks the model's `architecture.input_modalities` contains `image`, in addition to the existing zero-cost check.
- New `templates.ts` (static file sets) plus a `createFromTemplate` store action. The welcome screen goes in `Chat.tsx`.
- Animations use tw-animate-css classes plus keyframes in `styles.css`, behind `prefers-reduced-motion`. Only semantic tokens.
