/**
 * Tiny HTML → plain-text cleaner used for RSS summary normalization.
 * No external deps; conservative on entities.
 */
const namedEntities: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&nbsp;": " ",
  "&hellip;": "…",
  "&mdash;": "—",
  "&ndash;": "–",
  "&lsquo;": "‘",
  "&rsquo;": "’",
  "&ldquo;": "“",
  "&rdquo;": "”"
};

export function stripHtml(input: string | undefined | null): string {
  if (!input) return "";
  let text = input.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<\/(p|div|h[1-6]|li|br|tr)\s*>/gi, "\n");
  text = text.replace(/<br\s*\/?\s*>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&[a-z]+;|&#\d+;/gi, (match) => {
    if (match.startsWith("&#")) {
      const code = Number(match.slice(2, -1));
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    }
    return namedEntities[match.toLowerCase()] ?? "";
  });
  return text.replace(/\s+/g, " ").trim();
}

export function extractFirstImageUrl(item: Record<string, any>): string | undefined {
  if (item.enclosure?.url && /^https?:\/\//.test(item.enclosure.url)) return item.enclosure.url;
  const mediaContent = item["media:content"] || item.mediaContent;
  if (mediaContent) {
    const url = Array.isArray(mediaContent)
      ? mediaContent[0]?.["$"]?.url ?? mediaContent[0]?.url
      : mediaContent?.["$"]?.url ?? mediaContent?.url;
    if (typeof url === "string" && /^https?:\/\//.test(url)) return url;
  }
  const content = item["content:encoded"] ?? item.content ?? "";
  const match = typeof content === "string" ? content.match(/<img[^>]+src=["']([^"']+)["']/i) : null;
  if (match && /^https?:\/\//.test(match[1])) return match[1];
  return undefined;
}
