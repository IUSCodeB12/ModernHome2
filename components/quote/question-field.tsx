"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Check, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhotoCapture } from "@/components/quote/photo-capture";
import { formatAud, parseOptions, type QuestionOption } from "@/lib/quote/estimate";
import type { ServiceWithQuestions } from "@/lib/quote/types";
import { cn } from "@/lib/utils";

export type QuoteQuestion = ServiceWithQuestions["service_questions"][number];
export type FormValues = Record<string, string | string[] | number | boolean>;

/** Common quantities, so the usual answer is a tap rather than typing. */
const QUICK_QUANTITIES = [1, 2, 3, 5];

function priceDelta(option: QuestionOption): string | null {
  if (option.price_modifier_cents) {
    const sign = option.price_modifier_cents > 0 ? "+" : "−";
    return `${sign}${formatAud(Math.abs(option.price_modifier_cents))}`;
  }
  if (option.price_modifier_pct) return `+${option.price_modifier_pct}%`;
  return null;
}

/** Brass chip carrying an option's price effect. */
function DeltaChip({ text, on }: { text: string; on: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-medium tabular-nums transition-colors",
        on
          ? "bg-brand-foreground/10 text-brand-foreground"
          : "bg-muted text-muted-foreground"
      )}
    >
      {text}
    </span>
  );
}

/**
 * One question: prompt, control, its own photo prompt, and any error. Every
 * control is a large tap target showing the price consequence on the option
 * itself, so a choice's cost is visible before it's made, not after.
 */
export function QuestionField({
  question,
  index,
  form,
  onPhotoChange,
}: {
  question: QuoteQuestion;
  index: number;
  form: UseFormReturn<FormValues>;
  onPhotoChange: () => void;
}) {
  const options = parseOptions(question.options);
  const error = form.formState.errors[question.id]?.message as string | undefined;
  const errorId = `${question.id}-error`;

  return (
    <fieldset className="rounded-2xl border border-border bg-card p-4 shadow-elev-1 sm:p-5">
      <legend className="sr-only">{question.question_text}</legend>

      <div className="flex items-baseline gap-2.5">
        <span className="text-[0.7rem] font-medium tabular-nums text-brand">
          {String(index + 1).padStart(2, "0")}
        </span>
        <p className="font-serif text-lg leading-snug tracking-tight">
          {question.question_text}
        </p>
      </div>

      <div className="mt-3.5">
        {question.input_type === "single_select" && (
          <Controller
            control={form.control}
            name={question.id}
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                {options.map((option) => {
                  const on = field.value === option.value;
                  const delta = priceDelta(option);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        "flex min-h-12 items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm",
                        "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]",
                        on
                          ? "border-brand bg-brand text-brand-foreground shadow-elev-1"
                          : "border-border hover:border-brand/40 hover:bg-accent/40"
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                            on
                              ? "border-brand-foreground/50 bg-brand-foreground/15"
                              : "border-border"
                          )}
                        >
                          {on && <Check className="size-2.5" />}
                        </span>
                        <span className="truncate font-medium">{option.label}</span>
                      </span>
                      {delta && <DeltaChip text={delta} on={on} />}
                    </button>
                  );
                })}
              </div>
            )}
          />
        )}

        {question.input_type === "multi_select" && (
          <Controller
            control={form.control}
            name={question.id}
            render={({ field }) => {
              const selected = (field.value as string[]) ?? [];
              return (
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => {
                    const on = selected.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        onClick={() =>
                          field.onChange(
                            on
                              ? selected.filter((v) => v !== option.value)
                              : [...selected, option.value]
                          )
                        }
                        className={cn(
                          "flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium",
                          "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97]",
                          on
                            ? "border-brand bg-brand text-brand-foreground"
                            : "border-border hover:border-brand/40 hover:bg-accent/40"
                        )}
                      >
                        {on && <Check className="size-3.5" aria-hidden />}
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              );
            }}
          />
        )}

        {question.input_type === "boolean" && (
          <Controller
            control={form.control}
            name={question.id}
            render={({ field }) => {
              const on = field.value === true;
              const cents = options[0]?.price_modifier_cents;
              return (
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => field.onChange(!on)}
                  className={cn(
                    "flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm",
                    "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]",
                    on
                      ? "border-brand bg-brand text-brand-foreground shadow-elev-1"
                      : "border-border hover:border-brand/40 hover:bg-accent/40"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                        on
                          ? "border-brand-foreground/50 bg-brand-foreground/15"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {on ? <Check className="size-3" /> : <Plus className="size-3" />}
                    </span>
                    <span className="truncate font-medium">
                      {options[0]?.label ?? "Yes"}
                    </span>
                  </span>
                  {cents ? (
                    <DeltaChip text={`+${formatAud(cents)}`} on={on} />
                  ) : (
                    <span
                      className={cn(
                        "shrink-0 text-xs",
                        on ? "text-brand-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {on ? "Added" : "Tap to add"}
                    </span>
                  )}
                </button>
              );
            }}
          />
        )}

        {question.input_type === "number" && (
          <Controller
            control={form.control}
            name={question.id}
            render={({ field }) => (
              <div className="space-y-2.5">
                <div className="flex items-baseline gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    inputMode="decimal"
                    aria-invalid={!!error}
                    aria-describedby={error ? errorId : undefined}
                    className="h-12 max-w-28 text-lg font-semibold tabular-nums"
                    value={String(field.value ?? "")}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                  />
                  <span className="text-sm text-muted-foreground">metres</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_QUANTITIES.map((n) => {
                    const on = Number(field.value) === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => field.onChange(String(n))}
                        className={cn(
                          "min-h-9 rounded-full border px-3.5 text-sm font-medium tabular-nums",
                          "transition-colors active:scale-[0.97]",
                          on
                            ? "border-brand bg-brand text-brand-foreground"
                            : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground"
                        )}
                      >
                        {n}m
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          />
        )}

        {question.input_type === "text" && (
          <Textarea
            rows={5}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            placeholder="Tell us what you'd like done, where it is in the house, and anything we should know about access or finish."
            className="resize-y"
            {...form.register(question.id)}
          />
        )}
      </div>

      {question.requires_photo && (
        <PhotoCapture
          questionId={question.id}
          guideText={question.photo_guide_text}
          onChange={onPhotoChange}
        />
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-2.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
