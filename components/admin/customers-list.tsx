"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { formatAud } from "@/lib/quote/estimate";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import type { CustomerRow } from "@/lib/admin/customers-data";

export function CustomersList({ customers }: { customers: CustomerRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.full_name, c.phone, c.suburb, c.postcode]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    );
  }, [customers, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, phone, suburb…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No customers found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((customer) => {
            const jobCount = customer.bookings.length;
            const spend = customer.quote_requests.reduce(
              (sum, q) => sum + (q.final_quote_cents ?? 0),
              0
            );
            return (
              <div key={customer.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{customer.full_name ?? "Unnamed customer"}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.phone ?? "—"}
                      {customer.suburb ? ` · ${customer.suburb} ${customer.postcode ?? ""}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">
                      {jobCount} job{jobCount === 1 ? "" : "s"}
                    </p>
                    {spend > 0 && <p className="font-medium">{formatAud(spend)} quoted</p>}
                  </div>
                </div>

                {customer.quote_requests.length > 0 && (
                  <div className="mt-3 space-y-1 border-t pt-3">
                    {customer.quote_requests.map((q) => {
                      const booking = customer.bookings.find((b) => b.id);
                      return (
                        <Link
                          key={q.id}
                          href={`/admin/quotes/${q.id}`}
                          className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent"
                        >
                          <div className="flex items-center gap-2">
                            <StatusBadge status={q.status} />
                            {booking?.slot_start && (
                              <span className="text-muted-foreground">
                                {formatInTimeZone(
                                  new Date(booking.slot_start),
                                  BUSINESS_TIME_ZONE,
                                  "d MMM"
                                )}
                              </span>
                            )}
                          </div>
                          <span className="text-muted-foreground">
                            {q.final_quote_cents != null ? formatAud(q.final_quote_cents) : "—"}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
