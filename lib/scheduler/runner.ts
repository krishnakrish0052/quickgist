/**
 * Single autonomous pipeline cycle:
 * ingest → cluster → generate → quality → publish
 */

import { runIngestion } from "@/lib/services/ingestion";
import { detectTrendingTopics } from "@/lib/services/trend";
import { generateArticlePackage } from "@/lib/services/generation";
import { evaluateQuality } from "@/lib/services/quality";
import { publishArticle } from "@/lib/services/publishing";
import { updateSchedulerState, getSchedulerState } from "@/lib/scheduler/state";

export async function runPipelineOnce(): Promise<string> {
  const lines: string[] = [];

  const ingest = await runIngestion({ limit: 10 });
  lines.push(`Ingest: ${ingest.feedsSucceeded}/${ingest.feedsAttempted} feeds, ${ingest.inserted.length} new items`);

  const trendResult = await detectTrendingTopics();
  const newTopics = trendResult.topics.filter((t) => t.status === "new" || t.status === "clustered");
  lines.push(`Cluster: ${newTopics.length} new topics`);

  let published = 0;
  for (const topic of newTopics.slice(0, 5)) {
    try {
      const { article } = await generateArticlePackage(topic);
      const qr = await evaluateQuality(article);

      if (qr.confidence.decision === "auto_publish") {
        await publishArticle(article.id);
        published++;
        lines.push(`  ✓ Published: ${article.slug}`);
      } else {
        lines.push(`  ⏸ Held for review: ${article.slug} (confidence ${Math.round(qr.confidence.confidence * 100)}%)`);
      }
    } catch (err) {
      lines.push(`  ✗ Failed topic ${topic.id}: ${(err as Error)?.message}`);
    }
  }

  const state = getSchedulerState();
  updateSchedulerState({ totalArticlesPublished: state.totalArticlesPublished + published });
  lines.push(`Summary: ${published} articles published this cycle`);

  return lines.join("\n");
}
