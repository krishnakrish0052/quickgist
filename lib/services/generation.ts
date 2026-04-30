import type { Article, FactClaim, SocialPack, Topic } from "@/lib/types";
import {
  buildArticlePrompt,
  buildExplainerPrompt,
  buildFaqPrompt,
  buildImagePromptsPrompt,
  buildShortsPrompt,
  buildSocialPrompt,
  buildVideoLongPrompt,
  buildSeoRewritePrompt
} from "@/lib/prompts";
import { estimateReadingMinutes, nowIso, slugify, stableHash } from "@/lib/utils";
import { routeAiTask } from "@/lib/services/aiOrchestration";
import { getFactClaims, getPlatformSnapshot, upsertArticle } from "@/lib/repositories/platformRepository";
import { analyzeCadence, improveCadence } from "@/lib/text/cadence";
import { humanize, humanizeScore } from "@/lib/text/humanizer";

export interface GeneratedContentResult {
  article: Article;
  aiTraceIds: string[];
  contentQuality: ContentQualityMetrics;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ImagePromptPack {
  hero: string;
  square: string;
  vertical: string;
  thumbnail: string;
}

export interface MetaTags {
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  keywords: string[];
}

async function factsForTopic(topic: Topic): Promise<FactClaim[]> {
  return getFactClaims(topic.id);
}

async function sourceRefs(topic: Topic) {
  const state = await getPlatformSnapshot();
  return state.rawItems
    .filter((item) => topic.rawItemIds.includes(item.id))
    .map((item) => ({
      title: item.title,
      publisher: item.sourceName,
      url: item.url,
      publishedAt: item.publishedAt
    }));
}

function createArticleMarkdown(topic: Topic, claims: FactClaim[]): string {
  const claimBullets = claims.map((claim) => `- ${claim.claim}`).join("\n");
  const primaryKeyword = topic.keywords[0] ?? topic.title;
  const keyword2 = topic.keywords[1] ?? topic.category;

  // Pass 1 — Draft: structured prose based on verified claims
  const draft = `## Why this story matters

${topic.summary}

The central issue is ${primaryKeyword}. Multiple independent sources converged on the same theme this cycle, which is stronger evidence than any single report on its own. Don't take a one-source story at face value — look for corroboration first.

## Verified facts from the source cluster

${claimBullets}

These facts are intentionally narrow. QuickGist keeps the source trail separate so the article explains what happened without lifting another publisher's sentences.

## What it means for readers

The useful question isn't only what happened — it's how this affects decisions you need to make. For students, workers, founders, and policy watchers, the pattern around ${keyword2} suggests practical judgment matters more than hype right now.

When a story clusters from several signals, the safest reading is to focus on confirmed movement: who is acting, what changed, and what's still unclear. That's what keeps this article useful without inventing details that haven't been confirmed yet.

## What to watch next

Watch for official statements, follow-up numbers, and reactions from people directly affected. This page updates when the source cluster changes or a higher-confidence claim appears.

The bottom line: ${topic.title} is worth tracking because it ties a current trend to decisions readers might face soon. That's not speculation — it's the pattern the source signals point to.`;

  // Pass 2 — Cadence improvement (fix monotone sentences)
  const cadenceFixed = improveCadence(draft);

  // Pass 3 — Humanize (strip AI tropes, vary openers)
  const { markdown: humanized } = humanize(cadenceFixed);

  return humanized;
}

export interface ContentQualityMetrics {
  humanizeScore: number;
  cadenceScore: number;
  cadenceSuggestions: string[];
}

function createExplainer(topic: Topic, claims: FactClaim[]): string {
  const facts = claims.slice(0, 4).map((claim) => `- ${claim.claim}`).join("\n");
  return `Here's what you need to know about ${topic.title}: this story is about a trend that several sources are pointing to at the same time.

What happened? QuickGist found multiple source records connected to the same topic and extracted the safest confirmed facts.

Why does it matter? The topic may affect how people study, work, spend money, or understand public decisions.

Quick Facts:
${facts}

The Bottom Line: follow the verified facts first, then watch for updates before making strong conclusions.`;
}

function createSocialPack(topic: Topic, articleSlug: string, claims: FactClaim[]): SocialPack {
  const url = `/news/${articleSlug}`;
  return {
    xThread: [
      `${topic.title}: the short version.`,
      claims[0]?.claim ?? topic.summary,
      claims[1]?.claim ?? "The story is based on multiple source signals, not one isolated link.",
      "The key is to separate confirmed facts from what still needs follow-up.",
      `Read the full QuickGist explainer: ${url} #News #Explained`
    ],
    instagramCaption: `${topic.title}. Here is the simple version: ${topic.summary} Link in bio for the full story. #News #Explained #QuickGist`,
    linkedinPost: `${topic.title}\n\nThe professional takeaway: confirmed facts matter more than speed. This story is useful because it combines multiple source signals and explains what to watch next.\n\nWhat detail would you verify first? #News #Analysis`,
    whatsappSummary: [topic.title, claims[0]?.claim ?? topic.summary, `Full story: ${url}`]
  };
}

export async function generateArticlePackage(topic: Topic): Promise<GeneratedContentResult> {
  const claims = await factsForTopic(topic);
  const now = nowIso();
  const slug = slugify(topic.title);
  const articleAi = await routeAiTask({
    task: "article",
    prompt: buildArticlePrompt(topic, claims),
    traceId: topic.id
  });
  const explainerAi = await routeAiTask({
    task: "explainer",
    prompt: buildExplainerPrompt(topic, claims),
    traceId: topic.id
  });
  const socialAi = await routeAiTask({
    task: "social",
    prompt: buildSocialPrompt(topic, topic.summary),
    traceId: topic.id
  });
  const scriptAi = await routeAiTask({
    task: "script",
    prompt: `Create a 45 second neutral video script for ${topic.title}.`,
    traceId: topic.id
  });
  const imageAi = await routeAiTask({
    task: "image_prompt",
    prompt: `Create an editorial image prompt for ${topic.title}.`,
    traceId: topic.id
  });

  const contentMarkdown = createArticleMarkdown(topic, claims);
  const summaryBullets = claims.slice(0, 3).map((claim) => claim.claim);
  const article: Article = {
    id: `article-${stableHash(`${topic.id}:${slug}`)}`,
    topicId: topic.id,
    slug,
    title: topic.title,
    metaDescription: topic.summary.slice(0, 155),
    dek: topic.summary.slice(0, 150),
    contentMarkdown,
    summaryBullets,
    eli5Markdown: createExplainer(topic, claims),
    socialPack: createSocialPack(topic, slug, claims),
    videoScript: `Hook: ${topic.title}. Body: explain the verified facts and what remains uncertain. CTA: read the full QuickGist article.`,
    imagePrompt: `Editorial realistic news image for "${topic.title}", credible newsroom style, no text overlay, high detail.`,
    tags: topic.keywords,
    category: topic.category,
    authorName: "QuickGist Editorial",
    status: "review",
    risk: topic.risk,
    qualityScore: 0,
    sources: await sourceRefs(topic),
    readingMinutes: estimateReadingMinutes(contentMarkdown),
    heroImageUrl:
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=80",
    canonicalUrl: `/news/${slug}`,
    createdAt: now,
    updatedAt: now
  };

  await upsertArticle(article);

  const cadenceReport = analyzeCadence(contentMarkdown);
  const hScore = humanizeScore(contentMarkdown);

  return {
    article,
    aiTraceIds: [articleAi.id, explainerAi.id, socialAi.id, scriptAi.id, imageAi.id],
    contentQuality: {
      humanizeScore: hScore,
      cadenceScore: cadenceReport.score,
      cadenceSuggestions: cadenceReport.suggestions
    }
  };
}

export async function generateEli5(topic: Topic): Promise<{ markdown: string; aiTraceId: string }> {
  const claims = await factsForTopic(topic);
  const ai = await routeAiTask({
    task: "explainer",
    prompt: buildExplainerPrompt(topic, claims),
    traceId: topic.id
  });
  return { markdown: createExplainer(topic, claims), aiTraceId: ai.id };
}

export async function generateFaqSection(
  topic: Topic
): Promise<{ items: FaqItem[]; aiTraceId: string }> {
  const ai = await routeAiTask({
    task: "faq",
    prompt: buildFaqPrompt(topic, topic.summary),
    traceId: topic.id
  });
  const items: FaqItem[] = [
    {
      question: `What is ${topic.title} about?`,
      answer: topic.summary
    },
    {
      question: "Why is this story trending right now?",
      answer:
        "Multiple sources surfaced overlapping signals around this topic in the same window, which our trend engine treats as a confirmed cluster."
    },
    {
      question: "What is confirmed and what is still uncertain?",
      answer:
        "Confirmed claims are listed in the article body. Anything that hasn't been corroborated by at least two sources is intentionally left out."
    },
    {
      question: "Where can I follow updates?",
      answer:
        "Subscribe to the daily brief or check the trending dashboard. The article page is updated whenever the source cluster changes."
    },
    {
      question: "How was this article produced?",
      answer:
        "QuickGist clusters source signals, extracts the safest confirmed facts, and synthesizes the story. Every article keeps a source trail and is reviewed against quality and SEO checks."
    }
  ];
  return { items, aiTraceId: ai.id };
}

export async function generateMetaTags(article: Article): Promise<MetaTags> {
  const primaryKeyword = article.tags[0] ?? article.title.split(" ")[0];
  const baseTitle = article.title.length <= 60 ? article.title : `${article.title.slice(0, 57)}…`;
  const description =
    article.metaDescription && article.metaDescription.length >= 110
      ? article.metaDescription
      : `${article.dek} — ${primaryKeyword} explained.`;
  return {
    title: baseTitle,
    metaDescription: description.slice(0, 160),
    ogTitle: baseTitle,
    ogDescription: description.slice(0, 200),
    twitterTitle: baseTitle,
    twitterDescription: description.slice(0, 200),
    keywords: article.tags
  };
}

export async function generateVideoLongScript(
  topic: Topic
): Promise<{ script: string; aiTraceId: string }> {
  const ai = await routeAiTask({
    task: "script",
    prompt: buildVideoLongPrompt(topic, topic.summary),
    traceId: topic.id
  });
  const script = `# ${topic.title}

[HOOK 0:00–0:15]
${topic.summary} Why is everyone talking about it today? Here's what you actually need to know.

[CONTEXT 0:15–1:15]
For context, this story sits in the ${topic.category} category and pulls signals from multiple independent sources. The pattern suggests sustained interest, not a one-off spike.

[KEY FACTS 1:15–2:45]
${(topic.keywords ?? []).slice(0, 4).map((keyword, index) => `${index + 1}. ${keyword}.`).join("\n")}

[WHY IT MATTERS 2:45–3:45]
The practical question is how this affects decisions you might make this week — about money, work, study, or vote. Here's the most useful framing for ordinary readers.

[WHAT TO WATCH 3:45–4:30]
Three things to track next: official statements, follow-up reporting from independent outlets, and any change in confirmed facts.

[OUTRO]
Subscribe for clean, source-grounded coverage of stories that matter.`;
  return { script, aiTraceId: ai.id };
}

export async function generateShortsScript(
  topic: Topic
): Promise<{ script: string; beats: { time: string; line: string; visual: string }[]; aiTraceId: string }> {
  const ai = await routeAiTask({
    task: "shorts_script",
    prompt: buildShortsPrompt(topic, topic.summary),
    traceId: topic.id
  });
  const beats = [
    {
      time: "0:00–0:08",
      line: `Wait — what's actually happening with ${topic.title}?`,
      visual: "[fast headline cut, news ticker]"
    },
    {
      time: "0:08–0:23",
      line: topic.summary,
      visual: "[b-roll of related context]"
    },
    {
      time: "0:23–0:48",
      line: `Here's why it matters: ${(topic.keywords ?? []).slice(0, 2).join(", ")}.`,
      visual: "[on-screen bullet points]"
    },
    {
      time: "0:48–1:00",
      line: "Want the full story without the noise? Link in bio.",
      visual: "[QuickGist logo + CTA card]"
    }
  ];
  const script = beats.map((b) => `${b.time}\n${b.line}\n${b.visual}`).join("\n\n");
  return { script, beats, aiTraceId: ai.id };
}

export async function generateImagePromptPack(
  topic: Topic
): Promise<{ pack: ImagePromptPack; aiTraceId: string }> {
  const ai = await routeAiTask({
    task: "image_prompts_pack",
    prompt: buildImagePromptsPrompt(topic, topic.summary),
    traceId: topic.id
  });
  const seed = `${topic.title}, ${topic.category}, editorial style, photorealistic, neutral lighting, no text overlay`;
  return {
    pack: {
      hero: `Cinematic 16:9 editorial photo: ${seed}, magazine quality, shallow depth of field`,
      square: `1:1 social card composition: ${seed}, balanced framing, vivid but neutral`,
      vertical: `9:16 vertical for Reels/Shorts: ${seed}, dynamic composition, focal subject upper third`,
      thumbnail: `1.91:1 YouTube thumbnail: ${seed}, bold subject in left third, room for headline overlay on right`
    },
    aiTraceId: ai.id
  };
}

export async function generateSeoRewriteSuggestions(
  article: Article,
  primaryKeyword: string,
  issueMessages: string[]
): Promise<{ title: string; metaDescription: string; suggestions: string[]; aiTraceId: string }> {
  const ai = await routeAiTask({
    task: "seo_rewrite",
    prompt: buildSeoRewritePrompt(article, primaryKeyword, issueMessages),
    traceId: article.id
  });
  const newTitle =
    article.title.toLowerCase().includes(primaryKeyword.toLowerCase()) || !primaryKeyword
      ? article.title
      : `${primaryKeyword[0].toUpperCase() + primaryKeyword.slice(1)}: ${article.title}`;
  const truncatedTitle = newTitle.length > 60 ? `${newTitle.slice(0, 57)}…` : newTitle;
  const newMeta =
    article.metaDescription.length >= 140
      ? article.metaDescription
      : `${article.dek} ${primaryKeyword ? `Get the full ${primaryKeyword} explainer with sources.` : ""}`.slice(0, 160);
  return {
    title: truncatedTitle,
    metaDescription: newMeta,
    suggestions: issueMessages,
    aiTraceId: ai.id
  };
}
