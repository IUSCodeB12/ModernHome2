import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";

export default function AuthErrorPage() {
  return (
    <div className="site-theme">
      <AuthCard
        title="Link expired"
        description="This sign-in link is no longer valid — they can only be used once and expire after a short time."
      >
        <div className="space-y-5">
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
            <AlertTriangle className="size-4 text-amber-600" />
            No problem — just request a fresh code.
          </div>
          <Button asChild className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthCard>
    </div>
  );
}
