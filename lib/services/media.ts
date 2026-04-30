import type { MediaAsset, Topic } from "@/lib/types";
import { nowIso, stableHash } from "@/lib/utils";
import { addMediaAsset } from "@/lib/repositories/platformRepository";

const categoryImages: Record<string, string> = {
  technology: "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=80",
  education: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1400&q=80",
  finance: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80",
  health: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=80",
  politics: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1400&q=80",
  world: "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=80"
};

export async function createMediaAsset(topic: Topic, articleId?: string): Promise<MediaAsset> {
  const asset: MediaAsset = {
    id: `media-${stableHash(`${topic.id}:${articleId ?? "topic"}`)}`,
    articleId,
    topicId: topic.id,
    kind: "hero",
    prompt: `Credible editorial image for ${topic.title}.`,
    url: categoryImages[topic.category] ?? categoryImages.world,
    provider: "remote",
    attribution: "Unsplash editorial placeholder; replace with generated/R2 asset before launch.",
    createdAt: nowIso()
  };

  return addMediaAsset(asset);
}
