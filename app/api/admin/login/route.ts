import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { checkRateLimit, getClientIp, sanitizePlainString } from "../../../../lib/security";
import { createAdminToken, AUTH_COOKIE_NAME } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    
    // Brute force protection: max 5 login attempts per 10 minutes
    const rateLimit = checkRateLimit(`login:${clientIp}`, 5, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many failed login attempts. For security, your account is temporarily locked. Please try again later.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email = sanitizePlainString(body.email, 100);
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        {
          error: `Invalid email or password. (${rateLimit.remaining} attempts remaining)`,
        },
        { status: 401 }
      );
    }

    // Generate cryptographically signed token
    const token = createAdminToken(user.id, user.email);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set secure HTTP-only signed session cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing login" },
      { status: 500 }
    );
  }
}
