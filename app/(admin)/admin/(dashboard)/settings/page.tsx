import Link from "next/link";
import { ChevronRight, Palette } from "lucide-react";
import { MfaSetup } from "@/components/admin/mfa-setup";

export const metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      {/*
       * The theme editor lives on its own route rather than inline: it wants
       * the full width for a live preview beside the controls, and the sidebar
       * is already eleven items long without adding a twelfth.
       */}
      <Link
        href="/admin/settings/theme"
        className="group mt-6 flex items-center gap-4 rounded-2xl border bg-card p-6 transition-all duration-200 ease-[var(--ease-out-soft)] hover:border-foreground/20 hover:shadow-md"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <Palette className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold">Website theme</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Colours, type and shape for the public site. Preview before you
            publish.
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>

      <section className="mt-4 rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Security</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Two-factor authentication for your admin account.
        </p>
        <div className="mt-4">
          <MfaSetup />
        </div>
      </section>

      <p className="mt-6 text-sm text-muted-foreground">
        More business settings arrive in a later phase.
      </p>
    </div>
  );
}
