"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
      <div className="flex flex-col items-center gap-4 rounded-xl border p-8 text-center">
        <CheckCircle2 className="size-12 text-green-600" />
        <h2 className="text-xl font-semibold">You&apos;re booked in!</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          We&apos;ve received your quote request and held your time slot.
          We&apos;ll review your details and confirm your final quote shortly.
          {done.demo && (
            <span className="mt-2 block text-xs">
              (Demo mode — Supabase isn&apos;t configured, so nothing was saved.)
            </span>
          )}
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/">Back home</Link>
          </Button>
          <Button asChild>
            <Link href="/portal">View my bookings</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <ol className="mb-6 flex items-center gap-1">
        {STEP_LABELS.map((label, i) => (
          <li key={label} className="flex-1">
            <div
              className={cn(
                "h-1.5 rounded-full",
                i <= state.step ? "bg-primary" : "bg-muted"
              )}
            />
            <span
              className={cn(
                "mt-1 hidden text-[10px] uppercase tracking-wide sm:block",
                i === state.step
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {/* key on step → each step slides in fresh */}
      <div key={state.step} className="animate-enter-up">
      {state.step === 0 && (
        <StepService
          services={data.services}
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
