import { revalidatePath } from "next/cache";
import type { Article } from "@/lib/types";
import { nowIso } from "@/lib/utils";
import {
  addAuditLog,
  getArticleById,
  getLatestQualityReport,
  getTopicById,
  upsertArticle,
  upsertTopics
} from "@/lib/repositories/platformRepository";

export interface PublishResult {
  article: Article;
  published: boolean;
  reason?: string;
}

export async function publishArticle(articleId: string, actor: "system" | "admin" | "worker" = "system"): Promise<PublishResult> {
  const article = await getArticleById(articleId);
  if (!article) return { article: undefined as never, published: false, reason: "Article not found" };

  const latestReport = await getLatestQualityReport(articleId);
  if (!latestReport?.passed) {
    return { article, published: false, reason: "Latest quality report has not passed" };
  }

  article.status = "published";
  article.publishedAt = article.publishedAt ?? nowIso();
  article.updatedAt = nowIso();
  await upsertArticle(article);

  const topic = await getTopicById(article.topicId);
  if (topic) {
    topic.status = "published";
    topic.updatedAt = nowIso();
    await upsertTopics([topic]);
  }

  try {
    revalidatePath("/");
    revalidatePath(`/news/${article.slug}`);
    revalidatePath(`/explain/${article.slug}`);
    revalidatePath(`/category/${article.category}`);
  } catch {
    // Revalidation is only available inside a running Next.js request context.
  }

  await addAuditLog({
    actor,
    action: "article.published",
    entityType: "article",
    entityId: article.id,
    metadata: { slug: article.slug, qualityScore: article.qualityScore }
  });

  return { article, published: true };
}
