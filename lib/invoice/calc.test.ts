import { describe, expect, it } from "vitest";
import {
  calcInvoiceBalance,
  calcInvoiceTotals,
  invoiceStateLabel,
  normalizeLineItems,
} from "@/lib/invoice/calc";

describe("calcInvoiceTotals", () => {
  it("splits a GST-inclusive total so subtotal + gst = total", () => {
    const items = normalizeLineItems([
      { description: "Mount", quantity: 1, unit_price_cents: 14900 },
      { description: "Cable concealment", quantity: 1, unit_price_cents: 12000 },
    ]);
    const totals = calcInvoiceTotals(items);
    expect(totals.total_cents).toBe(26900);
    expect(totals.subtotal_cents + totals.gst_cents).toBe(totals.total_cents);
    // GST = round(26900 - 26900/1.1) = 2445
    expect(totals.gst_cents).toBe(2445);
    expect(totals.subtotal_cents).toBe(24455);
  });

  it("multiplies quantity into the line total", () => {
    const items = normalizeLineItems([
      { description: "LED strip", quantity: 4, unit_price_cents: 8500 },
    ]);
    expect(items[0].total_cents).toBe(34000);
    expect(calcInvoiceTotals(items).total_cents).toBe(34000);
  });

  it("is zero for no items", () => {
    expect(calcInvoiceTotals([])).toEqual({
      subtotal_cents: 0,
      gst_cents: 0,
      total_cents: 0,
    });
  });
});

describe("calcInvoiceBalance", () => {
  const TODAY = "2026-08-17";
  const base = { total_cents: 52000, amount_paid_cents: 0, due_date: null, status: "sent" };

  it("owes the full total when nothing has been paid", () => {
    const b = calcInvoiceBalance(base, TODAY);
    expect(b.balanceCents).toBe(52000);
    expect(b.settled).toBe(false);
    expect(b.partiallyPaid).toBe(false);
  });

  it("subtracts a credited deposit from the balance", () => {
    const b = calcInvoiceBalance({ ...base, amount_paid_cents: 10600 }, TODAY);
    expect(b.balanceCents).toBe(41400);
    expect(b.partiallyPaid).toBe(true);
    expect(b.settled).toBe(false);
  });

  it("settles when payments reach the total", () => {
    const b = calcInvoiceBalance({ ...base, amount_paid_cents: 52000 }, TODAY);
    expect(b.balanceCents).toBe(0);
    expect(b.settled).toBe(true);
    expect(b.partiallyPaid).toBe(false);
  });

  it("never reports a negative balance on an overpayment", () => {
    expect(calcInvoiceBalance({ ...base, amount_paid_cents: 60000 }, TODAY).balanceCents).toBe(0);
  });

  it("treats a paid status as settled even if the figures lag", () => {
    const b = calcInvoiceBalance({ ...base, status: "paid" }, TODAY);
    expect(b.settled).toBe(true);
    expect(b.overdue).toBe(false);
  });

  it("is not overdue on the due date itself", () => {
    expect(calcInvoiceBalance({ ...base, due_date: TODAY }, TODAY).overdue).toBe(false);
  });

  it("is overdue the day after", () => {
    expect(calcInvoiceBalance({ ...base, due_date: "2026-08-16" }, TODAY).overdue).toBe(true);
  });

  it("is never overdue without a due date", () => {
    expect(calcInvoiceBalance(base, TODAY).overdue).toBe(false);
  });

  it("is never overdue once settled", () => {
    const b = calcInvoiceBalance(
      { ...base, due_date: "2026-01-01", amount_paid_cents: 52000 },
      TODAY
    );
    expect(b.overdue).toBe(false);
  });
});

describe("invoiceStateLabel", () => {
  const TODAY = "2026-08-17";
  const label = (inv: Partial<Parameters<typeof calcInvoiceBalance>[0]> & { status?: string }) => {
    const full = {
      total_cents: 52000,
      amount_paid_cents: 0,
      due_date: null,
      status: "sent",
      ...inv,
    };
    return invoiceStateLabel(full.status, calcInvoiceBalance(full, TODAY));
  };

  it("reads paid when settled", () => {
    expect(label({ amount_paid_cents: 52000 })).toBe("paid");
  });

  it("prefers overdue over part paid", () => {
    // A part payment doesn't stop a bill being late — the urgent fact wins.
    expect(label({ amount_paid_cents: 10000, due_date: "2026-08-01" })).toBe("overdue");
  });

  it("reads part paid when something has been received and it's not late", () => {
    expect(label({ amount_paid_cents: 10000 })).toBe("part paid");
  });

  it("passes draft through untouched", () => {
    expect(label({ status: "draft" })).toBe("draft");
  });

  it("falls back to sent", () => {
    expect(label({})).toBe("sent");
  });
});
