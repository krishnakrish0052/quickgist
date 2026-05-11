import { beforeEach, describe, expect, it } from "vitest";
import { evaluateQuality, evaluateConfidence } from "@/lib/services/quality";
import { resetPlatformState, getPlatformState } from "@/lib/store";
import type { SEOScore } from "@/lib/services/seoEngine";

describe("quality gate", () => {
  beforeEach(() => {
    resetPlatformState();
  });

  it("passes the seeded source-grounded article", async () => {
    const article = getPlatformState().articles[0];
    const report = await evaluateQuality(article);
    expect(report.passed).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(75);
    expect(report.checks.enoughSources).toBe(true);
  });

  it("flags insufficient source diversity", async () => {
    const article = {
      ...getPlatformState().articles[0],
      id: "article-zero-sources",
      sources: [],
      contentMarkdown: "Short.",
      summaryBullets: [],
      tags: [],
      metaDescription: "",
    };
    const report = await evaluateQuality(article);
    // Structural score should be low enough with empty sources + short content + no summary
    expect(report.checks.enoughSources).toBe(false);
    expect(report.checks.minimumLength).toBe(false);
  });

  it("auto-publishes at 60% confidence for non-high-risk topics", () => {
    const article = {
      ...getPlatformState().articles[0],
      risk: "low" as const,
      category: "technology",
    };

    const seo: SEOScore = {
      overall: 95,
      keyword: { density: 0.012, score: 90, primaryKeyword: "ai literacy" },
      title: { length: 55, score: 100, hasKeyword: true },
      meta: { length: 150, score: 100, hasKeyword: true },
      readability: { fleschScore: 65, score: 85, level: "plain English" },
      structure: { headingCount: 5, bullets: 4, score: 88 },
      internalLinks: { count: 3, score: 80 },
      wordCount: 850,
      imageSeo: { altCoverage: 100, lazyLoaded: true, modernFormats: 2, score: 90 },
      schemaValidation: { hasJsonLd: true, validType: true, hasDatePublished: true, score: 100 },
      canonicalUrl: { hasCanonical: true, score: 100 },
      socialMeta: { hasOgTitle: true, hasOgDescription: true, hasOgImage: true, score: 100 },
      issues: [],
      suggestions: [],
    };

    // structuralScore = 50 (< 60, so first auto_publish path doesn't trigger)
    // confidence = 0.50*0.45 + 0.95*0.35 + 1.0*0.20 = 0.7575 >= 0.60 → auto_publish via second path
    const confidence = evaluateConfidence(article, seo, 50, 1, false);
    expect(confidence.confidence).toBeGreaterThanOrEqual(0.60);
    expect(confidence.decision).toBe("auto_publish");
  });
});
