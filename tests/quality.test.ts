import { beforeEach, describe, expect, it } from "vitest";
import { evaluateQuality } from "@/lib/services/quality";
import { resetPlatformState, getPlatformState } from "@/lib/store";

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
      id: "article-single-source",
      sources: [getPlatformState().articles[0].sources[0]]
    };
    const report = await evaluateQuality(article);
    expect(report.passed).toBe(false);
    expect(report.reasons).toContain("enoughSources");
  });
});
