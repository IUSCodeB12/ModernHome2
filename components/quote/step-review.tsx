"use client";

import { useEffect, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarClock, MapPin, Pencil, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedPrice } from "@/components/quote/animated-price";
import { InlineVerify } from "@/components/quote/inline-verify";
import { allPhotoEntries } from "@/components/quote/photo-store";
import { createClient } from "@/lib/supabase/client";
import { answerLabel } from "@/lib/quote/answers";
import {
  calculateDepositCents,
  calculateEstimate,
  formatAud,
} from "@/lib/quote/estimate";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import { isCustomService } from "@/lib/services/custom";
import type { ServiceWithQuestions } from "@/lib/quote/types";
import type { WizardState } from "@/lib/quote/wizard-state";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function Card({
  title,
  icon,
  onEdit,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-elev-1 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-medium">
          {icon}
          {title}
        </h3>
        <Button type="button" variant="ghost" size="xs" onClick={onEdit}>
          <Pencil /> Edit
        </Button>
      </div>
      <div className="mt-1 divide-y divide-border">{children}</div>
    </section>
  );
}

export function StepReview({
  service,
  state,
  configured,
  submitting,
  submitError,
  onBack,
  onEditStep,
  onSubmit,
}: {
  service: ServiceWithQuestions;
  state: WizardState;
  /** false in demo mode — skips real verification so the flow stays testable. */
  configured: boolean;
  submitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onEditStep: (step: number) => void;
  onSubmit: () => void;
}) {
  const custom = isCustomService(service);
  const estimate = useMemo(
    () => calculateEstimate(service, service.service_questions, state.answers),
    [service, state.answers]
  );
  const depositCents = calculateDepositCents(estimate);

  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState<string | null>(null);
  const [verified, setVerified] = useState(!configured);
  const [verifying, setVerifying] = useState(false);

  // An existing session means this customer verified on a previous visit —
  // don't make them do it again.
  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setVerified(true);
    });
  }, [configured]);

  const photoCount = allPhotoEntries().reduce((n, [, p]) => n + p.length, 0);

  function handleConfirm() {
    if (!agreed) {
      setAgreeError("Please tick the box above to continue.");
      return;
    }
    if (!verified) {
      setVerifying(true);
      return;
    }
    onSubmit();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">
          Check it over, then you&apos;re done
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nothing to pay now — your arrival window is held while we confirm.
        </p>
      </div>

      <Card title={service.name} onEdit={() => onEditStep(1)}>
        {service.service_questions.map((q) => {
          const label = answerLabel(q, state.answers);
          if (!label) return null;
          return <Row key={q.id} label={q.question_text} value={label} />;
        })}
        {photoCount > 0 && (
          <Row
            label="Photos attached"
            value={`${photoCount} photo${photoCount === 1 ? "" : "s"}`}
          />
        )}
      </Card>

      <Card
        title="When"
        icon={<CalendarClock className="size-4 text-brand" />}
        onEdit={() => onEditStep(2)}
      >
        {state.slot && (
          <Row
            label="Arrival window"
            value={`${formatInTimeZone(new Date(state.slot.start), BUSINESS_TIME_ZONE, "EEE d MMM")}, ${state.slot.label}`}
          />
        )}
      </Card>

      <Card
        title="Where"
        icon={<MapPin className="size-4 text-brand" />}
        onEdit={() => onEditStep(3)}
      >
        <Row
          label="Address"
          value={`${state.contact.addressLine1}, ${state.contact.suburb} ${state.contact.postcode}`}
        />
        <Row
          label="Contact"
          value={`${state.contact.fullName} · ${state.contact.phone}`}
        />
        <Row label="Email" value={state.contact.email} />
      </Card>

      {/* Price panel — the warm dark treatment used for the site's CTA finale. */}
      {/* Hairline keeps the panel legible against the near-black dark theme. */}
      <section className="overflow-hidden rounded-2xl bg-[#171513] p-5 text-white ring-1 ring-white/10">
        {custom ? (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-white/70">Your price</span>
              <span className="text-right font-semibold">Quoted after review</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              Custom jobs aren&apos;t priced instantly. We&apos;ll go through your
              description and photos, then send a fixed price broken down line by
              line — nothing to pay until you accept it.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-white/70">Estimated price</span>
              <span className="text-2xl font-semibold text-brand">
                <AnimatedPrice cents={estimate.low_cents} /> –{" "}
                <AnimatedPrice cents={estimate.high_cents} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-4">
              <span className="text-sm text-white/70">Deposit to hold your spot</span>
              <span className="font-semibold">{formatAud(depositCents)}</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/60">
              The final price is confirmed after we review your details and photos.
              Your deposit comes off the total and is fully refundable if we
              can&apos;t do the job.
            </p>
          </>
        )}
      </section>

      <label className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3 text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked);
            setAgreeError(null);
          }}
          className="mt-0.5 size-4 accent-[var(--brand)]"
        />
        <span>
          {custom
            ? "I understand this job will be priced after review, and my spot is held in the meantime."
            : "I understand this is an estimate and the final quote may be adjusted after review."}
        </span>
      </label>
      {agreeError && (
        <p role="alert" className="text-sm text-destructive">
          {agreeError}
        </p>
      )}

      {verifying && !verified && (
        <InlineVerify
          email={state.contact.email}
          onVerified={() => {
            setVerified(true);
            setVerifying(false);
            onSubmit();
          }}
          onCancel={() => {
            setVerifying(false);
            onEditStep(3);
          }}
        />
      )}

      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      )}

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
          disabled={submitting || verifying}
          onClick={handleConfirm}
        >
          {submitting
            ? "Booking…"
            : custom
              ? "Request my quote"
              : "Reserve my spot"}
        </Button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-brand" />
        {/* TODO(stripe): Phase 4 takes the deposit here via Stripe Checkout. */}
        No card needed today — we&apos;ll confirm the deposit with you directly.
      </p>
    </div>
  );
}
