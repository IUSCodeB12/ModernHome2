"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AdminAuthShell, AuthError } from "@/components/admin/admin-auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { navigateAfterAuth } from "@/lib/auth/navigate";

type Mode = "request" | "update";

export default function AdminResetPage() {
  const [mode, setMode] = useState<Mode>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Arriving from the emailed link fires PASSWORD_RECOVERY — switch to the
  // "set a new password" form.
  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("update");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset`,
      });
      if (error) setError(error.message);
      else setMessage(`If ${email} is an admin, a reset link is on its way.`);
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      navigateAfterAuth("/admin");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminAuthShell
      eyebrow={mode === "update" ? "New password" : "Account recovery"}
      title={mode === "update" ? "Set a new password" : "Reset password"}
      description={
        mode === "update"
          ? "Choose a new password for your admin account."
          : "We'll email you a link to reset your password."
      }
      footer={
        mode === "update" ? undefined : (
          <Link href="/admin/login" className="underline underline-offset-4 hover:text-foreground">
            Back to sign in
          </Link>
        )
      }
    >
      {mode === "update" ? (
        <form onSubmit={updatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <AuthError>{error}</AuthError>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Saving…" : "Save password"}
          </Button>
        </form>
      ) : (
        <form onSubmit={sendReset} className="space-y-4">
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
          {error && <AuthError>{error}</AuthError>}
          {message && (
            <p className="rounded-lg border border-green-600/25 bg-green-600/10 px-3 py-2 text-sm text-green-800">
              {message}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AdminAuthShell>
  );
}
