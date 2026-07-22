import { formatInTimeZone } from "date-fns-tz";
import { getInvoices } from "@/lib/admin/invoices-data";
import { formatAud } from "@/lib/quote/estimate";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoices" };

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
};

export default async function AdminInvoicesPage() {
  const { invoices, demo } = await getInvoices();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {demo
          ? "Demo data — Supabase not configured."
          : "Invoices are created automatically when a job moves to Invoiced."}
      </p>

      {invoices.length === 0 ? (
        <div className="mt-6 rounded-xl border p-8 text-center text-sm text-muted-foreground">
          No invoices yet. Move a completed job to <strong>Invoiced</strong> to raise one.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Number</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Service</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{inv.invoice_number}</td>
                  <td className="px-4 py-2">{inv.customerName}</td>
                  <td className="px-4 py-2 text-muted-foreground">{inv.serviceName}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {formatInTimeZone(new Date(inv.created_at), BUSINESS_TIME_ZONE, "d MMM yyyy")}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatAud(inv.total_cents)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        STATUS_STYLES[inv.status] ?? STATUS_STYLES.draft
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
