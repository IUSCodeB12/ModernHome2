import type { Json, Tables } from "@/lib/database.types";

export type QuestionOption = {
  label: string;
  value: string;
  price_modifier_cents: number | null;
  price_modifier_pct: number | null;
};

export type AnswerValue = string | string[] | number | boolean | null;
export type Answers = Record<string, AnswerValue>;

export type EstimateRange = {
  /** Calculated price before the ±15% spread, in cents. */
  midpoint_cents: number;
  low_cents: number;
  high_cents: number;
};

export function parseOptions(options: Json | null): QuestionOption[] {
  if (!Array.isArray(options)) return [];
  return options.filter(
    (o): o is QuestionOption =>
      typeof o === "object" && o !== null && "value" in o && "label" in o
  );
}

function roundToNearestTenDollars(cents: number): number {
  return Math.round(cents / 1000) * 1000;
}

/**
 * Price = base (× quantity for per_metre/per_hour, from the first `number`
 * answer) + flat modifiers + percentage modifiers (applied to the quantity-
 * scaled base). Range is ±15%, each end rounded to the nearest $10.
 */
export function calculateEstimate(
  service: Pick<Tables<"services">, "base_price_cents" | "price_unit">,
  questions: Pick<Tables<"service_questions">, "id" | "input_type" | "options">[],
  answers: Answers
): EstimateRange {
  let quantity = 1;
  if (service.price_unit !== "fixed") {
    const numberQuestion = questions.find((q) => q.input_type === "number");
    const raw = numberQuestion ? answers[numberQuestion.id] : null;
    const parsed = typeof raw === "string" ? parseFloat(raw) : Number(raw);
    quantity = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  const scaledBase = Math.round(service.base_price_cents * quantity);
  let total = scaledBase;

  for (const question of questions) {
    const answer = answers[question.id];
    if (answer === null || answer === undefined || answer === false) continue;

    const options = parseOptions(question.options);
    if (options.length === 0) continue;

    let selected: QuestionOption[] = [];
    if (question.input_type === "single_select" && typeof answer === "string") {
      selected = options.filter((o) => o.value === answer);
    } else if (question.input_type === "multi_select" && Array.isArray(answer)) {
      selected = options.filter((o) => answer.includes(o.value));
    } else if (question.input_type === "boolean" && answer === true) {
      selected = [options[0]];
    }

    for (const option of selected) {
      if (option.price_modifier_cents) total += option.price_modifier_cents;
      if (option.price_modifier_pct) {
        total += Math.round((scaledBase * option.price_modifier_pct) / 100);
      }
    }
  }

  total = Math.max(total, 0);

  return {
    midpoint_cents: total,
    low_cents: Math.max(roundToNearestTenDollars(Math.round(total * 0.85)), 0),
    high_cents: roundToNearestTenDollars(Math.round(total * 1.15)),
  };
}

/** Deposit: 20% of the estimate midpoint, minimum $50. */
export function calculateDepositCents(estimate: EstimateRange): number {
  return Math.max(Math.round(estimate.midpoint_cents * 0.2), 5000);
}

export function formatAud(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: dollars % 1 === 0 ? 0 : 2,
  }).format(dollars);
}
