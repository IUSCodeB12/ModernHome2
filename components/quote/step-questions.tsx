"use client";

import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateEstimate,
  formatAud,
  parseOptions,
  type Answers,
} from "@/lib/quote/estimate";
import type { ServiceWithQuestions } from "@/lib/quote/types";
import { cn } from "@/lib/utils";

function buildSchema(service: ServiceWithQuestions) {
  const shape: Record<string, z.ZodType> = {};
  for (const question of service.service_questions) {
    switch (question.input_type) {
      case "single_select":
        shape[question.id] = z.string().min(1, "Please choose an option");
        break;
      case "multi_select":
        shape[question.id] = z.array(z.string()).default([]);
        break;
      case "number":
        shape[question.id] = z.coerce
          .number({ error: "Enter a number" })
          .positive("Enter a value greater than 0")
          .max(1000, "That looks too large");
        break;
      case "boolean":
        shape[question.id] = z.boolean().default(false);
        break;
    }
  }
  return z.object(shape);
}

type FormValues = Record<string, string | string[] | number | boolean>;

export function StepQuestions({
  service,
  initialAnswers,
  onBack,
  onNext,
}: {
  service: ServiceWithQuestions;
  initialAnswers: Answers;
  onBack: () => void;
  onNext: (answers: Answers) => void;
}) {
  const schema = useMemo(() => buildSchema(service), [service]);

  const defaultValues = useMemo(() => {
    const values: FormValues = {};
    for (const q of service.service_questions) {
      const existing = initialAnswers[q.id];
      if (existing !== undefined && existing !== null) {
        values[q.id] = existing as FormValues[string];
      } else if (q.input_type === "multi_select") {
        values[q.id] = [];
      } else if (q.input_type === "boolean") {
        values[q.id] = false;
      } else {
        values[q.id] = "";
      }
    }
    return values;
  }, [service, initialAnswers]);

  const form = useForm<FormValues>({
    // zod v4 + coerce makes the resolver's input/output types diverge;
    // values are validated at runtime by the schema itself.
    resolver: zodResolver(schema as never),
    defaultValues,
    mode: "onTouched",
  });

  const watched = useWatch({ control: form.control });
  const estimate = useMemo(
    () =>
      calculateEstimate(service, service.service_questions, watched as Answers),
    [service, watched]
  );

  return (
    <form
      onSubmit={form.handleSubmit((values) => onNext(values as Answers))}
      className="space-y-6"
    >
      <h2 className="text-lg font-semibold">{service.name} — job details</h2>

      {service.service_questions.map((question) => {
        const options = parseOptions(question.options);
        const error = form.formState.errors[question.id]?.message as
          | string
          | undefined;

        return (
          <div key={question.id} className="space-y-2">
            <Label className="text-base">{question.question_text}</Label>

            {question.input_type === "single_select" && (
              <Controller
                control={form.control}
                name={question.id}
                render={({ field }) => (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={cn(
                          "flex min-h-11 items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                          field.value === option.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "hover:border-foreground/30"
                        )}
                      >
                        <span>{option.label}</span>
                        {option.price_modifier_cents ? (
                          <span
                            className={cn(
                              "text-xs",
                              field.value === option.value
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            )}
                          >
                            {option.price_modifier_cents > 0 ? "+" : "−"}
                            {formatAud(Math.abs(option.price_modifier_cents))}
                          </span>
                        ) : option.price_modifier_pct ? (
                          <span className="text-xs text-muted-foreground">
                            +{option.price_modifier_pct}%
                          </span>
                        ) : null}
                      </button>
                    ))}
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
                        const isOn = selected.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              field.onChange(
                                isOn
                                  ? selected.filter((v) => v !== option.value)
                                  : [...selected, option.value]
                              )
                            }
                            className={cn(
                              "min-h-11 rounded-full border px-4 text-sm transition-colors",
                              isOn
                                ? "border-primary bg-primary text-primary-foreground"
                                : "hover:border-foreground/30"
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  );
                }}
              />
            )}

            {question.input_type === "number" && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  className="max-w-32"
                  {...form.register(question.id)}
                />
                {service.price_unit === "per_metre" && (
                  <span className="text-sm text-muted-foreground">metres</span>
                )}
              </div>
            )}

            {question.input_type === "boolean" && (
              <Controller
                control={form.control}
                name={question.id}
                render={({ field }) => (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value === true}
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors sm:w-auto sm:min-w-64 sm:gap-6",
                      field.value === true
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-foreground/30"
                    )}
                  >
                    <span>{options[0]?.label ?? "Yes"}</span>
                    <span
                      className={cn(
                        "text-xs",
                        field.value === true
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {options[0]?.price_modifier_cents
                        ? `+${formatAud(options[0].price_modifier_cents)}`
                        : field.value === true
                          ? "Added"
                          : "Tap to add"}
                    </span>
                  </button>
                )}
              />
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );
      })}

      {/* Live estimate */}
      <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-lg sm:border sm:bg-muted/40">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Estimated price</span>
          <span className="text-lg font-semibold">
            {formatAud(estimate.low_cents)} – {formatAud(estimate.high_cents)}
          </span>
        </div>
        <div className="mt-3 flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button type="submit" className="flex-1">
            Continue
          </Button>
        </div>
      </div>
    </form>
  );
}
