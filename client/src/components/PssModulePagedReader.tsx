import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { FormativeQuestion, ModuleStep } from "@/lib/pss-module-formative";
import { ArrowRight, BookOpen, ClipboardCheck, ChevronLeft } from "lucide-react";

const prose = cn(
  "prose prose-neutral max-w-none dark:prose-invert",
  "prose-headings:font-semibold prose-headings:text-foreground prose-headings:scroll-mt-24",
  "prose-p:text-foreground/90 prose-p:leading-relaxed",
  "prose-li:marker:text-primary prose-strong:text-foreground",
  "prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
);

function FormativeBlock({
  title,
  focus,
  questions,
  onContinue,
}: {
  title: string;
  focus: string;
  questions: FormativeQuestion[];
  onContinue: () => void;
}) {
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setAnswers(questions.map(() => -1));
    setSubmitted(false);
  }, [questions]);

  const allAnswered = answers.every((a) => a >= 0);
  const canSubmit = allAnswered && !submitted;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{title}</p>
        <p className="text-sm text-foreground mt-1 font-medium">{focus}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Short check — not graded. Use your facility protocol at the bedside.
        </p>
      </div>
      <div className="space-y-6">
        {questions.map((q, qi) => (
          <div key={qi} className="space-y-3">
            <p className="text-sm font-medium text-foreground leading-snug">
              <span className="text-primary tabular-nums">{qi + 1}.</span> {q.prompt}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = answers[qi] === oi;
                const wrong = submitted && selected && oi !== q.correctIndex;
                const right = submitted && oi === q.correctIndex;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={submitted}
                    onClick={() => {
                      if (submitted) return;
                      setAnswers((prev) => {
                        const next = [...prev];
                        next[qi] = oi;
                        return next;
                      });
                    }}
                    className={cn(
                      "w-full text-left rounded-xl border-2 px-4 py-3 text-sm transition-all",
                      selected && !submitted && "border-primary bg-primary/5",
                      !selected && !submitted && "border-border bg-card hover:border-primary/35",
                      right && "border-emerald-600/60 bg-emerald-500/10",
                      wrong && "border-destructive/50 bg-destructive/5"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {submitted ? (
              <p className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3 py-1">{q.rationale}</p>
            ) : null}
          </div>
        ))}
      </div>
      {!submitted ? (
        <Button
          type="button"
          variant="cta"
          className="w-full rounded-xl"
          disabled={!canSubmit}
          onClick={() => setSubmitted(true)}
        >
          Check answers
        </Button>
      ) : (
        <Button type="button" variant="cta" className="w-full rounded-xl" onClick={onContinue}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function PssModulePagedReader({
  steps,
  moduleTitle,
  onCompleteFlow,
}: {
  steps: ModuleStep[];
  moduleTitle: string;
  onCompleteFlow: () => void;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [steps]);

  const step = steps[idx];
  const progressPct = steps.length > 0 ? Math.round(((idx + 1) / steps.length) * 100) : 0;

  const goBack = () => {
    if (idx > 0) setIdx((i) => i - 1);
  };

  const goNext = () => {
    if (idx < steps.length - 1) setIdx((i) => i + 1);
    else onCompleteFlow();
  };

  if (steps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground mb-6">
        No content loaded. Try refreshing the page.
      </p>
    );
  }

  if (!step) {
    return null;
  }

  return (
    <div className="space-y-5 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4 text-primary shrink-0" />
          <span>
            Step {idx + 1} of {steps.length} · {moduleTitle}
          </span>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{progressPct}%</span>
      </div>
      <Progress value={progressPct} className="h-1.5 bg-muted" />

      <Card className="overflow-hidden rounded-2xl border-border/90 bg-gradient-to-br from-card to-brand-surface/20 shadow-sm">
        <div className="p-5 md:p-8">
          {step.kind === "read" ? (
            <>
              <p className="text-xs font-medium text-muted-foreground mb-4">
                Section {step.index + 1} of {step.total}
              </p>
              <div className={prose} dangerouslySetInnerHTML={{ __html: step.html }} />
              <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl sm:flex-1"
                  disabled={idx === 0}
                  onClick={goBack}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button type="button" variant="cta" className="rounded-xl sm:flex-1" onClick={goNext}>
                  {idx >= steps.length - 1 ? "Finish & unlock quiz" : "Next"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-primary mb-4">
                <ClipboardCheck className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">Formative check</span>
              </div>
              <FormativeBlock
                title={step.title}
                focus={step.focus}
                questions={step.questions}
                onContinue={goNext}
              />
              <Button type="button" variant="ghost" className="mt-4 w-full text-muted-foreground" onClick={goBack}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to reading
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
