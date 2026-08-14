import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Booking confirmed. The warm dark banner echoes the site's CTA finale, so the
 * end of the wizard lands in the same room the customer started in.
 */
export function QuoteSuccess({ demo }: { demo: boolean }) {
  return (
    <div className="animate-enter-up overflow-hidden rounded-2xl border border-border bg-card shadow-elev-2">
      <div className="relative overflow-hidden bg-[#171513] px-8 py-12 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,177,99,0.22),transparent_65%)]" />
        <div className="relative">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand/15 ring-1 ring-brand/40">
            <CheckCircle2 className="size-7 text-brand" />
          </span>
          <p className="mt-5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-brand">
            Spot held
          </p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight text-white sm:text-4xl">
            You&apos;re booked in.
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm text-white/70">
            We&apos;ve got your details and held your arrival window. We&apos;ll
            review everything and confirm your final quote shortly.
          </p>
        </div>
      </div>

      <div className="p-6">
        {demo && (
          <p className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground">
            Demo mode — Supabase isn&apos;t configured, so nothing was saved.
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/">Back home</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/portal">
              View my bookings <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
