import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { FloatingCta } from "@/components/site/floating-cta";
import { Logo } from "@/components/site/logo";
import { BUSINESS } from "@/lib/business";

const footerLinks = [
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/quote", label: "Get a quote" },
  { href: "/portal", label: "My bookings" },
];

const legalLinks = [
  { href: "/legal/privacy", label: "Privacy policy" },
  { href: "/legal/terms-of-trade", label: "Terms of trade" },
  { href: "/legal/cancellation", label: "Cancellations & refunds" },
  { href: "/legal/warranty", label: "Workmanship warranty" },
];

/**
 * Deliberately does no auth work. Reading the session here made the layout
 * dynamic, which forced every page beneath it to render on demand and
 * blocked CDN caching site-wide. The header now reads its own session in
 * the browser — see `hooks/use-session-email.ts`.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="site-theme flex min-h-screen flex-col">
      <SiteHeader />

      {/* `isolate` keeps the ambient layer's negative z-index scoped to main,
          so it sits behind the page's sections but still above the body fill. */}
      <main className="relative isolate flex-1">
        <div aria-hidden className="ambient-ground" />
        {children}
      </main>
      <FloatingCta />

      <footer className="border-t bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:grid-cols-4">
          <div className="space-y-3 sm:col-span-1">
            <Logo size="sm" wordmark="plain" />
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

          {/*
           * Contact and registration details come from lib/business.ts and are
           * omitted while null. Printing a stand-in ABN or a fake address is
           * worse than printing nothing — it asserts something untrue on the
           * page customers check to see whether we're a real operator.
           */}
          <div className="space-y-2.5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Contact</p>
            {BUSINESS.phone && <p>{BUSINESS.phone}</p>}
            {BUSINESS.email && <p>{BUSINESS.email}</p>}
            <p>Servicing {BUSINESS.serviceArea}</p>
          </div>

          <div className="space-y-2.5 text-sm">
            <p className="font-medium text-foreground">Legal</p>
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="border-t">
          <div className="mx-auto w-full max-w-6xl px-4 py-5 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {BUSINESS.tradingName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
