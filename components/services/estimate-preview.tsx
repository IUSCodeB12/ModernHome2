"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calculateEstimate,
  formatAud,
  parseOptions,
  type Answers,
} from "@/lib/quote/estimate";
import type { ServiceWithQuestions } from "@/lib/quote/types";
import { cn } from "@/lib/utils";

/**
 * Inline mini-estimator on a service page: answer the one or two questions
 * that move the price most and see a live range, then jump into the wizard
 * with the service pre-selected.
 */
export function EstimatePreview({ service }: { service: ServiceWithQuestions }) {
  // The most price-relevant questions: first select + first number input.
  const keyQuestions = useMemo(() => {
    const firstSelect = service.service_questions.find(
      (q) => q.input_type === "single_select"
    );
    const firstNumber = service.service_questions.find(
      (q) => q.input_type === "number"
    );
    return [firstNumber, firstSelect].filter(Boolean) as typeof service.service_questions;
  }, [service]);

  const [answers, setAnswers] = useState<Answers>({});
  const estimate = useMemo(
    () => calculateEstimate(service, keyQuestions, answers),
    [service, keyQuestions, answers]
  );

  if (keyQuestions.length === 0) return null;

  return (
    <section className="rounded-2xl border bg-muted/30 p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Ballpark it in 10 seconds</h2>
      <div className="mt-4 space-y-4">
        {keyQuestions.map((q) => {
          const options = parseOptions(q.options);
          return (
            <div key={q.id}>
              <p className="mb-2 text-sm font-medium">{q.question_text}</p>
              {q.input_type === "number" ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    inputMode="decimal"
                    placeholder="e.g. 4"
                    className="max-w-28 bg-background"
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [q.id]: Number(e.target.value) }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">metres</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setAnswers((a) => ({ ...a, [q.id]: option.value }))
                      }
                      className={cn(
                        "min-h-10 rounded-full border px-4 text-sm transition-colors",
                        answers[q.id] === option.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background hover:border-foreground/30"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div>
          <p className="text-xs text-muted-foreground">Estimated range</p>
          <p className="font-display text-2xl">
            {formatAud(estimate.low_cents)} – {formatAud(estimate.high_cents)}
          </p>
        </div>
        <Button asChild>
          <Link href={`/quote?service=${service.slug}`}>
            Get the exact quote <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
