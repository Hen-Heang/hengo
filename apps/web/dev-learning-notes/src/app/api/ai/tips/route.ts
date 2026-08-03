import { NextRequest, NextResponse } from "next/server";
import { generateStructuredStudyOutput } from "@/lib/openai-study";

type Tip = {
  emoji: string;
  tip: string;
  detail: string;
};

const TIPS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["tips"],
  properties: {
    tips: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["emoji", "tip", "detail"],
        properties: {
          emoji: { type: "string" },
          tip: { type: "string" },
          detail: { type: "string" },
        },
      },
    },
  },
};

// Rate limiting: 10 requests per minute per IP
const aiRequests = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();

  const entry = aiRequests.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: "Rate limit reached. Wait a minute and try again." },
        { status: 429 }
      );
    }
    aiRequests.set(ip, { ...entry, count: entry.count + 1 });
  } else {
    aiRequests.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  try {
    const { title, content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 });
    }

    const result = await generateStructuredStudyOutput<{ tips: Tip[] }>({
      schemaName: "note_tips",
      schema: TIPS_SCHEMA,
      instructions: `You are an expert mentor for developers learning Java, Spring Boot, MyBatis, SQL, JSP, jQuery, and Korean enterprise application patterns.
Generate exactly 5 practical tips.
Focus on real project usage, beginner mistakes, and production habits.
Each tip title must be short and actionable.
Each detail must be a single sentence.
Use a different emoji for each tip.`,
      input: `Generate practical tips for the note titled "${title}".

Note content:
${String(content).slice(0, 8000)}`,
    });

    return NextResponse.json({ tips: result.tips });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("AI tips error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
