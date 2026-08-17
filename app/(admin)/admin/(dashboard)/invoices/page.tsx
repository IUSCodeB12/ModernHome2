import { getInvoices } from "@/lib/admin/invoices-data";
import { InvoicesTable } from "@/components/admin/invoices-table";
import { formatAud } from "@/lib/quote/estimate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoices" };

/** A headline figure with its label. Muted until there's actually money in it. */
function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "alert";
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          tone === "alert" ? "text-red-700" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function AdminInvoicesPage() {
  const { invoices, totals, demo } = await getInvoices();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {demo
          ? "Demo data — Supabase not configured."
          : "Raised automatically when a job moves to Invoiced. Any deposit already paid is credited."}
      </p>

      {invoices.length === 0 ? (
        <div className="mt-6 rounded-xl border p-8 text-center text-sm text-muted-foreground">
          No invoices yet. Move a completed job to <strong>Invoiced</strong> to raise one.
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Outstanding" value={formatAud(totals.outstandingCents)} />
            <Stat
              label={
                totals.overdueCount === 1 ? "Overdue (1 invoice)" : `Overdue (${totals.overdueCount} invoices)`
              }
              value={formatAud(totals.overdueCents)}
              tone={totals.overdueCents > 0 ? "alert" : "default"}
            />
            <Stat label="Invoices raised" value={String(invoices.length)} />
          </div>

          <InvoicesTable invoices={invoices} />
        </>
      )}
    </div>
  );
}
