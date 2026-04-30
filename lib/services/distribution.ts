import type { Article, DistributionChannel, DistributionJob } from "@/lib/types";
import { config } from "@/lib/config";
import { defaultDistributionChannels } from "@/lib/queues";
import { nowIso, stableHash } from "@/lib/utils";
import { addDistributionJobs } from "@/lib/repositories/platformRepository";

interface ScheduleDistributionInput {
  article: Article;
  channels?: DistributionChannel[];
  dryRun?: boolean;
  scheduledFor?: string;
}

function utmUrl(article: Article, channel: DistributionChannel): string {
  const base = new URL(article.canonicalUrl ?? `/news/${article.slug}`, config.siteUrl);
  base.searchParams.set("utm_source", channel);
  base.searchParams.set("utm_medium", "distribution");
  base.searchParams.set("utm_campaign", "quickgist_news");
  return base.toString();
}

function payloadFor(article: Article, channel: DistributionChannel): Record<string, string | string[]> {
  if (channel === "x") return { thread: article.socialPack.xThread, url: utmUrl(article, channel) };
  if (channel === "instagram") return { caption: article.socialPack.instagramCaption, url: utmUrl(article, channel) };
  if (channel === "linkedin") return { post: article.socialPack.linkedinPost, url: utmUrl(article, channel) };
  if (channel === "newsletter") return { subject: article.title, dek: article.dek, url: utmUrl(article, channel) };
  if (channel === "rss") return { title: article.title, summary: article.dek, url: utmUrl(article, channel) };
  if (channel === "youtube") return { script: article.videoScript, url: utmUrl(article, channel) };
  return { message: article.socialPack.whatsappSummary, url: utmUrl(article, channel) };
}

export async function scheduleDistribution(input: ScheduleDistributionInput): Promise<DistributionJob[]> {
  const channels = input.channels ?? defaultDistributionChannels;
  const scheduledFor = input.scheduledFor ?? nowIso();
  const jobs = channels.map((channel) => ({
    id: `dist-${stableHash(`${input.article.id}:${channel}:${scheduledFor}`)}`,
    articleId: input.article.id,
    channel,
    payload: payloadFor(input.article, channel),
    scheduledFor,
    status: input.dryRun ?? config.pipelineDryRun ? "dry_run" : "scheduled",
    utmUrl: utmUrl(input.article, channel),
    createdAt: nowIso()
  })) satisfies DistributionJob[];

  return addDistributionJobs(jobs);
}
