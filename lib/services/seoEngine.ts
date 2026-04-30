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

  const metaLength = article.metaDescription.length;
  const metaHasKeyword = keyword ? article.metaDescription.toLowerCase().includes(keyword.toLowerCase()) : false;
  const metaLengthScore = scoreFromRange(metaLength, [140, 160]);
  const metaScore = Math.round(metaLengthScore * 0.6 + (metaHasKeyword ? 40 : 0));
  if (metaLength < 110) {
    issues.push({ severity: "warning", message: "Meta description is short — target 140–160 chars.", field: "meta" });
    suggestions.push("Expand the meta description to better summarize the page.");
  }

  const flesch = fleschReadingEase(plain);
  const fleschScoreNorm = scoreFromRange(flesch, [55, 75]);
  if (flesch < 45) {
    issues.push({ severity: "warning", message: "Readability is low — break up long sentences.", field: "readability" });
    suggestions.push("Shorten sentences (max 20 words) and use plainer verbs.");
  }

  const headingCount = (article.contentMarkdown.match(/^##\s+/gm) ?? []).length;
  const bullets = (article.contentMarkdown.match(/^[-*]\s+/gm) ?? []).length;
  const idealHeadings: [number, number] = [3, 8];
  const structureScore = Math.round((scoreFromRange(headingCount, idealHeadings) + scoreFromRange(bullets, [2, 12])) / 2);
  if (headingCount < 3) {
    issues.push({ severity: "warning", message: "Add more H2 subheadings — aim for one every 200–300 words.", field: "structure" });
    suggestions.push("Insert 1–2 more H2 sections to break up the body.");
  }

  const internalLinks = (article.contentMarkdown.match(/\]\((?!https?:|mailto:|#)[^)]+\)/g) ?? []).length;
  const internalScore = scoreFromRange(internalLinks, [2, 6]);
  if (internalLinks < 2) {
    issues.push({ severity: "info", message: "Add at least 2 internal links to related coverage.", field: "internal_links" });
    suggestions.push("Link to 2–3 related explainers or category pages.");
  }

  const overall = Math.round(
    keywordScore * 0.2 +
      titleScore * 0.15 +
      metaScore * 0.1 +
      fleschScoreNorm * 0.2 +
      structureScore * 0.15 +
      internalScore * 0.1 +
      Math.min(100, (wordCount / 900) * 100) * 0.1
  );

  if (wordCount < 700) {
    issues.push({ severity: "critical", message: `Article is only ${wordCount} words — target 800+ for SEO.`, field: "wordCount" });
    suggestions.push("Expand the body to at least 800 words for better SERP performance.");
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
    issues,
    suggestions
  };
}
