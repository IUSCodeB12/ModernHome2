import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { FloatingCta } from "@/components/site/floating-cta";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const footerLinks = [
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/quote", label: "Get a quote" },
  { href: "/portal", label: "My bookings" },
];

async function getSessionEmail(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const email = await getSessionEmail();

  return (
    <div className="site-theme flex min-h-screen flex-col">
      <SiteHeader email={email} />

      <main className="flex-1">{children}</main>
      <FloatingCta />

      <footer className="border-t bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:grid-cols-4">
          <div className="space-y-3 sm:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                MH
              </span>
              <span className="font-semibold tracking-tight">ModernHome</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Quality home improvement, priced online in minutes.
            </p>
          </div>

          <div className="space-y-2.5 text-sm">
            <p className="font-medium">Explore</p>
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="space-y-2.5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Contact</p>
            <p>0400 000 000</p>
            <p>hello@example.com.au</p>
            <p>Servicing Greater Melbourne</p>
          </div>

          <div className="space-y-2.5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Business</p>
            <p>ABN 00 000 000 000</p>
            <p>Licence 000000C</p>
            <p>Fully insured</p>
          </div>
        </div>
        <div className="border-t">
          <div className="mx-auto w-full max-w-6xl px-4 py-5 text-xs text-muted-foreground">
            © {new Date().getFullYear()} ModernHome. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
