// /middleware.ts
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () =>
            request.cookies.getAll().map(({ name, value }) => ({
              name,
              value,
            })),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    // Redirect to homepage if trying to access dashboard unauthenticated
    if (path.startsWith("/dashboard") && (!user || error)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Redirect from "/" to role-specific dashboard if logged in
    if (path === "/" && user && !error) {
      try {
        const { data: userProfile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userProfile?.role === "participant") {
          return NextResponse.redirect(
            new URL("/dashboard/athlete", request.url),
          );
        } else {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      } catch (profileError) {
        console.error("Error fetching user profile:", profileError);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  } catch (e) {
    console.error("Middleware error:", e);
    // Fallback to rendering the page anyway
    return response;
  }

  return response;
}

// Match all paths except static/image/api assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)",
  ],
};
