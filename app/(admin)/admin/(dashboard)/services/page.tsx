import { getDemoWizardData } from "@/lib/quote/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ServiceWithQuestions } from "@/lib/quote/types";
import { ServiceEditor } from "@/components/admin/service-editor";

export const dynamic = "force-dynamic";

async function getServices(): Promise<{ services: ServiceWithQuestions[]; demo: boolean }> {
  if (!isSupabaseConfigured()) {
    return { services: getDemoWizardData().services, demo: true };
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*, service_questions(*)")
    .order("sort_order");
  const services = (data ?? []).map((s) => ({
    ...s,
    service_questions: [...s.service_questions].sort((a, b) => a.sort_order - b.sort_order),
  }));
  return { services, demo: false };
}

export default async function AdminServicesPage() {
  const { services, demo } = await getServices();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Services &amp; pricing</h1>
        <p className="text-sm text-muted-foreground">
          Tune prices, questions and modifiers — changes apply to the quote
          wizard immediately, no code needed.
          {demo && " (Demo data — Supabase not configured; edits won't persist.)"}
        </p>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <ServiceEditor key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}
