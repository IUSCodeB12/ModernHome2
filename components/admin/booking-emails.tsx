"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MinusCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import { labelForTemplate } from "@/lib/email/labels";
import {
  getBookingEmails,
  type BookingEmail,
} from "@/app/(admin)/admin/(dashboard)/bookings/actions";

/**
 * What we've told this customer, and whether it actually arrived.
 *
 * Before `email_log` existed this question could only be answered by logging
 * into Resend. It matters most in the failure case: a bounced booking
 * confirmation means someone may be expecting nobody, or nobody expecting
 * someone.
 */

const PRESENTATION: Record<
  BookingEmail["status"],
  { label: string; icon: typeof CheckCircle2; tone: string }
> = {
  sent: { label: "Sent", icon: CheckCircle2, tone: "text-emerald-600" },
  failed: { label: "Failed", icon: AlertCircle, tone: "text-destructive" },
  pending: { label: "Sending…", icon: Loader2, tone: "text-muted-foreground" },
  // Local dev and preview deploys run without RESEND_API_KEY. Spelling that
  // out beats showing a tradie the word "skipped" and letting them wonder
  // whether the customer was missed.
  skipped: {
    label: "Not sent — email is stubbed here",
    icon: MinusCircle,
    tone: "text-muted-foreground",
  },
};

function EmailRow({ email }: { email: BookingEmail }) {
  const { label, icon: Icon, tone } = PRESENTATION[email.status];
  const failed = email.status === "failed";

  return (
    <li
      className={
        failed
          ? "rounded-lg border border-destructive/30 bg-destructive/5 p-2.5"
          : "p-2.5"
      }
    >
      <div className="flex items-start gap-2.5">
        <Icon className={`mt-0.5 size-4 shrink-0 ${tone}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <span className="text-sm font-medium">
              {labelForTemplate(email.template)}
            </span>
            <span
              className="shrink-0 text-xs text-muted-foreground"
              // Relative time is the scannable form; the exact local time is
              // what you need when comparing against a customer's "I never
              // got it" — so keep both.
              title={formatInTimeZone(
                new Date(email.createdAt),
                BUSINESS_TIME_ZONE,
                "EEE d MMM yyyy, h:mmaaa"
              )}
            >
              {formatDistanceToNow(new Date(email.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{email.recipient}</p>
          {email.status !== "sent" && (
            <p className={`mt-0.5 text-xs ${failed ? "text-destructive" : "text-muted-foreground"}`}>
              {label}
              {email.error ? ` — ${email.error}` : ""}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * "Nothing sent" and "couldn't load" are kept strictly apart. Collapsing a
 * failed read into an empty list would tell the tradie their customer was
 * never contacted, which is the opposite of what a broken panel means.
 */
type State =
  | { kind: "loading" }
  | { kind: "ready"; emails: BookingEmail[] }
  | { kind: "error"; message: string };

export function BookingEmails({ bookingId }: { bookingId: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getBookingEmails(bookingId);
    setState(
      res.ok
        ? { kind: "ready", emails: res.data.emails }
        : { kind: "error", message: res.error }
    );
    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const failures =
    state.kind === "ready"
      ? state.emails.filter((e) => e.status === "failed").length
      : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Delivery
          {failures > 0 && (
            <span className="ml-2 text-xs font-normal text-destructive">
              {failures} failed
            </span>
          )}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground"
          disabled={loading}
          onClick={() => void load()}
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {state.kind === "loading" ? (
        <p className="px-2.5 py-2 text-sm text-muted-foreground">Loading…</p>
      ) : state.kind === "error" ? (
        <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      ) : state.emails.length === 0 ? (
        <p className="px-2.5 py-2 text-sm text-muted-foreground">
          Nothing sent for this job yet.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {state.emails.map((email) => (
            <EmailRow key={email.id} email={email} />
          ))}
        </ul>
      )}
    </div>
  );
}
