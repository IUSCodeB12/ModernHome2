import { addDays } from "date-fns";
import { Clock, Save, Wallet } from "lucide-react";
import { QuoteWizard } from "@/components/quote/wizard";
import { getDemoWizardData } from "@/lib/quote/demo-data";
import { getServicePhotos } from "@/lib/services/data";
import { getQuoteIdentity } from "@/lib/quote/saved-contact";
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

  const [servicesRes, rulesRes, blockedRes, photos, identity] = await Promise.all([
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
    getServicePhotos(),
    getQuoteIdentity(),
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
    photos,
    configured: true,
    identity,
  };
}

export default async function QuotePage() {
  const data = await getWizardData();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-brand">
        Instant quote
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        Let&apos;s price your job.
      </h1>
      <p className="mt-4 max-w-md text-base text-muted-foreground">
        Answer a few questions and lock in a 2-hour arrival window. Your price
        updates as you go — no callout fee, no card needed.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="size-4 text-brand" />
          About 2 minutes
        </span>
        <span className="flex items-center gap-1.5">
          <Wallet className="size-4 text-brand" />
          Nothing to pay today
        </span>
        <span className="flex items-center gap-1.5">
          <Save className="size-4 text-brand" />
          Saved as you go
        </span>
      </div>
      <div className="mt-10">
        <QuoteWizard data={data} />
      </div>
    </div>
  );
}
