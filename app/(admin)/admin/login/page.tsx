"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { AdminAuthShell, AuthError } from "@/components/admin/admin-auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/auth/otp-input";
import { ResendTimer } from "@/components/auth/resend-timer";
import { navigateAfterAuth } from "@/lib/auth/navigate";

type Step = "email" | "otp" | "mfa";

/**
 * Passwordless staff sign-in: emailed 6-digit code, then the TOTP second
 * factor when the account has one enrolled. Matching the customer flow means
 * one auth mechanism to reason about and no admin passwords to leak — the
 * authenticator app remains the thing that actually gates the dashboard.
 */
export default function AdminLoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Returns true if MFA (aal2) is required but not yet satisfied. */
  async function needsMfa() {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return data?.nextLevel === "aal2" && data.currentLevel !== "aal2";
  }

  function finish() {
    navigateAfterAuth("/admin");
  }

  // If arriving already signed in at aal1 (e.g. redirected by middleware),
  // jump straight to the authenticator step.
  useEffect(() => {
    needsMfa()
      .then((mfa) => {
        if (mfa) setStep("mfa");
      })
      .catch(() => {});
  }, []);

  async function sendCode(target = email) {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      // shouldCreateUser:false — the admin door must never mint new accounts.
      const { error } = await supabase.auth.signInWithOtp({
        email: target,
        options: { shouldCreateUser: false },
      });
      if (error) {
        setError("We couldn't send a code to that address.");
        return false;
      }
      return true;
    } catch {
      setError("Sign-in is unavailable. Check the Supabase configuration.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await sendCode()) {
      setStep("otp");
      setCode("");
    }
  }

  async function verifyCode(token = code) {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: token.trim(),
        type: "email",
      });
      if (error || !data.user) {
        setError("That code didn't match — check the email and try again.");
        setCode("");
        return;
      }
      // A valid code proves the mailbox, not the role. Non-admins get signed
      // out here rather than bouncing off middleware with no explanation.
      if (!(await isAdmin(supabase, data.user.id))) {
        await supabase.auth.signOut();
        setError("That account doesn't have admin access.");
        setCode("");
        setStep("email");
        return;
      }
      if (await needsMfa()) {
        setStep("mfa");
        setCode("");
        return;
      }
      finish();
    } finally {
      setLoading(false);
    }
  }

  async function verifyMfa(token = code) {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.find((f) => f.status === "verified");
      if (!factor) {
        setError("No authenticator is set up for this account.");
        return;
      }
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code: token.trim(),
      });
      if (error) {
        setError("That code didn't match — try the current one.");
        setCode("");
        return;
      }
      finish();
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setStep("email");
    setError(null);
    setCode("");
  }

  if (step === "mfa") {
    return (
      <AdminAuthShell
        eyebrow="Two-factor"
        title="Enter your authenticator code"
        description="Open your authenticator app and enter the current 6-digit code."
        footer={
          <button type="button" onClick={restart} className="underline underline-offset-4 hover:text-foreground">
            Start over
          </button>
        }
      >
        <div className="space-y-5">
          <div className="flex justify-center">
            <OtpInput
              value={code}
              onChange={setCode}
              onComplete={(v) => verifyMfa(v)}
              disabled={loading}
              invalid={!!error}
            />
          </div>
          {error && <AuthError>{error}</AuthError>}
          <Button onClick={() => verifyMfa()} className="w-full" disabled={loading || code.length < 6}>
            {loading ? "Verifying…" : "Verify"}
          </Button>
        </div>
      </AdminAuthShell>
    );
  }

  if (step === "otp") {
    return (
      <AdminAuthShell
        eyebrow="Staff access"
        title="Enter your code"
        description={
          <>
            We emailed a 6-digit code to{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </>
        }
        footer={
          <button type="button" onClick={restart} className="underline underline-offset-4 hover:text-foreground">
            Use a different email
          </button>
        }
      >
        <div className="space-y-5">
          <div className="flex justify-center">
            <OtpInput
              value={code}
              onChange={setCode}
              onComplete={(v) => verifyCode(v)}
              disabled={loading}
              invalid={!!error}
            />
          </div>
          {error && <AuthError>{error}</AuthError>}
          <Button onClick={() => verifyCode()} className="w-full" disabled={loading || code.length < 6}>
            {loading ? "Verifying…" : "Verify & continue"}
          </Button>
          <ResendTimer onResend={() => sendCode()} disabled={loading} />
        </div>
      </AdminAuthShell>
    );
  }

  return (
    <AdminAuthShell
      title="Admin sign-in"
      description="No password needed — we'll email you a 6-digit code."
    >
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
        {error && <AuthError>{error}</AuthError>}
        <Button type="submit" className="w-full" disabled={loading || !email}>
          {loading ? "Sending code…" : "Continue"}
        </Button>
      </form>
    </AdminAuthShell>
  );
}
