import { describe, expect, it } from "vitest";
import { calcInvoiceTotals, normalizeLineItems } from "@/lib/invoice/calc";
import {
  LINE_CATALOGUE,
  SERVICE_TEMPLATES,
  templateForService,
} from "@/lib/invoice/line-presets";

describe("line catalogue", () => {
  it("has unique descriptions, so an added preset is unambiguous", () => {
    const all = LINE_CATALOGUE.flatMap((g) => g.lines.map((l) => l.description));
    expect(new Set(all).size).toBe(all.length);
  });

  it("prices everything but the adjustments group at or above zero", () => {
    for (const group of LINE_CATALOGUE) {
      for (const line of group.lines) {
        if (group.id === "adjustments") {
          expect(line.unit_price_cents).toBeLessThan(0);
        } else {
          expect(line.unit_price_cents).toBeGreaterThanOrEqual(0);
        }
        expect(line.quantity).toBeGreaterThan(0);
        expect(Number.isInteger(line.unit_price_cents)).toBe(true);
      }
    }
  });
});

describe("templateForService", () => {
  it("returns empty for an unknown or missing slug", () => {
    expect(templateForService("not-a-service")).toEqual([]);
    expect(templateForService(null)).toEqual([]);
    expect(templateForService(undefined)).toEqual([]);
  });

  it("gives every template a positive total", () => {
    for (const [slug, lines] of Object.entries(SERVICE_TEMPLATES)) {
      const totals = calcInvoiceTotals(normalizeLineItems(lines));
      expect(totals.total_cents, slug).toBeGreaterThan(0);
      expect(totals.subtotal_cents + totals.gst_cents).toBe(totals.total_cents);
    }
  });

  it("covers every seeded service slug", () => {
    for (const slug of [
      "tv-wall-mounting",
      "tv-floating-cabinet",
      "showcase-cabinet",
      "led-strip-lighting",
      "room-heater-installation",
      "custom-job",
    ]) {
      expect(templateForService(slug).length, slug).toBeGreaterThan(0);
    }
  });
});

describe("discount lines", () => {
  it("subtracts from the total and keeps GST consistent", () => {
    const items = normalizeLineItems([
      { description: "Installation labour", quantity: 2, unit_price_cents: 11000 },
      { description: "Discount", quantity: 1, unit_price_cents: -5000 },
    ]);
    const totals = calcInvoiceTotals(items);
    expect(totals.total_cents).toBe(17000);
    expect(totals.subtotal_cents + totals.gst_cents).toBe(totals.total_cents);
  });
});
