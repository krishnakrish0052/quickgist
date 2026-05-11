/**
 * Shared canonical list of AI-generated artifact phrases and markdown patterns.
 * Used across generation, quality checks, humanization, and sanitization.
 */

export const AI_ARTIFACT_PHRASES = [
  "as an ai",
  "i cannot",
  "certainly!",
  "of course!",
  "i'd be happy to",
  "in today's fast-paced world",
  "in today's digital age",
  "in today's digital era",
  "in today's digital landscape",
  "delve into",
  "tapestry of",
  "navigate the complexities",
  "navigate the challenges",
  "navigate the nuances",
  "it's worth noting",
  "it is worth noting",
  "it is worth mentioning",
  "it is important to note",
  "it is crucial to note",
  "it is essential to note",
  "a testament to",
  "stands as a testament",
  "in the grand scheme",
  "fast-paced",
  "ever-changing",
  "digital age",
  "in this article we",
  "as we delve",
  "as we explore",
  "as we uncover",
  "let's dive",
  "without further ado",
  "in the realm of",
  "in the world of",
  "dive deep into",
  "crucially",
  "not only that but",
  "comprehensive guide",
  "comprehensive overview",
  "comprehensive look",
  "comprehensive analysis",
  "robust solution",
  "robust framework",
  "robust approach",
  "synergize",
  "synergizing",
  "synergized",
  "leverage",
  "utilize",
  "in conclusion",
  "to summarize",
  "all in all",
  "the ever-evolving landscape",
  "in the evolving world",
  "moreover",
  "furthermore",
  "delve",
  "tapestry",
];

export const MARKDOWN_ARTIFACT_PATTERNS: RegExp[] = [
  // Unclosed bold: line has opening ** but no closing **
  /\*\*(?!.*\*\*).+$/m,
  // Standalone bold markers: orphan ** tokens
  /(?:^|\s)\*\*(?:\s|$)/g,
  // Code fences: triple backtick blocks
  /```[\s\S]*?```/g,
  // Empty links: markdown links with empty URL
  /\[([^\]]*)\]\(\s*\)/g,
  // Stray markdown headers in body text: h3+ in article body
  /(?:^|\n)#{3,}\s+/gm,
];
