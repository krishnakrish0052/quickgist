import { routeAiTask, type AiResponse } from "@/lib/services/aiOrchestration";
import { markdownToPlainText } from "@/lib/utils";
import type { Article } from "@/lib/types";

// ─── AI Quality Analysis ─────────────────────────────────────────────

export interface AIQualityInsight {
  overallAssessment: string;
  depthScore: number;           // 0-100 — how substantive is the content?
  biasFraming: string;          // human-readable bias/framing assessment
  missingContext: string[];     // what context is missing?
  factQuality: string;          // assessment of factual grounding
  improvementRecommendations: string[];
}

export interface AISEOInsight {
  searchIntent: string;         // what intent does this article serve?
  contentGaps: string[];        // what topics/angles are missing?
  semanticKeywords: string[];   // related keywords to target
  titleOptimization: string;    // suggested title improvement
  metaOptimization: string;     // suggested meta description improvement
  competitiveAngle: string;     // how to differentiate from competing content
}

function isReal(ai: AiResponse): boolean {
  return ai.provider !== "deterministic";
}

function tryParseJson<T>(raw: string): T | null {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

// ─── AI Quality Analysis ─────────────────────────────────────────────

const QUALITY_ANALYSIS_PROMPT = `You are a senior editorial quality analyst. Analyze this news article and return a JSON assessment.

Article title: {TITLE}
Category: {CATEGORY}
Word count: {WORDCOUNT}
Content:
{CONTENT}

Return strict JSON:
{
  "overallAssessment": "2-3 sentence overall quality judgment",
  "depthScore": <0-100 number — how substantive and well-researched>,
  "biasFraming": "1 sentence on bias/framing — note if partisan language, loaded terms, or balanced presentation",
  "missingContext": ["missing angle 1", "missing angle 2"],
  "factQuality": "1 sentence on factual grounding — are claims attributed? sources diverse?",
  "improvementRecommendations": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3"]
}

Be direct and specific. If the article is thin or biased, say so clearly. If it's well-researched and balanced, acknowledge that.`;

export async function analyzeContentQuality(article: Article): Promise<{
  ai: AIQualityInsight | null;
  aiTraceId: string;
  provider: string;
}> {
  const plainText = markdownToPlainText(article.contentMarkdown);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  const prompt = QUALITY_ANALYSIS_PROMPT
    .replace("{TITLE}", article.title)
    .replace("{CATEGORY}", article.category)
    .replace("{WORDCOUNT}", String(wordCount))
    .replace("{CONTENT}", plainText.slice(0, 4000));

  const ai = await routeAiTask({
    task: "article",
    prompt,
    maxTokens: 800,
    temperature: 0.4,
    traceId: `quality-ai-${article.id}`
  });

  if (!isReal(ai)) {
    return { ai: null, aiTraceId: ai.id, provider: ai.provider };
  }

  const parsed = tryParseJson<AIQualityInsight>(ai.output);
  return { ai: parsed, aiTraceId: ai.id, provider: ai.provider };
}

// ─── AI SEO Analysis ─────────────────────────────────────────────────

const SEO_ANALYSIS_PROMPT = `You are a senior SEO strategist. Analyze this article's search optimization and return a JSON assessment.

Article title: {TITLE}
Meta description: {META}
Primary keyword: {KEYWORD}
Category: {CATEGORY}
Word count: {WORDCOUNT}
Content excerpt:
{CONTENT}

Return strict JSON:
{
  "searchIntent": "what search intent does this serve — informational, navigational, commercial, news?",
  "contentGaps": ["missing topic 1", "missing topic 2"],
  "semanticKeywords": ["related keyword 1", "related keyword 2", "related keyword 3", "related keyword 4"],
  "titleOptimization": "specific suggestion to improve CTR from SERPs",
  "metaOptimization": "specific suggestion to improve the meta description for click-through",
  "competitiveAngle": "what makes this content different or better than existing SERP results?"
}

Be specific and actionable. Every suggestion should be something an editor can implement immediately.`;

export async function analyzeSEO(article: Article, primaryKeyword?: string): Promise<{
  ai: AISEOInsight | null;
  aiTraceId: string;
  provider: string;
}> {
  const keyword = primaryKeyword ?? article.tags[0] ?? article.title.split(" ")[0];
  const plainText = markdownToPlainText(article.contentMarkdown);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  const prompt = SEO_ANALYSIS_PROMPT
    .replace("{TITLE}", article.title)
    .replace("{META}", article.metaDescription)
    .replace("{KEYWORD}", keyword)
    .replace("{CATEGORY}", article.category)
    .replace("{WORDCOUNT}", String(wordCount))
    .replace("{CONTENT}", plainText.slice(0, 3000));

  const ai = await routeAiTask({
    task: "seo_rewrite",
    prompt,
    maxTokens: 800,
    temperature: 0.4,
    traceId: `seo-ai-${article.id}`
  });

  if (!isReal(ai)) {
    return { ai: null, aiTraceId: ai.id, provider: ai.provider };
  }

  const parsed = tryParseJson<AISEOInsight>(ai.output);
  return { ai: parsed, aiTraceId: ai.id, provider: ai.provider };
}
