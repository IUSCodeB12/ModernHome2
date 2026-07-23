"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/auth/otp-input";
import { navigateAfterAuth } from "@/lib/auth/navigate";

type Step = "password" | "mfa";

export default function AdminLoginPage() {
  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Returns true if MFA (aal2) is required but not yet satisfied. */
  async function needsMfa() {
    const supabase = createClient();
    const { data } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return data?.nextLevel === "aal2" && data.currentLevel !== "aal2";
  }

  async function finish() {
    navigateAfterAuth("/admin");
  }

  // If arriving already signed in at aal1 (e.g. redirected by middleware),
  // jump straight to the code step.
  useEffect(() => {
    needsMfa()
      .then((mfa) => {
        if (mfa) setStep("mfa");
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once
  }, []);

  async function handlePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      if (await needsMfa()) {
        setStep("mfa");
        return;
      }
      await finish();
    } catch {
      setError("Sign-in is unavailable. Check the Supabase configuration.");
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
      await finish();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{step === "mfa" ? "Two-factor code" : "Admin login"}</CardTitle>
          <CardDescription>
            {step === "mfa"
              ? "Enter the 6-digit code from your authenticator app."
              : "Sign in to manage ModernHome."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "mfa" ? (
            <div className="space-y-4">
              <OtpInput
                value={code}
                onChange={setCode}
                onComplete={(v) => verifyMfa(v)}
                disabled={loading}
                invalid={!!error}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                onClick={() => verifyMfa()}
                className="w-full"
                disabled={loading || code.length < 6}
              >
                {loading ? "Verifying…" : "Verify"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-center text-sm">
                <Link href="/admin/reset" className="text-muted-foreground underline">
                  Forgot your password?
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
