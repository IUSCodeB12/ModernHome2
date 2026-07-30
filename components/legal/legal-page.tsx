import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { LegalToc, type TocItem } from "@/components/legal/legal-toc";
import { isBusinessRegistered } from "@/lib/business";

export type LegalMeta = { label: string; value: string };

const DOCUMENTS = [
  { href: "/legal/privacy", label: "Privacy policy" },
  { href: "/legal/terms-of-trade", label: "Terms of trade" },
  { href: "/legal/cancellation", label: "Cancellations & refunds" },
  { href: "/legal/warranty", label: "Workmanship warranty" },
];

/**
 * Shell for a legal document: editorial hero, sticky contents rail, and the
 * cross-links between documents.
 *
 * Pages own their own contents list because a Next layout can't receive props
 * from the page beneath it — so the two-column grid lives here in a component
 * the page composes, not in `layout.tsx`.
 */
export function LegalPage({
  title,
  accent,
  meta,
  toc,
  children,
}: {
  /** Leading words of the heading, set in Fraunces. */
  title: string;
  /** Trailing word, set in brass italic. */
  accent: string;
  meta: LegalMeta[];
  toc: TocItem[];
  children: React.ReactNode;
}) {
  const registered = isBusinessRegistered();

  return (
    <>
      <header className="relative overflow-hidden border-b bg-muted/40">
        {/* Warm brass wash, mirroring the framing used elsewhere on the site. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-32 size-[32rem] rounded-full bg-[radial-gradient(circle,var(--brand)_0%,transparent_62%)] opacity-[0.07]"
        />
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <p className="inline-flex items-center rounded-full border border-brand/25 bg-brand/10 px-3.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-foreground">
            Legal document
          </p>
          <h1 className="mt-6 max-w-2xl text-balance text-4xl leading-[1.1] tracking-tight sm:text-5xl">
            {title} <em className="not-italic text-brand sm:italic">{accent}</em>
          </h1>
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            {meta.map((item) => (
              <div key={item.label}>
                <dt className="text-[0.62rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="mt-1 text-[0.85rem]">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-0 px-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden py-12 lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-5rem)] lg:overflow-y-auto lg:border-r lg:pr-6">
          <LegalToc items={toc} />
        </aside>

        <main className="py-12 lg:pl-12">
          {!registered && (
            <div className="mb-12 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
              <div className="text-sm text-amber-900">
                <p className="font-medium">Draft — not yet in force</p>
                <p className="mt-1">
                  Highlighted details are outstanding until the business entity is
                  registered, and this document has not been reviewed by a lawyer.
                  It is excluded from search engines until then.
                </p>
              </div>
            </div>
          )}

          {children}

          <nav className="mt-16 border-t pt-6">
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              Other documents
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {DOCUMENTS.map((doc) => (
                <li key={doc.href}>
                  <Link
                    href={doc.href}
                    className="text-sm transition-colors hover:text-brand"
                  >
                    {doc.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </main>
      </div>
    </>
  );
}
