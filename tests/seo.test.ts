import { describe, expect, it } from "vitest";
import { articleJsonLd, absoluteUrl } from "@/lib/seo";
import { seedArticles } from "@/lib/seed";

describe("seo helpers", () => {
  it("creates absolute URLs", () => {
    expect(absoluteUrl("/news/test")).toMatch(/^http:\/\/localhost:3000\/news\/test/);
  });

  it("generates NewsArticle schema", () => {
    const schema = articleJsonLd(seedArticles[0]);
    expect(schema["@type"]).toBe("NewsArticle");
    expect(schema.headline).toBe(seedArticles[0].title);
    expect(JSON.stringify(schema.mainEntityOfPage)).toContain(seedArticles[0].slug);
  });
});
