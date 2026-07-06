import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Session-Refresh + Routen-Schutz für die Middleware.
 * Muster laut Supabase-SSR-Doku: Cookies müssen sowohl auf dem Request
 * (für nachgelagerte Server Components) als auch auf der Response landen.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    supabaseUrl(),
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase nicht erreichbar → wie "nicht angemeldet" behandeln.
  }

  const path = request.nextUrl.pathname;
  const brauchtAuth = path.startsWith("/projekte");

  if (!user && brauchtAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("weiter", path);
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/projekte";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
