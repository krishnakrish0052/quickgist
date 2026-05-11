import { MARKDOWN_ARTIFACT_PATTERNS } from "@/lib/text/ai-artifacts";

/**
 * Anti-AI-trope filter and human writing pass.
 * Removes phrases that pattern-match to LLM output and replaces with
 * natural alternatives. Also injects connective tissue and varied openers.
 */

interface TropeReplacement {
  pattern: RegExp;
  replacement: string;
}

const TROPE_REPLACEMENTS: TropeReplacement[] = [
  // Overused intros
  { pattern: /\bin today'?s fast[- ]paced world\b/gi, replacement: "right now" },
  { pattern: /\bin today'?s digital (age|era|landscape)\b/gi, replacement: "today" },
  { pattern: /\bin the (ever-)?evolving (landscape|world) of\b/gi, replacement: "in" },
  { pattern: /\bin the realm of\b/gi, replacement: "in" },
  { pattern: /\bin the world of\b/gi, replacement: "in" },
  { pattern: /\blandscape of\b/gi, replacement: "state of" },
  { pattern: /\btapestry of\b/gi, replacement: "range of" },

  // Delve / dive
  { pattern: /\bdelve into\b/gi, replacement: "look at" },
  { pattern: /\bdive deep into\b/gi, replacement: "examine" },
  { pattern: /\bdive into\b/gi, replacement: "explore" },

  // Navigate
  { pattern: /\bnavigate the (complexities|challenges|nuances) of\b/gi, replacement: "deal with" },
  { pattern: /\bnavigate (through|this)\b/gi, replacement: "handle" },

  // Testament
  { pattern: /\bstand(s)? as a testament to\b/gi, replacement: "reflect" },
  { pattern: /\ba testament to\b/gi, replacement: "a sign of" },

  // Crucial / crucial importance
  { pattern: /\bcrucially\b/gi, replacement: "importantly" },
  { pattern: /\bcrucial\b/gi, replacement: "key" },
  { pattern: /\bit is (important|essential|crucial) to note (that)?\b/gi, replacement: "" },
  { pattern: /\bit'?s worth noting (that)?\b/gi, replacement: "" },
  { pattern: /\bit is worth mentioning (that)?\b/gi, replacement: "" },

  // Filler stacks
  { pattern: /\bmoreover,\s+furthermore,?\b/gi, replacement: "On top of that," },
  { pattern: /\bfurthermore, moreover\b/gi, replacement: "Beyond that," },
  { pattern: /\badditionally, furthermore\b/gi, replacement: "Also," },
  { pattern: /\bfurthermore\b/gi, replacement: "Beyond that" },
  { pattern: /\bmoreover\b/gi, replacement: "On top of that" },

  // Comprehensive / robust
  { pattern: /\bcomprehensive (guide|overview|look|analysis)\b/gi, replacement: "$1" },
  { pattern: /\brobust (solution|framework|approach)\b/gi, replacement: "$1" },
  { pattern: /\bsynergiz(e|ing|ed)\b/gi, replacement: "work together" },
  { pattern: /\bleverage\b/gi, replacement: "use" },
  { pattern: /\butilize\b/gi, replacement: "use" },

  // AI self-reference
  { pattern: /\bas an ai (language model|assistant)[\s,]/gi, replacement: " " },
  { pattern: /\bI (cannot|can't) (provide|generate|create) (that|this)\b/gi, replacement: "" },

  // Transitional AI clichés
  { pattern: /\bin conclusion,\s*/gi, replacement: "" },
  { pattern: /\bto summarize,\s*/gi, replacement: "In short, " },
  { pattern: /\bto sum (up|it up),\s*/gi, replacement: "Bottom line: " },
  { pattern: /\ball in all,\s*/gi, replacement: "" },

  // Em-dash overuse — remove overuse; single dashes are fine
  { pattern: /—[^—\n]{0,30}—[^—\n]{0,30}—/g, replacement: "," }
];

const OPENER_POOL = [
  "Here's what changed.",
  "That said,",
  "What this means in practice:",
  "The key detail:",
  "Worth watching closely.",
  "The short version:",
  "Here's the tension:",
  "To be clear:",
  "The real question is this:",
  "Three things to keep in mind."
];

export interface HumanizationReport {
  tropesRemoved: number;
  openersVaried: boolean;
  markdown: string;
}

export function humanize(markdown: string): HumanizationReport {
  let text = markdown;
  let tropesRemoved = 0;

  // --- Pass 0: Markdown artifact cleanup (must run first) ---

  // Strip all MARKDOWN_ARTIFACT_PATTERNS
  for (const pattern of MARKDOWN_ARTIFACT_PATTERNS) {
    text = text.replace(pattern, "");
  }

  // Convert bold-labeled callouts to proper headings
  text = text.replace(/\*\*(Key Takeaway|Note|Important|TL;DR|Summary|Bottom Line):?\*\*\s*/gi, "### $1\n\n");

  // Strip orphan bold/italic markers (lines that are only markers)
  text = text.replace(/^[\*\s]+$/gm, "");

  // Remove lines that are only ** or * characters
  text = text.replace(/^\*{1,3}\s*$/gm, "");

  // --- Pass 1: Trope replacements ---

  for (const { pattern, replacement } of TROPE_REPLACEMENTS) {
    const before = text;
    text = text.replace(pattern, replacement);
    if (text !== before) tropesRemoved++;
  }

  // Collapse double spaces from empty replacements
  text = text.replace(/ {2,}/g, " ").replace(/\n {2,}\n/g, "\n\n");

  // Vary paragraph openers: if two consecutive paragraphs start with the same word, prepend a connector
  const paragraphs = text.split(/\n\n+/);
  let openersVaried = false;
  for (let i = 1; i < paragraphs.length; i++) {
    const prev = paragraphs[i - 1].split(" ")[0]?.toLowerCase();
    const curr = paragraphs[i].split(" ")[0]?.toLowerCase();
    if (prev && curr && prev === curr && !/^#{1,6}/.test(paragraphs[i])) {
      const connector = OPENER_POOL[(i * 7 + tropesRemoved) % OPENER_POOL.length];
      paragraphs[i] = `${connector} ${paragraphs[i]}`;
      openersVaried = true;
    }
  }
  text = paragraphs.join("\n\n");

  return { tropesRemoved, openersVaried, markdown: text };
}

export function humanizeScore(markdown: string): number {
  let score = 100;
  const checks: { pattern: RegExp; penalty: number }[] = [
    { pattern: /delve into/i, penalty: 10 },
    { pattern: /in today'?s fast/i, penalty: 10 },
    { pattern: /tapestry of/i, penalty: 8 },
    { pattern: /it is (important|crucial) to note/i, penalty: 8 },
    { pattern: /furthermore, moreover/i, penalty: 12 },
    { pattern: /navigate the complexities/i, penalty: 8 },
    { pattern: /leverage/gi, penalty: 5 },
    { pattern: /utilize/gi, penalty: 5 },
    { pattern: /in conclusion/i, penalty: 8 },
    { pattern: /stand(s)? as a testament/i, penalty: 8 }
  ];
  for (const { pattern, penalty } of checks) {
    if (pattern.test(markdown)) score -= penalty;
  }
  return Math.max(0, score);
}
