import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Only the routes that actually gate on a session.
     *
     * This used to run on every non-static request "so sessions stay fresh
     * site-wide", but updateSession calls supabase.auth.getUser() — a network
     * round trip to the auth server — so every marketing page view paid for
     * one, and running middleware at all keeps a route from being served
     * straight from the CDN.
     *
     * Sessions still stay fresh: the browser client auto-refreshes tokens
     * (the header mounts it on every page via useSessionEmail), and anyone
     * arriving at a gated route gets refreshed here before it renders.
     */
    "/admin",
    "/admin/:path*",
    "/portal",
    "/portal/:path*",
    "/auth/:path*",
  ],
};
