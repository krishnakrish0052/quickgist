import { describe, expect, it } from "vitest";
import { scoreArticle } from "@/lib/services/seoEngine";
import type { Article } from "@/lib/types";

function makeTestArticle(overrides?: Partial<Article>): Article {
  return {
    id: "test-article-1",
    topicId: "test-topic-1",
    slug: "test-article-slug",
    title: "Test Article Title",
    metaDescription: "This is a test meta description for the article being tested.",
    dek: "A test dek for the article.",
    contentMarkdown: "This is some test content for the article.",
    summaryBullets: ["Point 1", "Point 2", "Point 3"],
    eli5Markdown: "Simple explanation of the topic for a general audience.",
    socialPack: {
      xThread: ["Tweet about this topic."],
      instagramCaption: "Instagram caption for this topic.",
      linkedinPost: "LinkedIn post about this topic.",
      whatsappSummary: ["WhatsApp summary point 1."],
    },
    videoScript: "Video script for this topic.",
    imagePrompt: "Editorial image prompt for this topic.",
    tags: ["test"],
    category: "technology",
    authorName: "Test Author",
    status: "draft",
    risk: "low",
    qualityScore: 0,
    sources: [
      {
        title: "Source Title",
        publisher: "Source Publisher",
        url: "https://example.com/article",
        publishedAt: "2026-01-01T00:00:00Z",
      },
    ],
    readingMinutes: 3,
    heroImageUrl: "https://example.com/hero.jpg",
    canonicalUrl: "https://example.com/test-article",
    publishedAt: "2026-05-10T00:00:00Z",
    createdAt: "2026-05-10T00:00:00Z",
    updatedAt: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

const WELL_FORMED_BODY = `## Understanding AI Literacy in Modern Education

AI literacy is becoming a fundamental skill that every student needs to develop. As artificial intelligence tools become more widespread, understanding how to use them responsibly is just as important as knowing how to code. This comprehensive guide explores the key aspects of AI literacy and why it matters for education today.

The rapid adoption of AI tools in classrooms has created an urgent need for structured AI literacy programs. Students are already using chatbots for research, writing assistance, and problem-solving. Without proper guidance, they risk developing poor habits that could undermine their learning and critical thinking skills. AI literacy addresses this gap by teaching students not just how to use AI, but when it is appropriate and how to verify the outputs.

Many universities have recognized this need and are integrating AI literacy into their core curriculum. Rather than treating AI as a standalone subject, they are weaving it into existing courses across disciplines. For example, business students learn to evaluate AI-generated market analyses, while journalism students practice fact-checking AI-assisted research. This cross-disciplinary approach ensures that AI literacy is not confined to computer science departments but becomes a universal competency.

## Why AI Literacy Matters for Students

Students who develop strong AI literacy skills gain significant advantages in their academic and professional careers. They learn to approach AI outputs with healthy skepticism, understanding that these systems can produce convincing but incorrect information. This critical mindset is invaluable in an era where AI-generated content is increasingly difficult to distinguish from human-created work.

The key components of AI literacy include understanding how AI models work at a conceptual level, recognizing common failure modes such as hallucinations and biases, and developing verification strategies. Students should also learn about the ethical implications of AI use, including privacy concerns, data rights, and the environmental impact of large-scale AI systems. These topics prepare students to be responsible users and creators of AI technology.

Practical skills are equally important. Students need hands-on experience with prompt engineering, output evaluation, and collaborative problem-solving with AI tools. They should practice using AI for creative tasks like brainstorming and editing, as well as analytical tasks like data interpretation and code review. The goal is not to replace human judgment but to enhance it through thoughtful AI collaboration.

## How Employers View AI Literacy

Employers increasingly value candidates who demonstrate strong AI literacy. In a recent survey, more than seventy percent of hiring managers said they prefer candidates who can effectively use AI tools while maintaining critical oversight. This trend is reshaping hiring practices across industries, from technology and finance to healthcare and education.

The most sought-after skills include the ability to verify AI-generated information, explain AI-assisted decisions, and identify when AI tools are being misused. Employers want team members who can leverage AI to increase productivity without compromising quality or ethics. This has led many companies to invest in AI literacy training for their existing workforce, creating additional opportunities for graduates who already possess these skills.

Companies are also looking for candidates who understand the limitations of AI systems. Knowing when not to use AI is just as valuable as knowing how to use it effectively. This nuanced understanding comes from comprehensive AI literacy education that covers both the capabilities and the constraints of current AI technology.

![AI literacy training session with students using laptops](https://example.com/ai-literacy-training.jpg)

## Key Recommendations for Building AI Literacy

- Start with foundational concepts and teach students how AI models are trained and what data they use
- Emphasize verification so students always cross-check AI outputs against reliable sources
- Practice responsible use including exercises on citation, privacy protection, and ethical decision-making
- Encourage critical thinking to help students identify biases, errors, and limitations in AI-generated content
- Build practical skills through hands-on experience with real AI tools in supervised settings
- Address ethical concerns like data privacy, algorithmic fairness, and environmental impact
- Foster collaboration by teaching students to combine AI assistance with human creativity and judgment
- Stay current since AI technology evolves rapidly and curricula should be reviewed and updated regularly

## The Future of AI Literacy

As AI technology continues to advance, AI literacy will become even more essential. Future developments in multimodal AI, autonomous agents, and personalized learning systems will create new opportunities and challenges. Educational institutions must stay ahead of these trends by continuously updating their AI literacy programs and investing in faculty development.

The next frontier in AI literacy involves understanding more complex AI systems, including those that can generate images, videos, and interactive experiences. Students will need to develop visual literacy skills alongside text-based AI literacy to navigate this evolving landscape. Additionally, as AI becomes more integrated into decision-making processes in government, healthcare, and finance, understanding AI governance and accountability will be crucial for informed citizenship.

Ultimately, AI literacy is about empowerment. It gives students the tools they need to thrive in a world where AI is ubiquitous while protecting them from its potential pitfalls. By investing in comprehensive AI literacy education today, we are preparing the next generation for success in an AI-augmented future.

For more information, check out our [AI education resources](/category/ai-education) and [technology guides](/category/technology).

<img loading="lazy" alt="Students collaborating on AI project" src="https://example.com/ai-students.webp" />`;

const POOR_BODY = "This is a very short article. It has almost no content at all. The writer forgot to add any details.";

describe("scoreArticle", () => {
  it("scores a well-formed article with overall > 70", () => {
    const article = makeTestArticle({
      id: "test-well-formed",
      title: "AI Literacy Programs Expand as Students Demand Safer Digital Skills",
      metaDescription:
        "AI literacy is becoming a campus priority as students and employers focus on verification, privacy, citations, and responsible tool use across disciplines.",
      contentMarkdown: WELL_FORMED_BODY,
      tags: ["ai literacy"],
      heroImageUrl: "https://example.com/hero.jpg",
      canonicalUrl: "/news/ai-literacy-programs-expand",
    });

    const result = scoreArticle(article, "ai literacy");
    expect(result.overall).toBeGreaterThan(70);
  });

  it("scores a poor article with overall < 50", () => {
    const article = makeTestArticle({
      id: "test-poor",
      title: "News",
      metaDescription: "Short.",
      contentMarkdown: POOR_BODY,
      tags: [],
      heroImageUrl: undefined,
      canonicalUrl: undefined,
      publishedAt: "2025-01-01T00:00:00Z",
    });

    const result = scoreArticle(article);
    expect(result.overall).toBeLessThan(50);
  });

  it("computes keyword density component correctly", () => {
    const article = makeTestArticle({
      id: "test-keyword-density",
      title: "AI Literacy Programs Expand as Students Demand Safer Digital Skills",
      metaDescription:
        "AI literacy is becoming a campus priority as students and employers focus on verification, privacy, citations, and responsible tool use across disciplines.",
      contentMarkdown: WELL_FORMED_BODY,
      tags: ["ai literacy"],
    });

    const result = scoreArticle(article, "ai literacy");
    expect(result.keyword.density).toBeGreaterThan(0);
    expect(result.keyword.primaryKeyword).toBe("ai literacy");
    expect(result.keyword.score).toBeGreaterThanOrEqual(0);
    expect(result.keyword.score).toBeLessThanOrEqual(100);
  });

  it("scores an ideal-length title (50-60 chars) close to 100", () => {
    // Title of exactly 55 chars — inside the [50, 60] ideal window
    const title = "AI Literacy Programs Expand as Students Seek Safe Skills";
    expect(title.length).toBeGreaterThanOrEqual(50);
    expect(title.length).toBeLessThanOrEqual(60);

    const article = makeTestArticle({
      id: "test-ideal-title",
      title,
      metaDescription:
        "AI literacy is becoming a campus priority as students and employers focus on verification, privacy, citations, and responsible tool use across disciplines.",
      contentMarkdown: WELL_FORMED_BODY,
      tags: ["ai literacy"],
    });

    const result = scoreArticle(article, "ai literacy");
    // Title length score should be 100 (perfect length in [50,60]),
    // and with keyword present the final title score = 100*0.6 + 40 = 100
    expect(result.title.length).toBe(title.length);
    expect(result.title.score).toBe(100);
  });

  it("scores meta description close to ideal with 140-160 chars", () => {
    // 148 chars — inside the [140, 160] ideal window
    const meta =
      "AI literacy is becoming a fundamental campus priority as students and employers demand verification, privacy, and responsible tool use skills.";
    expect(meta.length).toBeGreaterThanOrEqual(140);
    expect(meta.length).toBeLessThanOrEqual(160);

    const article = makeTestArticle({
      id: "test-ideal-meta",
      title: "AI Literacy Programs Expand as Students Demand Safer Digital Skills",
      metaDescription: meta,
      contentMarkdown: WELL_FORMED_BODY,
      tags: ["ai literacy"],
    });

    const result = scoreArticle(article, "ai literacy");
    // Meta length in [140, 160] gives length score 100,
    // and with keyword present the final meta score = 100*0.6 + 40 = 100
    expect(result.meta.length).toBe(meta.length);
    expect(result.meta.score).toBe(100);
  });

  it("scores structure correctly with H2s and bullet points", () => {
    const article = makeTestArticle({
      id: "test-structure",
      title: "AI Literacy Programs Expand as Students Demand Safer Digital Skills",
      metaDescription:
        "AI literacy is becoming a campus priority as students and employers focus on verification, privacy, citations, and responsible tool use across disciplines.",
      contentMarkdown: WELL_FORMED_BODY,
      tags: ["ai literacy"],
    });

    const result = scoreArticle(article);
    // WELL_FORMED_BODY has 5 H2 headings and 8 bullet items
    expect(result.structure.headingCount).toBeGreaterThanOrEqual(3);
    expect(result.structure.bullets).toBeGreaterThanOrEqual(2);
    expect(result.structure.score).toBeGreaterThanOrEqual(70);
  });
});
