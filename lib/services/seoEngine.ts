import type { Article } from "@/lib/types";
import { markdownToPlainText } from "@/lib/utils";

export interface SEOIssue {
  severity: "info" | "warning" | "critical";
  message: string;
  field?: string;
}

export interface SEOScore {
  overall: number;
  keyword: { density: number; score: number; primaryKeyword: string };
  title: { length: number; score: number; hasKeyword: boolean };
  meta: { length: number; score: number; hasKeyword: boolean };
  readability: { fleschScore: number; score: number; level: string };
  structure: { headingCount: number; bullets: number; score: number };
  internalLinks: { count: number; score: number };
  wordCount: number;
  imageSeo: { altCoverage: number; lazyLoaded: boolean; modernFormats: number; score: number };
  schemaValidation: { hasJsonLd: boolean; validType: boolean; hasDatePublished: boolean; score: number };
  canonicalUrl: { hasCanonical: boolean; score: number };
  socialMeta: { hasOgTitle: boolean; hasOgDescription: boolean; hasOgImage: boolean; score: number };
  issues: SEOIssue[];
  suggestions: string[];
}

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","if","to","of","in","on","for","with","at","by","from","as","is","it","this",
  "that","these","those","be","are","was","were","been","being","have","has","had","do","does","did","will",
  "would","should","could","may","might","must","shall","can","need","might","i","you","he","she","they","we"
]);

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function fleschReadingEase(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (sentences.length === 0 || words.length === 0) return 0;
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const asl = words.length / sentences.length;
  const asw = syllables / words.length;
  return Math.max(0, Math.min(100, 206.835 - 1.015 * asl - 84.6 * asw));
}

function readingLevel(score: number): string {
  if (score >= 80) return "very easy";
  if (score >= 70) return "easy";
  if (score >= 60) return "plain English";
  if (score >= 50) return "fairly difficult";
  if (score >= 30) return "difficult";
  return "very difficult";
}

function keywordDensity(text: string, keyword: string): number {
  if (!keyword) return 0;
  const tokens = text.toLowerCase().split(/\W+/).filter((t) => t && !STOP_WORDS.has(t));
  if (tokens.length === 0) return 0;
  const phrase = keyword.toLowerCase().split(/\s+/).filter(Boolean);
  if (phrase.length === 0) return 0;
  let hits = 0;
  for (let i = 0; i <= tokens.length - phrase.length; i++) {
    let match = true;
    for (let j = 0; j < phrase.length; j++) {
      if (tokens[i + j] !== phrase[j]) {
        match = false;
        break;
      }
    }
    if (match) hits += 1;
  }
  return hits / Math.max(1, tokens.length - phrase.length + 1);
}

function scoreFromRange(value: number, ideal: [number, number]): number {
  const [min, max] = ideal;
  if (value >= min && value <= max) return 100;
  if (value < min) return Math.max(0, (value / min) * 100);
  return Math.max(0, 100 - ((value - max) / max) * 100);
}

export function scoreArticle(article: Article, primaryKeyword?: string): SEOScore {
  const keyword = (primaryKeyword ?? article.tags[0] ?? "").trim();
  const plain = markdownToPlainText(article.contentMarkdown);
  const wordCount = plain.split(/\s+/).filter(Boolean).length;
  const issues: SEOIssue[] = [];
  const suggestions: string[] = [];

  // ── Keyword density (15%) ──
  const keywordDens = keyword ? keywordDensity(plain, keyword) : 0;
  const keywordScore = scoreFromRange(keywordDens, [0.005, 0.025]);
  if (keywordDens < 0.005) {
    issues.push({ severity: "warning", message: `Keyword "${keyword}" appears below the 0.5% density floor.`, field: "keyword" });
    suggestions.push(`Mention "${keyword}" naturally 1–2 more times in body copy.`);
  }
  if (keywordDens > 0.025) {
    issues.push({ severity: "warning", message: `Keyword "${keyword}" exceeds 2.5% density — risks keyword stuffing.`, field: "keyword" });
    suggestions.push(`Replace some occurrences of "${keyword}" with synonyms or pronouns.`);
  }

  // ── Title (12%) ──
  const titleLength = article.title.length;
  const titleHasKeyword = keyword ? article.title.toLowerCase().includes(keyword.toLowerCase()) : false;
  const titleLengthScore = scoreFromRange(titleLength, [50, 60]);
  const titleScore = Math.round(titleLengthScore * 0.6 + (titleHasKeyword ? 40 : 0));
  if (!titleHasKeyword && keyword) {
    issues.push({ severity: "warning", message: "Primary keyword missing from title.", field: "title" });
    suggestions.push("Move the primary keyword closer to the start of the title.");
  }
  if (titleLength > 65) {
    issues.push({ severity: "info", message: "Title may be truncated in SERPs.", field: "title" });
  }

  // ── Meta description (8%) ──
  const metaLength = article.metaDescription.length;
  const metaHasKeyword = keyword ? article.metaDescription.toLowerCase().includes(keyword.toLowerCase()) : false;
  const metaLengthScore = scoreFromRange(metaLength, [140, 160]);
  const metaScore = Math.round(metaLengthScore * 0.6 + (metaHasKeyword ? 40 : 0));
  if (metaLength < 110) {
    issues.push({ severity: "warning", message: "Meta description is short — target 140–160 chars.", field: "meta" });
    suggestions.push("Expand the meta description to better summarize the page.");
  }

  // ── Readability (16%) ──
  const flesch = fleschReadingEase(plain);
  const fleschScoreNorm = scoreFromRange(flesch, [55, 75]);
  if (flesch < 45) {
    issues.push({ severity: "warning", message: "Readability is low — break up long sentences.", field: "readability" });
    suggestions.push("Shorten sentences (max 20 words) and use plainer verbs.");
  }

  // ── Structure (12%) ──
  const headingCount = (article.contentMarkdown.match(/^##\s+/gm) ?? []).length;
  const bullets = (article.contentMarkdown.match(/^[-*]\s+/gm) ?? []).length;
  const idealHeadings: [number, number] = [3, 8];
  const structureScore = Math.round((scoreFromRange(headingCount, idealHeadings) + scoreFromRange(bullets, [2, 12])) / 2);
  if (headingCount < 3) {
    issues.push({ severity: "warning", message: "Add more H2 subheadings — aim for one every 200–300 words.", field: "structure" });
    suggestions.push("Insert 1–2 more H2 sections to break up the body.");
  }

  // ── Internal links (6%) ──
  const internalLinks = (article.contentMarkdown.match(/\]\((?!https?:|mailto:|#)[^)]+\)/g) ?? []).length;
  const internalScore = scoreFromRange(internalLinks, [2, 6]);
  if (internalLinks < 2) {
    issues.push({ severity: "info", message: "Add at least 2 internal links to related coverage.", field: "internal_links" });
    suggestions.push("Link to 2–3 related explainers or category pages.");
  }

  // ── Word count (8%) ──
  const wordCountScore = Math.min(100, (wordCount / 500) * 100);

  // ── Image SEO (8%) ──
  const imgTags = article.contentMarkdown.match(/<img\b[^>]*>/gi) ?? [];
  const mdImgTags = article.contentMarkdown.match(/!\[.*?\]\([^)]+\)/g) ?? [];
  const allImages = [...imgTags, ...mdImgTags];
  const imagesWithAlt = allImages.filter((img) => /alt=["'][^"']+["']/.test(img) || /!\[.+\]/.test(img)).length;
  const altCoverage = allImages.length > 0 ? imagesWithAlt / allImages.length : 0;
  const hasLazyLoading = imgTags.some((img) => /loading=["']lazy["']/.test(img));
  const modernFormatHints = article.contentMarkdown.match(/\.(webp|avif)\b/gi) ?? [];
  const imageSeoAltScore = allImages.length > 0 ? scoreFromRange(altCoverage, [0.8, 1.0]) : 100;
  const imageSeoLazyScore = hasLazyLoading ? 100 : (allImages.length > 0 ? 50 : 100);
  const imageSeoFormatScore = allImages.length > 0 ? scoreFromRange(modernFormatHints.length / allImages.length, [0.5, 1.0]) : 100;
  const imageSeoScore = Math.round(imageSeoAltScore * 0.5 + imageSeoLazyScore * 0.3 + imageSeoFormatScore * 0.2);

  if (allImages.length > 0 && altCoverage < 1) {
    const missing = allImages.length - imagesWithAlt;
    issues.push({ severity: "warning", message: `${missing} image(s) missing alt text — all images should be accessible.`, field: "imageSeo" });
    suggestions.push("Add descriptive alt text to all images.");
  }
  if (allImages.length > 0 && !hasLazyLoading) {
    issues.push({ severity: "info", message: "Images are not lazy-loaded — add loading=\"lazy\" for performance.", field: "imageSeo" });
    suggestions.push("Add loading=\"lazy\" to image tags for better Core Web Vitals.");
  }
  if (allImages.length > 0 && modernFormatHints.length < allImages.length) {
    issues.push({ severity: "info", message: "Consider using WebP/AVIF image formats for smaller file sizes.", field: "imageSeo" });
    suggestions.push("Serve images in WebP or AVIF format to improve page load speed.");
  }
  if (!article.heroImageUrl) {
    issues.push({ severity: "warning", message: "Article has no hero image — add one for better social card rendering.", field: "imageSeo" });
    suggestions.push("Add a relevant hero image to improve social share previews.");
  }

  // ── Schema validation (7%) ──
  const contentLower = article.contentMarkdown.toLowerCase();
  const hasJsonLdInContent = contentLower.includes("application/ld+json") || contentLower.includes("json-ld");
  const hasValidType = contentLower.includes('"@type"') || contentLower.includes("newsarticle") || contentLower.includes("news article");
  const hasDatePublishedInSchema = contentLower.includes("datepublished");
  const hasHeadlineInSchema = contentLower.includes('"headline"');
  let schemaScore = 0;
  if (hasJsonLdInContent) {
    let checks = 0;
    let passed = 0;
    if (hasValidType) passed++; checks++;
    if (hasDatePublishedInSchema) passed++; checks++;
    if (hasHeadlineInSchema) passed++; checks++;
    schemaScore = checks > 0 ? Math.round((passed / checks) * 100) : 50;
  } else {
    // Article will have JSON-LD injected at render time via schema.ts, so note but don't penalise heavily
    schemaScore = 60;
  }
  if (!hasJsonLdInContent) {
    issues.push({ severity: "info", message: "JSON-LD schema not present in article content — injected at render time.", field: "schema" });
    suggestions.push("Ensure the page template injects NewsArticle JSON-LD schema.");
  }

  // ── Canonical URL (3%) ──
  const contentHasCanonicalLink = /<link[^>]+rel=["']canonical["']/i.test(article.contentMarkdown);
  const hasCanonical = Boolean(article.canonicalUrl) || contentHasCanonicalLink;
  const canonicalScore = hasCanonical ? 100 : 0;
  if (!hasCanonical) {
    issues.push({ severity: "info", message: "No canonical URL found — set one to avoid duplicate-content penalties.", field: "canonical" });
    suggestions.push("Add a canonical URL to prevent duplicate content issues.");
  }

  // ── Social meta (5%) ──
  // OG tags are usually injected at render time via metadata; check article fields
  const hasOgTitle = !!article.title;
  const hasOgDescription = !!article.metaDescription;
  const hasOgImage = !!article.heroImageUrl;
  const socialMetaChecks = [hasOgTitle, hasOgDescription, hasOgImage].filter(Boolean).length;
  const socialMetaScore = Math.round((socialMetaChecks / 3) * 100);
  if (socialMetaChecks < 3) {
    const missingTags = [];
    if (!hasOgTitle) missingTags.push("og:title");
    if (!hasOgDescription) missingTags.push("og:description");
    if (!hasOgImage) missingTags.push("og:image");
    issues.push({ severity: "warning", message: `Social meta incomplete — missing ${missingTags.join(", ")}.`, field: "socialMeta" });
    suggestions.push("Ensure OG meta tags (title, description, image) are populated for social sharing.");
  }

  // ── Freshness bonus (additive) ──
  const publishedDate = article.publishedAt ? new Date(article.publishedAt) : null;
  const daysSincePublished = publishedDate ? (Date.now() - publishedDate.getTime()) / 86400000 : 999;
  const freshnessBonus = daysSincePublished < 1 ? 10 : daysSincePublished < 3 ? 5 : daysSincePublished < 7 ? 2 : 0;

  // ── Overall score ──
  const overall = Math.round(
    keywordScore * 0.15 +
      titleScore * 0.12 +
      metaScore * 0.08 +
      fleschScoreNorm * 0.16 +
      structureScore * 0.12 +
      internalScore * 0.06 +
      wordCountScore * 0.08 +
      imageSeoScore * 0.08 +
      schemaScore * 0.07 +
      canonicalScore * 0.03 +
      socialMetaScore * 0.05 +
      Math.min(100, freshnessBonus)
  );

  if (wordCount < 600) {
    issues.push({ severity: "critical", message: `Article is only ${wordCount} words — target 800+ for SEO.`, field: "wordCount" });
    suggestions.push("Expand the body to at least 800 words for better SERP performance.");
  } else if (wordCount < 800) {
    issues.push({ severity: "info", message: `Article is ${wordCount} words — 800+ is ideal for SEO depth.`, field: "wordCount" });
    suggestions.push("Consider expanding to 800+ words for stronger topical depth.");
  }

  return {
    overall: Math.max(0, Math.min(100, overall)),
    keyword: { density: keywordDens, score: Math.round(keywordScore), primaryKeyword: keyword },
    title: { length: titleLength, score: titleScore, hasKeyword: titleHasKeyword },
    meta: { length: metaLength, score: metaScore, hasKeyword: metaHasKeyword },
    readability: { fleschScore: Math.round(flesch), score: Math.round(fleschScoreNorm), level: readingLevel(flesch) },
    structure: { headingCount, bullets, score: Math.round(structureScore) },
    internalLinks: { count: internalLinks, score: Math.round(internalScore) },
    wordCount,
    imageSeo: {
      altCoverage: Math.round(altCoverage * 100),
      lazyLoaded: hasLazyLoading,
      modernFormats: modernFormatHints.length,
      score: Math.round(imageSeoScore),
    },
    schemaValidation: {
      hasJsonLd: hasJsonLdInContent,
      validType: hasValidType,
      hasDatePublished: hasDatePublishedInSchema,
      score: Math.round(schemaScore),
    },
    canonicalUrl: {
      hasCanonical,
      score: Math.round(canonicalScore),
    },
    socialMeta: {
      hasOgTitle,
      hasOgDescription,
      hasOgImage,
      score: Math.round(socialMetaScore),
    },
    issues,
    suggestions,
  };
}
