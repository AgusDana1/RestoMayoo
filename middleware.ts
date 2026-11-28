import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const AUTH_COOKIE_NAME = "resto_admin_session";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "resto-mayo-secure-secret-token-key-2026-c7f8a49e-d301";

async function verifyTokenEdge(token: string): Promise<boolean> {
  try {
    // base64url -> utf8
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    const parts = decoded.split(":");
    if (parts.length !== 4) return false;

    const [userId, email, timestampStr, providedSignature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAge) return false;

    const payload = `${userId}:${email}:${timestamp}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedSignature = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (providedSignature.length !== expectedSignature.length) return false;
    let diff = 0;
    for (let i = 0; i < providedSignature.length; i++) {
      diff |= providedSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin pages: only allow access if authenticated with a valid signed token
  if (pathname.startsWith("/admin")) {
    // Exclude login page from redirect loop
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);
    const isValid = sessionCookie?.value
      ? await verifyTokenEdge(sessionCookie.value)
      : false;

    if (!isValid) {
      const loginUrl = new URL("/admin/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      if (sessionCookie) {
        response.cookies.delete(AUTH_COOKIE_NAME);
      }
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};

