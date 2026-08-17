"use client";

import { useState, useTransition } from "react";
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
import { formatAud } from "@/lib/quote/estimate";
import { recordInvoicePayment } from "@/app/(admin)/admin/(dashboard)/invoices/actions";

/**
 * Record money received against an invoice.
 *
 * Defaults to the full balance, because that's the overwhelmingly common case —
 * the customer paid the installer on the day. The amount stays editable so a
 * part payment can be entered without leaving the invoice looking untouched.
 */
export function InvoicePaymentDialog({
  invoiceId,
  invoiceNumber,
  balanceCents,
  amountPaidCents,
}: {
  invoiceId: string;
  invoiceNumber: string;
  balanceCents: number;
  amountPaidCents: number;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(() => (balanceCents / 100).toFixed(2));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const amountCents = Math.round((Number(amount) || 0) * 100);
  const remaining = Math.max(0, balanceCents - amountCents);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await recordInvoicePayment({ invoiceId, amountCents });
      if (res.ok) setOpen(false);
      else setError(res.error);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Reopening after a part payment should offer what's left now, not the
        // balance as it stood when the row first rendered.
        if (next) setAmount((balanceCents / 100).toFixed(2));
        setError(null);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">Record payment</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Payment for {invoiceNumber}</DialogTitle>
          <DialogDescription>
            {amountPaidCents > 0
              ? `${formatAud(amountPaidCents)} received so far — ${formatAud(balanceCents)} outstanding.`
              : `${formatAud(balanceCents)} outstanding.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label htmlFor="payment-amount" className="text-sm font-medium">
            Amount received
          </label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">$</span>
            <Input
              id="payment-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {amountCents <= 0
              ? "Enter an amount greater than zero."
              : remaining > 0
                ? `${formatAud(remaining)} will still be outstanding.`
                : "This settles the invoice and marks the job paid."}
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending || amountCents <= 0}>
            {pending ? "Saving…" : `Record ${formatAud(amountCents)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
