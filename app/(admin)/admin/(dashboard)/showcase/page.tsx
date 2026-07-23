import { ShowcaseManager } from "@/components/admin/showcase-manager";
import { getShowcaseAdmin } from "@/lib/admin/showcase-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Homepage showcase" };

export default async function AdminShowcasePage() {
  const { panels, services, demo } = await getShowcaseAdmin();

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight">Homepage showcase</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {demo
          ? "Demo mode — connect Supabase to manage panels."
          : "The scrolling “what we install” section on the homepage, in order."}
      </p>
      <div className="mt-6">
        <ShowcaseManager initial={panels} services={services} configured={!demo} />
      </div>
    </div>
  );
}
