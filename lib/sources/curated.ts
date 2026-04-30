/**
 * Curated free RSS feeds for QuickGist's default ingestion run.
 * Only feeds with permissive RSS access and reliable publishing cadence.
 * Country/language is best-effort metadata used for source weighting and i18n.
 */

import type { Source } from "@/lib/types";

export interface CuratedFeed {
  id: string;
  name: string;
  homepageUrl: string;
  rssUrl: string;
  category: string;
  country: string;
  language: string;
  reliability: number;
}

export const curatedFeeds: CuratedFeed[] = [
  // World
  {
    id: "src-bbc-world",
    name: "BBC News — World",
    homepageUrl: "https://www.bbc.com/news/world",
    rssUrl: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "world",
    country: "GB",
    language: "en",
    reliability: 95
  },
  {
    id: "src-aljazeera",
    name: "Al Jazeera",
    homepageUrl: "https://www.aljazeera.com",
    rssUrl: "https://www.aljazeera.com/xml/rss/all.xml",
    category: "world",
    country: "QA",
    language: "en",
    reliability: 88
  },
  {
    id: "src-npr-world",
    name: "NPR — World",
    homepageUrl: "https://www.npr.org/sections/world",
    rssUrl: "https://feeds.npr.org/1004/rss.xml",
    category: "world",
    country: "US",
    language: "en",
    reliability: 92
  },
  {
    id: "src-guardian-world",
    name: "The Guardian — World",
    homepageUrl: "https://www.theguardian.com/world",
    rssUrl: "https://www.theguardian.com/world/rss",
    category: "world",
    country: "GB",
    language: "en",
    reliability: 90
  },

  // Business / Finance
  {
    id: "src-bbc-business",
    name: "BBC News — Business",
    homepageUrl: "https://www.bbc.com/news/business",
    rssUrl: "https://feeds.bbci.co.uk/news/business/rss.xml",
    category: "business",
    country: "GB",
    language: "en",
    reliability: 94
  },
  {
    id: "src-npr-business",
    name: "NPR — Business",
    homepageUrl: "https://www.npr.org/sections/business",
    rssUrl: "https://feeds.npr.org/1006/rss.xml",
    category: "business",
    country: "US",
    language: "en",
    reliability: 90
  },
  {
    id: "src-guardian-business",
    name: "The Guardian — Business",
    homepageUrl: "https://www.theguardian.com/business",
    rssUrl: "https://www.theguardian.com/business/rss",
    category: "business",
    country: "GB",
    language: "en",
    reliability: 88
  },

  // Technology
  {
    id: "src-bbc-tech",
    name: "BBC News — Technology",
    homepageUrl: "https://www.bbc.com/news/technology",
    rssUrl: "https://feeds.bbci.co.uk/news/technology/rss.xml",
    category: "technology",
    country: "GB",
    language: "en",
    reliability: 93
  },
  {
    id: "src-techcrunch",
    name: "TechCrunch",
    homepageUrl: "https://techcrunch.com",
    rssUrl: "https://techcrunch.com/feed/",
    category: "technology",
    country: "US",
    language: "en",
    reliability: 80
  },
  {
    id: "src-theverge",
    name: "The Verge",
    homepageUrl: "https://www.theverge.com",
    rssUrl: "https://www.theverge.com/rss/index.xml",
    category: "technology",
    country: "US",
    language: "en",
    reliability: 82
  },
  {
    id: "src-arstechnica",
    name: "Ars Technica",
    homepageUrl: "https://arstechnica.com",
    rssUrl: "https://feeds.arstechnica.com/arstechnica/index",
    category: "technology",
    country: "US",
    language: "en",
    reliability: 88
  },
  {
    id: "src-hacker-news",
    name: "Hacker News (front page)",
    homepageUrl: "https://news.ycombinator.com",
    rssUrl: "https://hnrss.org/frontpage",
    category: "technology",
    country: "US",
    language: "en",
    reliability: 75
  },

  // Science
  {
    id: "src-bbc-science",
    name: "BBC News — Science",
    homepageUrl: "https://www.bbc.com/news/science_and_environment",
    rssUrl: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    category: "science",
    country: "GB",
    language: "en",
    reliability: 95
  },
  {
    id: "src-npr-science",
    name: "NPR — Science",
    homepageUrl: "https://www.npr.org/sections/science",
    rssUrl: "https://feeds.npr.org/1007/rss.xml",
    category: "science",
    country: "US",
    language: "en",
    reliability: 92
  },
  {
    id: "src-guardian-science",
    name: "The Guardian — Science",
    homepageUrl: "https://www.theguardian.com/science",
    rssUrl: "https://www.theguardian.com/science/rss",
    category: "science",
    country: "GB",
    language: "en",
    reliability: 90
  },

  // Health
  {
    id: "src-bbc-health",
    name: "BBC News — Health",
    homepageUrl: "https://www.bbc.com/news/health",
    rssUrl: "https://feeds.bbci.co.uk/news/health/rss.xml",
    category: "health",
    country: "GB",
    language: "en",
    reliability: 94
  },
  {
    id: "src-npr-health",
    name: "NPR — Health",
    homepageUrl: "https://www.npr.org/sections/health",
    rssUrl: "https://feeds.npr.org/1128/rss.xml",
    category: "health",
    country: "US",
    language: "en",
    reliability: 92
  },

  // India
  {
    id: "src-the-hindu-national",
    name: "The Hindu — National",
    homepageUrl: "https://www.thehindu.com/news/national/",
    rssUrl: "https://www.thehindu.com/news/national/feeder/default.rss",
    category: "india",
    country: "IN",
    language: "en",
    reliability: 88
  },
  {
    id: "src-the-hindu-business",
    name: "The Hindu — Business",
    homepageUrl: "https://www.thehindu.com/business/",
    rssUrl: "https://www.thehindu.com/business/feeder/default.rss",
    category: "business",
    country: "IN",
    language: "en",
    reliability: 86
  }
];

export function curatedFeedsToSources(): Source[] {
  return curatedFeeds.map((feed) => ({
    id: feed.id,
    name: feed.name,
    kind: "rss" as const,
    homepageUrl: feed.homepageUrl,
    reliabilityScore: feed.reliability,
    language: feed.language,
    country: feed.country,
    enabled: true
  }));
}

export function getCuratedFeed(id: string): CuratedFeed | undefined {
  return curatedFeeds.find((feed) => feed.id === id);
}
