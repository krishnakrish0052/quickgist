import { beforeEach, describe, expect, it } from "vitest";
import { resetPlatformState } from "@/lib/store";
import {
  getArticleBySlug,
  getPlatformSnapshot,
  seedRepository,
  subscribe,
  upsertRawItems
} from "@/lib/repositories/platformRepository";
import { seedRawItems } from "@/lib/seed";

describe("platform repository", () => {
  beforeEach(() => {
    resetPlatformState();
  });

  it("seeds the local repository facade", async () => {
    await seedRepository();
    const snapshot = await getPlatformSnapshot();
    expect(snapshot.sources.length).toBeGreaterThanOrEqual(3);
    expect(snapshot.articles.length).toBeGreaterThanOrEqual(1);
  });

  it("dedupes raw item upserts by content hash", async () => {
    await upsertRawItems(seedRawItems);
    const inserted = await upsertRawItems(seedRawItems);
    expect(inserted).toHaveLength(0);
  });

  it("finds seeded articles by slug and stores subscribers", async () => {
    await seedRepository();
    const article = await getArticleBySlug("ai-literacy-and-safety-programs-expand-across-campuses");
    const subscriber = await subscribe("reader@example.com", ["technology"]);
    expect(article?.title).toContain("AI literacy");
    expect(subscriber.topics).toContain("technology");
  });
});
