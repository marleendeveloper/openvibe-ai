import type { ChatMsg } from "./ai";
import type { ProviderId } from "./providers";

export type CreationQuestion = { id: string; label: string; options: string[] };
export type CreationClarification = {
  projectId: string;
  revision: string;
  provider: ProviderId;
  model: string;
  prompt: string;
  images: string[];
  modelOverride?: string;
  questions: CreationQuestion[];
};

/** Local checks only: no provider request is sent until important choices are answered. */
export function creationQuestions(prompt: string): CreationQuestion[] {
  const questions: CreationQuestion[] = [];
  if (
    /^\s*(?:(?:bitte\s+)?(?:erstelle|baue|mach(?:e)?|create|build)\s+)?(?:(?:mir|eine?|an?|me)\s+)*(?:app|website|webseite|shop)(?:\s+bitte)?[.!?\s]*$/i.test(
      prompt,
    )
  ) {
    questions.push({
      id: "purpose",
      label: "Für wen und wofür soll das Ergebnis sein?",
      options: [],
    });
  }
  // Ignore explicitly excluded services, including the bounded starter's local-only disclaimer.
  const positive = prompt.replace(
    /(?:keine?|ohne|no|without)\s+(?:echte?\s+|reale?\s+|real\s+)?(?:zahlung(?:en)?|payment(?:s)?|login|anmeldung|registrierung|versand|live[- ]daten)[^.;\n]*/gi,
    "",
  );
  if (/\b(stripe|paypal|checkout|bezahlen|zahlung(?:en)?|payment(?:s)?)\b/i.test(positive)) {
    questions.push({
      id: "payments",
      label: "Soll zuerst ein Shop ohne echte Zahlungen entstehen?",
      options: [
        "Ja, Warenkorb und Bestellübersicht ohne Zahlung",
        "Zahlungsansicht vorbereiten; echte Zahlungen später anbinden",
      ],
    });
  }
  if (/\b(login|anmeldung|registrierung|sign[- ]?(?:in|up)|authentication)\b/i.test(positive)) {
    questions.push({
      id: "accounts",
      label: "Wie soll die erste Version mit Konten umgehen?",
      options: [
        "Zunächst ohne Anmeldung nutzbar",
        "Anmeldeansicht vorbereiten; echte Konten später anbinden",
      ],
    });
  }
  if (
    /(?:alles|gesamte?s?\s+projekt|all\s+files).{0,25}(?:löschen|ersetzen|delete|replace)|(?:lösche|ersetze|delete|replace).{0,25}(?:alles|gesamte?s?\s+projekt|all\s+files)/i.test(
      prompt,
    )
  ) {
    questions.push({
      id: "replacement",
      label: "Darf die bestehende Arbeit vollständig ersetzt werden?",
      options: [
        "Bestehende Arbeit behalten und nur ergänzen",
        "Ja, vollständig ersetzen; Wiederherstellungspunkt sichern",
      ],
    });
  }
  return questions;
}

export function clarifiedPrompt(
  pending: CreationClarification,
  answers: Record<string, string>,
): string {
  const decisions = pending.questions.map((q) => {
    const answer = answers[q.id]?.trim();
    if (!answer || answer.length > 1000)
      throw new Error("Bitte jede Rückfrage beantworten (maximal 1.000 Zeichen).");
    return `${q.label} ${answer}`;
  });
  return `${pending.prompt}\n\nBestätigte Entscheidungen:\n${decisions.join("\n")}`;
}

/** Ask for direct output, not a lengthy reasoning stream that consumes the code budget. */
export function completionBody(data: {
  provider: ProviderId;
  model: string;
  messages: ChatMsg[];
  stream: boolean;
  temperature: number;
  max_tokens: number;
}) {
  return {
    model: data.model,
    messages: data.messages,
    stream: data.stream,
    temperature: data.temperature,
    max_tokens: data.max_tokens,
    ...(data.provider === "openrouter" ? { reasoning: { enabled: false, exclude: true } } : {}),
  };
}

export const FAST_CREATION_RULES = `FAST DELIVERY: Produce a compact complete first version with all essential requested interactions. Do not spend output tokens on extensive planning, alternatives or repeated explanations. Start with a short PUBLIC work summary in German (at most two sentences describing what you are building and important assumptions), then immediately output complete runnable files. Never output private reasoning or <think> blocks. Plain CSS is available; Tailwind is NOT installed. Reuse existing entry files and dependencies; prefer native browser features over new packages. Important product choices have already been clarified when needed; do not silently add real payments, login, message delivery or live services. No truncation, missing styles, placeholders or nonfunctional controls. Keep code compact, not incomplete.`;
