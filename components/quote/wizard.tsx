"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { QuoteWizardData, ServiceWithQuestions } from "@/lib/quote/types";
import {
  clearWizardState,
  loadWizardState,
  newWizardState,
  saveWizardState,
  type WizardState,
} from "@/lib/quote/wizard-state";
import { submitQuoteRequest } from "@/app/(site)/quote/actions";
import { allPhotoEntries, clearPhotos } from "@/components/quote/photo-store";
import { StepService } from "@/components/quote/step-service";
import { StepQuestions } from "@/components/quote/step-questions";
import { StepPhotos } from "@/components/quote/step-photos";
import { StepContact } from "@/components/quote/step-contact";
import { StepSlot } from "@/components/quote/step-slot";
import { StepReview } from "@/components/quote/step-review";
import { ProgressRail } from "@/components/quote/progress-rail";

const STEP_LABELS = ["Service", "Details", "Photos", "About you", "Time", "Review"];

/**
 * Uploads pending photos to quote-photos/{userId}/{draftId}/ and returns
 * question id -> storage paths. Requires an authenticated session.
 */
async function uploadPendingPhotos(
  draftId: string
): Promise<Record<string, string[]>> {
  const entries = allPhotoEntries();
  if (entries.length === 0) return {};

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const result: Record<string, string[]> = {};
  for (const [questionId, photos] of entries) {
    result[questionId] = [];
    for (let i = 0; i < photos.length; i++) {
      const path = `${user.id}/${draftId}/${questionId}-${i}.jpg`;
      const { error } = await supabase.storage
        .from("quote-photos")
        .upload(path, photos[i].blob, {
          contentType: "image/jpeg",
          upsert: true,
        });
      if (error) throw error;
      result[questionId].push(path);
    }
  }
  return result;
}

export function QuoteWizard({ data }: { data: QuoteWizardData }) {
  // Hydration-safe: start fresh on the server render, then restore any
  // saved progress from sessionStorage after mount.
  const [state, setState] = useState<WizardState>(newWizardState);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{ demo: boolean } | null>(null);

  useEffect(() => {
    const saved = loadWizardState();
    if (saved) {
      setState(saved);
      setHydrated(true);
      return;
    }
    // Deep link: /quote?service=slug pre-selects the service and jumps to
    // job details — but only for a fresh start, never over saved progress.
    const slug = new URLSearchParams(window.location.search).get("service");
    const preselect = slug
      ? data.services.find((s) => s.slug === slug)
      : undefined;
    if (preselect) {
      setState((prev) => ({ ...prev, serviceId: preselect.id, step: 1 }));
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    if (hydrated) saveWizardState(state);
  }, [state, hydrated]);

  const update = useCallback((patch: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const service: ServiceWithQuestions | null =
    data.services.find((s) => s.id === state.serviceId) ?? null;

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
    return (
      <div className="animate-enter-up overflow-hidden rounded-2xl border border-border bg-card shadow-elev-2">
        {/* Warm confirmation banner echoing the CTA finale */}
        <div className="relative overflow-hidden bg-[#171513] px-8 py-12 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,177,99,0.22),transparent_65%)]" />
          <div className="relative">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand/15 ring-1 ring-brand/40">
              <CheckCircle2 className="size-7 text-brand" />
            </span>
            <p className="mt-5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-brand">
              Spot held
            </p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight text-white sm:text-4xl">
              You&apos;re booked in.
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-white/70">
              We&apos;ve got your details and held your arrival window. We&apos;ll
              review everything and confirm your final quote shortly.
            </p>
          </div>
        </div>

        <div className="p-6">
          {done.demo && (
            <p className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground">
              Demo mode — Supabase isn&apos;t configured, so nothing was saved.
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Back home</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/portal">
                View my bookings <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ProgressRail labels={STEP_LABELS} current={state.step} />

      {/* key on step → each step slides in fresh */}
      <div key={state.step} className="animate-enter-up">
      {state.step === 0 && (
        <StepService
          services={data.services}
          photos={data.photos}
          selectedId={state.serviceId}
          onSelect={(s) => {
            // Changing service resets answers/photos for a clean slate.
            if (s.id !== state.serviceId) {
              clearPhotos();
              update({ serviceId: s.id, answers: {}, photoPaths: {}, step: 1 });
            } else {
              update({ step: 1 });
            }
          }}
        />
      )}

      {state.step === 1 && service && (
        <StepQuestions
          service={service}
          initialAnswers={state.answers}
          onBack={() => update({ step: 0 })}
          onNext={(answers) => update({ answers, step: 2 })}
        />
      )}

      {state.step === 2 && service && (
        <StepPhotos
          service={service}
          onBack={() => update({ step: 1 })}
          onNext={() => update({ step: 3 })}
        />
      )}

      {state.step === 3 && (
        <StepContact
          initial={state.contact}
          configured={data.configured}
          onBack={() => update({ step: 2 })}
          onNext={(contact) => update({ contact, step: 4 })}
        />
      )}

      {state.step === 4 && (
        <StepSlot
          data={data}
          initial={state.slot}
          onBack={() => update({ step: 3 })}
          onNext={(slot) => update({ slot, step: 5 })}
        />
      )}

      {state.step === 5 && service && (
        <StepReview
          service={service}
          state={state}
          submitting={submitting}
          submitError={submitError}
          onBack={() => update({ step: 4 })}
          onSubmit={handleSubmit}
        />
      )}
      </div>

      {/* Guard: lost service (e.g. cleared storage) — restart */}
      {state.step > 0 && !service && (
        <div className="rounded-xl border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Something went missing — let&apos;s start over.
          </p>
          <Button
            className="mt-3"
            onClick={() => {
              clearWizardState();
              clearPhotos();
              setState(newWizardState());
            }}
          >
            Restart
          </Button>
        </div>
      )}
    </div>
  );
}
