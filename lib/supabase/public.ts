import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Anon, cookie-free server client for **public content only**.
 *
 * This exists so public pages can be statically rendered and CDN-cached.
 * Reading cookies is a dynamic API — the moment a loader touches
 * `lib/supabase/server.ts`, Next opts the whole route out of static
 * rendering, which is what pinned every marketing page to a full
 * server render plus a database round trip on every single visit.
 *
 * It is also a safety boundary. A page rendered with the cookie-bound
 * client carries that visitor's data; caching such a page would serve one
 * customer's rows to everyone. Because this client never sees a session,
 * anything it returns is public by construction and safe to cache.
 *
 * Rules:
 * - Only for tables with an anon-readable RLS policy (services,
 *   service_questions, gallery_items, hero_slides, service_showcase).
 * - Never for quote_requests, bookings, invoices or profiles — those are
 *   owner-scoped and would silently return nothing here anyway.
 * - Never for anything that should vary per visitor.
 *
 * Use `lib/supabase/server.ts` for signed-in reads and
 * `lib/supabase/admin.ts` for service-role work.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
