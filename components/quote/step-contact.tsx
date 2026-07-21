"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OtpInput } from "@/components/auth/otp-input";
import { ResendTimer } from "@/components/auth/resend-timer";
import { createClient } from "@/lib/supabase/client";
import type { ContactDetails } from "@/lib/quote/wizard-state";

const contactSchema = z.object({
  fullName: z.string().min(2, "Enter your name"),
  phone: z
    .string()
    .regex(/^[\d\s+()-]{8,}$/, "Enter a valid phone number"),
  addressLine1: z.string().min(3, "Enter your street address"),
  suburb: z.string().min(2, "Enter your suburb"),
  postcode: z.string().regex(/^\d{4}$/, "4-digit postcode"),
  accessNotes: z.string().max(1000).optional().default(""),
});

type ContactForm = z.infer<typeof contactSchema>;

type AuthPhase = "loading" | "signedOut" | "codeSent" | "signedIn";

function InlineAuth({
  email,
  setEmail,
  configured,
  onSignedIn,
}: {
  email: string;
  setEmail: (v: string) => void;
  configured: boolean;
  onSignedIn: (email: string) => void;
}) {
  const [phase, setPhase] = useState<AuthPhase>("loading");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      setPhase("signedOut");
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        onSignedIn(user.email);
        setPhase("signedIn");
      } else {
        setPhase("signedOut");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  async function sendCode() {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    if (!configured) {
      // Demo mode — skip real auth so the wizard can be exercised locally.
      onSignedIn(email);
      setPhase("signedIn");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) setError(error.message);
      else setPhase("codeSent");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(token = code) {
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: token.trim(),
        type: "email",
      });
      if (error) {
        setError("That code didn't match — check the email and try again.");
      } else {
        onSignedIn(email);
        setPhase("signedIn");
      }
    } finally {
      setBusy(false);
    }
  }

  if (phase === "loading") {
    return <p className="text-sm text-muted-foreground">Checking sign-in…</p>;
  }

  if (phase === "signedIn") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-600/30 bg-green-600/10 px-3 py-2 text-sm">
        <CheckCircle2 className="size-4 text-green-600" />
        <span>
          Signed in as <span className="font-medium">{email}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <p className="text-sm font-medium">
        Your email — we&apos;ll send a 6-digit code so your quote is saved to
        your account. No password needed.
      </p>
      <div className="space-y-2">
        <Label htmlFor="wizard-email">Email</Label>
        <Input
          id="wizard-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={phase === "codeSent"}
        />
      </div>
      {phase === "codeSent" ? (
        <div className="space-y-3">
          <Label>Enter the 6-digit code we emailed you</Label>
          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={(v) => verifyCode(v)}
            disabled={busy}
            invalid={!!error}
          />
          {busy && <p className="text-sm text-muted-foreground">Checking…</p>}
          <ResendTimer onResend={sendCode} disabled={busy} />
          <button
            type="button"
            className="mx-auto block text-xs text-muted-foreground underline"
            onClick={() => {
              setCode("");
              setError(null);
              setPhase("signedOut");
            }}
          >
            Use a different email
          </button>
        </div>
      ) : (
        <Button type="button" onClick={sendCode} disabled={busy} className="w-full">
          {busy ? "Sending…" : "Send code"}
        </Button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function StepContact({
  initial,
  configured,
  onBack,
  onNext,
}: {
  initial: ContactDetails;
  configured: boolean;
  onBack: () => void;
  onNext: (contact: ContactDetails, signedIn: boolean) => void;
}) {
  const [email, setEmail] = useState(initial.email);
  const [signedIn, setSignedIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema as never),
    defaultValues: {
      fullName: initial.fullName,
      phone: initial.phone,
      addressLine1: initial.addressLine1,
      suburb: initial.suburb,
      postcode: initial.postcode,
      accessNotes: initial.accessNotes,
    },
    mode: "onTouched",
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        if (!signedIn) {
          setAuthError("Please verify your email first — it only takes a moment.");
          return;
        }
        onNext({ ...values, accessNotes: values.accessNotes ?? "", email }, signedIn);
      })}
      className="space-y-5"
    >
      <h2 className="text-lg font-semibold">Your details</h2>

      <InlineAuth
        email={email}
        setEmail={setEmail}
        configured={configured}
        onSignedIn={(verifiedEmail) => {
          setEmail(verifiedEmail);
          setSignedIn(true);
          setAuthError(null);
        }}
      />
      {authError && <p className="text-sm text-destructive">{authError}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
          {form.formState.errors.fullName && (
            <p className="text-sm text-destructive">
              {form.formState.errors.fullName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="0400 000 000"
            {...form.register("phone")}
          />
          {form.formState.errors.phone && (
            <p className="text-sm text-destructive">
              {form.formState.errors.phone.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine1">Street address</Label>
        <Input
          id="addressLine1"
          autoComplete="address-line1"
          {...form.register("addressLine1")}
        />
        {form.formState.errors.addressLine1 && (
          <p className="text-sm text-destructive">
            {form.formState.errors.addressLine1.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="suburb">Suburb</Label>
          <Input id="suburb" autoComplete="address-level2" {...form.register("suburb")} />
          {form.formState.errors.suburb && (
            <p className="text-sm text-destructive">
              {form.formState.errors.suburb.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="postcode">Postcode</Label>
          <Input
            id="postcode"
            inputMode="numeric"
            maxLength={4}
            {...form.register("postcode")}
          />
          {form.formState.errors.postcode && (
            <p className="text-sm text-destructive">
              {form.formState.errors.postcode.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accessNotes">
          Access notes <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="accessNotes"
          placeholder="Parking, stairs, pets, gate codes…"
          {...form.register("accessNotes")}
        />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue
        </Button>
      </div>
    </form>
  );
}
