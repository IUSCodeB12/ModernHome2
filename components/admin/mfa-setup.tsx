"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/auth/otp-input";

type Phase = "loading" | "disabled" | "enrolling" | "enabled";

/** Admin TOTP MFA enrollment + management. */
export function MfaSetup() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function refresh() {
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find((f) => f.status === "verified");
    setPhase(verified ? "enabled" : "disabled");
  }

  useEffect(() => {
    refresh().catch(() => setPhase("disabled"));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once
  }, []);

  async function startEnroll() {
    setError(null);
    setBusy(true);
    try {
      // Clean up any half-finished (unverified) factor first.
      const { data: list } = await supabase.auth.mfa.listFactors();
      const stale = list?.all?.find(
        (f) => f.factor_type === "totp" && f.status === "unverified"
      );
      if (stale) await supabase.auth.mfa.unenroll({ factorId: stale.id });

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `admin-${Date.now()}`,
      });
      if (error || !data) {
        setError(error?.message ?? "Couldn't start setup.");
        return;
      }
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setPhase("enrolling");
    } finally {
      setBusy(false);
    }
  }

  async function verify(token = code) {
    if (!factorId) return;
    setError(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: token.trim(),
      });
      if (error) {
        setError("That code didn't match — try the current one.");
        setCode("");
        return;
      }
      setQr(null);
      setSecret(null);
      setFactorId(null);
      setCode("");
      setPhase("enabled");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.all?.filter((f) => f.factor_type === "totp") ?? [];
      for (const f of totp) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      setPhase("disabled");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "loading") {
    return <p className="text-sm text-muted-foreground">Checking security…</p>;
  }

  if (phase === "enabled") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-green-700">
          <ShieldCheck className="size-5" />
          Two-factor authentication is on.
        </div>
        <p className="text-sm text-muted-foreground">
          You&apos;ll enter a code from your authenticator app each time you sign in.
        </p>
        <Button variant="outline" onClick={disable} disabled={busy}>
          {busy ? "Removing…" : "Turn off two-factor"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (phase === "enrolling") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Scan this with Google Authenticator, 1Password, or Authy — then enter the 6-digit code.
        </p>
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element -- data-URL SVG from Supabase
          <img src={qr} alt="TOTP QR code" className="size-44 rounded-lg border bg-white p-2" />
        )}
        {secret && (
          <p className="text-xs text-muted-foreground">
            Can&apos;t scan? Enter this key manually:{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">{secret}</code>
          </p>
        )}
        <OtpInput value={code} onChange={setCode} onComplete={(v) => verify(v)} disabled={busy} invalid={!!error} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={() => verify()} disabled={busy || code.length < 6}>
            {busy ? "Verifying…" : "Turn on two-factor"}
          </Button>
          <Button variant="ghost" onClick={() => setPhase("disabled")} disabled={busy}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // disabled
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-amber-700">
        <ShieldAlert className="size-5" />
        Two-factor authentication is off.
      </div>
      <p className="text-sm text-muted-foreground">
        Add a second step at sign-in to protect the admin dashboard.
      </p>
      <Button onClick={startEnroll} disabled={busy}>
        {busy ? "Starting…" : "Set up two-factor"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
