import { getAdminQuotes } from "@/lib/admin/quotes-data";
import { QuotesTable } from "@/components/admin/quotes-table";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const { quotes, demo } = await getAdminQuotes();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quotes</h1>
        <p className="text-sm text-muted-foreground">
          Review requests, adjust pricing, and send quotes.
          {demo && " (Demo data — Supabase not configured.)"}
        </p>
      </div>
      <QuotesTable quotes={quotes} />
    </div>
  );
}
