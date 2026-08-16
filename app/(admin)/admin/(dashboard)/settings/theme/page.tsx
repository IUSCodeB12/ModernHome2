import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeEditor } from "@/components/admin/theme-editor/theme-editor";
import { getThemeEditorData } from "@/lib/admin/theme-data";

export const metadata = { title: "Website theme" };

// Reads the draft and the publish history, both admin-only. Never cacheable.
export const dynamic = "force-dynamic";

export default async function ThemeSettingsPage() {
  const data = await getThemeEditorData();

  return (
    <div className="-m-6 flex h-screen flex-col p-6">
      <Link
        href="/admin/settings"
        className="mb-3 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Settings
      </Link>

      {!data.configured && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Supabase isn&apos;t connected, so nothing here can be saved. The
          editor still works as a preview.
        </p>
      )}

      <ThemeEditor data={data} />
    </div>
  );
}
