import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const NOTES_DIR = path.join(ROOT, "notes");
const ENV_PATH = path.join(ROOT, ".env.local");

const META = {
  java: { title: "Java Core", description: "OOP, Collections, Streams, Lambda, Lombok" },
  springboot: { title: "Spring Boot", description: "IoC/DI, MVC, REST API, Transactions" },
  mybatis: { title: "MyBatis", description: "Dynamic SQL, XML Mapper, Logging" },
  sql: { title: "SQL Fundamentals", description: "SELECT, JOIN, Aggregates, Pagination" },
  "jsp-jstl": { title: "JSP & JSTL", description: "Templates, Tags, Formatting" },
  jquery: { title: "jQuery & AJAX", description: "DOM, AJAX patterns, Form handling" },
  projects: { title: "Projects", description: "Full-stack project references" },
  roadmap: { title: "Korea Adaptation Roadmap", description: "Step-by-step Korea adaptation study plan" },
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing env file: ${filePath}`);
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function normalizeTags(tags) {
  return Array.isArray(tags) ? tags.filter((tag) => typeof tag === "string") : [];
}

function collectReadmeNotes() {
  const directories = fs.readdirSync(NOTES_DIR).filter((entry) => {
    const fullPath = path.join(NOTES_DIR, entry);
    return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, "README.md"));
  });

  return directories.map((slug) => {
    const filePath = path.join(NOTES_DIR, slug, "README.md");
    const raw = fs.readFileSync(filePath, "utf8");
    const { content, data } = matter(raw);
    const fallback = META[slug] ?? { title: slug, description: "" };

    return {
      slug,
      title: typeof data.title === "string" && data.title ? data.title : fallback.title,
      description:
        typeof data.description === "string" && data.description
          ? data.description
          : fallback.description,
      category: typeof data.category === "string" && data.category ? data.category : slug,
      tags: normalizeTags(data.tags),
      content,
    };
  });
}

async function main() {
  loadEnvFile(ENV_PATH);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set.");
  }

  const notes = collectReadmeNotes();
  const supabase = createClient(supabaseUrl, supabaseSecretKey);

  const { data, error } = await supabase
    .from("notes")
    .upsert(notes, { onConflict: "slug" })
    .select("slug");

  if (error) {
    throw error;
  }

  const imported = Array.isArray(data) ? data.map((row) => row.slug).sort() : [];
  console.log(`Imported ${imported.length} notes into Supabase.`);
  for (const slug of imported) {
    console.log(`- ${slug}`);
  }
}

main().catch((error) => {
  console.error("Import failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
