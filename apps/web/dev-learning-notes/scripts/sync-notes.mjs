/**
 * sync-notes.mjs
 * Reads every notes/<slug>/README.md and upserts the full content into Supabase.
 * Run: node scripts/sync-notes.mjs
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const NOTES_DIR = path.join(ROOT, "notes");

// ─── Supabase admin client ────────────────────────────────────────────────────
const SUPABASE_URL = "https://xuddvkvoyrvbcalcxohb.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1ZGR2a3ZveXJ2YmNhbGN4b2hiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE2ODcyOSwiZXhwIjoyMDg4NzQ0NzI5fQ.b1ulUvH-9ztvMP0q60lmat7G_7ManOUtCN4MVlrM7WY";
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

// ─── Metadata map ─────────────────────────────────────────────────────────────
const META = {
  java:       { title: "Java Core",        description: "OOP, Collections, Streams, Lambda, Lombok",  category: "Backend",   icon: "java" },
  springboot: { title: "Spring Boot",      description: "IoC/DI, MVC, REST API, Transactions",        category: "Backend",   icon: "springboot" },
  mybatis:    { title: "MyBatis",          description: "Dynamic SQL, XML Mapper, Logging",           category: "Backend",   icon: "mybatis" },
  sql:        { title: "SQL Fundamentals", description: "SELECT, JOIN, Aggregates, Pagination",       category: "Database",  icon: "sql" },
  "jsp-jstl": { title: "JSP & JSTL",      description: "Templates, Tags, Formatting",                category: "Frontend",  icon: "jsp-jstl" },
  jquery:     { title: "jQuery & AJAX",    description: "DOM, AJAX patterns, Form handling",          category: "Frontend",  icon: "jquery" },
  projects:   { title: "Projects",         description: "Full-stack project references",              category: "Reference", icon: "projects" },
};

// ─── Strip the "back to root" link that's only for local navigation ───────────
function cleanContent(raw) {
  return raw
    .replace(/\[<-\s*Back to root\]\([^)]*\)\n?/g, "")
    .trim();
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const slugs = fs
    .readdirSync(NOTES_DIR)
    .filter((d) => fs.existsSync(path.join(NOTES_DIR, d, "README.md")));

  console.log(`Found ${slugs.length} notes: ${slugs.join(", ")}\n`);

  for (const slug of slugs) {
    const filePath = path.join(NOTES_DIR, slug, "README.md");
    const raw = fs.readFileSync(filePath, "utf-8");
    const content = cleanContent(raw);
    const meta = META[slug] ?? {
      title: slug.charAt(0).toUpperCase() + slug.slice(1),
      description: "",
      category: "General",
      icon: slug,
    };

    const payload = {
      slug,
      title: meta.title,
      description: meta.description,
      category: meta.category,
      content,
      tags: [meta.icon],
    };

    const { error } = await admin
      .from("notes")
      .upsert(payload, { onConflict: "slug" });

    if (error) {
      console.error(`  ✗ ${slug}: ${error.message}`);
    } else {
      console.log(`  ✓ ${slug} — ${content.length} chars`);
    }
  }

  console.log("\nDone. All notes synced to Supabase.");
}

main().catch(console.error);
