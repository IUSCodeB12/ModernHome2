import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { isAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export class AdminAuthError extends Error {
  constructor(message = "Not authorised") {
    super(message);
    this.name = "AdminAuthError";
  }
}

export type AdminContext = {
  user: User;
  /** Session-scoped client (RLS applies). */
  supabase: SupabaseClient<Database>;
  /** Service-role client (bypasses RLS) for admin writes. */
  admin: SupabaseClient<Database>;
};

/**
 * Asserts the current request is from a signed-in admin. Throws
 * AdminAuthError otherwise. Use at the top of every admin server action.
 */
export async function assertAdmin(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(supabase, user.id))) {
    throw new AdminAuthError();
  }

  return { user, supabase, admin: createAdminClient() };
}

export type ActionResult<T = void> =
  | ({ ok: true } & (T extends void ? object : { data: T }))
  | { ok: false; error: string };

/** Wraps an admin action with auth assertion + uniform error handling. */
export async function adminAction<T>(
  fn: (ctx: AdminContext) => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const ctx = await assertAdmin();
    const data = await fn(ctx);
    return { ok: true, data } as ActionResult<T>;
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return { ok: false, error: "You must be signed in as an admin." };
    }
    console.error("[admin action]", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong.";
    return { ok: false, error: message };
  }
}
