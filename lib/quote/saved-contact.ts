import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { EMPTY_CONTACT, type ContactDetails } from "@/lib/quote/wizard-state";

export type QuoteIdentity = {
  /** Session email, or null when signed out. */
  email: string | null;
  /** Details already on file, or null when signed out / nothing stored yet. */
  contact: ContactDetails | null;
};

/**
 * Who's booking, and what we already know about them.
 *
 * Every submit already writes name/phone/suburb/postcode back to `profiles`
 * (see `app/(site)/quote/actions.ts`) — nothing had ever read them again, so
 * returning customers retyped the lot. The street address and access notes
 * aren't on the profile at all; they're per-job columns on `bookings`, so the
 * most recent booking supplies them. That deliberately avoids a migration and
 * means every existing customer benefits immediately.
 *
 * Read with the cookie-bound client so RLS scopes it to the caller — this only
 * ever returns the requesting customer's own rows. `/quote` is force-dynamic,
 * so reading the session here doesn't make a cacheable route user-specific.
 */
export async function getQuoteIdentity(): Promise<QuoteIdentity> {
  const signedOut: QuoteIdentity = { email: null, contact: null };
  if (!isSupabaseConfigured()) return signedOut;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return signedOut;

  const email = user.email ?? null;

  const [profileRes, bookingRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, suburb, postcode")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("address_line1, suburb, postcode, access_notes")
      .eq("customer_id", user.id)
      .not("address_line1", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileRes.data;
  const booking = bookingRes.data;

  const contact: ContactDetails = {
    ...EMPTY_CONTACT,
    email: email ?? "",
    fullName: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    // The last job site beats the profile's suburb, which is only ever
    // whatever the most recent submit happened to set.
    addressLine1: booking?.address_line1 ?? "",
    suburb: booking?.suburb ?? profile?.suburb ?? "",
    postcode: booking?.postcode ?? profile?.postcode ?? "",
    accessNotes: booking?.access_notes ?? "",
  };

  // An email alone isn't worth surfacing as "your saved details".
  const hasSomething = Boolean(
    contact.fullName || contact.phone || contact.addressLine1
  );
  return { email, contact: hasSomething ? contact : null };
}
