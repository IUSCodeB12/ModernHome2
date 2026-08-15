import { ChevronDown } from "lucide-react";
import { PhotoStrip } from "@/components/portal/photo-strip";
import { parseOptions, type Answers } from "@/lib/quote/estimate";
import type { Tables } from "@/lib/database.types";

function answerLabel(
  question: Tables<"service_questions">,
  answers: Answers
): string | null {
  const value = answers[question.id];
  if (value === undefined || value === null || value === "") return null;
  const options = parseOptions(question.options);
  if (question.input_type === "single_select") {
    return options.find((o) => o.value === value)?.label ?? String(value);
  }
  if (question.input_type === "multi_select" && Array.isArray(value)) {
    return value.length
      ? value.map((v) => options.find((o) => o.value === v)?.label ?? v).join(", ")
      : null;
  }
  if (question.input_type === "boolean") {
    return value === true ? (options[0]?.label ?? "Yes") : "No";
  }
  return String(value);
}

/**
 * The answers the quote was built from, folded away.
 *
 * Open by default only while the price is still being decided — that's the
 * window where "did I say 65 inch or 75?" is a live question. Afterwards it's
 * reference material and shouldn't be taking up the page.
 */
export function EnquiryDetails({
  questions,
  answers,
  photoUrls,
  defaultOpen,
}: {
  questions: Tables<"service_questions">[];
  answers: Answers;
  photoUrls: string[];
  defaultOpen: boolean;
}) {
  const rows = [...questions]
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((q) => {
      const label = answerLabel(q, answers);
      return label ? [{ question: q, label }] : [];
    });

  if (!rows.length && !photoUrls.length) return null;

  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border bg-card p-5 [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer items-center justify-between font-medium">
        What you told us
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      <div className="mt-3 divide-y border-t pt-1">
        {rows.map(({ question, label }) =>
          // Free-text answers are paragraphs — give them their own block.
          question.input_type === "text" ? (
            <div key={question.id} className="py-2">
              <p className="text-sm text-muted-foreground">{question.question_text}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm font-medium">{label}</p>
            </div>
          ) : (
            <div
              key={question.id}
              className="flex items-start justify-between gap-4 py-2"
            >
              <span className="text-sm text-muted-foreground">
                {question.question_text}
              </span>
              <span className="text-right text-sm font-medium">{label}</span>
            </div>
          )
        )}
      </div>

      {photoUrls.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <p className="mb-2 text-sm text-muted-foreground">Photos you sent us</p>
          <PhotoStrip urls={photoUrls} />
        </div>
      )}
    </details>
  );
}
