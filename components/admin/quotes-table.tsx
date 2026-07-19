"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAud } from "@/lib/quote/estimate";
import type { AdminQuoteRow } from "@/lib/admin/demo";

const STATUS_FILTERS = ["all", "pending", "approved", "adjusted", "rejected", "expired"];

export function QuotesTable({ quotes }: { quotes: AdminQuoteRow[] }) {
  const [status, setStatus] = useState("all");
  const filtered =
    status === "all" ? quotes : quotes.filter((q) => q.status === status);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} quote{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Estimate</TableHead>
              <TableHead>Quote</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No quotes match this filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((quote) => (
                <TableRow
                  key={quote.id}
                  className="cursor-pointer"
                  onClick={() => {
                    window.location.href = `/admin/quotes/${quote.id}`;
                  }}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/quotes/${quote.id}`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {quote.profiles?.full_name ?? "Unknown"}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {quote.profiles?.suburb} {quote.profiles?.postcode}
                    </div>
                  </TableCell>
                  <TableCell>{quote.services?.name ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {quote.estimate_low_cents != null && quote.estimate_high_cents != null
                      ? `${formatAud(quote.estimate_low_cents)} – ${formatAud(quote.estimate_high_cents)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {quote.final_quote_cents != null
                      ? formatAud(quote.final_quote_cents)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={quote.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
