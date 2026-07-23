import { describe, it, expect } from "vitest";
import { buildInvoiceItems } from "@/lib/invoice/create";
import { calcInvoiceTotals, type LineItem } from "@/lib/invoice/calc";

const stored: LineItem[] = [
  { description: "Labour", quantity: 2, unit_price_cents: 12000, total_cents: 24000 },
  { description: "Bracket", quantity: 1, unit_price_cents: 8000, total_cents: 8000 },
];

describe("buildInvoiceItems", () => {
  it("bills the itemised breakdown when the admin sent one", () => {
    expect(buildInvoiceItems(stored, 99900, "TV Wall Mounting")).toEqual(stored);
  });

  it("ignores the final quote when a breakdown exists", () => {
    // The breakdown is what the customer accepted — the headline number must
    // not silently override the lines that justified it.
    const items = buildInvoiceItems(stored, 1, "TV Wall Mounting");
    expect(calcInvoiceTotals(items).total_cents).toBe(32000);
  });

  it("falls back to a single line at the final quoted price", () => {
    expect(buildInvoiceItems([], 52000, "LED Strip Lighting")).toEqual([
      {
        description: "LED Strip Lighting — installation",
        quantity: 1,
        unit_price_cents: 52000,
        total_cents: 52000,
      },
    ]);
  });

  it("treats null line items like an empty breakdown", () => {
    expect(buildInvoiceItems(null, 52000, "Heater")).toHaveLength(1);
    expect(buildInvoiceItems(undefined, 52000, "Heater")).toHaveLength(1);
  });

  it("bills nothing when there is no breakdown and no price", () => {
    expect(buildInvoiceItems([], 0, "Heater")).toEqual([]);
    expect(buildInvoiceItems(null, null, "Heater")).toEqual([]);
  });

  it("refuses to bill a negative quote", () => {
    expect(buildInvoiceItems([], -5000, "Heater")).toEqual([]);
  });

  it("produces totals whose GST split reconciles", () => {
    const items = buildInvoiceItems([], 52000, "LED Strip Lighting");
    const t = calcInvoiceTotals(items);
    expect(t.subtotal_cents + t.gst_cents).toBe(t.total_cents);
    expect(t.total_cents).toBe(52000);
    expect(t.gst_cents).toBe(4727);
  });
});
