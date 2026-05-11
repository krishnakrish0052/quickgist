import type { MediaAsset, Topic } from "@/lib/types";
import { nowIso, stableHash } from "@/lib/utils";
import { addMediaAsset } from "@/lib/repositories/platformRepository";
import { searchRelevantImage, titleToImageQuery } from "@/lib/services/imageSearch";
import { generateNewsImage } from "@/lib/services/imageGeneration";

const categoryImages: Record<string, string> = {
  technology: "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=80",
  education: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1400&q=80",
  finance: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80",
  health: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=80",
  politics: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1400&q=80",
  world: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80"
};

export async function createMediaAsset(topic: Topic, articleId?: string): Promise<MediaAsset> {
  let url: string;
  let provider: MediaAsset["provider"] = "placeholder";
  let prompt: string;
  let attribution: string;
  let generatedBy: "ai" | "stock" | undefined;

  // Attempt AI image generation first
  try {
    const aiImage = await generateNewsImage(topic.summary, "hero");
    if (aiImage.provider !== "placeholder") {
      url = aiImage.url;
      provider = "remote";
      prompt = `AI generated: "${topic.summary.slice(0, 100)}" → ${aiImage.url.slice(0, 60)}…`;
      attribution = `AI-generated image via ${aiImage.provider === "openai" ? "DALL-E 3" : aiImage.provider}.`;
      generatedBy = "ai";

      const asset: MediaAsset = {
        id: `media-${stableHash(`${topic.id}:${articleId ?? "topic"}`)}`,
        articleId,
        topicId: topic.id,
        kind: "hero",
        prompt,
        url,
        provider,
        attribution,
        generatedBy,
        createdAt: nowIso(),
      };
      return addMediaAsset(asset);
    }
  } catch (err) {
    console.warn("[media] AI image generation failed, falling back to stock search:", (err as Error).message);
  }

  // Fall through to stock photo search (Pexels → Pixabay → Unsplash)
  const query = titleToImageQuery(topic.title, topic.keywords ?? []);
  const searchedUrl = await searchRelevantImage(query);

  const fallbackUrl = categoryImages[topic.category] ?? categoryImages.world;
  url = searchedUrl ?? fallbackUrl;
  generatedBy = "stock";

  prompt = searchedUrl
    ? `Image search: "${query}" → ${searchedUrl.slice(0, 80)}…`
    : `Fallback category image for ${topic.category}. Setup PEXELS_API_KEY for relevant photos.`;
  provider = searchedUrl ? "remote" : "placeholder";

  attribution = searchedUrl
    ? "Licensed stock photo via search API."
    : "Unsplash editorial placeholder; set PEXELS_API_KEY for topic-relevant images.";

  const asset: MediaAsset = {
    id: `media-${stableHash(`${topic.id}:${articleId ?? "topic"}`)}`,
    articleId,
    topicId: topic.id,
    kind: "hero",
    prompt,
    url,
    provider,
    attribution,
    generatedBy,
    createdAt: nowIso(),
  };

  return addMediaAsset(asset);
}
