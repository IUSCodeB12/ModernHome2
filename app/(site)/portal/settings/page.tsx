import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsForm } from "@/components/portal/settings-form";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { signOutEverywhere } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-bold tracking-tight">Account settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Supabase isn&apos;t configured yet — settings will appear here once it&apos;s connected.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/portal/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, suburb, postcode")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> My bookings
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Account settings</h1>

      <div className="mt-6">
        <SettingsForm
          email={user.email ?? ""}
          profile={
            profile ?? { full_name: null, phone: null, suburb: null, postcode: null }
          }
        />
      </div>

      <section className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-6">
        <div>
          <h2 className="font-serif text-lg">Sign out everywhere</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ends your sessions on every device.
          </p>
        </div>
        <form action={signOutEverywhere}>
          <Button type="submit" variant="outline">
            Sign out everywhere
          </Button>
        </form>
      </section>
    </div>
  );
}
