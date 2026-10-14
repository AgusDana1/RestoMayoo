import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const AUTH_COOKIE_NAME = "resto_admin_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin pages: only allow access if authenticated
  if (pathname.startsWith("/admin")) {
    // Exclude login page from redirect loop
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);

    // If no session cookie exists or empty, redirect to admin login
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};

