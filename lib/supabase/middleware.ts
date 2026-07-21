import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth/roles";
import type { Database } from "@/lib/database.types";

const LOGIN_PATH = "/admin/login";
/** Admin routes reachable while signed out (auth screens). */
const ADMIN_PUBLIC_PATHS = new Set([LOGIN_PATH, "/admin/reset"]);

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const isProtectedAdminRoute =
    pathname.startsWith("/admin") && !ADMIN_PUBLIC_PATHS.has(pathname);
  const isPortalRoute = pathname.startsWith("/portal");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase isn't configured yet — keep admin routes locked. Portal
    // renders its own "not configured" notice.
    // ADMIN_DEV_BYPASS=1 (development only) unlocks the admin UI with demo
    // data so it can be previewed before Supabase is linked.
    const devBypass =
      process.env.NODE_ENV === "development" &&
      process.env.ADMIN_DEV_BYPASS === "1";
    if (isProtectedAdminRoute && !devBypass) return redirectToLogin(request);
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: do not run code between createServerClient and
  // supabase.auth.getUser() — it can cause hard-to-debug logout issues.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedAdminRoute) {
    if (!user || !(await isAdmin(supabase, user.id))) {
      return redirectToLogin(request);
    }
    // Enforce 2FA (aal2) when the admin has enrolled a TOTP factor.
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      return redirectToLogin(request);
    }
  }

  // Portal requires any signed-in customer.
  if (isPortalRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}
