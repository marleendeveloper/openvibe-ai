import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { answerCreationQuestions } from "@/lib/studio/agent";
import type { CreationClarification } from "@/lib/studio/creation";
import { Btn } from "./ui";

export function CreationQuestions({
  pending,
  onCancel,
}: {
  pending: CreationClarification;
  onCancel: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const complete = pending.questions.every((q) => !!answers[q.id]?.trim());
  return (
    <form
      className="space-y-4 border-y border-primary/30 py-4"
      aria-label="Rückfragen vor der Erstellung"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        void answerCreationQuestions(answers).catch((e: unknown) =>
          setError(e instanceof Error ? e.message : "Bitte erneut versuchen."),
        );
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Bevor ich starte</h2>
        <Btn
          type="button"
          title="Auftrag bearbeiten"
          aria-label="Auftrag bearbeiten"
          onClick={onCancel}
        >
          <X size={16} />
        </Btn>
      </div>
      <p className="break-words text-sm text-muted-foreground">{pending.prompt}</p>
      {pending.questions.map((q) => (
        <fieldset key={q.id} className="min-w-0 space-y-2">
          <legend className="mb-2 text-sm font-medium">{q.label}</legend>
          {q.options.length ? (
            q.options.map((option) => (
              <label
                key={option}
                className="flex items-start gap-2 rounded-md border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
              >
                <input
                  type="radio"
                  name={q.id}
                  value={option}
                  checked={answers[q.id] === option}
                  onChange={() => setAnswers((s) => ({ ...s, [q.id]: option }))}
                  className="mt-1 shrink-0 accent-primary"
                  required
                />
                <span>{option}</span>
              </label>
            ))
          ) : (
            <textarea
              aria-label={q.label}
              value={answers[q.id] ?? ""}
              maxLength={1000}
              required
              rows={3}
              placeholder="Zum Beispiel: eine Website für mein Fotostudio mit Galerie und Kontakt."
              onChange={(e) => setAnswers((s) => ({ ...s, [q.id]: e.target.value }))}
              className="w-full min-w-0 resize-y rounded-md border bg-background p-3 text-sm outline-none focus:border-ring"
            />
          )}
        </fieldset>
      ))}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Btn
        type="submit"
        variant="primary"
        disabled={!complete}
        className="h-auto min-h-10 w-full whitespace-normal"
      >
        Mit diesen Angaben erstellen <ArrowRight size={16} className="shrink-0" />
      </Btn>
    </form>
  );
}
