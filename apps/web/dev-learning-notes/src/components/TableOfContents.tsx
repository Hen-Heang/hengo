"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { List } from "lucide-react";

export function TableOfContents({ html, mobile = false }: { html: string; mobile?: boolean }) {
  const [activeId, setActiveId] = useState<string>("");

  const toc = useMemo(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headings = Array.from(doc.querySelectorAll("h2, h3"));

    return headings.map((heading) => ({
      id:
        heading.id ||
        heading.textContent?.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") ||
        "",
      text: heading.textContent || "",
      level: parseInt(heading.tagName.substring(1)),
    }));
  }, [html]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) {
          setActiveId(visibleEntry.target.id);
        }
      },
      { rootMargin: "-100px 0% -80% 0%" }
    );

    const headingElements = document.querySelectorAll("h2, h3");
    headingElements.forEach((element) => observer.observe(element));

    return () => {
      headingElements.forEach((element) => observer.unobserve(element));
    };
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <nav
      className={mobile ? "w-full p-4" : "p-4"}
    >
      <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
        <List size={14} />
        Table of Contents
      </div>

      <ul className="space-y-1 relative">
        <div className="absolute left-0 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />

        {toc.map((item, index) => (
          <li
            key={`${item.id}-${index}`}
            className={cn(
              "group relative pl-4 transition-all duration-200",
              item.level === 3 ? "ml-4" : ""
            )}
          >
            <div
              className={cn(
                "absolute left-[-0.5px] top-1/2 -translate-y-1/2 w-px h-full bg-transparent group-hover:bg-zinc-400 dark:group-hover:bg-zinc-700 transition-colors",
                activeId === item.id ? "bg-emerald-500 h-full w-[2px] z-10" : ""
              )}
            />

            <a
              href={`#${item.id}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                setActiveId(item.id);
              }}
              className={cn(
                "block py-1.5 text-xs font-medium transition-colors hover:text-zinc-700 dark:hover:text-zinc-200",
                activeId === item.id ? "text-emerald-500 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
