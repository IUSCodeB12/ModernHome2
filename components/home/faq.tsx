import { ChevronDown } from "lucide-react";
import { SectionHeader } from "@/components/home/section-header";
import { Reveal } from "@/components/home/reveal";

const FAQS = [
  {
    q: "How accurate is the instant estimate?",
    a: "The online range covers the vast majority of jobs. Once you add photos we confirm a fixed final price before any work starts — if something unusual turns up, you approve the adjusted quote first.",
  },
  {
    q: "Do you charge a callout fee?",
    a: "No. You see the price online before we visit, so there's nothing to pay just for showing up.",
  },
  {
    q: "What's the deposit for?",
    a: "A small deposit (20% of the estimate, minimum $50) locks in your arrival window. It comes straight off your final bill and is fully refundable if we can't do the job.",
  },
  {
    q: "Are you licensed and insured?",
    a: "Yes — fully licensed and insured for all listed services, and any electrical work is completed by an A-grade electrician.",
  },
  {
    q: "What if I need to reschedule?",
    a: "Reschedule free up to 24 hours before your window from your bookings page, or just give us a call.",
  },
];

export function Faq() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <SectionHeader number="05" eyebrow="Good to know" title="Questions, answered" align="center" />

      <Reveal className="mt-10 space-y-2">
        {FAQS.map((item) => (
          <details
            key={item.q}
            className="group rounded-xl border bg-card px-5 transition-colors open:bg-muted/40"
          >
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </p>
          </details>
        ))}
      </Reveal>

      {/* Rich-result eligibility for search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </section>
  );
}
