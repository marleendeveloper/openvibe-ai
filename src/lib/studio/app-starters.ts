export const APP_TYPES = [
  {
    id: "shop",
    label: "Shop",
    subtitle: "Produkte & Warenkorb",
    name: "Rave Merch",
    topic: "Festival-Merch mit T-Shirts, Caps, Taschen und Stickern",
    features:
      "4 visuell dargestellte Produkte mit Preisen in Euro, Kategorienfilter, Warenkorb mit Mengenänderung und Gesamtsumme, Bestellübersicht ohne echte Zahlung",
  },
  {
    id: "website",
    label: "Website",
    subtitle: "Marke & Angebote",
    name: "RaveSafe",
    topic: "Sicher feiern: Safer Use, Notfall-Hilfe und Community",
    features:
      "markante Startansicht, Angebote, passende Inhalte, Navigation zu den Abschnitten und ein funktionierender Kontakt-Dialog ohne vorgetäuschten Versand",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    subtitle: "Zahlen & Übersicht",
    name: "Pulse Analytics",
    topic: "Besucher, Umsatz und Anmeldungen eines kleinen Unternehmens",
    features:
      "Kennzahlen, Diagramm, umschaltbarer Zeitraum mit konsistenten Beispieldaten, durchsuchbare Tabelle und sichtbare Leerzustände",
  },
  {
    id: "tasks",
    label: "Aufgaben",
    subtitle: "Planen & Abhaken",
    name: "Meine Aufgaben",
    topic: "Persönliche Aufgabenplanung",
    features:
      "Aufgaben hinzufügen, abhaken, löschen, nach Status filtern, Zähler, Eingabeprüfung und lokale Speicherung",
  },
  {
    id: "weather",
    label: "Wetter",
    subtitle: "Ort & Vorhersage",
    name: "Berlin Wetter",
    topic: "Wetter in Berlin mit 21 °C",
    features:
      "große Wetteransicht, Celsius/Fahrenheit-Umschaltung, mehrtägige Beispieldaten und auswählbare Beispielorte; Daten ehrlich als Beispieldaten kennzeichnen",
  },
] as const;

export type AppKind = (typeof APP_TYPES)[number]["id"];
export const APP_STYLES = [
  {
    id: "dark",
    label: "Dunkel",
    description: "Kontrastreich & markant",
    instruction: "dunkle Oberflächen, markante Akzentfarbe passend zur Branche",
  },
  {
    id: "light",
    label: "Hell",
    description: "Klar & aufgeräumt",
    instruction: "helle Oberflächen, klare Typografie, kräftige Akzentfarbe passend zur Branche",
  },
  {
    id: "colorful",
    label: "Farbenfroh",
    description: "Lebendig & mutig",
    instruction: "lebendige, abgestimmte Farben mit gut lesbaren Kontrasten",
  },
] as const;
export type AppStyle = (typeof APP_STYLES)[number]["id"];
export type AppDraft = { kind: AppKind; name: string; topic: string; style: AppStyle };

export function starterDraft(kind: AppKind): AppDraft {
  const type = APP_TYPES.find((t) => t.id === kind);
  if (!type) throw new Error("Bitte einen App-Typ auswählen.");
  return { kind, name: type.name, topic: type.topic, style: "dark" };
}

export function appPrompt(draft: AppDraft): string {
  const type = APP_TYPES.find((t) => t.id === draft.kind);
  const style = APP_STYLES.find((s) => s.id === draft.style);
  if (!type || !style || !draft.name.trim() || !draft.topic.trim())
    throw new Error("Bitte Name, Thema und Stil auswählen.");
  return `App-Start: Erstelle eine vollständige, sofort bedienbare ${type.label} namens ${JSON.stringify(draft.name.trim())}. Thema: ${JSON.stringify(draft.topic.trim())}.
Gestaltung: ${style.instruction}. Die Inhalte und Funktionen müssen zum Thema passen, nicht nur den Namen einer generischen Demo austauschen.
Umfang: ${type.features}.
Liefere die gesamte kleine App in einem Durchgang: vollständige Dateien, passende deutsche Inhalte und Visuals, fertiges CSS für Handy und Desktop. Halte den Code kompakt, nutze wiederverwendbare Komponenten und kurze selbst enthaltene Produktillustrationen statt sehr langer Bilddaten. Alle sichtbaren Bedienelemente müssen funktionieren. Keine Lorem-Ipsum-Texte oder TODO-Platzhalter. Keine echte Zahlung, kein Versand und keine Live-Daten ohne angebundenen Dienst; kennzeichne Beispieldaten und lokale Aktionen ehrlich.`;
}

/** Applies to all coding requests, including short free-form ideas and existing saved prompts. */
export const PRODUCT_RULES = `OUT-OF-THE-BOX: Build a finished, immediately usable product, not a skeleton. For short requests infer sensible, domain-specific content and essential interactions; do not ask the user to write a technical specification. A shop must look like a shop (prominent product visuals, prices, working cart and totals), a dashboard like a dashboard, and a website like the named business. Use distinctive domain-appropriate styling, meaningful visual assets or self-contained product illustrations rather than emoji-only product placeholders, responsive layouts and clear typography. Every visible control must work, with input validation, empty states and accessible labels. Use realistic German content unless another language is requested. No lorem ipsum, TODOs or fake success messages. Persist local user-created data where appropriate. Never claim live data, real payment, account creation or message delivery without a connected service; visibly identify sample data and local-only actions. Stay within the user's scope; do not add unrelated features. Output complete runnable files and CSS.`;
