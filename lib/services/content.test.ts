import { describe, expect, it } from "vitest";
import { serviceCoverage } from "@/lib/services/content";
import type { Tables } from "@/lib/database.types";

type Question = Tables<"service_questions">;

function question(partial: Partial<Question>): Question {
  return {
    id: "q1",
    service_id: "s1",
    question_text: "What size is your TV?",
    input_type: "single_select",
    options: [
      { value: "43", label: 'Up to 43"', price_delta_cents: 0 },
      { value: "55", label: '55"', price_delta_cents: 2000 },
      { value: "65", label: '65"', price_delta_cents: 4000 },
      { value: "75", label: '75" or larger', price_delta_cents: 8000 },
    ],
    sort_order: 0,
    required: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...partial,
  } as Question;
}

describe("serviceCoverage", () => {
  it("keeps every option, not just the first couple", () => {
    // The old derivation sliced to 2, so a page advertising TV mounting
    // implied it couldn't do anything above 55".
    const [row] = serviceCoverage([question({})]);
    expect(row.values).toEqual(['Up to 43"', '55"', '65"', '75" or larger']);
  });

  it("groups options under the question they belong to", () => {
    const rows = serviceCoverage([
      question({ id: "a", sort_order: 0 }),
      question({
        id: "b",
        sort_order: 1,
        question_text: "What type of wall?",
        options: [
          { value: "plaster", label: "Plasterboard", price_delta_cents: 0 },
          { value: "brick", label: "Brick", price_delta_cents: 3000 },
        ],
      }),
    ]);
    expect(rows.map((r) => r.label)).toEqual([
      "What size is your TV?",
      "What type of wall?",
    ]);
    expect(rows[1].values).toEqual(["Plasterboard", "Brick"]);
  });

  it("collapses a boolean to the affirmative — 'No' is not a capability", () => {
    const [row] = serviceCoverage([
      question({
        input_type: "boolean",
        question_text: "Conceal the cables?",
        options: [
          { value: "yes", label: "Yes, hide my cables", price_delta_cents: 9000 },
          { value: "no", label: "No", price_delta_cents: 0 },
        ],
      }),
    ]);
    expect(row.values).toEqual(["Yes, hide my cables"]);
  });

  it("skips free-text questions, which have nothing to enumerate", () => {
    expect(
      serviceCoverage([
        question({ input_type: "text", question_text: "Describe the job", options: [] }),
      ])
    ).toEqual([]);
  });

  it("skips questions with no options at all", () => {
    expect(serviceCoverage([question({ options: [] })])).toEqual([]);
  });

  it("respects sort_order rather than array order", () => {
    const rows = serviceCoverage([
      question({ id: "b", sort_order: 2, question_text: "Second" }),
      question({ id: "a", sort_order: 1, question_text: "First" }),
    ]);
    expect(rows.map((r) => r.label)).toEqual(["First", "Second"]);
  });

  it("does not mutate the caller's array", () => {
    const input = [
      question({ id: "b", sort_order: 2 }),
      question({ id: "a", sort_order: 1 }),
    ];
    serviceCoverage(input);
    expect(input.map((q) => q.id)).toEqual(["b", "a"]);
  });
});
