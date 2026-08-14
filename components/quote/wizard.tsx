"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateEstimate, type Answers } from "@/lib/quote/estimate";
import { uploadPendingPhotos } from "@/lib/quote/upload-photos";
import { isCustomService } from "@/lib/services/custom";
import type { QuoteWizardData, ServiceWithQuestions } from "@/lib/quote/types";
import {
  clearWizardState,
  loadWizardState,
  newWizardState,
  saveWizardState,
  type WizardState,
} from "@/lib/quote/wizard-state";
import { submitQuoteRequest } from "@/app/(site)/quote/actions";
import { clearPhotos } from "@/components/quote/photo-store";
import { QuoteSuccess } from "@/components/quote/quote-success";
import { StepService } from "@/components/quote/step-service";
import { StepQuestions } from "@/components/quote/step-questions";
import { StepContact } from "@/components/quote/step-contact";
import { StepSlot } from "@/components/quote/step-slot";
import { StepReview } from "@/components/quote/step-review";
import { ProgressRail } from "@/components/quote/progress-rail";

/**
 * Five steps, down from six. Photos used to be a step of their own — for two
 * of the five services it rendered a screen that only said "no photos needed"
 * — so each photo prompt now sits under the question it illustrates. Time
 * moved ahead of contact details: seeing a real arrival window is a reason to
 * keep going, whereas an address form is a chore.
 */
const STEP_LABELS = ["Service", "Details", "Time", "You", "Review"];

const STEP_SERVICE = 0;
const STEP_DETAILS = 1;
const STEP_TIME = 2;
const STEP_CONTACT = 3;
const STEP_REVIEW = 4;

export function QuoteWizard({ data }: { data: QuoteWizardData }) {
  // Hydration-safe: start fresh on the server render, then restore any
  // saved progress from localStorage after mount.
  const [state, setState] = useState<WizardState>(newWizardState);
  const [hydrated, setHydrated] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{ demo: boolean } | null>(null);
  /** Uncommitted answers from the details form, so the rail price tracks live. */
  const [liveAnswers, setLiveAnswers] = useState<Answers | null>(null);

  useEffect(() => {
    const saved = loadWizardState();

    // Real progress always wins — resume it and ignore any deep link.
    if (saved && (saved.serviceId || saved.step > STEP_SERVICE)) {
      setState(saved);
      setResumed(saved.step > STEP_SERVICE);
      setHydrated(true);
      return;
    }

    // Deep link: /quote?service=slug pre-selects the service and jumps to job
    // details. Note the draft is only "saved progress" once a service is
    // picked: opening /quote and leaving writes a step-0 draft, and now that
    // drafts outlive the tab, treating that as progress would kill every
    // service-page deep link from then on.
    const slug = new URLSearchParams(window.location.search).get("service");
    const preselect = slug
      ? data.services.find((s) => s.slug === slug)
      : undefined;
    if (preselect) {
      setState((prev) => ({
        ...(saved ?? prev),
        serviceId: preselect.id,
        step: STEP_DETAILS,
      }));
    } else if (saved) {
      setState(saved);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    if (hydrated) saveWizardState(state);
  }, [state, hydrated]);

  // Advancing from the bottom of a long form otherwise drops the customer into
  // the middle of the next step — send them back to the rail each time.
  const topRef = useRef<HTMLDivElement>(null);
  const lastStepRef = useRef(state.step);
  useEffect(() => {
    if (!hydrated || lastStepRef.current === state.step) {
      lastStepRef.current = state.step;
      return;
    }
    lastStepRef.current = state.step;
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state.step, hydrated]);

  const update = useCallback((patch: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
    setResumed(false);
  }, []);

  const service: ServiceWithQuestions | null =
    data.services.find((s) => s.id === state.serviceId) ?? null;

  function restart() {
    clearWizardState();
    clearPhotos();
    setLiveAnswers(null);
    setResumed(false);
    setState(newWizardState());
  }

  // The rail's running price: live form values while on the details step,
  // committed answers everywhere after it.
  const railPrice = useMemo(() => {
    if (!service || isCustomService(service)) return null;
    if (state.step < STEP_DETAILS) return null;
    const answers =
      state.step === STEP_DETAILS && liveAnswers ? liveAnswers : state.answers;
    const estimate = calculateEstimate(
      service,
      service.service_questions,
      answers
    );
    return { low: estimate.low_cents, high: estimate.high_cents };
  }, [service, state.step, state.answers, liveAnswers]);

  async function handleSubmit() {
    if (!service || !state.slot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      let photoPaths: Record<string, string[]> = {};
      if (data.configured) {
        photoPaths = await uploadPendingPhotos(state.draftId);
      }

      const result = await submitQuoteRequest({
        draftId: state.draftId,
        serviceId: service.id,
        answers: state.answers,
        photoPaths,
        contact: {
          fullName: state.contact.fullName,
          phone: state.contact.phone,
          addressLine1: state.contact.addressLine1,
          suburb: state.contact.suburb,
          postcode: state.contact.postcode,
          accessNotes: state.contact.accessNotes,
        },
        slot: { start: state.slot.start, end: state.slot.end },
      });

      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }

      clearWizardState();
      clearPhotos();
      setDone({ demo: result.demo ?? false });
    } catch (err) {
      console.error("[quote] submit failed", err);
      setSubmitError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return <QuoteSuccess demo={done.demo} />;
  }

  return (
    <div ref={topRef} className="scroll-mt-24">
      <ProgressRail
        labels={STEP_LABELS}
        current={state.step}
        price={railPrice}
        onStepSelect={(step) => update({ step })}
      />

      {resumed && (
        <div className="animate-enter-up mb-5 flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3">
          <p className="text-sm">
            <span className="font-medium">Picked up where you left off.</span>{" "}
            <span className="text-muted-foreground">
              Any photos need adding again.
            </span>
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={restart}>
            <RotateCcw /> Start over
          </Button>
        </div>
      )}

      {/* key on step → each step slides in fresh */}
      <div key={state.step} className="animate-enter-up">
        {state.step === STEP_SERVICE && (
          <StepService
            services={data.services}
            photos={data.photos}
            selectedId={state.serviceId}
            onSelect={(s) => {
              // Changing service resets answers/photos for a clean slate.
              if (s.id !== state.serviceId) {
                clearPhotos();
                setLiveAnswers(null);
                update({
                  serviceId: s.id,
                  answers: {},
                  photoPaths: {},
                  step: STEP_DETAILS,
                });
              } else {
                update({ step: STEP_DETAILS });
              }
            }}
          />
        )}

        {state.step === STEP_DETAILS && service && (
          <StepQuestions
            service={service}
            initialAnswers={state.answers}
            onAnswersChange={setLiveAnswers}
            onBack={() => update({ step: STEP_SERVICE })}
            onNext={(answers) => update({ answers, step: STEP_TIME })}
          />
        )}

        {state.step === STEP_TIME && (
          <StepSlot
            data={data}
            initial={state.slot}
            onBack={() => update({ step: STEP_DETAILS })}
            onNext={(slot) => update({ slot, step: STEP_CONTACT })}
          />
        )}

        {state.step === STEP_CONTACT && (
          <StepContact
            initial={state.contact}
            saved={data.identity.contact}
            signedInEmail={data.identity.email}
            onBack={() => update({ step: STEP_TIME })}
            onNext={(contact) => update({ contact, step: STEP_REVIEW })}
          />
        )}

        {state.step === STEP_REVIEW && service && (
          <StepReview
            service={service}
            state={state}
            configured={data.configured}
            submitting={submitting}
            submitError={submitError}
            onBack={() => update({ step: STEP_CONTACT })}
            onEditStep={(step) => update({ step })}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Guard: lost service (e.g. cleared storage) — restart */}
      {state.step > STEP_SERVICE && !service && (
        <div className="rounded-xl border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Something went missing — let&apos;s start over.
          </p>
          <Button className="mt-3" onClick={restart}>
            Restart
          </Button>
        </div>
      )}
    </div>
  );
}
