import { formatInTimeZone } from "date-fns-tz";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import type { LineItem } from "@/lib/invoice/calc";
import type { ReceiptData } from "@/lib/invoice/receipt-pdf";

/** The invoice columns a receipt needs, whichever client read them. */
export type ReceiptInvoice = {
  invoice_number: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  due_date: string | null;
  line_items: unknown;
  subtotal_cents: number;
  gst_cents: number;
  total_cents: number;
  deposit_credit_cents: number;
  amount_paid_cents: number;
};

/**
 * Build the printable receipt from an invoice row plus who and where it's for.
 *
 * Shared by the customer's `/portal/[id]/receipt` (RLS-scoped) and the admin's
 * `/admin/invoices/[id]/pdf` (service role). They reach the row by different
 * routes, but the document must be byte-identical: an admin checking what was
 * sent has to be looking at the same page the customer opened.
 */
export function toReceiptData(
  invoice: ReceiptInvoice,
  party: { serviceName: string; customerName: string; address: string | null }
): ReceiptData {
  const fmt = (iso: string) =>
    formatInTimeZone(new Date(iso), BUSINESS_TIME_ZONE, "d MMM yyyy");

  return {
    invoiceNumber: invoice.invoice_number,
    status: invoice.status,
    paidAt: invoice.paid_at ? fmt(invoice.paid_at) : null,
    issuedAt: fmt(invoice.created_at),
    dueDate: invoice.due_date ? fmt(invoice.due_date) : null,
    serviceName: party.serviceName,
    customerName: party.customerName,
    address: party.address,
    lineItems: (invoice.line_items ?? []) as LineItem[],
    subtotalCents: invoice.subtotal_cents,
    gstCents: invoice.gst_cents,
    totalCents: invoice.total_cents,
    depositCreditCents: invoice.deposit_credit_cents,
    balanceCents: Math.max(0, invoice.total_cents - invoice.amount_paid_cents),
  };
}

/** Formats a booking's address the way the receipt prints it. */
export function receiptAddress(booking: {
  address_line1?: string | null;
  suburb?: string | null;
  postcode?: string | null;
} | null | undefined): string | null {
  if (!booking?.address_line1) return null;
  return `${booking.address_line1}, ${booking.suburb ?? ""} ${booking.postcode ?? ""}`.trim();
}
