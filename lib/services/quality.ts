import type { Article, QualityReport } from "@/lib/types";
import { config } from "@/lib/config";
import { jaccardSimilarity, markdownToPlainText, nowIso } from "@/lib/utils";
import { AI_ARTIFACT_PHRASES } from "@/lib/text/ai-artifacts";
import {
  addQualityReport,
  addReviewTask,
  getTopicById,
  upsertArticle,
} from "@/lib/repositories/platformRepository";
import { scoreArticle, type SEOScore } from "@/lib/services/seoEngine";

/**
 * Checks if article content is a near-duplicate of source text.
 * Threshold at 0.80 means only nearly-verbatim copies are flagged.
 * Synthesized articles naturally overlap with source material, so
 * the old 0.42 threshold was far too strict.
 */
function hasHighSimilarityToSource(article: Article): boolean {
  const sourceText = article.sources.map((source) => `${source.title} ${source.publisher}`).join(" ");
  return jaccardSimilarity(markdownToPlainText(article.contentMarkdown), sourceText) > 0.80;
}

export type QualityDecision = "auto_publish" | "human_review" | "regenerate";

export interface QualityConfidence {
  confidence: number;
  decision: QualityDecision;
  reasons: string[];
  weights: {
    structuralScore: number;
    seoScore: number;
    sourceScore: number;
    riskPenalty: number;
  };
}

export interface AssessedQuality {
  report: QualityReport;
  seo: SEOScore;
  confidence: QualityConfidence;
}

/**
 * Evaluate confidence on a 0–1 scale using SEO + structural + source signals.
 */
export function evaluateConfidence(
  article: Article,
  seo: SEOScore,
  structuralScore: number,
  sourceCount: number,
  requiresHumanReview: boolean,
): QualityConfidence {
  const seoScoreNorm = seo.overall / 100;
  const structuralNorm = structuralScore / 100;
  const sourceNorm = Math.min(1, sourceCount / Math.max(1, config.minSourcesForPublish));
  const riskPenalty = requiresHumanReview ? 0.15 : 0;

  const confidence = Math.max(
    0,
    Math.min(1, structuralNorm * 0.45 + seoScoreNorm * 0.35 + sourceNorm * 0.2 - riskPenalty),
  );

  let decision: QualityDecision;
  // Quality gate (Phase 5/6 thresholds):
  //   ≥60% confidence + not high-risk → auto_publish
  //   40%-60% confidence → human_review
  //   <40% confidence → regenerate
  //   High-risk categories ALWAYS require human review (never auto_publish)
  if (structuralScore >= 60 && !requiresHumanReview) decision = "auto_publish";
  else if (confidence >= config.autoPublishConfidenceThreshold && !requiresHumanReview) decision = "auto_publish";
  else if (confidence >= config.reviewConfidenceThreshold) decision = "human_review";
  else decision = "regenerate";

  const reasons: string[] = [];
  if (requiresHumanReview) reasons.push("Topic risk policy requires human review.");
  if (sourceNorm < 1) reasons.push(`Source diversity below target (${sourceCount}/${config.minSourcesForPublish}).`);
  if (seoScoreNorm < 0.6) reasons.push(`SEO score is ${seo.overall}/100.`);
  if (structuralNorm < 0.7) reasons.push(`Structural quality score is ${structuralScore}/100.`);

  return { confidence, decision, reasons, weights: { structuralScore, seoScore: seo.overall, sourceScore: Math.round(sourceNorm * 100), riskPenalty } };
}

/**
 * Compute the structural quality checks and return a raw quality score
 * without persisting. Internal shared helper for both assessQuality and
 * evaluateQuality.
 */
function computeChecks(article: Article, keyword?: string): { checks: Record<string, boolean>; structuralScore: number } {
  const plainText = markdownToPlainText(article.contentMarkdown);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const sourceCount = new Set(article.sources.map((source) => source.publisher)).size;
  const requiresHumanReview = article.risk === "high" || config.highRiskCategories.includes(article.category.toLowerCase());

  const checks = {
    minimumLength: wordCount >= 220,
    enoughSources: sourceCount >= config.minSourcesForPublish,
    hasSummary: article.summaryBullets.length >= 3,
    noAiArtifacts: !AI_ARTIFACT_PHRASES.some((phrase) => plainText.toLowerCase().includes(phrase)),
    hasPrimaryKeyword: keyword ? plainText.toLowerCase().includes(keyword.toLowerCase()) : true,
    lowSourceSimilarity: !hasHighSimilarityToSource(article),
    hasAttribution: article.sources.every((source) => source.url && source.publisher),
    humanReviewForHighRisk: !requiresHumanReview || article.status === "review",
  };

  const structuralScore = Math.round(
    (Object.values(checks).filter(Boolean).length / Object.values(checks).length) * 100,
  );

  return { checks, structuralScore };
}

/**
 * Read-only quality assessment. Returns the quality report, SEO score, and
 * confidence routing decision without mutating the article or persisting
 * anything. Safe for MCP tools.
 */
export async function assessQuality(article: Article): Promise<AssessedQuality> {
  const topic = await getTopicById(article.topicId);
  const keyword = topic?.keywords[0];
  const sourceCount = new Set(article.sources.map((source) => source.publisher)).size;
  const requiresHumanReview = article.risk === "high" || config.highRiskCategories.includes(article.category.toLowerCase());

  const { checks, structuralScore } = computeChecks(article, keyword);
  const seo = scoreArticle(article, keyword);
  const confidence = evaluateConfidence(article, seo, structuralScore, sourceCount, requiresHumanReview);

  // SEO fast-track: score ≥ 90 overrides confidence threshold; score ≥ 70 fast-tracks low/medium risk
  const seoFastTrack =
    (seo.overall >= 90 && !requiresHumanReview) ||
    (seo.overall >= 70 && article.risk !== "high");
  const effectiveDecision = seoFastTrack ? "auto_publish" : confidence.decision;
  if (seoFastTrack) {
    confidence.decision = "auto_publish";
    confidence.reasons = confidence.reasons.filter((r) => !r.startsWith("SEO"));
  }

  const reasons = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  // PASS LOGIC: article passes if structural quality is at least fair (≥60)
  // AND the confidence decision isn't regenerate. Individual check failures
  // are informational — they feed the confidence score, which already weights
  // them properly. The old all-or-nothing pass logic (zero failures)
  // made every article a "quality failure" even when it was perfectly usable.
  const passed = structuralScore >= 60 && effectiveDecision !== "regenerate";

  const report: QualityReport = {
    id: `quality-${article.id}-${Date.now()}`,
    articleId: article.id,
    topicId: article.topicId,
    score: Math.round(confidence.confidence * 100),
    passed,
    reasons,
    checks,
    createdAt: nowIso(),
  };

  return { report, seo, confidence };
}

/**
 * Full quality evaluation: assess the article AND persist the results.
 * Mutates the article status, upserts it, adds quality report + review task.
 * This is what the pipeline calls.
 */
export async function evaluateQuality(
  article: Article,
): Promise<QualityReport & { seo: SEOScore; confidence: QualityConfidence }> {
  const { report, seo, confidence } = await assessQuality(article);

  // SEO fast-track logic mirror (needed for status assignment): ≥90 auto-publish, ≥70 auto-publish for non-high risk
  const requiresHumanReview = article.risk === "high" || config.highRiskCategories.includes(article.category.toLowerCase());
  const seoFastTrack =
    (seo.overall >= 90 && !requiresHumanReview) ||
    (seo.overall >= 70 && article.risk !== "high");
  const effectiveDecision = seoFastTrack ? "auto_publish" : confidence.decision;

  // Apply state mutations
  article.qualityScore = Math.round(confidence.confidence * 100);
  if (effectiveDecision === "auto_publish") {
    article.status = "published";
  } else {
    article.status = "review";
  }
  article.updatedAt = nowIso();
  await upsertArticle(article);
  await addQualityReport(report);

  // Create review task when the article needs human eyes, not for every
  // "quality failure" — a review task means something actionable.
  if (requiresHumanReview || effectiveDecision === "human_review") {
    await addReviewTask({
      id: `review-${article.id}`,
      articleId: article.id,
      topicId: article.topicId,
      title: article.title,
      reason:
        effectiveDecision === "human_review"
          ? `Confidence ${Math.round(confidence.confidence * 100)}/100 — human review recommended. ${confidence.reasons.join("; ")}`
          : "Topic risk policy requires human review.",
      status: "open",
      priority: requiresHumanReview || confidence.decision === "regenerate" ? "high" : "normal",
      createdAt: nowIso(),
    });
  }

  return { ...report, seo, confidence };
}
