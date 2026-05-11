import type { Article, FactClaim, Topic } from "@/lib/types";

export function buildArticlePrompt(topic: Topic, claims: FactClaim[]): string {
  const factsBlock = claims.length > 0
    ? [
        "Verified facts (cross-checked from multiple sources):",
        ...claims.map((claim, index) => `${index + 1}. ${claim.claim}`)
      ]
    : [
        `Use this summary as your starting point: ${topic.summary}`,
        "Source context: " + topic.sourceIds.map(() => "one news report").join(", ") + ".",
        "Since only one source is available, clearly note what is confirmed vs. what needs verification."
      ];

  return [
    "You are an expert news journalist for QuickGist, a magazine-grade publication.",
    `Headline: ${topic.title}`,
    `Primary keyword: ${topic.keywords[0] ?? topic.title}`,
    `Secondary keywords: ${topic.keywords.slice(1, 4).join(", ") || topic.category}`,
    "Audience: general readers, students, and early-career professionals.",
    "",
    "OUTPUT REQUIREMENTS:",
    "- Write 500–800 words in clean Markdown. Never fewer than 400 words — short output will be rejected and regenerated.",
    "- Start with a strong lede paragraph that hooks the reader.",
    "- Use exactly 3 H2 sections with descriptive, keyword-rich headings.",
    "- Write at least 4 paragraphs separated by blank lines.",
    "- Use 1–2 bullet lists where facts naturally group together.",
    "- Write in short paragraphs (2–4 sentences each).",
    "- Use plain, conversational English. Flesch reading ease above 60.",
    "- End with a \"Why this matters\" paragraph.",
    "- Never use cliché AI phrases: delve, tapestry, navigate, landscape, moreover, furthermore, in today's, it's worth noting, a testament to, fast-paced, ever-changing, digital age, without further ado.",
    "",
    "RULES:",
    "- Synthesize facts; do not copy source phrasing verbatim.",
    "- Stay neutral. Flag uncertainty when facts are thin.",
    "- If only one source exists, say so early in the article.",
    "- The primary keyword MUST appear in the first sentence, one H2 heading, and the closing paragraph.",
    "- Output will be automatically validated. Missing headings, short word count, or AI-clichés will cause rejection.",
    "",
    ...factsBlock
  ].join("\n");
}

export function buildExplainerPrompt(topic: Topic, claims: FactClaim[]): string {
  return [
    `Explain ${topic.title} to a smart 16-year-old.`,
    "Answer: what happened, why it matters, and what happens next.",
    "Use only these facts:",
    ...claims.map((claim) => `- ${claim.claim}`)
  ].join("\n");
}

export function buildSocialPrompt(topic: Topic, summary: string): string {
  return [
    `Create platform-specific social posts for ${topic.title}.`,
    `Summary: ${summary}`,
    "Include X thread, Instagram caption, LinkedIn post, and WhatsApp bullets."
  ].join("\n");
}

export function buildFaqPrompt(topic: Topic, summary: string): string {
  return [
    `Generate a 5-question FAQ for ${topic.title}.`,
    `Summary: ${summary}`,
    "Each Q must be one a curious reader would actually ask. Each A must be 2–3 sentences, plain language.",
    "Output strict JSON: { items: [{ question, answer }] }."
  ].join("\n");
}

export function buildVideoLongPrompt(topic: Topic, summary: string): string {
  return [
    `Write a 4-minute long-form video script about ${topic.title}.`,
    `Summary: ${summary}`,
    "Sections: Hook (15s), Context (60s), Key Facts (90s), Why it matters (60s), What to watch (45s).",
    "Tone: neutral, curious, conversational. Add visual cue suggestions in [brackets]."
  ].join("\n");
}

export function buildShortsPrompt(topic: Topic, summary: string): string {
  return [
    `Write a 60-second short-form video script for ${topic.title}.`,
    `Summary: ${summary}`,
    "Format: 4 beats (Hook 8s, What 15s, Why 25s, CTA 12s).",
    "Tone: punchy, plainspoken. Each beat ends with a clear visual cue in [brackets]."
  ].join("\n");
}

export function buildImagePromptsPrompt(topic: Topic, summary: string): string {
  return [
    `Write 4 image generation prompts for ${topic.title}.`,
    `Summary: ${summary}`,
    "Variants: 16:9 hero, 1:1 social, 9:16 vertical, 1.91:1 thumbnail.",
    "Style: editorial, photorealistic, no text overlay, neutral framing.",
    "Output strict JSON: { hero, square, vertical, thumbnail }."
  ].join("\n");
}

export function buildSeoRewritePrompt(article: Article, primaryKeyword: string, issues: string[]): string {
  return [
    `Improve the SEO of "${article.title}" without changing its meaning.`,
    `Primary keyword: ${primaryKeyword}`,
    `Issues to fix: ${issues.join("; ")}`,
    "Return strict JSON: { title, metaDescription, suggestions: string[] }."
  ].join("\n");
}
