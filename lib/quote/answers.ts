import { parseOptions, type Answers } from "@/lib/quote/estimate";
import type { Tables } from "@/lib/database.types";

/** Human-readable label for a single answer, or null if unanswered. */
export function answerLabel(
  question: Pick<
    Tables<"service_questions">,
    "id" | "input_type" | "options"
  >,
  answers: Answers
): string | null {
  const value = answers[question.id];
  if (value === undefined || value === null || value === "") return null;
  const options = parseOptions(question.options);

  switch (question.input_type) {
    case "single_select":
      return options.find((o) => o.value === value)?.label ?? String(value);
    case "multi_select":
      if (!Array.isArray(value) || value.length === 0) return null;
      return value
        .map((v) => options.find((o) => o.value === v)?.label ?? v)
        .join(", ");
    case "number":
      return String(value);
    case "boolean":
      return value === true ? (options[0]?.label ?? "Yes") : "No";
    default:
      return String(value);
  }
}
