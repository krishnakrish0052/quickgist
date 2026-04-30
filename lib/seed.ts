import type { Article, FactClaim, PlatformState, RawItem, Source, Topic } from "@/lib/types";
import { estimateReadingMinutes, stableHash } from "@/lib/utils";

const seedTimestamp = "2026-04-28T00:00:00.000Z";

export const seedSources: Source[] = [
  {
    id: "src-policy-watch",
    name: "Policy Watch",
    kind: "rss",
    homepageUrl: "https://example.com/policy-watch",
    reliabilityScore: 86,
    language: "en",
    country: "IN",
    enabled: true
  },
  {
    id: "src-campus-daily",
    name: "Campus Daily",
    kind: "rss",
    homepageUrl: "https://example.com/campus-daily",
    reliabilityScore: 79,
    language: "en",
    country: "IN",
    enabled: true
  },
  {
    id: "src-techwire",
    name: "TechWire Asia",
    kind: "newsapi",
    homepageUrl: "https://example.com/techwire",
    reliabilityScore: 82,
    language: "en",
    country: "SG",
    enabled: true
  },
  {
    id: "src-trends",
    name: "Trend Signals",
    kind: "google_trends",
    homepageUrl: "https://trends.google.com",
    reliabilityScore: 70,
    language: "en",
    country: "IN",
    enabled: true
  }
];

export const seedRawItems: RawItem[] = [
  {
    id: "raw-ai-literacy-policy",
    sourceId: "src-policy-watch",
    sourceName: "Policy Watch",
    title: "Universities add AI safety modules to technology courses",
    url: "https://example.com/policy-watch/ai-safety-modules",
    summary:
      "Several Indian universities are adding AI literacy and safety modules to computer science and business programs.",
    publishedAt: "2026-04-27T11:00:00.000Z",
    fetchedAt: seedTimestamp,
    contentHash: stableHash("Universities add AI safety modules to technology courses"),
    signals: { shareVelocity: 42, region: "IN" }
  },
  {
    id: "raw-ai-literacy-campus",
    sourceId: "src-campus-daily",
    sourceName: "Campus Daily",
    title: "Student groups ask for practical AI training, not only coding classes",
    url: "https://example.com/campus-daily/practical-ai-training",
    summary:
      "Student groups say AI education should include verification, citation, privacy, and responsible tool use.",
    publishedAt: "2026-04-27T14:20:00.000Z",
    fetchedAt: seedTimestamp,
    contentHash: stableHash("Student groups ask for practical AI training"),
    signals: { comments: 86, region: "IN" }
  },
  {
    id: "raw-ai-literacy-techwire",
    sourceId: "src-techwire",
    sourceName: "TechWire Asia",
    title: "Employers want graduates who can audit AI output",
    url: "https://example.com/techwire/audit-ai-output",
    summary:
      "Recruiters increasingly ask entry-level candidates to explain how they verify AI-generated analysis and avoid blind automation.",
    publishedAt: "2026-04-27T16:35:00.000Z",
    fetchedAt: seedTimestamp,
    contentHash: stableHash("Employers want graduates who can audit AI output"),
    signals: { shareVelocity: 37, region: "APAC" }
  },
  {
    id: "raw-ai-literacy-trend",
    sourceId: "src-trends",
    sourceName: "Trend Signals",
    title: "Search interest rises for AI literacy courses",
    url: "https://trends.google.com/trends/explore?q=ai%20literacy%20course",
    summary:
      "Search demand has increased for simple AI literacy courses, especially among students and early-career workers.",
    publishedAt: "2026-04-27T18:00:00.000Z",
    fetchedAt: seedTimestamp,
    contentHash: stableHash("Search interest rises for AI literacy courses"),
    signals: { trendRank: 7, shareVelocity: 51, region: "IN" }
  }
];

export const seedTopics: Topic[] = [
  {
    id: "topic-ai-literacy",
    slug: "ai-literacy-and-safety-programs-expand-across-campuses",
    title: "AI literacy and safety programs expand across campuses",
    summary:
      "Colleges, students, and employers are converging on a practical version of AI education: verification, privacy, citations, and responsible use.",
    category: "technology",
    keywords: ["ai literacy", "students", "safety", "education", "verification"],
    status: "published",
    sourceIds: ["src-policy-watch", "src-campus-daily", "src-techwire", "src-trends"],
    rawItemIds: [
      "raw-ai-literacy-policy",
      "raw-ai-literacy-campus",
      "raw-ai-literacy-techwire",
      "raw-ai-literacy-trend"
    ],
    trendScore: 83,
    noveltyScore: 72,
    risk: "medium",
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp
  }
];

export const seedFactClaims: FactClaim[] = [
  {
    id: "fact-ai-literacy-1",
    topicId: "topic-ai-literacy",
    claim:
      "Several universities are adding AI literacy and safety topics to existing technology and business programs.",
    sourceRawItemIds: ["raw-ai-literacy-policy"],
    confidence: 0.82,
    risk: "medium",
    createdAt: seedTimestamp
  },
  {
    id: "fact-ai-literacy-2",
    topicId: "topic-ai-literacy",
    claim:
      "Students are asking for practical training on verification, citation, privacy, and responsible AI use.",
    sourceRawItemIds: ["raw-ai-literacy-campus"],
    confidence: 0.8,
    risk: "medium",
    createdAt: seedTimestamp
  },
  {
    id: "fact-ai-literacy-3",
    topicId: "topic-ai-literacy",
    claim:
      "Employers increasingly value graduates who can audit and explain AI-assisted work.",
    sourceRawItemIds: ["raw-ai-literacy-techwire"],
    confidence: 0.78,
    risk: "medium",
    createdAt: seedTimestamp
  },
  {
    id: "fact-ai-literacy-4",
    topicId: "topic-ai-literacy",
    claim:
      "Search demand is rising for AI literacy courses among students and early-career workers.",
    sourceRawItemIds: ["raw-ai-literacy-trend"],
    confidence: 0.74,
    risk: "low",
    createdAt: seedTimestamp
  }
];

const seedArticleMarkdown = `## Why AI literacy is becoming a campus priority

AI literacy is moving from a specialist topic into mainstream education. Colleges are starting to treat responsible AI use as a basic skill, similar to spreadsheet literacy or source citation.

The shift is practical. Students already use AI tools for research, writing, coding, and revision. The risk is not that every student uses automation. The risk is that students use it without knowing how to verify claims, protect private data, or explain the final work.

## What students are asking for

Student groups want AI education that goes beyond prompt tricks. The strongest demand is for simple training on checking facts, citing sources, understanding privacy tradeoffs, and spotting confident but wrong answers.

That makes the new programs different from older technology courses. They are not only about how AI systems are built. They are also about how ordinary people should use them in a responsible way.

## Why employers care

Employers are beginning to ask a sharper question: can a graduate audit AI output? A candidate who can explain their process, identify weak evidence, and correct model mistakes is more useful than someone who only knows how to generate a quick draft.

This is why AI safety and AI literacy are becoming career skills. The value is not blind speed. The value is judgment.

## What to watch next

The next step is consistency. If colleges adopt clear standards for disclosure, citation, privacy, and verification, students will have a shared playbook. If they do not, AI use will remain uneven and hard to assess.

For readers, the bottom line is simple: AI literacy is no longer just a technical subject. It is becoming a general education skill for studying, working, and making decisions.`;

export const seedArticles: Article[] = [
  {
    id: "article-ai-literacy",
    topicId: "topic-ai-literacy",
    slug: "ai-literacy-and-safety-programs-expand-across-campuses",
    title: "AI literacy programs expand as students demand safer skills",
    metaDescription:
      "AI literacy is becoming a campus priority as students and employers focus on verification, privacy, citations, and responsible tool use.",
    dek: "Colleges are moving beyond prompt tips and toward practical AI judgment.",
    contentMarkdown: seedArticleMarkdown,
    summaryBullets: [
      "AI literacy is becoming a general education skill, not only a coding topic.",
      "Students want training on verification, citation, privacy, and responsible use.",
      "Employers increasingly value graduates who can audit AI-assisted work."
    ],
    eli5Markdown:
      "Here's what you need to know about AI literacy: it means learning how to use AI tools carefully, not just quickly. Students use AI for homework, coding, and research, but they also need to check whether the answer is true, cite sources, and avoid sharing private information. The bottom line: AI is useful only when people know how to question it.",
    socialPack: {
      xThread: [
        "AI literacy is becoming a basic campus skill, not a niche coding topic.",
        "The big need: students must learn verification, citation, privacy, and responsible use.",
        "Employers care because they want graduates who can audit AI output, not blindly trust it.",
        "The next wave of AI education will be less about tricks and more about judgment.",
        "Full explainer: /news/ai-literacy-and-safety-programs-expand-across-campuses #AI #Education #Careers"
      ],
      instagramCaption:
        "AI skills are changing. Students do not just need faster drafts. They need safer workflows: verify facts, cite sources, protect private data, and explain how the work was made. Link in bio for the full story. #AI #Education #Students #Careers",
      linkedinPost:
        "AI literacy is becoming a workforce skill. The graduates who stand out will be the ones who can verify, cite, and explain AI-assisted work. How should colleges teach responsible AI use? #AI #Education",
      whatsappSummary: [
        "AI literacy is becoming a basic college skill.",
        "Students want practical training on fact-checking, citation, and privacy.",
        "Employers value candidates who can audit AI output."
      ]
    },
    videoScript:
      "Hook: AI literacy is becoming the new spreadsheet skill. Body: Colleges are adding practical modules on verification, privacy, citations, and responsible use. CTA: Read the full QuickGist explainer.",
    imagePrompt:
      "Editorial image of college students reviewing AI-generated research on laptops, newsroom lighting, realistic, trustworthy, no text overlays.",
    tags: ["AI", "Education", "Students", "Careers", "AI Safety"],
    category: "technology",
    authorName: "QuickGist Editorial AI",
    status: "published",
    risk: "medium",
    qualityScore: 91,
    sources: seedRawItems.map((item) => ({
      title: item.title,
      publisher: item.sourceName,
      url: item.url,
      publishedAt: item.publishedAt
    })),
    readingMinutes: estimateReadingMinutes(seedArticleMarkdown),
    heroImageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    canonicalUrl: "/news/ai-literacy-and-safety-programs-expand-across-campuses",
    publishedAt: seedTimestamp,
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp
  }
];

export function createSeedState(): PlatformState {
  return {
    sources: [...seedSources],
    rawItems: [...seedRawItems],
    topics: [...seedTopics],
    topicSources: seedTopics.flatMap((topic) =>
      topic.rawItemIds.map((rawItemId) => {
        const rawItem = seedRawItems.find((item) => item.id === rawItemId);
        return {
          topicId: topic.id,
          rawItemId,
          sourceId: rawItem?.sourceId ?? "unknown",
          confidence: 0.84
        };
      })
    ),
    factClaims: [...seedFactClaims],
    articles: [...seedArticles],
    qualityReports: [],
    reviewTasks: [],
    mediaAssets: [
      {
        id: "media-ai-literacy-hero",
        articleId: "article-ai-literacy",
        topicId: "topic-ai-literacy",
        kind: "hero",
        prompt: seedArticles[0].imagePrompt,
        url: seedArticles[0].heroImageUrl ?? "",
        provider: "remote",
        attribution: "Unsplash editorial placeholder",
        createdAt: seedTimestamp
      }
    ],
    distributionJobs: [],
    subscribers: [],
    auditLogs: []
  };
}
