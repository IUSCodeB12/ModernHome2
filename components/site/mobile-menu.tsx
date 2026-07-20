"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Animated mobile disclosure panel. Split out and lazy-loaded (see
 * site-header) so framer-motion stays out of the initial bundle — desktop
 * visitors never pay for it, and it only loads on the first menu tap.
 */
export default function MobileMenu({
  open,
  links,
  email,
}: {
  open: boolean;
  links: { href: string; label: string }[];
  email: string | null;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          id="mobile-nav"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden border-t border-border/70 bg-background/95 backdrop-blur md:hidden"
        >
          <div
            className="mx-auto flex max-w-6xl flex-col gap-1 px-8 py-5"
            style={{ perspective: 800 }}
          >
            {links.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, rotateX: -80 }}
                animate={{ opacity: 1, rotateX: 0 }}
                transition={{ delay: 0.04 + i * 0.07, duration: 0.3, ease: "easeOut" }}
                style={{ transformOrigin: "top" }}
              >
                <Link
                  href={link.href}
                  className="block py-2 text-xl font-medium text-foreground"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <Button asChild size="lg" className="mt-3 w-full rounded-full">
              <Link href="/quote">
                Get an instant quote
                <ArrowRight />
              </Link>
            </Button>

            {/* Account section */}
            <div className="mt-4 border-t pt-4">
              {email ? (
                <div className="space-y-1">
                  <p className="truncate px-1 pb-1 text-xs text-muted-foreground">{email}</p>
                  <Link
                    href="/portal/settings"
                    className="flex items-center gap-2 py-2 text-base font-medium text-foreground"
                  >
                    <Settings className="size-4" /> Account settings
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex items-center gap-2 py-2 text-base font-medium text-foreground"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="block py-2 text-base font-medium text-foreground"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
