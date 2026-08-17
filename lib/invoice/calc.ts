export type LineItem = {
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
};

export type InvoiceTotals = {
  subtotal_cents: number;
  gst_cents: number;
  total_cents: number;
};

/** Australian GST rate (10%), applied as a component of a GST-inclusive total. */
export const GST_RATE = 0.1;

/**
 * Days after issue that an invoice falls due.
 *
 * Zero — due on the day it's raised — because that's what the terms of trade
 * actually say: "The balance is payable on completion" (§8), and an invoice is
 * only raised once the job is complete. Publishing a longer term here would
 * quietly grant credit the terms don't offer.
 */
export const PAYMENT_TERMS_DAYS = 0;

export function lineItemTotal(quantity: number, unitPriceCents: number): number {
  return Math.round(quantity * unitPriceCents);
}

/**
 * Totals for a set of line items. Prices are treated as GST-inclusive
 * (standard for AU consumer quotes): subtotal is the ex-GST portion and
 * gst is the 1/11th component, so subtotal + gst = sum of line totals.
 */
export function calcInvoiceTotals(items: LineItem[]): InvoiceTotals {
  const total = items.reduce(
    (sum, item) => sum + lineItemTotal(item.quantity, item.unit_price_cents),
    0
  );
  const gst = Math.round(total - total / (1 + GST_RATE));
  return {
    subtotal_cents: total - gst,
    gst_cents: gst,
    total_cents: total,
  };
}

export function normalizeLineItems(
  items: Array<{ description: string; quantity: number; unit_price_cents: number }>
): LineItem[] {
  return items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price_cents: item.unit_price_cents,
    total_cents: lineItemTotal(item.quantity, item.unit_price_cents),
  }));
}

/** How much of an invoice is still owed, and whether it's late. */
export type InvoiceBalance = {
  /** The bill in full, GST inclusive. */
  totalCents: number;
  /** Received so far, including any deposit credited at issue time. */
  amountPaidCents: number;
  /** Still owed. Never negative — an overpayment reads as nil outstanding. */
  balanceCents: number;
  settled: boolean;
  /** Part-paid: something received, something still owed. */
  partiallyPaid: boolean;
  overdue: boolean;
};

export type InvoiceBalanceInput = {
  total_cents: number;
  amount_paid_cents: number;
  due_date: string | null;
  status: string;
};

/**
 * Derive an invoice's payment state.
 *
 * `overdue` is computed here rather than stored as a status. A stored flag
 * would need a nightly job to flip rows and would be wrong for a whole day
 * whenever that job missed a run; derived, it's correct on every read.
 *
 * `due_date` is a plain date (no time), so it's compared date-to-date against
 * `today` — a caller passes the current date in the business time zone. An
 * invoice due today is not yet overdue; it becomes overdue the day after.
 */
export function calcInvoiceBalance(
  invoice: InvoiceBalanceInput,
  today: string
): InvoiceBalance {
  const totalCents = invoice.total_cents;
  const amountPaidCents = invoice.amount_paid_cents;
  const balanceCents = Math.max(0, totalCents - amountPaidCents);
  const settled = invoice.status === "paid" || balanceCents === 0;

  return {
    totalCents,
    amountPaidCents,
    balanceCents,
    settled,
    partiallyPaid: !settled && amountPaidCents > 0,
    overdue: !settled && invoice.due_date !== null && invoice.due_date < today,
  };
}

/**
 * One word for where an invoice stands, for badges and filters.
 *
 * Collapses the stored status and the derived balance into a single label,
 * most-urgent first: being overdue matters more than being part paid, which
 * matters more than merely having been sent.
 */
export function invoiceStateLabel(
  status: string,
  balance: InvoiceBalance
): "paid" | "overdue" | "part paid" | "sent" | "draft" {
  if (balance.settled) return "paid";
  if (balance.overdue) return "overdue";
  if (balance.partiallyPaid) return "part paid";
  return status === "draft" ? "draft" : "sent";
}
