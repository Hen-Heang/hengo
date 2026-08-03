export type NewsSource = "devto" | "hackernews" | "arxiv" | "thenewsapi";

export type NewsTopic = "ai" | "dev" | "research" | "general";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: NewsSource;
  tag?: string;
  points?: number;
  publishedAt?: string;
  readingTime?: number;
  topics: NewsTopic[];
  imageUrl?: string;
}
