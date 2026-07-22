"use client";

import { useState, useTransition } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  requestReschedule,
  type QuoteResponseState,
} from "@/app/(site)/portal/[id]/actions";

/** "Request a different time" for a booked/approved job. */
export function RescheduleRequest({
  quoteId,
  alreadyRequested,
}: {
  quoteId: string;
  alreadyRequested: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [state, setState] = useState<QuoteResponseState>(null);
  const [pending, startTransition] = useTransition();

  if (alreadyRequested || state?.ok) {
    return (
      <p className="text-sm text-muted-foreground">
        <CalendarClock className="mr-1 inline size-4" />
        Reschedule requested — we&apos;ll be in touch to arrange a new time.
      </p>
    );
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <CalendarClock /> Request a different time
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Which days or times suit you better? (optional)"
        rows={3}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => setState(await requestReschedule(quoteId, note)))
          }
        >
          {pending ? "Sending…" : "Send request"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
