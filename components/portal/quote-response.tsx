"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  respondToQuote,
  type QuoteResponseState,
} from "@/app/(site)/portal/[id]/actions";

/**
 * Accept / decline controls shown when a booking is awaiting the customer.
 * The amount and the ask live in the page headline — this is actions only.
 */
export function QuoteResponse({ quoteId }: { quoteId: string }) {
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
      <p className="text-sm font-medium text-emerald-700">{state.ok}</p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
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
