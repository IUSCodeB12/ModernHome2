"use client";

import { useEffect, useRef, useState } from "react";
import { MailCheck } from "lucide-react";
import { OtpInput } from "@/components/auth/otp-input";
import { ResendTimer } from "@/components/auth/resend-timer";
import { createClient } from "@/lib/supabase/client";

/**
 * Last-mile email verification, shown only when the customer taps the confirm
 * button on the review step.
 *
 * The code is sent the moment this panel mounts, so the customer switches to
 * their inbox once, comes back, and the booking submits itself — rather than
 * being sent off to check email mid-flow with three screens still to go.
 */
export function InlineVerify({
  email,
  onVerified,
  onCancel,
}: {
  email: string;
  onVerified: () => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentRef = useRef(false);

  async function sendCode() {
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // StrictMode double-invokes effects in dev; guard so only one code is sent.
    if (sentRef.current) return;
    sentRef.current = true;
    void sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- send once on mount
  }, []);

  async function verify(token: string) {
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
        setCode("");
      } else {
        onVerified();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-enter-up space-y-3 rounded-2xl border border-brand/40 bg-brand/5 p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand ring-1 ring-brand/30">
          <MailCheck className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium">One tap to confirm it&apos;s you</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{email}</span>. Enter it
            and your booking goes through.
          </p>
        </div>
      </div>

      <OtpInput
        value={code}
        onChange={setCode}
        onComplete={(v) => verify(v)}
        disabled={busy}
        invalid={!!error}
      />

      {busy && (
        <p className="text-center text-sm text-muted-foreground">Checking…</p>
      )}
      {error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      )}

      <ResendTimer onResend={sendCode} disabled={busy} />

      <button
        type="button"
        onClick={onCancel}
        className="mx-auto block text-xs text-muted-foreground underline"
      >
        Use a different email
      </button>
    </div>
  );
}
