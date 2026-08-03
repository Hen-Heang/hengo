import { NextRequest, NextResponse } from "next/server";
import { deleteSavedNewsItem, getSavedNews, saveNewsItem } from "@/lib/news-bookmarks";
import type { NewsItem } from "@/lib/news-types";

export async function GET() {
  const items = await getSavedNews();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  try {
    const item = (await req.json()) as NewsItem;
    if (!item?.id || !item?.title || !item?.url || !item?.source) {
      return NextResponse.json({ error: "Invalid news item" }, { status: 400 });
    }

    await saveNewsItem(item);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing news item id" }, { status: 400 });
    }

    await deleteSavedNewsItem(String(id));
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
