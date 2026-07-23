import Link from "next/link";
import { redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatAud } from "@/lib/quote/estimate";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My bookings",
  robots: { index: false, follow: false },
};

export default async function PortalPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-bold tracking-tight">My bookings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Supabase isn&apos;t configured yet — bookings will appear here once
          it&apos;s connected.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/portal");

  const { data: quotes } = await supabase
    .from("quote_requests")
    .select(
      "id, status, estimate_low_cents, estimate_high_cents, final_quote_cents, created_at, services(name), bookings(id, status, slot_start, slot_end, deposit_cents)"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold tracking-tight">My bookings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your quotes and jobs, all in one place.
      </p>

      {!quotes?.length ? (
        <div className="mt-8 rounded-xl border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing here yet — get your first quote in a few minutes.
          </p>
          <Link
            href="/quote"
            className="mt-3 inline-block text-sm font-medium underline"
          >
            Get an instant quote
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {quotes.map((quote) => {
            const booking = quote.bookings;
            return (
              <li key={quote.id}>
                <Link
                  href={`/portal/${quote.id}`}
                  className="card-lift flex items-center justify-between gap-3 rounded-xl border bg-card p-4 hover:border-foreground/20"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {quote.services?.name ?? "Service"}
                      </span>
                      <StatusBadge status={booking?.status ?? quote.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {quote.final_quote_cents
                        ? `Final quote ${formatAud(quote.final_quote_cents)}`
                        : quote.estimate_low_cents && quote.estimate_high_cents
                          ? `Est. ${formatAud(quote.estimate_low_cents)} – ${formatAud(quote.estimate_high_cents)}`
                          : "Estimate pending"}
                    </p>
                    {booking?.slot_start && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatInTimeZone(
                          new Date(booking.slot_start),
                          BUSINESS_TIME_ZONE,
                          "EEE d MMM, HH:mm"
                        )}
                        {booking.slot_end &&
                          ` – ${formatInTimeZone(new Date(booking.slot_end), BUSINESS_TIME_ZONE, "HH:mm")}`}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
