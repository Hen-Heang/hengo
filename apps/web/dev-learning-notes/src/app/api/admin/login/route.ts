import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOwnerPassword, getOwnerSecret } from "@/lib/owner-auth";
import crypto from "crypto";

// Rate limiting: max 5 attempts per 15 min per IP
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();

  const entry = attempts.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }
  } else {
    attempts.set(ip, { count: 0, resetAt: now + WINDOW_MS });
  }

  const { password } = await req.json();
  const expectedPassword = getOwnerPassword();
  const ownerSecret = getOwnerSecret();

  if (!expectedPassword || !ownerSecret) {
    return NextResponse.json(
      { error: "Owner auth is not configured" },
      { status: 500 }
    );
  }

  // Timing-safe comparison to prevent timing attacks
  let passwordMatch = false;
  try {
    const a = Buffer.from(password ?? "");
    const b = Buffer.from(expectedPassword);
    if (a.length === b.length) {
      passwordMatch = crypto.timingSafeEqual(a, b);
    }
  } catch {
    passwordMatch = false;
  }

  if (!passwordMatch) {
    const current = attempts.get(ip)!;
    attempts.set(ip, { ...current, count: current.count + 1 });
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Success — reset rate limit
  attempts.delete(ip);

  const cookieStore = await cookies();
  cookieStore.set("admin_token", ownerSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
