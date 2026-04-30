import type { Article, QualityReport } from "@/lib/types";
import { config } from "@/lib/config";
import { jaccardSimilarity, markdownToPlainText, nowIso } from "@/lib/utils";
import {
  addQualityReport,
  addReviewTask,
  getTopicById,
  upsertArticle
} from "@/lib/repositories/platformRepository";
import { scoreArticle, type SEOScore } from "@/lib/services/seoEngine";

const aiArtifactPhrases = [
  "as an ai",
  "i cannot",
  "certainly!",
  "of course!",
  "i'd be happy to",
  "in today's fast-paced world"
];

function hasHighSimilarityToSource(article: Article): boolean {
  const sourceText = article.sources.map((source) => `${source.title} ${source.publisher}`).join(" ");
  return jaccardSimilarity(markdownToPlainText(article.contentMarkdown), sourceText) > 0.42;
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

/**
 * Evaluate confidence on a 0–1 scale using SEO + structural + source signals.
 * Mirrors the guide's quality-gate routing model.
 */
export function evaluateConfidence(
  article: Article,
  seo: SEOScore,
  structuralScore: number,
  sourceCount: number,
  requiresHumanReview: boolean
): QualityConfidence {
  const seoScoreNorm = seo.overall / 100;
  const structuralNorm = structuralScore / 100;
  const sourceNorm = Math.min(1, sourceCount / Math.max(2, config.minSourcesForPublish));
  const riskPenalty = requiresHumanReview ? 0.15 : 0;

  const confidence = Math.max(
    0,
    Math.min(
      1,
      structuralNorm * 0.45 + seoScoreNorm * 0.35 + sourceNorm * 0.2 - riskPenalty
    )
  );

  let decision: QualityDecision;
  if (confidence >= config.autoPublishConfidenceThreshold && !requiresHumanReview) decision = "auto_publish";
  else if (confidence >= config.reviewConfidenceThreshold) decision = "human_review";
  else decision = "regenerate";

  const reasons: string[] = [];
  if (requiresHumanReview) reasons.push("Topic risk policy requires human review.");
  if (sourceNorm < 1) reasons.push(`Source diversity below target (${sourceCount}/${config.minSourcesForPublish}).`);
  if (seoScoreNorm < 0.6) reasons.push(`SEO score is ${seo.overall}/100.`);
  if (structuralNorm < 0.7) reasons.push(`Structural quality score is ${structuralScore}/100.`);

  return {
    confidence,
    decision,
    reasons,
    weights: {
      structuralScore,
      seoScore: seo.overall,
      sourceScore: Math.round(sourceNorm * 100),
      riskPenalty
    }
  };
}

export async function evaluateQuality(article: Article): Promise<QualityReport & { seo: SEOScore; confidence: QualityConfidence }> {
  const plainText = markdownToPlainText(article.contentMarkdown);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const sourceCount = new Set(article.sources.map((source) => source.publisher)).size;
  const topic = await getTopicById(article.topicId);
  const primaryKeyword = topic?.keywords[0]?.toLowerCase();
  const requiresHumanReview =
    article.risk === "high" || config.highRiskCategories.includes(article.category.toLowerCase());

  const checks = {
    minimumLength: wordCount >= 220,
    enoughSources: sourceCount >= config.minSourcesForPublish,
    hasSummary: article.summaryBullets.length >= 3,
    noAiArtifacts: !aiArtifactPhrases.some((phrase) => plainText.toLowerCase().includes(phrase)),
    hasPrimaryKeyword: primaryKeyword ? plainText.toLowerCase().includes(primaryKeyword) : true,
    lowSourceSimilarity: !hasHighSimilarityToSource(article),
    hasAttribution: article.sources.every((source) => source.url && source.publisher),
    humanReviewForHighRisk: !requiresHumanReview || article.status === "review"
  };

  const reasons = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
  const structuralScore = Math.round(
    (Object.values(checks).filter(Boolean).length / Object.values(checks).length) * 100
  );

  const seo = scoreArticle(article, topic?.keywords[0]);
  const confidence = evaluateConfidence(article, seo, structuralScore, sourceCount, requiresHumanReview);

  const passed = reasons.length === 0 && structuralScore >= 75 && confidence.decision !== "regenerate";

  const report: QualityReport = {
    id: `quality-${article.id}-${Date.now()}`,
    articleId: article.id,
    topicId: article.topicId,
    score: Math.round(confidence.confidence * 100),
    passed,
    reasons,
    checks,
    createdAt: nowIso()
  };

  article.qualityScore = Math.round(confidence.confidence * 100);
  if (confidence.decision === "auto_publish" && !requiresHumanReview) {
    article.status = "draft";
  } else {
    article.status = "review";
  }
  article.updatedAt = nowIso();
  await upsertArticle(article);
  await addQualityReport(report);

  if (!passed || requiresHumanReview || confidence.decision !== "auto_publish") {
    await addReviewTask({
      id: `review-${article.id}`,
      articleId: article.id,
      topicId: article.topicId,
      title: article.title,
      reason:
        confidence.decision === "regenerate"
          ? `Confidence ${Math.round(confidence.confidence * 100)}/100 — regeneration recommended. ${confidence.reasons.join("; ")}`
          : !passed
            ? `Quality checks failed: ${reasons.join(", ")}`
            : `Confidence ${Math.round(confidence.confidence * 100)}/100 — human review required.`,
      status: "open",
      priority: requiresHumanReview || confidence.decision === "regenerate" ? "high" : "normal",
      createdAt: nowIso()
    });
  }

  return { ...report, seo, confidence };
}
