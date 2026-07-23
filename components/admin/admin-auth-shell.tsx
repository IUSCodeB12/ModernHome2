import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Framed shell for the staff-facing auth screen (/admin/login).
 *
 * It sits outside the dashboard layout, so without this it renders as a bare
 * card on an empty page with no way back to the site. Echoes the public
 * header's editorial language — brand lockup, hairline rails, amber corner plus
 * marks — while the form controls stay sans, per the admin/site split.
 */

function PlusMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute z-10 text-brand/60 ${className ?? ""}`}
    >
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path d="M5.5 0v11M0 5.5h11" stroke="currentColor" strokeWidth="1" />
      </svg>
    </span>
  );
}

export function AdminAuthShell({
  eyebrow = "Staff access",
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Brand lockup — Fraunces wordmark, matching the public header */}
          <div className="mb-6 flex justify-center">
            <Link href="/" className="group flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-transform duration-300 ease-[var(--ease-spring)] group-hover:rotate-3 group-hover:scale-105">
                MH
              </span>
              <span
                className="text-lg tracking-tight"
                style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontWeight: 560 }}
              >
                ModernHome
              </span>
            </Link>
          </div>

          <div className="relative rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-elev-2)] sm:p-8">
            <PlusMark className="-left-[5px] -top-[5px]" />
            <PlusMark className="-right-[5px] -top-[5px]" />
            <PlusMark className="-left-[5px] -bottom-[5px]" />
            <PlusMark className="-right-[5px] -bottom-[5px]" />

            <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-brand">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            )}
            <div className="mt-6">{children}</div>
          </div>

          {footer && (
            <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Back to modernhome.com.au
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Error banner with enough weight to be noticed on a focused auth screen. */
export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {children}
    </p>
  );
}
