import { describe, it, expect } from "vitest";
import { buildInvoiceItems, depositCreditCents, dueDateFor } from "@/lib/invoice/create";
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

describe("depositCreditCents", () => {
  const PAID = "2026-08-01T03:00:00.000Z";

  it("credits a deposit that has been paid", () => {
    expect(depositCreditCents(10000, PAID, 52000)).toBe(10000);
  });

  it("credits nothing when the deposit was asked for but never paid", () => {
    // The bug this guards: billing the full quote *and* keeping an uncollected
    // deposit off the bill is right, but crediting an unpaid deposit would hand
    // the customer money they never sent.
    expect(depositCreditCents(10000, null, 52000)).toBe(0);
    expect(depositCreditCents(10000, undefined, 52000)).toBe(0);
  });

  it("credits nothing when no deposit was set", () => {
    expect(depositCreditCents(null, PAID, 52000)).toBe(0);
    expect(depositCreditCents(0, PAID, 52000)).toBe(0);
  });

  it("caps the credit at the invoice total", () => {
    // A deposit bigger than the final bill is a refund, not a negative invoice.
    expect(depositCreditCents(60000, PAID, 52000)).toBe(52000);
  });

  it("leaves the full amount owing when the deposit is unpaid", () => {
    const total = calcInvoiceTotals(buildInvoiceItems([], 52000, "Heater")).total_cents;
    expect(total - depositCreditCents(10600, null, total)).toBe(52000);
  });
});

describe("dueDateFor", () => {
  it("uses the Melbourne date, not the UTC one", () => {
    // 9pm on 17 Aug in Melbourne is still 11am UTC on the 17th in winter, but
    // a late-evening job invoiced in daylight saving crosses the UTC date line:
    // 17 Aug 21:00 AEST === 17 Aug 11:00 UTC. Check the summer case, where
    // 31 Dec 23:00 AEDT === 31 Dec 12:00 UTC and a naive UTC read still says 31st,
    // then the genuinely ambiguous one: 1 Jan 09:00 AEDT === 31 Dec 22:00 UTC.
    expect(dueDateFor(new Date("2025-12-31T22:00:00.000Z"))).toBe("2026-01-01");
  });

  it("is due the day it is raised, matching the terms of trade", () => {
    expect(dueDateFor(new Date("2026-08-17T04:00:00.000Z"))).toBe("2026-08-17");
  });
});
