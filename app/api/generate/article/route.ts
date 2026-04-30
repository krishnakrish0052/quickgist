import { badRequest, internalGuard, notFound, ok, readJson } from "@/lib/api";
import { extractFactClaims } from "@/lib/services/factExtraction";
import { generateArticlePackage } from "@/lib/services/generation";
import { getTopicById, getTopicBySlug } from "@/lib/repositories/platformRepository";

interface Body {
  topicId?: string;
  slug?: string;
}

export async function POST(request: Request) {
  const guard = internalGuard(request);
  if (guard) return guard;
  const body = await readJson<Body>(request);
  if (!body.topicId && !body.slug) return badRequest("topicId or slug is required");

  const topic = body.topicId ? await getTopicById(body.topicId) : await getTopicBySlug(body.slug ?? "");
  if (!topic) return notFound("Topic not found");

  await extractFactClaims(topic);
  return ok(await generateArticlePackage(topic));
}
