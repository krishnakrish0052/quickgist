import { badRequest, internalGuard, notFound, ok, readJson } from "@/lib/api";
import { getArticleById, getArticleBySlug } from "@/lib/repositories/platformRepository";
import { scheduleDistribution } from "@/lib/services/distribution";
import type { DistributionChannel } from "@/lib/types";

interface Body {
  articleId?: string;
  slug?: string;
  channels?: DistributionChannel[];
  dryRun?: boolean;
  scheduledFor?: string;
}

export async function POST(request: Request) {
  const guard = internalGuard(request);
  if (guard) return guard;
  const body = await readJson<Body>(request);
  if (!body.articleId && !body.slug) return badRequest("articleId or slug is required");
  const article = body.slug
    ? await getArticleBySlug(body.slug)
    : await getArticleById(body.articleId ?? "");
  if (!article) return notFound("Article not found");
  return ok(
    await scheduleDistribution({
      article,
      channels: body.channels,
      dryRun: body.dryRun,
      scheduledFor: body.scheduledFor
    })
  );
}
