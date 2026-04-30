import { describe, expect, it } from "vitest";
import { jaccardSimilarity, slugify, stableHash } from "@/lib/utils";

describe("utils", () => {
  it("creates stable SEO slugs", () => {
    expect(slugify("AI Literacy & Safety Programs Expand Across Campuses!")).toBe(
      "ai-literacy-and-safety-programs-expand-across-campuses"
    );
  });

  it("creates deterministic hashes", () => {
    expect(stableHash("quickgist")).toBe(stableHash("quickgist"));
    expect(stableHash("quickgist")).not.toBe(stableHash("newsflow"));
  });

  it("scores related text higher than unrelated text", () => {
    expect(jaccardSimilarity("ai literacy courses for students", "students need ai literacy courses")).toBeGreaterThan(
      jaccardSimilarity("ai literacy courses", "rainfall forecast cricket")
    );
  });
});
