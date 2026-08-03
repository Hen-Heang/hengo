import { supabaseAdmin } from "@/lib/supabase";
import type { NewsItem } from "@/lib/news-types";

const TABLE_NAME = "news_bookmarks";

function normalizeRow(row: Record<string, unknown>): NewsItem {
  return {
    id: String(row.news_id),
    title: String(row.title),
    url: String(row.url),
    source: row.source as NewsItem["source"],
    tag: row.tag ? String(row.tag) : undefined,
    points: typeof row.points === "number" ? row.points : undefined,
    publishedAt: row.published_at ? String(row.published_at) : undefined,
    readingTime: typeof row.reading_time === "number" ? row.reading_time : undefined,
    topics: Array.isArray(row.topics)
      ? row.topics.filter((topic): topic is NewsItem["topics"][number] => typeof topic === "string")
      : [],
  };
}

export async function getSavedNews(): Promise<NewsItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .select("news_id,title,url,source,tag,points,published_at,reading_time,topics")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => normalizeRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function saveNewsItem(item: NewsItem): Promise<void> {
  const { error } = await supabaseAdmin.from(TABLE_NAME).upsert(
    {
      news_id: item.id,
      title: item.title,
      url: item.url,
      source: item.source,
      tag: item.tag,
      points: item.points,
      published_at: item.publishedAt,
      reading_time: item.readingTime,
      topics: item.topics,
    },
    { onConflict: "news_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteSavedNewsItem(newsId: string): Promise<void> {
  const { error } = await supabaseAdmin.from(TABLE_NAME).delete().eq("news_id", newsId);

  if (error) {
    throw new Error(error.message);
  }
}
