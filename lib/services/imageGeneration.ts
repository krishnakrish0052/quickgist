/**
 * AI image generation service.
 *
 * Provider auto-detection (checked in order):
 *   - OpenAI DALL-E 3 (requires OPENAI_API_KEY)
 *   - Falls back to https://placehold.co/ deterministic placeholders
 *
 * In-memory cache keyed by stableHash(prompt + style) to avoid
 * duplicate API calls for the same prompt during a process lifetime.
 */

import OpenAI from "openai";
import { stableHash } from "@/lib/utils";

// ─── Style → DALL-E dimension mapping ──────────────────────────
export type ImageStyle = "hero" | "square" | "vertical" | "thumbnail";

const STYLE_SIZE: Record<ImageStyle, "1792x1024" | "1024x1024" | "1024x1792"> = {
  hero: "1792x1024",
  square: "1024x1024",
  vertical: "1024x1792",
  thumbnail: "1024x1024",
};

const STYLE_PLACEHOLDER_SIZE: Record<ImageStyle, string> = {
  hero: "1792x1024",
  square: "1024x1024",
  vertical: "1024x1792",
  thumbnail: "1024x1024",
};

export function styleToSize(style: ImageStyle): "1792x1024" | "1024x1024" | "1024x1792" {
  return STYLE_SIZE[style];
}

// ─── In-memory cache ───────────────────────────────────────────
const imageCache = new Map<string, { url: string; provider: string }>();

function cacheKey(prompt: string, style: ImageStyle): string {
  return stableHash(`${prompt}||${style}`);
}

// ─── Provider detection ────────────────────────────────────────
export function isImageGenerationAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

// ─── DALL-E 3 generation ───────────────────────────────────────
async function generateWithDalle(
  prompt: string,
  style: ImageStyle,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new OpenAI({ apiKey });
    const size = styleToSize(style);
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
    });
    return response.data?.[0]?.url ?? null;
  } catch (err) {
    console.warn("[imageGeneration] DALL-E 3 request failed:", (err as Error).message);
    return null;
  }
}

// ─── Placeholder fallback ──────────────────────────────────────
function placeholderUrl(style: ImageStyle, prompt: string): string {
  const dimensions = STYLE_PLACEHOLDER_SIZE[style];
  const encoded = encodeURIComponent(prompt.slice(0, 80));
  return `https://placehold.co/${dimensions}?text=${encoded}`;
}

// ─── Public API ────────────────────────────────────────────────

export interface GeneratedImage {
  url: string;
  provider: "openai" | "placeholder";
  cached: boolean;
}

/**
 * Generate a news image for the given prompt and style.
 *
 * Checks the in-memory cache first. Tries DALL-E 3 if OPENAI_API_KEY
 * is set; falls back to a deterministic placehold.co URL otherwise.
 *
 * Set `options.force` to true to bypass the cache and always call the API.
 */
export async function generateNewsImage(
  prompt: string,
  style: ImageStyle,
  options?: { force?: boolean },
): Promise<GeneratedImage> {
  const key = cacheKey(prompt, style);

  // Check cache (unless forced)
  if (!options?.force) {
    const cached = imageCache.get(key);
    if (cached) {
      return { url: cached.url, provider: cached.provider as "openai" | "placeholder", cached: true };
    }
  }

  // Try DALL-E 3
  const dalleUrl = await generateWithDalle(prompt, style);
  if (dalleUrl) {
    imageCache.set(key, { url: dalleUrl, provider: "openai" });
    return { url: dalleUrl, provider: "openai", cached: false };
  }

  // Fallback to placeholder
  const fallbackUrl = placeholderUrl(style, prompt);
  imageCache.set(key, { url: fallbackUrl, provider: "placeholder" });
  return { url: fallbackUrl, provider: "placeholder", cached: false };
}
