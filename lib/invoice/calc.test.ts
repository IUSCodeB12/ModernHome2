import { describe, expect, it } from "vitest";
import { calcInvoiceTotals, normalizeLineItems } from "@/lib/invoice/calc";

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
