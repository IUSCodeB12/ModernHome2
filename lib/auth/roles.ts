import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Returns true when the given user has the 'admin' role.
 *
 * Reads the user's row from `profiles` (created automatically on signup
 * by the `handle_new_user` trigger). RLS lets users read their own
 * profile, so this works with the caller's session client.
 */
export async function isAdmin(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) return false;
  return data.role === "admin";
}
