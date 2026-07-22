"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { calcInvoiceTotals, normalizeLineItems, type LineItem } from "@/lib/invoice/calc";
import { formatAud } from "@/lib/quote/estimate";
import { updateInvoiceItems } from "@/app/(admin)/admin/(dashboard)/invoices/actions";

type Draft = { description: string; quantity: string; unit_price_cents: string };

function toDraft(items: LineItem[]): Draft[] {
  if (!items.length) return [{ description: "", quantity: "1", unit_price_cents: "0.00" }];
  return items.map((it) => ({
    description: it.description,
    quantity: String(it.quantity),
    unit_price_cents: (it.unit_price_cents / 100).toFixed(2),
  }));
}

/** Edit an invoice's line items — e.g. adding extra on-site work agreed on the day. */
export function InvoiceEditor({
  invoiceId,
  invoiceNumber,
  lineItems,
}: {
  invoiceId: string;
  invoiceNumber: string;
  lineItems: LineItem[];
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Draft[]>(() => toDraft(lineItems));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parsed = items.map((it) => ({
    description: it.description,
    quantity: Number(it.quantity) || 0,
    unit_price_cents: Math.round((Number(it.unit_price_cents) || 0) * 100),
  }));
  const totals = calcInvoiceTotals(normalizeLineItems(parsed));

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateInvoiceItems({ invoiceId, lineItems: parsed });
      if (res.ok) setOpen(false);
      else setError(res.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Add work
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {invoiceNumber}</DialogTitle>
          <DialogDescription>
            Add extra on-site work agreed on the day. GST is recalculated at 10%.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex gap-2 text-xs font-medium text-muted-foreground">
            <span className="flex-1">Description</span>
            <span className="w-14 text-right">Qty</span>
            <span className="w-20 text-right">Unit $</span>
            <span className="w-8" />
          </div>
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                className="flex-1"
                value={item.description}
                placeholder="e.g. Extra bracket"
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((it, j) => (j === i ? { ...it, description: e.target.value } : it))
                  )
                }
              />
              <Input
                className="w-14 text-right"
                inputMode="numeric"
                value={item.quantity}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((it, j) => (j === i ? { ...it, quantity: e.target.value } : it))
                  )
                }
              />
              <Input
                className="w-20 text-right"
                inputMode="decimal"
                value={item.unit_price_cents}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((it, j) => (j === i ? { ...it, unit_price_cents: e.target.value } : it))
                  )
                }
              />
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-40"
                disabled={items.length === 1}
                onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setItems((prev) => [...prev, { description: "", quantity: "1", unit_price_cents: "0.00" }])
            }
          >
            <Plus /> Add line
          </Button>
        </div>

        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal (ex GST)</span>
            <span>{formatAud(totals.subtotal_cents)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>GST (10%)</span>
            <span>{formatAud(totals.gst_cents)}</span>
          </div>
          <div className="mt-1 flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatAud(totals.total_cents)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : `Save (${formatAud(totals.total_cents)})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
