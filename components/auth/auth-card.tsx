import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Consistent framed card used across every auth screen. */
export function AuthCard({
  title,
  description,
  children,
  footer,
  back,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto flex min-h-[72vh] w-full max-w-6xl items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {back && (
          <Link
            href={back.href}
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> {back.label}
          </Link>
        )}
        <div className="relative rounded-2xl border bg-card p-6 shadow-[var(--shadow-elev-2)] sm:p-8">
          <h1 className="font-display text-2xl">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>
        {footer && (
          <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>
        )}
      </div>
    </div>
  );
}
