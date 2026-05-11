/**
 * Image search service — fetches a news-relevant photo from a configured provider.
 * Supports Pexels (primary), Pixabay (secondary), Unsplash (tertiary).
 * Falls back to null if no key is set; caller uses category pool as backup.
 *
 * Free API sign-ups:
 *   Pexels:   https://www.pexels.com/api/
 *   Pixabay:  https://pixabay.com/api/docs/
 *   Unsplash: https://unsplash.com/developers
 */

const STOP = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with","by","from",
  "as","is","are","was","were","be","been","has","have","had","will","would","could",
  "says","say","said","after","before","over","after","since","its","his","her","their",
  "new","all","no","not","up","out","about","into","over","also","just","more","than",
  "that","this","which","who","what","how","when","where","why","can","may","might",
]);

/** Derive a tight search query from an article title — 3-4 meaningful words. */
export function titleToImageQuery(title: string, keywords: string[] = []): string {
  // Prefer explicit keywords if they're clean
  const cleanKeywords = keywords
    .filter((k) => k.length > 3 && !STOP.has(k.toLowerCase()))
    .slice(0, 3);

  if (cleanKeywords.length >= 2) {
    return cleanKeywords.join(" ");
  }

  // Fall back: extract meaningful words from title
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));

  return words.slice(0, 4).join(" ") || title;
}

async function fetchWithTimeout(url: string, options: RequestInit, ms = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Pexels — https://www.pexels.com/api/  (200 req/hr free) */
async function searchPexels(query: string): Promise<string | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  try {
    const res = await fetchWithTimeout(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      { headers: { Authorization: key } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { photos?: { src: { large2x: string } }[] };
    return data.photos?.[0]?.src?.large2x ?? null;
  } catch {
    return null;
  }
}

/** Pixabay — https://pixabay.com/api/docs/  (unlimited free) */
async function searchPixabay(query: string): Promise<string | null> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return null;
  try {
    const params = new URLSearchParams({
      key,
      q: query,
      image_type: "photo",
      orientation: "horizontal",
      per_page: "3",
      safesearch: "true",
      min_width: "1200",
    });
    const res = await fetchWithTimeout(`https://pixabay.com/api/?${params}`, {});
    if (!res.ok) return null;
    const data = await res.json() as { hits?: { largeImageURL: string }[] };
    return data.hits?.[0]?.largeImageURL ?? null;
  } catch {
    return null;
  }
}

/** Unsplash — https://unsplash.com/developers  (50 req/hr free) */
async function searchUnsplash(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const params = new URLSearchParams({ query, orientation: "landscape", per_page: "3" });
    const res = await fetchWithTimeout(
      `https://api.unsplash.com/search/photos?${params}`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { results?: { urls: { regular: string } }[] };
    return data.results?.[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}

let _warnedMissingImageKey = false;

/**
 * Fetch the most relevant news photo for a given search query.
 * Tries Pexels → Pixabay → Unsplash in order. Returns null if none configured.
 */
export async function searchRelevantImage(query: string): Promise<string | null> {
  if (!_warnedMissingImageKey && !process.env.PEXELS_API_KEY && !process.env.PIXABAY_API_KEY && !process.env.UNSPLASH_ACCESS_KEY) {
    _warnedMissingImageKey = true;
    console.warn(
      "[imageSearch] No image API key configured. Articles will use Unsplash category fallbacks. " +
        "Sign up for a free key at https://www.pexels.com/api/ (200 req/hr) — set PEXELS_API_KEY in .env."
    );
  }
  return (
    (await searchPexels(query)) ??
    (await searchPixabay(query)) ??
    (await searchUnsplash(query)) ??
    null
  );
}
