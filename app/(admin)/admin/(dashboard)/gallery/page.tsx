import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { GalleryManager } from "@/components/admin/gallery-manager";
import type { Tables } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const configured = isSupabaseConfigured();
  let items: Tables<"gallery_items">[] = [];
  let services: Pick<Tables<"services">, "id" | "name">[] = [];

  if (configured) {
    const supabase = await createClient();
    const [itemsRes, servicesRes] = await Promise.all([
      supabase.from("gallery_items").select("*").order("sort_order"),
      supabase.from("services").select("id, name").order("sort_order"),
    ]);
    items = itemsRes.data ?? [];
    services = servicesRes.data ?? [];
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gallery</h1>
        <p className="text-sm text-muted-foreground">
          Upload before/after pairs, reorder, and feature your best work.
          {!configured && " (Supabase not configured — uploads are disabled.)"}
        </p>
      </div>
      <GalleryManager items={items} services={services} configured={configured} />
    </div>
  );
}
