/**
 * One-time script: sync all notes/*.md files → Supabase
 * Run: node scripts/sync-to-supabase.mjs
 */

// Bypass self-signed cert from corporate SSL proxy
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = path.join(__dirname, "..", ".env.local");
const env = fs.readFileSync(envPath, "utf-8");
for (const line of env.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  process.env[key.trim()] = rest.join("=").trim();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET);

const META = {
  java:       { title: "Java Core",       description: "OOP, Collections, Streams, Lambda, Lombok",       category: "backend", tags: ["java", "oop", "streams"] },
  springboot: { title: "Spring Boot",     description: "IoC/DI, MVC, REST API, Transactions",             category: "backend", tags: ["spring", "java", "rest"] },
  mybatis:    { title: "MyBatis",         description: "Dynamic SQL, XML Mapper, Logging",                 category: "backend", tags: ["mybatis", "sql", "java"] },
  sql:        { title: "SQL Fundamentals",description: "SELECT, JOIN, Aggregates, Pagination",             category: "database", tags: ["sql", "postgresql"] },
  "jsp-jstl": { title: "JSP & JSTL",     description: "Templates, Tags, Formatting",                      category: "frontend", tags: ["jsp", "jstl", "java"] },
  jquery:     { title: "jQuery & AJAX",   description: "DOM, AJAX patterns, Form handling",                category: "frontend", tags: ["jquery", "javascript", "ajax"] },
  projects:   { title: "Projects",        description: "Full-stack project references",                    category: "project",  tags: ["project", "fullstack"] },
};

const NOTES_DIR = path.join(__dirname, "..", "notes");
const slugs = fs.readdirSync(NOTES_DIR).filter((d) => {
  const full = path.join(NOTES_DIR, d);
  return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, "README.md"));
});

console.log(`\n📦  Found ${slugs.length} notes: ${slugs.join(", ")}\n`);

let success = 0;
let skipped = 0;
let failed  = 0;

for (const slug of slugs) {
  const filePath = path.join(NOTES_DIR, slug, "README.md");
  const raw = fs.readFileSync(filePath, "utf-8");

  // Strip frontmatter if present
  let content = raw;
  if (raw.startsWith("---")) {
    const end = raw.indexOf("---", 3);
    if (end !== -1) content = raw.slice(end + 3).trim();
  }

  const meta = META[slug] ?? { title: slug, description: "", category: "", tags: [] };

  const payload = {
    slug,
    title:       meta.title,
    description: meta.description,
    category:    meta.category,
    content,
    tags:        meta.tags,
  };

  // Upsert — update if slug already exists, insert if not
  const { error } = await supabase
    .from("notes")
    .upsert(payload, { onConflict: "slug" });

  if (error) {
    console.error(`  ❌  ${slug}: ${error.message}`);
    failed++;
  } else {
    console.log(`  ✅  ${slug} → synced`);
    success++;
  }
}

console.log(`\n─────────────────────────────`);
console.log(`✅  Success : ${success}`);
if (skipped) console.log(`⏭️   Skipped : ${skipped}`);
if (failed)  console.log(`❌  Failed  : ${failed}`);
console.log(`─────────────────────────────\n`);

if (failed > 0) process.exit(1);
