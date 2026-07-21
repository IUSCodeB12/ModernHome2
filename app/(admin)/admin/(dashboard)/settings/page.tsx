import { MfaSetup } from "@/components/admin/mfa-setup";

export const metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <section className="mt-6 rounded-2xl border bg-card p-6">
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
