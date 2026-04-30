import { badRequest, internalGuard, notFound, ok, readJson } from "@/lib/api";
import { getArticleById, getArticleBySlug } from "@/lib/repositories/platformRepository";

interface Body {
  articleId?: string;
  slug?: string;
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
  return ok({ articleId: article.id, imagePrompt: article.imagePrompt });
}
