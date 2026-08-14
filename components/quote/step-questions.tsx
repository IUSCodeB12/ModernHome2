"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isCustomService } from "@/lib/services/custom";
import { AnimatedPrice } from "@/components/quote/animated-price";
import { getPhotos } from "@/components/quote/photo-store";
import {
  QuestionField,
  type FormValues,
} from "@/components/quote/question-field";
import { calculateEstimate, type Answers } from "@/lib/quote/estimate";
import type { ServiceWithQuestions } from "@/lib/quote/types";

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
      case "text":
        // Deliberately short: "Mount 2 shelves" is a complete answer, and the
        // old 20-character floor blocked the catch-all service on real briefs.
        shape[question.id] = z
          .string()
          .min(10, "A few more words, so we can price it properly")
          .max(2000, "That's a bit long — keep it under 2000 characters");
        break;
    }
  }
  return z.object(shape);
}

export function StepQuestions({
  service,
  initialAnswers,
  onAnswersChange,
  onBack,
  onNext,
}: {
  service: ServiceWithQuestions;
  initialAnswers: Answers;
  /** Streams in-progress answers up so the rail's price can track live. */
  onAnswersChange: (answers: Answers) => void;
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

  const custom = isCustomService(service);
  const watched = useWatch({ control: form.control });
  const estimate = useMemo(
    () =>
      calculateEstimate(service, service.service_questions, watched as Answers),
    [service, watched]
  );

  // useWatch hands back a fresh object every change, so key the effect on the
  // serialised values rather than the reference.
  const watchedKey = JSON.stringify(watched);
  useEffect(() => {
    onAnswersChange(watched as Answers);
    // watchedKey is the value-identity of `watched`; depending on the object
    // itself would re-fire on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedKey]);

  // Photo prompts are inline now, so "missing photos" is a nudge on Continue
  // rather than a wall — one tap to proceed, no checkbox to hunt for.
  // The photo store is module state, so a bump of this counter is how a change
  // in it re-enters React and re-derives `missingPhotos` below.
  const [, setPhotoVersion] = useState(0);
  const [nudged, setNudged] = useState(false);
  const missingPhotos = service.service_questions.filter(
    (q) => q.requires_photo && getPhotos(q.id).length === 0
  );

  function submit(values: FormValues) {
    if (missingPhotos.length > 0 && !nudged) {
      setNudged(true);
      return;
    }
    onNext(values as Answers);
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">
          Tell us about the job
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {service.name} — {service.service_questions.length}{" "}
          {service.service_questions.length === 1 ? "question" : "questions"},
          and your price updates as you go.
        </p>
      </div>

      {service.service_questions.map((question, i) => (
        <QuestionField
          key={question.id}
          question={question}
          index={i}
          form={form}
          onPhotoChange={() => {
            setPhotoVersion((v) => v + 1);
            setNudged(false);
          }}
        />
      ))}

      {nudged && missingPhotos.length > 0 && (
        <div className="animate-enter-up rounded-xl border border-brand/40 bg-brand/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Camera className="size-4 text-brand" />
            A photo would lock this price in
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Without one we&apos;ll confirm the final figure after we&apos;ve seen
            the space. Happy either way — your spot is still held.
          </p>
        </div>
      )}

      {/* Sticky action bar — carries the running price on mobile, where the
          rail at the top of the page has scrolled away. */}
      <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:bg-muted/40 sm:px-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            {custom ? "Your price" : "Estimated price"}
          </span>
          {custom ? (
            <span className="text-right text-sm font-medium">
              We&apos;ll review and send a fixed price
            </span>
          ) : (
            <span className="text-lg font-semibold">
              <AnimatedPrice cents={estimate.low_cents} /> –{" "}
              <AnimatedPrice cents={estimate.high_cents} />
            </span>
          )}
        </div>
        <div className="mt-3 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            Back
          </Button>
          <Button type="submit" className="flex-1">
            {nudged && missingPhotos.length > 0 ? "Continue anyway" : "Continue"}
            <ArrowRight />
          </Button>
        </div>
      </div>
    </form>
  );
}
