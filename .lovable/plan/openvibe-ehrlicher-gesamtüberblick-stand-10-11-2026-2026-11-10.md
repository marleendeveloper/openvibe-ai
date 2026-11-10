# OpenVibe – Ehrlicher Gesamtüberblick (Stand 10.11.2026)

Legende: **Getestet** = in einem echten Ablauf geprüft · **Teilweise** = nur ein Teil oder nur simuliert geprüft · **Ungetestet** = gebaut, aber nicht durchgespielt

## 1. Zugang und Sicherheit

| Funktion | Stand | Wie gut |
|---|---|---|
| Nur 2 Konten erlaubt (Marleen, Justin), Registrierung aus | Getestet | Gäste sehen nur die Anmeldeseite, die KI weist sie ab (Fehler 403) |
| Passkey-Anmeldung | Teilweise | Nur mit einem simulierten Fingerabdruck geprüft. Ein echter Passkey auf eurem Handy ist noch nicht eingerichtet |
| Notfall-Link per E-Mail | Teilweise | Konto für Justin angelegt, Regel geprüft. Eine echte E-Mail wurde nie verschickt und angeklickt |
| Gespeicherte Schlüssel verschlüsselt, nicht im Browser lesbar | Getestet (Code und automatische Prüfungen) | Stabil |
| OpenRouter-Schlüssel automatisch für Marleen | Getestet | Funktioniert ohne Klicks. Justin muss einmal „Gespeicherten Schlüssel verwenden“ tippen |

Offen: Der Schlüssel, der im Chat gepostet wurde, sollte bei OpenRouter ersetzt werden.

## 2. KI-Programmierung (Kern)

| Funktion | Stand | Wie gut |
|---|---|---|
| Aufträge an Nemotron (kostenlos) | Getestet, mehrfach | Zähler, Todo-Liste, Notizen, Wetter-Karte und RaveSafe-Seite funktionierten |
| 0€-Schutz (nur Modelle, die wirklich kostenlos sind) | Getestet | Es wird nie auf ein bezahltes Modell ausgewichen |
| Mehrere Dateien, Löschen, Ersetzen | Getestet | Gut |
| Automatische Reparatur bei Fehlern in der Vorschau | Getestet (1 Fall) | Hat funktioniert |
| Rückgängig | Getestet | Gut |
| Große Aufträge in Schritten | Teilweise | Der Plan und die Schritte 1–2 liefen. Schritt 3 brach ab |
| Automatischer neuer Versuch bei Verbindungsabbruch | Nicht bestätigt | Die Prüfungen sind grün, aber im echten Test war kein „Neuer Versuch“ zu sehen |
| Bilder hochladen (an ein kostenloses Bildmodell) | Teilweise | Der Auftrag lief ohne Fehler, die Vorschau danach wurde nicht geöffnet |

**Ehrliche Einschätzung:** Kleine und mittlere Aufträge laufen zuverlässig. Die größte Schwäche: Nemotron bricht bei langen Aufträgen öfter ab. Die RaveSafe-Seite klappte erst beim 3. Versuch.

## 3. Projekte und Veröffentlichen

| Funktion | Stand |
|---|---|
| Projekte im Konto speichern, laden, löschen | Getestet |
| Chat-Verlauf pro Projekt | Getestet |
| Apps veröffentlichen unter /p/name, Veröffentlichung zurücknehmen | Getestet |
| Projekt-Übersicht (Statistiken, Filter, Verlauf) | Getestet. Die Markierung „Live“ wurde nicht mit einer veröffentlichten App geprüft |
| 5 Startvorlagen | Teilweise: nur die Landingpage geöffnet |

## 4. Code-Prüfung (KI-Review)

Findet Fehler und Sicherheitsrisiken, nach Wichtigkeit geordnet. **Getestet:** Ein echter Durchlauf fand einen ernsten Fehler. Vorschläge werden nie automatisch übernommen.

## 5. Anbindung für Assistenten (ChatGPT/Claude)

Assistenten können nur lesen: Projekte, Dateien und veröffentlichte Apps. **Ungetestet** ist eine echte Verbindung mit einem Assistenten. Geprüft ist nur, dass Zugriffe ohne Anmeldung abgewiesen werden.

## 6. Design

- Dunkles Lila wie bei ravesafe.app, Schrift Archivo, Knöpfe mit Farbverlauf, abgerundete Formen.
- Handy: Tabs unten mit lila Markierung. Desktop: 3 Spalten.
- Chat: Sprechblasen, Fortschrittsleiste, Chips für geänderte Dateien, schimmernde Platzhalter beim Laden, sanftes Einblenden.
- **Geprüft:** vor allem die Handy-Ansicht. **Kaum geprüft:** Desktop nach dem neuen Design, alle Dialoge und die Ansicht bei reduzierter Bewegung.

## 7. Qualität insgesamt

- 75 automatische Prüfungen bestehen, das Projekt läuft fehlerfrei.
- Gemeldet war einmal eine weiße Seite. In einem frischen Browser lud die Seite bei mir, die Ursache ist nicht sicher geklärt.
- Die veröffentlichte App läuft eventuell noch auf einem alten Stand, bis erneut veröffentlicht wird.

## Vorschlag für die nächsten Schritte (nach Freigabe)

1. Echten Passkey einrichten (macht ihr selbst) und den Notfall-Link einmal echt testen.
2. Neue Versuche bei großen Aufträgen genauer prüfen und abgebrochene Schritte gezielt fortsetzen.
3. Desktop-Ansicht und Dialoge mit Screenshots prüfen.
4. Restliche Vorlagen und den Bild-Auftrag samt Vorschau testen.
5. Erneut veröffentlichen.
