import { describe, expect, it } from "vitest";
import {
  calculateDepositCents,
  calculateEstimate,
} from "@/lib/quote/estimate";

const fixedService = { base_price_cents: 14900, price_unit: "fixed" as const };
const perMetreService = { base_price_cents: 8500, price_unit: "per_metre" as const };

const selectQuestion = {
  id: "q-select",
  input_type: "single_select" as const,
  options: [
    { label: "A", value: "a", price_modifier_cents: 0, price_modifier_pct: null },
    { label: "B", value: "b", price_modifier_cents: 5000, price_modifier_pct: null },
  ],
};

const booleanQuestion = {
  id: "q-bool",
  input_type: "boolean" as const,
  options: [
    { label: "Yes", value: "yes", price_modifier_cents: 12000, price_modifier_pct: null },
  ],
};

const numberQuestion = { id: "q-num", input_type: "number" as const, options: null };

const pctQuestion = {
  id: "q-pct",
  input_type: "single_select" as const,
  options: [
    { label: "Cove", value: "cove", price_modifier_cents: null, price_modifier_pct: 20 },
  ],
};

describe("calculateEstimate", () => {
  it("returns base ±15% rounded to nearest $10 with no answers", () => {
    const e = calculateEstimate(fixedService, [], {});
    expect(e.midpoint_cents).toBe(14900);
    // 12665 → 12700 (nearest $10 = 1000c step); 17135 → 17100
    expect(e.low_cents).toBe(13000);
    expect(e.high_cents).toBe(17000);
    expect(e.low_cents % 1000).toBe(0);
    expect(e.high_cents % 1000).toBe(0);
  });

  it("adds flat modifiers from selects and booleans", () => {
    const e = calculateEstimate(
      fixedService,
      [selectQuestion, booleanQuestion],
      { "q-select": "b", "q-bool": true }
    );
    expect(e.midpoint_cents).toBe(14900 + 5000 + 12000);
  });

  it("ignores false booleans and unknown answers", () => {
    const e = calculateEstimate(fixedService, [selectQuestion, booleanQuestion], {
      "q-select": "nonexistent",
      "q-bool": false,
    });
    expect(e.midpoint_cents).toBe(14900);
  });

  it("multiplies base by quantity for per_metre services", () => {
    const e = calculateEstimate(perMetreService, [numberQuestion], { "q-num": 4 });
    expect(e.midpoint_cents).toBe(8500 * 4);
  });

  it("applies percentage modifiers to the quantity-scaled base", () => {
    const e = calculateEstimate(perMetreService, [numberQuestion, pctQuestion], {
      "q-num": 4,
      "q-pct": "cove",
    });
    expect(e.midpoint_cents).toBe(34000 + Math.round(34000 * 0.2));
  });

  it("defaults quantity to 1 when the number answer is missing or invalid", () => {
    expect(
      calculateEstimate(perMetreService, [numberQuestion], {}).midpoint_cents
    ).toBe(8500);
    expect(
      calculateEstimate(perMetreService, [numberQuestion], { "q-num": -2 })
        .midpoint_cents
    ).toBe(8500);
  });
});

describe("calculateDepositCents", () => {
  it("is 20% of the midpoint", () => {
    const e = { midpoint_cents: 100000, low_cents: 85000, high_cents: 115000 };
    expect(calculateDepositCents(e)).toBe(20000);
  });

  it("has a $50 floor", () => {
    const e = { midpoint_cents: 10000, low_cents: 8500, high_cents: 11500 };
    expect(calculateDepositCents(e)).toBe(5000);
  });
});
