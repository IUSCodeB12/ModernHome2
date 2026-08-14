"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SavedDetails } from "@/components/quote/saved-details";
import { isContactComplete, type ContactDetails } from "@/lib/quote/wizard-state";

const contactSchema = z.object({
  email: z.string().regex(/^\S+@\S+\.\S+$/, "Enter a valid email address"),
  fullName: z.string().min(2, "Enter your name"),
  phone: z.string().regex(/^[\d\s+()-]{8,}$/, "Enter a valid phone number"),
  addressLine1: z.string().min(3, "Enter your street address"),
  suburb: z.string().min(2, "Enter your suburb"),
  postcode: z.string().regex(/^\d{4}$/, "4-digit postcode"),
  accessNotes: z.string().max(1000).optional().default(""),
});

type ContactForm = z.infer<typeof contactSchema>;

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {hint && (
          <span className="ml-1 font-normal text-muted-foreground">{hint}</span>
        )}
      </Label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Contact details — no sign-in wall.
 *
 * Verification used to sit here, mid-flow: three screens in, before the
 * customer had seen a time or a final price, they were sent to their inbox for
 * a 6-digit code. Now they finish the booking first and verify once, on the
 * review step, at the point they're actually committing.
 */
export function StepContact({
  initial,
  saved,
  signedInEmail,
  onBack,
  onNext,
}: {
  initial: ContactDetails;
  /** On-file details for a signed-in returning customer, else null. */
  saved: ContactDetails | null;
  /** Session email when already signed in — the quote is tied to this account. */
  signedInEmail: string | null;
  onBack: () => void;
  onNext: (contact: ContactDetails) => void;
}) {
  // Anything typed into this draft outranks the account record — the customer
  // has already told us this booking is different.
  const draftStarted = initial.fullName.trim().length > 0;
  const canFastPath = !draftStarted && !!saved && isContactComplete(saved);
  const [editing, setEditing] = useState(!canFastPath);

  const prefill = draftStarted ? initial : (saved ?? initial);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema as never),
    defaultValues: {
      // Signed in? The session address is authoritative and the field is
      // rendered read-only, so seed it here or validation dead-ends with
      // nothing on screen to fix.
      email: signedInEmail ?? prefill.email,
      fullName: prefill.fullName,
      phone: prefill.phone,
      addressLine1: prefill.addressLine1,
      suburb: prefill.suburb,
      postcode: prefill.postcode,
      accessNotes: prefill.accessNotes,
    },
    mode: "onTouched",
  });

  const errors = form.formState.errors;

  if (!editing && saved) {
    return (
      <SavedDetails
        saved={saved}
        onUse={() => onNext(saved)}
        onEdit={() => setEditing(true)}
        onBack={onBack}
      />
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit((values) =>
        onNext({ ...values, accessNotes: values.accessNotes ?? "" })
      )}
      className="space-y-5"
    >
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Where are we going?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {canFastPath
            ? "Filled in from your last booking — change whatever's different."
            : "Last details — then you're done."}
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-elev-1 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="fullName" label="Full name" error={errors.fullName?.message}>
            <Input
              id="fullName"
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              {...form.register("fullName")}
            />
          </Field>
          <Field id="phone" label="Phone" error={errors.phone?.message}>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="0400 000 000"
              aria-invalid={!!errors.phone}
              {...form.register("phone")}
            />
          </Field>
        </div>

        {signedInEmail ? (
          // The booking is tied to the signed-in account and every notification
          // goes to it, so an editable field here would be a promise we don't
          // keep — the typed address is never stored or used.
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
            <ShieldCheck className="size-4 shrink-0 text-brand" />
            <span className="min-w-0">
              Signed in as{" "}
              <span className="font-medium">{signedInEmail}</span> — your quote
              lands there.
            </span>
          </div>
        ) : (
          <Field
            id="email"
            label="Email"
            hint="— your quote and confirmation land here"
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...form.register("email")}
            />
          </Field>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-elev-1 sm:p-5">
        <Field
          id="addressLine1"
          label="Street address"
          error={errors.addressLine1?.message}
        >
          <Input
            id="addressLine1"
            autoComplete="address-line1"
            aria-invalid={!!errors.addressLine1}
            {...form.register("addressLine1")}
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field id="suburb" label="Suburb" error={errors.suburb?.message}>
              <Input
                id="suburb"
                autoComplete="address-level2"
                aria-invalid={!!errors.suburb}
                {...form.register("suburb")}
              />
            </Field>
          </div>
          <Field id="postcode" label="Postcode" error={errors.postcode?.message}>
            <Input
              id="postcode"
              inputMode="numeric"
              maxLength={4}
              autoComplete="postal-code"
              aria-invalid={!!errors.postcode}
              {...form.register("postcode")}
            />
          </Field>
        </div>

        <Field id="accessNotes" label="Access notes" hint="(optional)">
          <Textarea
            id="accessNotes"
            rows={3}
            placeholder="Parking, stairs, pets, gate codes…"
            {...form.register("accessNotes")}
          />
        </Field>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-brand" />
        Used only to quote and complete your job — never shared.
      </p>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Review <ArrowRight />
        </Button>
      </div>
    </form>
  );
}
