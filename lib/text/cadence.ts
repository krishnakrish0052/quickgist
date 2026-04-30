/**
 * Sentence-level cadence analysis and burstiness enforcement.
 * Ensures articles read like human prose: varied sentence lengths, questions, contractions.
 */

export interface CadenceReport {
  sentenceCount: number;
  avgWords: number;
  stddev: number;
  hasQuestion: boolean;
  contractionCount: number;
  shortParagraphCount: number;
  score: number;
  suggestions: string[];
}

function tokenizeSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function wordCount(sentence: string): number {
  return sentence.split(/\s+/).filter(Boolean).length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

const CONTRACTIONS = [
  /\bdon't\b/gi, /\bcan't\b/gi, /\bwon't\b/gi, /\bit's\b/gi, /\bthat's\b/gi,
  /\bwe're\b/gi, /\bthey're\b/gi, /\bhe's\b/gi, /\bshe's\b/gi, /\byou're\b/gi,
  /\bI'm\b/gi, /\bI've\b/gi, /\bwe've\b/gi, /\bthey've\b/gi, /\bdoesn't\b/gi,
  /\bdidn't\b/gi, /\bisn't\b/gi, /\baren't\b/gi, /\bwasn't\b/gi, /\bweren't\b/gi
];

export function analyzeCadence(markdown: string): CadenceReport {
  const plainText = markdown.replace(/#{1,6}\s/g, "").replace(/[*_`[\]()]/g, "");
  const sentences = tokenizeSentences(plainText);
  const lengths = sentences.map(wordCount);
  const avg = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  const sd = stddev(lengths);
  const hasQuestion = /\?/.test(plainText);
  const contractionCount = CONTRACTIONS.reduce((n, re) => n + (plainText.match(re)?.length ?? 0), 0);
  const paragraphs = markdown.split(/\n\n+/).filter(Boolean);
  const shortParaCount = paragraphs.filter((p) => {
    const sents = tokenizeSentences(p.replace(/#{1,6}\s/g, ""));
    return sents.length <= 2 && sents.length > 0;
  }).length;

  const suggestions: string[] = [];
  let score = 100;

  if (sd < 5 && sentences.length > 4) {
    suggestions.push("Sentence lengths are too uniform — vary short and long sentences more.");
    score -= 20;
  }
  if (!hasQuestion) {
    suggestions.push("Add at least one rhetorical question to engage the reader.");
    score -= 15;
  }
  if (contractionCount < 2) {
    suggestions.push("Use at least 2 contractions (it's, don't, can't) to sound more natural.");
    score -= 15;
  }
  if (shortParaCount < 1) {
    suggestions.push("Add at least one short paragraph (1–2 sentences) for visual rhythm.");
    score -= 10;
  }

  return {
    sentenceCount: sentences.length,
    avgWords: Math.round(avg),
    stddev: Math.round(sd * 10) / 10,
    hasQuestion,
    contractionCount,
    shortParagraphCount: shortParaCount,
    score: Math.max(0, score),
    suggestions
  };
}

/**
 * Rewrites the 3 longest sentences into 2 shorter ones each when burstiness is low.
 * This is a heuristic split — finds the best comma/semicolon or mid-point to cut.
 */
export function improveCadence(markdown: string): string {
  const report = analyzeCadence(markdown);
  if (report.stddev >= 5) return markdown;

  const sentences = tokenizeSentences(markdown.replace(/#{1,6}\s/g, ""));
  const byLength = [...sentences].sort((a, b) => wordCount(b) - wordCount(a)).slice(0, 3);

  let result = markdown;
  for (const long of byLength) {
    if (wordCount(long) < 20) continue;
    const split = splitLongSentence(long);
    if (split !== long) {
      result = result.replace(long, split);
    }
  }
  return result;
}

function splitLongSentence(sentence: string): string {
  const commaIdx = sentence.indexOf(", ", Math.floor(sentence.length * 0.35));
  if (commaIdx > 0 && commaIdx < Math.floor(sentence.length * 0.7)) {
    const a = sentence.slice(0, commaIdx).trim() + ".";
    const b = sentence.slice(commaIdx + 2, sentence.length);
    const bCapitalized = b.charAt(0).toUpperCase() + b.slice(1);
    return `${a} ${bCapitalized}`;
  }
  const words = sentence.split(" ");
  const mid = Math.floor(words.length / 2);
  return words.slice(0, mid).join(" ") + ". " + words.slice(mid).join(" ");
}
