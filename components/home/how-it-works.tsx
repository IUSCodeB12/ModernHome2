import { Camera, CalendarClock, ClipboardList } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { SectionHeader } from "@/components/home/section-header";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Answer a few questions",
    body: "Tell us the job — TV size, wall type, how many metres. Takes about a minute.",
  },
  {
    icon: Camera,
    title: "Snap a couple of photos",
    body: "A quick shot of the spot lets us confirm your price. Optional, but it helps.",
  },
  {
    icon: CalendarClock,
    title: "Lock in a 2-hour window",
    body: "Pick a time that suits, pay a small deposit, and we'll be there.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <SectionHeader
        number="01"
        eyebrow="How it works"
        title="A quote in minutes, not days"
        align="center"
      />

      <div className="relative mt-14 grid gap-10 sm:grid-cols-3">
        {/* Connecting line (desktop) */}
        <div
          className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent sm:block"
          aria-hidden
        />
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 120} className="relative text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full border bg-background shadow-sm">
              <step.icon className="size-6" />
            </div>
            <div className="mx-auto mt-3 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {i + 1}
            </div>
            <h3 className="mt-3 font-semibold">{step.title}</h3>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
              {step.body}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
