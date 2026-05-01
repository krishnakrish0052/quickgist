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
import { searchRelevantImage, titleToImageQuery } from "@/lib/services/imageSearch";

const CATEGORY_IMAGES: Record<string, string[]> = {
  technology: [
    "photo-1518770660439-4636190af475", // circuit board
    "photo-1526374965328-7f61d4dc18c5", // matrix code
    "photo-1550751827-4bd374c3f58b", // cyber lock
    "photo-1451187580459-43490279c0fa", // earth network
    "photo-1488590528505-98d2b5aba04b", // laptop screen
    "photo-1504384308090-c894fdcc538d", // server room
  ],
  finance: [
    "photo-1611974789855-9c2a0a7236a3", // stock charts
    "photo-1579532537598-459ecdaf39cc", // trading screen
    "photo-1526304640581-d334cdbbf45e", // financial analysis
    "photo-1559526324-4b87b5e36e44", // currency
    "photo-1554224155-8d04cb21cd6c", // business meeting
    "photo-1460925895917-afdab827c52f", // wall street
  ],
  politics: [
    "photo-1529107386315-e1a2ed48a620", // parliament
    "photo-1541872703-74c5e44368f9", // podium
    "photo-1575320181282-9afab399332c", // flags
    "photo-1464938050520-ef2270bb8ce8", // capitol
    "photo-1486591978090-58e619d37fe7", // globe
    "photo-1495020689067-958852a7765e", // newspaper
  ],
  health: [
    "photo-1576091160399-112ba8d25d1d", // hospital
    "photo-1530497610245-94d3c16cda28", // medical
    "photo-1559757148-5c350d0d3c56", // lab
    "photo-1584515933487-779824d29309", // medicine
    "photo-1631815589968-fdb09a223b1e", // microscope
    "photo-1559757175-0eb30cd8c063", // doctor
  ],
  education: [
    "photo-1523050854058-8df90110c9f1", // graduation
    "photo-1427504494785-3a9ca7044f45", // classroom
    "photo-1503676260728-1c00da094a0b", // books
    "photo-1546410531-bb4caa6b424d", // student
    "photo-1497633762265-9d179a990aa6", // library
    "photo-1434030216411-0b793f4b4173", // writing
  ],
  science: [
    "photo-1532094349884-543559612296", // molecules
    "photo-1507413245164-6160d8298b31", // lab
    "photo-1516339901601-2e1b62dc0c45", // telescope
    "photo-1635070041078-e363dbe005cb", // chemistry
    "photo-1581091226825-a6a2a5aee158", // research
    "photo-1564325724739-bae0bd08762c", // astronomy
  ],
  world: [
    "photo-1495020689067-958852a7765e", // newspaper
    "photo-1585829365295-ab7cd400c167", // globe
    "photo-1504711434969-e33886168f5c", // city
    "photo-1541963463532-d68292c34b19", // streets
    "photo-1486591978090-58e619d37fe7", // world map
    "photo-1514439827219-9137a0b99245", // architecture
  ],
};

const OLD_PLACEHOLDER = "photo-1495020689067-958852a7765e";

function pickHeroImage(topic: Topic): string {
  const pool = CATEGORY_IMAGES[topic.category] ?? CATEGORY_IMAGES.world;
  const hash = Math.abs(parseInt(stableHash(topic.id).replace(/\D/g, "").slice(0, 8) || "0", 10));
  const photoId = pool[hash % pool.length];
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1400&q=80`;
}

/** Returns the best hero image URL for an article — falls back to category pool if stored URL is stale/missing. */
export function articleHeroImage(article: { heroImageUrl?: string | null; category: string; slug: string }): string {
  const stored = article.heroImageUrl ?? "";
  if (!stored || stored.includes(OLD_PLACEHOLDER)) {
    const pool = CATEGORY_IMAGES[article.category.toLowerCase()] ?? CATEGORY_IMAGES.world;
    const hash = Math.abs(parseInt(article.slug.replace(/\D/g, "").slice(0, 8) || "1", 10) + article.slug.length * 31);
    return `https://images.unsplash.com/${pool[hash % pool.length]}?auto=format&fit=crop&w=1400&q=80`;
  }
  return stored;
}

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
  const primaryKeyword = (topic.keywords[0] ?? topic.title).toLowerCase();
  const keyword2 = topic.keywords[1] ?? topic.category;
  const keyword3 = topic.keywords[2] ?? topic.keywords[0] ?? "";

  // Build fact paragraphs — each claim becomes its own sentence in running prose
  const factParagraphs = claims
    .slice(0, 6)
    .map((c) => c.claim.trim())
    .join(" ");

  const verifiedList = claims
    .slice(0, 5)
    .map((c) => `- ${c.claim.trim()}`)
    .join("\n");

  // Derive a short context phrase from the category
  const categoryContext: Record<string, string> = {
    technology: "the technology sector",
    finance: "financial markets and the economy",
    health: "public health and medical research",
    politics: "the political landscape",
    education: "education policy",
    science: "scientific research",
    world: "global affairs",
  };
  const contextPhrase = categoryContext[topic.category.toLowerCase()] ?? "the broader public debate";

  // Intro: keyword in first sentence, summary in second
  const intro = `${topic.title} has emerged as a significant development in ${contextPhrase}. ${topic.summary} Understanding what ${primaryKeyword} means — and why multiple independent sources are reporting on it simultaneously — is essential for anyone tracking this area.`;

  // Draft — full SEO-structured article
  const draft = `${intro}

## What happened: the key facts on ${primaryKeyword}

${factParagraphs}

These details come from multiple independent source signals, not a single report. Cross-source corroboration is the standard QuickGist applies before publishing any claim about ${primaryKeyword}.

## Verified findings

${verifiedList}

Each point above has been extracted from source material and cross-checked. Where sources disagreed, the more conservative claim was selected.

## Why ${keyword2} matters right now

The story around ${topic.title} sits at an important moment. Coverage of ${keyword2} has accelerated across major publications this cycle, which typically signals that the issue is moving from specialist discussion into mainstream consequence.

${keyword3 ? `The connection to ${keyword3} is worth noting specifically. ` : ""}For readers tracking this topic, the practical question is not just what happened — it is what actions or decisions the development might affect in the weeks ahead.

## What to watch next

Readers following ${primaryKeyword} should look for:

- Official responses and statements from the relevant authorities
- Follow-up data that either confirms or qualifies the initial reports
- Secondary effects in related areas of ${contextPhrase}

Coverage of ${topic.title} will continue to develop. The details above represent the verified state of the story at time of publication.

## The bottom line

${topic.title} is a developing story with confirmed movement on multiple fronts. The verified facts point clearly to ${primaryKeyword} as the central issue, with ${keyword2} as an important secondary dimension. Stay with QuickGist for source-grounded updates as this story develops.`;

  // Pass 2 — Cadence improvement
  const cadenceFixed = improveCadence(draft);

  // Pass 3 — Humanize
  const { markdown: humanized } = humanize(cadenceFixed);

  return humanized;
}

export interface ContentQualityMetrics {
  humanizeScore: number;
  cadenceScore: number;
  cadenceSuggestions: string[];
}

function createExplainer(topic: Topic, claims: FactClaim[]): string {
  const primaryKeyword = topic.keywords[0] ?? topic.title;
  const facts = claims.slice(0, 4).map((claim) => `- ${claim.claim}`).join("\n");
  return `## ${topic.title} — explained simply

**What is this about?** ${topic.summary}

**Why are people talking about ${primaryKeyword}?** Multiple news sources picked up this story at the same time, which usually means the development is significant enough to have real-world consequences — for businesses, policymakers, or everyday people.

**Quick Facts**

${facts}

**What does this mean for you?** The story around ${topic.title} could affect decisions in ${topic.category} — from policy changes to market shifts to public behaviour. The key is to focus on the confirmed facts above rather than speculation.

**The Bottom Line:** ${topic.title} is worth understanding because it is already generating action, not just commentary. Follow verified updates as more details emerge.`;
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

async function resolveHeroImage(topic: Topic): Promise<string> {
  const query = titleToImageQuery(topic.title, topic.keywords);
  const found = await searchRelevantImage(query);
  return found ?? pickHeroImage(topic);
}

function buildMetaDescription(topic: Topic): string {
  const keyword = topic.keywords[0] ?? topic.title;
  const base = `${topic.title}: ${topic.summary}`;
  const suffix = ` Learn what ${keyword} means and why it matters.`;
  const combined = (base + suffix).slice(0, 157).trimEnd();
  return combined.length < base.length ? base.slice(0, 155).trimEnd() + "." : combined;
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
    metaDescription: buildMetaDescription(topic),
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
    heroImageUrl: await resolveHeroImage(topic),
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
