"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export type ActionState = { ok?: string; error?: string } | null;

const profileSchema = z.object({
  full_name: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  suburb: z.string().trim().max(80).optional().or(z.literal("")),
  postcode: z
    .string()
    .trim()
    .regex(/^\d{4}$/u, "Enter a 4-digit postcode")
    .optional()
    .or(z.literal("")),
});

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/portal/settings");
  return { supabase, user };
}

/** Update the signed-in user's profile row. */
export async function updateProfile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    suburb: formData.get("suburb"),
    postcode: formData.get("postcode"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name || null,
      phone: parsed.data.phone || null,
      suburb: parsed.data.suburb || null,
      postcode: parsed.data.postcode || null,
    })
    .eq("id", user.id);

  if (error) return { error: "Couldn't save — please try again." };
  revalidatePath("/portal/settings");
  return { ok: "Profile saved." };
}

/** Start an email change — Supabase emails a confirmation to the new address. */
export async function changeEmail(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };

  const { supabase, user } = await requireUser();
  if (email.data.toLowerCase() === user.email?.toLowerCase()) {
    return { error: "That's already your email." };
  }

  const { error } = await supabase.auth.updateUser({ email: email.data });
  if (error) return { error: "Couldn't start the change — please try again." };
  return {
    ok: `Check ${email.data} — we sent a link to confirm the change.`,
  };
}

/** Sign out of every device/session. */
export async function signOutEverywhere(): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}

/** Permanently delete the account (service-role) and sign out. */
export async function deleteAccount(
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Account deletion isn't available right now." };
  }
  const { supabase, user } = await requireUser();

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "Couldn't delete your account — please contact support." };

  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
