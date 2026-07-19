import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { demoQuotes, type AdminQuoteRow } from "@/lib/admin/demo";

const QUOTE_SELECT =
  "*, services(name, price_unit, base_price_cents, service_questions(*)), profiles(full_name, phone, suburb, postcode), bookings(*)";

export async function getAdminQuotes(): Promise<{
  quotes: AdminQuoteRow[];
  demo: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { quotes: demoQuotes(), demo: true };
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("quote_requests")
    .select(QUOTE_SELECT)
    .order("created_at", { ascending: false });
  return { quotes: (data ?? []) as unknown as AdminQuoteRow[], demo: false };
}

export async function getAdminQuote(id: string): Promise<{
  quote: AdminQuoteRow | null;
  photoUrls: Record<string, string>;
  demo: boolean;
}> {
  if (!isSupabaseConfigured()) {
    const quote = demoQuotes().find((q) => q.id === id) ?? null;
    return { quote, photoUrls: {}, demo: true };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("quote_requests")
    .select(QUOTE_SELECT)
    .eq("id", id)
    .maybeSingle();
  const quote = (data as unknown as AdminQuoteRow) ?? null;

  // Signed URLs for private quote-photos (valid 1 hour).
  const photoUrls: Record<string, string> = {};
  if (quote?.photo_urls?.length) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from("quote-photos")
      .createSignedUrls(quote.photo_urls, 3600);
    for (const item of signed ?? []) {
      if (item.signedUrl && item.path) photoUrls[item.path] = item.signedUrl;
    }
  }

  return { quote, photoUrls, demo: false };
}
