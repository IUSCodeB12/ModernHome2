import { cn } from "@/lib/utils";

/**
 * Content primitives for the legal documents.
 *
 * Structure adapted from the pattern used on our other site — numbered
 * sections, callouts, striped eligibility cards — but rebuilt on this site's
 * tokens: warm ivory surfaces, Fraunces headings, brass accent. No raw hex, so
 * these follow the theme rather than fighting it.
 */

/** A numbered document section. The `id` is what the contents rail tracks. */
export function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-b pb-12 last:border-b-0 last:pb-0 [&+*]:mt-12"
    >
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-brand">
        {number}
      </p>
      <h2 className="mt-2.5 font-serif text-[1.65rem] leading-tight tracking-tight">
        {title}
      </h2>
      <div className="mt-5 space-y-3.5 text-[0.95rem] leading-[1.8] text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground [&_a]:underline [&_a]:decoration-brand/40 [&_a]:underline-offset-2">
        {children}
      </div>
    </section>
  );
}

/** Brass-accented aside for an important qualification. */
export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-r-lg border border-l-[3px] border-brand/25 border-l-brand bg-brand/5 px-5 py-4 text-[0.9rem] leading-[1.75]">
      {children}
    </div>
  );
}

/**
 * The statutory notice that opens each document. Deliberately distinct from
 * {@link Callout} — it's a standing legal position, not an aside.
 */
export function Notice({
  tag,
  children,
}: {
  tag: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-12 rounded-r-lg border border-l-[3px] border-foreground/15 border-l-foreground/60 bg-muted/50 px-5 py-4">
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-foreground/70">
        {tag}
      </p>
      <p className="mt-2 text-[0.9rem] leading-[1.75] text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

/** Bulleted list with brass dots instead of default markers. */
export function Bullets({ children }: { children: React.ReactNode }) {
  return (
    <ul className="space-y-2.5">
      {children}
    </ul>
  );
}

export function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative pl-5 leading-[1.75] before:absolute before:left-0 before:top-[0.65em] before:size-[5px] before:rounded-full before:bg-brand/70">
      {children}
    </li>
  );
}

/** Grid of "what we collect" style category cards. */
export function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

export function DataCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-[0.85rem] font-medium text-foreground">{title}</p>
      <div className="mt-2 divide-y">
        {items.map((item) => (
          <p key={item} className="py-1.5 text-[0.85rem] leading-relaxed">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

/** Three-across grid for the "your rights" tiles. */
export function TileGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export function Tile({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-[0.85rem] font-medium text-foreground">{title}</p>
      <p className="mt-1.5 text-[0.8rem] leading-[1.65]">{children}</p>
    </div>
  );
}

type Verdict = "yes" | "no" | "maybe";

const STRIPE: Record<Verdict, string> = {
  yes: "bg-emerald-600",
  no: "bg-red-500",
  maybe: "bg-brand",
};

const BADGE: Record<Verdict, string> = {
  yes: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  no: "bg-red-50 text-red-800 ring-red-200",
  maybe: "bg-brand/10 text-foreground ring-brand/25",
};

/**
 * Striped eligibility card. The stripe and badge carry the answer so a reader
 * scanning a refund policy can see where they stand without reading prose —
 * which is the whole point of the document.
 */
export function Scenario({
  verdict,
  badge,
  title,
  children,
}: {
  verdict: Verdict;
  badge: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[4px_1fr] overflow-hidden rounded-xl border bg-card">
      <div className={STRIPE[verdict]} aria-hidden />
      <div className="p-4 sm:p-5">
        <span
          className={cn(
            "inline-block rounded-full px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] ring-1",
            BADGE[verdict]
          )}
        >
          {badge}
        </span>
        <p className="mt-2.5 text-[0.95rem] font-medium text-foreground">{title}</p>
        <p className="mt-1 text-[0.875rem] leading-[1.7]">{children}</p>
      </div>
    </div>
  );
}

export function ScenarioList({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}

/** Numbered vertical timeline for a step-by-step process. */
export function Timeline({ children }: { children: React.ReactNode }) {
  return <ol className="ml-2 space-y-6 border-l-2 pl-6">{children}</ol>;
}

export function Step({ step, children }: { step: string; children: React.ReactNode }) {
  return (
    <li className="relative before:absolute before:-left-[31px] before:top-1.5 before:size-2.5 before:rounded-full before:bg-brand before:ring-4 before:ring-background">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-brand">
        {step}
      </p>
      <p className="mt-1 leading-[1.7]">{children}</p>
    </li>
  );
}

/** Label/value rows — processing times, contact details. */
export function KeyValueGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-2.5 sm:grid-cols-2">{children}</div>;
}

export function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
      <span className="text-[0.85rem]">{label}</span>
      <span className="text-[0.85rem] font-medium text-foreground">{value}</span>
    </div>
  );
}
