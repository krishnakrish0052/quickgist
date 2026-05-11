import { createHash } from "node:crypto";

export function nowIso(): string {
  return new Date().toISOString();
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 92);
}

export function stableHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function estimateReadingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown-source";
  }
}

const STOP_WORDS = new Set([
  // articles / determiners
  "the","a","an","this","that","these","those","my","your","his","her","its","our","their",
  // conjunctions / prepositions
  "and","or","but","nor","so","yet","for","of","to","in","on","at","by","from","with",
  "as","into","onto","upon","about","above","below","between","through","during","before",
  "after","since","until","while","although","because","though","unless","whether","if",
  "then","than","when","where","which","who","whom","whose","what","how","why",
  // auxiliaries / modals
  "is","are","was","were","be","been","being","have","has","had","do","does","did",
  "will","would","could","should","may","might","shall","must","can","need","dare",
  "ought","used",
  // pronouns
  "it","its","he","she","we","they","them","him","us","me","you","i",
  // common high-frequency nouns / verbs that add no topic signal
  "said","say","says","told","tell","know","get","got","make","made","take","took",
  "come","came","go","went","see","saw","think","thought","look","looked","want",
  "new","also","just","more","most","some","any","all","no","not","up","out",
  "off","over","into","down","back","way","other","first","last","now","only",
  "even","still","such","own","same","much","many","both","each","every","been",
  "reading","having","being","doing","going","saying","making","taking","getting",
  // 2-char tokens to exclude
  "of","to","in","is","it","be","as","at","so","we","he","by","or","on","do",
  "if","me","my","up","an","go","no","us","am","pm",
]);

export function tokenSet(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
  );
}

export function jaccardSimilarity(left: string, right: string): number {
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);
  if (!leftTokens.size || !rightTokens.size) return 0;

  let intersection = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) intersection += 1;
  });

  const union = new Set([...leftTokens, ...rightTokens]).size;
  return intersection / union;
}

export function pickTopKeywords(text: string, limit = 8): string[] {
  const validTokens = tokenSet(text);
  const counts = new Map<string, number>();
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => validTokens.has(token))
    .forEach((token) => counts.set(token, (counts.get(token) ?? 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
}

export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_\-[\]()`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
