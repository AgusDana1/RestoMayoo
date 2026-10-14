/**
 * Security and sanitization utilities
 * Protects against XSS, input tampering, and brute force attacks.
 */

// In-memory rate limiter store
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale rate limit entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Check if a request exceeds rate limit
 * @param key Unique identifier (e.g. `login:${ip}` or `order:${ip}`)
 * @param maxAttempts Maximum allowed attempts in the window
 * @param windowMs Window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime: now + windowMs,
    };
  }

  if (record.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetAt,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetTime: record.resetAt,
  };
}

/**
 * Extracts client IP from Request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "127.0.0.1";
}

/**
 * Strip dangerous HTML tags and script elements (XSS Prevention)
 */
export function sanitizeText(input: unknown, maxLength = 255): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "") // strip all HTML tags
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize plain string without HTML entities (for names & codes)
 */
export function sanitizePlainString(input: unknown, maxLength = 100): string {
  if (typeof input !== "string") return "";
  // Strip control characters, tags, and special SQL/script delimiters
  return input
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w\s\d.,\-#@]/gi, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate customer name
 */
export function isValidCustomerName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 50) return false;
  // Allow letters, numbers, spaces, dots, dashes
  return /^[a-zA-Z0-9\s.\-']+$/.test(name);
}

/**
 * Safely parse positive integer (prevent SQL injection / NaN / negative injection)
 */
export function parsePositiveInt(val: unknown): number | null {
  if (val === undefined || val === null) return null;
  const num = Number(val);
  if (!Number.isInteger(num) || num <= 0 || isNaN(num) || !isFinite(num)) {
    return null;
  }
  return num;
}

