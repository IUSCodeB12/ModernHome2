"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { calcInvoiceTotals, normalizeLineItems } from "@/lib/invoice/calc";
import { formatAud } from "@/lib/quote/estimate";
import {
  adjustQuote,
  approveQuote,
  rejectQuote,
} from "@/app/(admin)/admin/(dashboard)/quotes/actions";

type Draft = { description: string; quantity: string; unit_price_cents: string };

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function QuoteActions({
  quoteId,
  status,
  estimateMidpointCents,
}: {
  quoteId: string;
  status: string;
  estimateMidpointCents: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<Draft[]>([
    { description: "Labour & installation", quantity: "1", unit_price_cents: centsToInput(estimateMidpointCents) },
  ]);

  const decided = status === "rejected" || status === "expired";

  const parsedItems = items.map((it) => ({
    description: it.description,
    quantity: Number(it.quantity) || 0,
    unit_price_cents: Math.round((Number(it.unit_price_cents) || 0) * 100),
  }));
  const totals = calcInvoiceTotals(normalizeLineItems(parsedItems));

  function handleApprove() {
    startTransition(async () => {
      const res = await approveQuote({ quoteId });
      if (res.ok) {
        toast.success(`Approved at ${formatAud(res.data.finalQuoteCents)}. Customer notified.`);
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
          <Button className="w-full" onClick={handleApprove} disabled={pending}>
            <Check /> Approve as-is ({formatAud(estimateMidpointCents)})
          </Button>
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

      {/* Adjust dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adjust quote</DialogTitle>
            <DialogDescription>
              Build the final quote from line items. GST is calculated at 10%.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_4rem_6rem_2rem] gap-2 text-xs text-muted-foreground">
              <span>Description</span>
              <span>Qty</span>
              <span>Unit $</span>
              <span />
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_4rem_6rem_2rem] items-center gap-2">
                <Input
                  value={item.description}
                  placeholder="Description"
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, j) => (j === i ? { ...it, description: e.target.value } : it))
                    )
                  }
                />
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={item.quantity}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, j) => (j === i ? { ...it, quantity: e.target.value } : it))
                    )
                  }
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price_cents}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, j) => (j === i ? { ...it, unit_price_cents: e.target.value } : it))
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={items.length === 1}
                  onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setItems((prev) => [...prev, { description: "", quantity: "1", unit_price_cents: "0.00" }])
              }
            >
              <Plus /> Add line
            </Button>
          </div>

          <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal (ex GST)</span>
              <span>{formatAud(totals.subtotal_cents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (10%)</span>
              <span>{formatAud(totals.gst_cents)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatAud(totals.total_cents)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={handleAdjust} disabled={pending || totals.total_cents <= 0}>
              Save & send ({formatAud(totals.total_cents)})
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
