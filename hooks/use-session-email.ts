"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * The signed-in user's email, read in the browser.
 *
 * The header used to receive this as a prop from the server layout, which
 * meant a `getUser()` call on every single request. That made the layout
 * dynamic, and a dynamic layout forces every page under it to be dynamic —
 * which is what stopped the marketing pages ever being CDN-cached.
 *
 * Reading it here keeps those pages static. The trade-off is that auth state
 * resolves after hydration rather than being in the initial HTML.
 *
 * Uses `getSession()` (local, no network) rather than `getUser()` (verifies
 * with the auth server). That is deliberate: this value only labels a menu.
 * Every actual authorisation decision still happens server-side in the
 * middleware and in the /portal and /admin routes, so a stale value here
 * grants nothing.
 *
 * Returns `undefined` while still unknown, so callers can avoid flashing
 * "Sign in" at someone who is already signed in.
 */
export function useSessionEmail(): string | null | undefined {
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setEmail(data.session?.user?.email ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setEmail(session?.user?.email ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return email;
}
