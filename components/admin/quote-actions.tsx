"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  QuotePriceBuilder,
  draftsToItems,
  initialDrafts,
  type Draft,
} from "@/components/admin/quote-price-builder";
import type { LineItem } from "@/lib/invoice/calc";
import { formatAud } from "@/lib/quote/estimate";
import {
  adjustQuote,
  approveQuote,
  rejectQuote,
} from "@/app/(admin)/admin/(dashboard)/quotes/actions";

export function QuoteActions({
  quoteId,
  status,
  estimateMidpointCents,
  serviceSlug = null,
  existingLineItems = [],
}: {
  quoteId: string;
  status: string;
  estimateMidpointCents: number;
  /** Drives which starter breakdown the price builder offers. */
  serviceSlug?: string | null;
  /** Any line-item quote already saved on this request. */
  existingLineItems?: LineItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<Draft[]>(() =>
    initialDrafts(existingLineItems, serviceSlug, estimateMidpointCents)
  );

  const decided = status === "rejected" || status === "expired";
  const canApproveAsIs = estimateMidpointCents > 0;
  const hasCustomQuote = existingLineItems.length > 0;

  const parsedItems = draftsToItems(items);

  function handleApprove(replaceCustomQuote = false) {
    startTransition(async () => {
      const res = await approveQuote({ quoteId, replaceCustomQuote });
      if (res.ok) {
        toast.success(`Approved at ${formatAud(res.data.finalQuoteCents)}. Customer notified.`);
        if (res.data.warning) toast.warning(res.data.warning);
        setReplaceOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleAdjust() {
    startTransition(async () => {
      const res = await adjustQuote({ quoteId, lineItems: parsedItems });
      if (res.ok) {
        toast.success(`Quote adjusted to ${formatAud(res.data.finalQuoteCents)}. Customer notified.`);
        if (res.data.warning) toast.warning(res.data.warning);
        setAdjustOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      const res = await rejectQuote({ quoteId, reason });
      if (res.ok) {
        toast.success("Quote rejected. Customer notified.");
        setRejectOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <section className="rounded-xl border p-4">
      <h2 className="font-medium">Actions</h2>
      {decided ? (
        <p className="mt-2 text-sm text-muted-foreground">
          This quote has been {status}. No further actions.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {/* A custom job carries no auto-estimate, so "approve at the
              midpoint" would approve it at $0. Pricing has to go through the
              line-item builder. */}
          {canApproveAsIs ? (
            <Button
              className="w-full"
              onClick={() => (hasCustomQuote ? setReplaceOpen(true) : handleApprove())}
              disabled={pending}
            >
              <Check /> Approve as-is ({formatAud(estimateMidpointCents)})
            </Button>
          ) : (
            <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
              No auto-estimate for this request — build the price below.
            </p>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setAdjustOpen(true)}
            disabled={pending}
          >
            <Pencil /> Adjust price…
          </Button>
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
            onClick={() => setRejectOpen(true)}
            disabled={pending}
          >
            <X /> Reject…
          </Button>
        </div>
      )}

      <QuotePriceBuilder
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        items={items}
        setItems={setItems}
        serviceSlug={serviceSlug}
        estimateMidpointCents={estimateMidpointCents}
        pending={pending}
        onSave={handleAdjust}
      />

      {/* Confirm discarding an existing custom quote */}
      <Dialog open={replaceOpen} onOpenChange={setReplaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard the custom quote?</DialogTitle>
            <DialogDescription>
              This request already has a custom line-item breakdown. Approving
              as-is replaces it with the flat estimate midpoint of{" "}
              {formatAud(estimateMidpointCents)} and the line items are lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplaceOpen(false)} disabled={pending}>
              Keep custom quote
            </Button>
            <Button variant="destructive" onClick={() => handleApprove(true)} disabled={pending}>
              Discard & approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject quote</DialogTitle>
            <DialogDescription>
              The customer will be notified with this reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Outside our service area."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={pending || reason.trim().length < 3}
            >
              Reject & notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
