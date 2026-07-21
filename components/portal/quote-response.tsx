"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  respondToQuote,
  type QuoteResponseState,
} from "@/app/(site)/portal/[id]/actions";

/** Accept / decline controls shown when a booking is awaiting the customer. */
export function QuoteResponse({
  quoteId,
  amount,
}: {
  quoteId: string;
  amount: string;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<QuoteResponseState>(null);
  const [confirmingDecline, setConfirmingDecline] = useState(false);

  function respond(decision: "accept" | "decline") {
    startTransition(async () => {
      setState(await respondToQuote(quoteId, decision));
    });
  }

  if (state?.ok) {
    return (
      <div className="rounded-xl border border-green-600/30 bg-green-600/10 p-4 text-sm text-green-800">
        {state.ok}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <h2 className="font-medium">Your quote is ready</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We&apos;ve reviewed your job — the price is{" "}
        <span className="font-semibold text-foreground">{amount}</span>. Happy to go ahead?
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={() => respond("accept")} disabled={pending}>
          <Check /> {pending ? "Saving…" : "Accept quote"}
        </Button>
        {confirmingDecline ? (
          <Button
            variant="destructive"
            onClick={() => respond("decline")}
            disabled={pending}
          >
            <X /> Confirm decline
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => setConfirmingDecline(true)}
            disabled={pending}
          >
            Decline
          </Button>
        )}
      </div>

      {state?.error && <p className="mt-3 text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
