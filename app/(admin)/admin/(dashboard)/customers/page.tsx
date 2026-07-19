import { getCustomers } from "@/lib/admin/customers-data";
import { CustomersList } from "@/components/admin/customers-list";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const { customers, demo } = await getCustomers();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Search customers and see their job history.
          {demo && " (Demo data — Supabase not configured.)"}
        </p>
      </div>
      <CustomersList customers={customers} />
    </div>
  );
}
