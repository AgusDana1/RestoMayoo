/**
 * Optimize image URLs for mobile/tablet screens:
 * Automatically downsizes Unsplash URLs to mobile viewport resolution and WebP/AVIF format
 * with reduced quality for ultra-fast loading and lower memory usage.
 */
export function getOptimizedImageUrl(
  url?: string | null,
  fallback = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=75&auto=format"
): string {
  if (!url || typeof url !== "string") return fallback;

  if (url.includes("images.unsplash.com")) {
    try {
      const u = new URL(url);
      u.searchParams.set("w", "400");
      u.searchParams.set("q", "75");
      u.searchParams.set("auto", "format");
      return u.toString();
    } catch {
      return url;
    }
  }

  return url;
}

