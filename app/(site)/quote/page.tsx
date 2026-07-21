import { addDays } from "date-fns";
import { QuoteWizard } from "@/components/quote/wizard";
import { getDemoWizardData } from "@/lib/quote/demo-data";
import type { QuoteWizardData } from "@/lib/quote/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Get an instant quote",
  description:
    "Answer a few questions, add photos and lock in a 2-hour arrival window. Fixed-price quote in minutes — no callout fees.",
};

async function getWizardData(): Promise<QuoteWizardData> {
  if (!isSupabaseConfigured()) {
    return getDemoWizardData();
  }

  const supabase = await createClient();

  const [servicesRes, rulesRes, blockedRes] = await Promise.all([
    supabase
      .from("services")
      .select("*, service_questions(*)")
      .eq("active", true)
      .order("sort_order"),
    supabase.from("availability_rules").select("*").eq("active", true),
    supabase
      .from("blocked_dates")
      .select("date")
      .gte("date", new Date().toISOString().slice(0, 10)),
  ]);

  // Busy intervals need the service role (customers can only read their own
  // bookings). Only slot times are passed to the client — nothing personal.
  let busy: QuoteWizardData["busy"] = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("bookings")
      .select("slot_start, slot_end, status")
      .neq("status", "cancelled")
      .gte("slot_start", new Date().toISOString())
      .lte("slot_start", addDays(new Date(), 16).toISOString());
    busy = data ?? [];
  } catch {
    console.warn("[quote] SUPABASE_SERVICE_ROLE_KEY missing — busy slots not excluded");
  }

  return {
    services: (servicesRes.data ?? []).map((s) => ({
      ...s,
      service_questions: [...s.service_questions].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
    })),
    rules: rulesRes.data ?? [],
    blockedDates: blockedRes.data ?? [],
    busy,
    configured: true,
  };
}

export default async function QuotePage() {
  const data = await getWizardData();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Get an instant quote
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Answer a few questions and lock in a time — takes about 3 minutes.
      </p>
      <div className="mt-6">
        <QuoteWizard data={data} />
      </div>
    </div>
  );
}
