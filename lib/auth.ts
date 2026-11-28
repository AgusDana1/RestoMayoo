import crypto from "crypto";

export const AUTH_COOKIE_NAME = "resto_admin_session";

// Secret used for signing session tokens
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "resto-mayo-secure-secret-token-key-2026-c7f8a49e-d301";

/**
 * Hash a password using Node's built-in scrypt with a random 16-byte salt.
 * Format: `scrypt:<saltHex>:<hashHex>`
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

/**
 * Verify a password against either a `scrypt:<salt>:<hash>` string or a legacy plaintext password.
 */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (stored.startsWith("scrypt:")) {
    const parts = stored.split(":");
    if (parts.length !== 3) return false;
    const [, salt, hashHex] = parts;
    const derived = crypto.scryptSync(password, salt, 64);
    const storedBuf = Buffer.from(hashHex, "hex");
    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
  }
  // Legacy plaintext fallback for existing seeded accounts
  const a = Buffer.from(password, "utf-8");
  const b = Buffer.from(stored, "utf-8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Generate a cryptographically signed session token:
 * format: `${userId}:${email}:${timestamp}:${signature}`
 */
export function createAdminToken(userId: number, email: string): string {
  const timestamp = Date.now();
  const payload = `${userId}:${email}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");

  const tokenData = Buffer.from(`${payload}:${signature}`).toString("base64url");
  return tokenData;
}

/**
 * Verify a session token signature and validity (max 7 days)
 */
export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return false;

    const [userId, email, timestampStr, providedSignature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Check expiration: 7 days
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAge) {
      return false;
    }

    const payload = `${userId}:${email}:${timestamp}`;
    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payload)
      .digest("hex");

    // Timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Checks whether the incoming Request has a valid admin session cookie
 */
export function isAdminAuthenticated(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const token = match[1];
  return verifyAdminToken(token);
}

