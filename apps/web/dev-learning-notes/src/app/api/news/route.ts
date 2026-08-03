import { NextResponse } from "next/server";
import type { NewsItem, NewsTopic, NewsSource } from "@/lib/news-types";

function buildTopics(source: NewsSource, title: string, tag?: string): NewsTopic[] {
  const haystack = `${title} ${tag ?? ""}`.toLowerCase();
  const topics = new Set<NewsTopic>();

  const hasAiKeyword =
    /\b(ai|llm|gpt|openai|anthropic|deepmind|model|agent|rag|prompt|ml|machine learning)\b/.test(
      haystack
    );
  const hasDevKeyword =
    /\b(java|spring|react|next|typescript|javascript|python|api|database|cloud|frontend|backend|devops|programming|software)\b/.test(
      haystack
    );

  if (source === "arxiv") {
    topics.add("research");
  }

  if (source === "devto" || source === "hackernews") {
    topics.add("dev");
  }

  if (source === "thenewsapi") {
    topics.add("general");
  }

  if (hasAiKeyword) {
    topics.add("ai");
  }

  if (hasDevKeyword) {
    topics.add("dev");
  }

  if (topics.size === 0) {
    topics.add("general");
  }

  return Array.from(topics);
}

async function fetchDevTo(): Promise<NewsItem[]> {
  const tags = ["ai", "javascript", "webdev", "programming", "java"];
  const results: NewsItem[] = [];

  for (const tag of tags) {
    try {
      const res = await fetch(`https://dev.to/api/articles?tag=${tag}&per_page=3&top=1`, {
        next: { revalidate: 1800 },
      });
      if (!res.ok) continue;
      const articles = await res.json();

      for (const article of articles) {
        if (!results.find((item) => item.id === `devto-${article.id}`)) {
          results.push({
            id: `devto-${article.id}`,
            title: article.title,
            url: article.url,
            source: "devto",
            tag: article.tag_list?.[0] ?? tag,
            publishedAt: article.published_at,
            readingTime: article.reading_time_minutes,
            topics: buildTopics("devto", article.title, article.tag_list?.[0] ?? tag),
            imageUrl: article.social_image || article.cover_image,
          });
        }
      }
    } catch {
      // Skip failed tags.
    }
  }

  return results.slice(0, 8);
}

async function fetchHackerNews(): Promise<NewsItem[]> {
  try {
    const idsRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", {
      next: { revalidate: 1800 },
    });
    if (!idsRes.ok) return [];
    const ids: number[] = await idsRes.json();

    const top = ids.slice(0, 30);
    const stories = await Promise.allSettled(
      top.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          next: { revalidate: 1800 },
        }).then((res) => res.json())
      )
    );

    const techKeywords = [
      "AI",
      "LLM",
      "Java",
      "Spring",
      "React",
      "Next",
      "TypeScript",
      "JavaScript",
      "Python",
      "API",
      "Open Source",
      "developer",
      "startup",
      "tech",
      "database",
      "model",
      "code",
      "software",
      "cloud",
    ];

    const filtered = stories
      .filter(
        (
          story
        ): story is PromiseFulfilledResult<{
          id: number;
          title: string;
          url: string;
          score: number;
          type: string;
          time: number;
        }> =>
          story.status === "fulfilled" &&
          story.value?.type === "story" &&
          story.value?.url &&
          techKeywords.some((keyword) =>
            story.value.title?.toLowerCase().includes(keyword.toLowerCase())
          )
      )
      .map((story) => ({
        id: `hn-${story.value.id}`,
        title: story.value.title,
        url: story.value.url,
        source: "hackernews" as const,
        points: story.value.score,
        publishedAt: new Date(story.value.time * 1000).toISOString(),
        topics: buildTopics("hackernews", story.value.title),
      }));

    return filtered.slice(0, 6);
  } catch {
    return [];
  }
}

async function fetchArxiv(): Promise<NewsItem[]> {
  try {
    const query = encodeURIComponent("(cat:cs.AI OR cat:cs.LG OR cat:cs.SE)");
    const res = await fetch(
      `https://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=8&sortBy=submittedDate&sortOrder=descending`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];

    const xml = await res.text();
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

    return entries.flatMap((entry) => {
      const block = entry[1];
      const id = block.match(/<id>(.*?)<\/id>/)?.[1]?.trim();
      const title = block
        .match(/<title>([\s\S]*?)<\/title>/)?.[1]
        ?.replace(/\s+/g, " ")
        .trim();
      const publishedAt = block.match(/<published>(.*?)<\/published>/)?.[1]?.trim();
      const primaryCategory = block.match(/term="([^"]+)"/)?.[1];

      if (!id || !title) return [];

      return [
        {
          id: `arxiv-${id.split("/").pop()}`,
          title,
          url: id,
          source: "arxiv" as const,
          tag: primaryCategory?.replace("cs.", "") ?? "AI",
          publishedAt,
          topics: buildTopics("arxiv", title, primaryCategory),
        },
      ];
    });
  } catch {
    return [];
  }
}

async function fetchTheNewsApi(): Promise<NewsItem[]> {
  const apiToken = process.env.THENEWSAPI_API_TOKEN;
  if (!apiToken) return [];

  try {
    const params = new URLSearchParams({
      api_token: apiToken,
      search:
        'AI OR OpenAI OR Anthropic OR "software engineering" OR JavaScript OR TypeScript OR Java OR React OR Next.js',
      categories: "tech,business",
      language: "en",
      limit: "6",
      sort: "published_at",
    });

    const res = await fetch(`https://api.thenewsapi.com/v1/news/all?${params.toString()}`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const articles = Array.isArray(data.data) ? data.data : [];

    return articles.map(
      (article: {
        uuid: string;
        title: string;
        url: string;
        published_at?: string;
        categories?: string[];
        image_url?: string;
      }) => ({
        id: `thenewsapi-${article.uuid}`,
        title: article.title,
        url: article.url,
        source: "thenewsapi" as const,
        tag: article.categories?.[0],
        publishedAt: article.published_at,
        topics: buildTopics("thenewsapi", article.title, article.categories?.[0]),
        imageUrl: article.image_url,
      })
    );
  } catch {
    return [];
  }
}

export async function GET() {
  const [devto, hackerNews, arxiv, generalNews] = await Promise.allSettled([
    fetchDevTo(),
    fetchHackerNews(),
    fetchArxiv(),
    fetchTheNewsApi(),
  ]);

  const devtoItems = devto.status === "fulfilled" ? devto.value : [];
  const hackerNewsItems = hackerNews.status === "fulfilled" ? hackerNews.value : [];
  const arxivItems = arxiv.status === "fulfilled" ? arxiv.value : [];
  const generalNewsItems = generalNews.status === "fulfilled" ? generalNews.value : [];

  const merged: NewsItem[] = [];
  const max = Math.max(
    devtoItems.length,
    hackerNewsItems.length,
    arxivItems.length,
    generalNewsItems.length
  );

  for (let index = 0; index < max; index++) {
    if (devtoItems[index]) merged.push(devtoItems[index]);
    if (hackerNewsItems[index]) merged.push(hackerNewsItems[index]);
    if (arxivItems[index]) merged.push(arxivItems[index]);
    if (generalNewsItems[index]) merged.push(generalNewsItems[index]);
  }

  return NextResponse.json({ items: merged });
}
