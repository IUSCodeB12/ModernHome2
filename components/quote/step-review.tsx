"use client";

import { useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import {
  calculateDepositCents,
  calculateEstimate,
  formatAud,
  parseOptions,
  type Answers,
} from "@/lib/quote/estimate";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import type { ServiceWithQuestions } from "@/lib/quote/types";
import type { WizardState } from "@/lib/quote/wizard-state";
import { allPhotoEntries } from "@/components/quote/photo-store";

function answerLabel(
  question: ServiceWithQuestions["service_questions"][number],
  answers: Answers
): string | null {
  const value = answers[question.id];
  if (value === undefined || value === null || value === "") return null;
  const options = parseOptions(question.options);

  switch (question.input_type) {
    case "single_select":
      return options.find((o) => o.value === value)?.label ?? String(value);
    case "multi_select": {
      if (!Array.isArray(value) || value.length === 0) return null;
      return value
        .map((v) => options.find((o) => o.value === v)?.label ?? v)
        .join(", ");
    }
    case "number":
      return `${value}`;
    case "boolean":
      return value === true ? (options[0]?.label ?? "Yes") : "No";
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export function StepReview({
  service,
  state,
  submitting,
  submitError,
  onBack,
  onSubmit,
}: {
  service: ServiceWithQuestions;
  state: WizardState;
  submitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const estimate = useMemo(
    () => calculateEstimate(service, service.service_questions, state.answers),
    [service, state.answers]
  );
  const depositCents = calculateDepositCents(estimate);
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState<string | null>(null);

  const photoCount = allPhotoEntries().reduce((n, [, p]) => n + p.length, 0);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Review &amp; hold your spot</h2>

      <section className="rounded-xl border p-4">
        <h3 className="font-medium">{service.name}</h3>
        <div className="mt-2 divide-y">
          {service.service_questions.map((q) => {
            const label = answerLabel(q, state.answers);
            if (!label) return null;
            return <Row key={q.id} label={q.question_text} value={label} />;
          })}
          {photoCount > 0 && (
            <Row label="Photos attached" value={`${photoCount}`} />
          )}
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h3 className="font-medium">Where &amp; when</h3>
        <div className="mt-2 divide-y">
          <Row
            label="Address"
            value={`${state.contact.addressLine1}, ${state.contact.suburb} ${state.contact.postcode}`}
          />
          {state.slot && (
            <Row
              label="Arrival window"
              value={`${formatInTimeZone(new Date(state.slot.start), BUSINESS_TIME_ZONE, "EEE d MMM")}, ${state.slot.label}`}
            />
          )}
          <Row label="Contact" value={`${state.contact.fullName} · ${state.contact.phone}`} />
        </div>
      </section>

      <section className="rounded-xl border bg-muted/40 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Estimated price</span>
          <span className="text-xl font-semibold">
            {formatAud(estimate.low_cents)} – {formatAud(estimate.high_cents)}
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">
            Deposit to hold your spot
          </span>
          <span className="font-semibold">{formatAud(depositCents)}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          The final price is confirmed after we review your details and photos.
          Your deposit comes off the total and is fully refundable if we can&apos;t
          do the job.
        </p>
      </section>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked);
            setAgreeError(null);
          }}
          className="mt-0.5 size-4"
        />
        <span>
          I understand this is an estimate and the final quote may be adjusted
          after review.
        </span>
      </label>
      {agreeError && <p className="text-sm text-destructive">{agreeError}</p>}
      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={submitting}
        >
          Back
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={submitting}
          onClick={() => {
            if (!agreed) {
              setAgreeError("Please tick the box above to continue.");
              return;
            }
            onSubmit();
          }}
        >
          {submitting ? "Booking…" : "Pay deposit & book"}
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {/* TODO(stripe): Phase 4 replaces this with Stripe Checkout. */}
        Card payment is coming soon — for now this reserves your spot and we&apos;ll
        confirm the deposit with you directly.
      </p>
    </div>
  );
}
