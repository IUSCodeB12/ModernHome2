"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";
import { OtpInput } from "@/components/auth/otp-input";
import { ResendTimer } from "@/components/auth/resend-timer";
import { GoogleButton, isGoogleAuthEnabled } from "@/components/auth/google-button";
import { safeNext } from "@/lib/auth/redirect";
import { navigateAfterAuth } from "@/lib/auth/navigate";

const LAST_EMAIL_KEY = "mh-last-email";

export default function LoginPage() {
  const [next, setNext] = useState("/portal");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [loading, setLoading] = useState(false);
  const submittedRef = useRef(false);

  // Read ?next / ?error and the remembered email after mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(safeNext(params.get("next")));
    if (params.get("error") === "auth") {
      setError("That link expired or was already used — enter your email for a fresh code.");
    }
    const last = window.localStorage.getItem(LAST_EMAIL_KEY);
    if (last) setEmail(last);
  }, []);

  async function sendCode(targetEmail: string) {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setError(error.message);
        return false;
      }
      window.localStorage.setItem(LAST_EMAIL_KEY, targetEmail);
      return true;
    } catch {
      setError("Sign-in is unavailable right now. Please try again shortly.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (await sendCode(email)) {
      setStep("otp");
      setOtp("");
    }
  }

  async function verify(code: string) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (error) {
        setInvalid(true);
        setError("That code didn't match — check the email and try again.");
        setOtp("");
        setTimeout(() => setInvalid(false), 400);
        return;
      }
      navigateAfterAuth(next);
    } finally {
      submittedRef.current = false;
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <AuthCard
        title="Enter your code"
        description={
          <>
            We emailed a 6-digit code to{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </>
        }
        footer={
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError(null);
              setOtp("");
            }}
            className="underline underline-offset-4 hover:text-foreground"
          >
            Use a different email
          </button>
        }
      >
        <div className="space-y-5">
          <div className="flex justify-center" onClick={() => setInvalid(false)}>
            <OtpInput
              value={otp}
              onChange={setOtp}
              onComplete={verify}
              disabled={loading}
              invalid={invalid}
            />
          </div>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          <Button
            className="w-full"
            disabled={loading || otp.length < 6}
            onClick={() => verify(otp)}
          >
            {loading ? "Verifying…" : "Verify & continue"}
          </Button>
          <ResendTimer onResend={() => sendCode(email)} disabled={loading} />
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Sign in or create an account"
      description="No password needed — we'll email you a 6-digit code."
      footer={
        <>By continuing you agree to our terms & privacy policy.</>
      }
    >
      <div className="space-y-4">
        {isGoogleAuthEnabled() && (
          <>
            <GoogleButton next={next} />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && (
            <p className="flex items-start gap-1.5 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading || !email}>
            {loading ? "Sending code…" : "Continue"}
          </Button>
        </form>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-green-600" />
          Your quotes and bookings, saved to your account
        </p>
      </div>
    </AuthCard>
  );
}
