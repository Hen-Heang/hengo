"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { PageTransition } from "@/components/PageTransition";
import { ReadingProgress } from "@/components/ReadingProgress";
import { CodeCopy } from "@/components/CodeCopy";
import { TechIcon } from "@/components/TechIcon";
import { NoteActions } from "@/components/NoteActions";
import { NoteBlockEditor } from "@/components/NoteBlockEditor";
import { AiTips } from "@/components/AiTips";
import { AskNotePanel } from "@/components/AskNotePanel";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronDown,
  Brain,
  Share2,
  List,
  ArrowUp,
  Hash,
} from "lucide-react";
import { updateNoteAction } from "@/app/actions/notes";
import { QuizModal } from "@/components/QuizModal";

const TableOfContents = dynamic(
  () => import("@/components/TableOfContents").then((mod) => mod.TableOfContents),
  { ssr: false }
);

interface NoteViewProps {
  slug: string;
  note: {
    content: string;
    title: string;
    icon: string;
    description: string;
  };
  html: string;
}

export function NoteView({ slug, note, html }: NoteViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(searchParams.get("edit") === "true");
  const [showQuiz, setShowQuiz] = useState(false);
  const [showMobileToc, setShowMobileToc] = useState(false);
  const [showFloatingNav, setShowFloatingNav] = useState(false);
  const [activeSectionLabel, setActiveSectionLabel] = useState("Contents");

  useEffect(() => {
    setIsEditing(searchParams.get("edit") === "true");
  }, [searchParams]);

  useEffect(() => {
    if (isEditing) return;
    const onScroll = () => setShowFloatingNav(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isEditing]);

  useEffect(() => {
    if (isEditing) return;
    const headingElements = Array.from(document.querySelectorAll("h2, h3"));
    if (headingElements.length === 0) { setActiveSectionLabel("Contents"); return; }
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((e) => e.isIntersecting);
        if (!visibleEntry) return;
        const text = visibleEntry.target.textContent?.trim();
        if (!text) return;
        setActiveSectionLabel(text.length > 28 ? `${text.slice(0, 28)}…` : text);
      },
      { rootMargin: "-15% 0% -75% 0%" }
    );
    headingElements.forEach((el) => observer.observe(el));
    return () => headingElements.forEach((el) => observer.unobserve(el));
  }, [html, isEditing]);

  const handleSave = async (content: string, meta: { title: string; description: string; icon: string }) => {
    await updateNoteAction(slug, content, meta);
  };

  const handleCancel = () => {
    setIsEditing(false);
    router.replace(`/notes/${slug}`);
    router.refresh();
  };

  return (
    <>
      {showQuiz && (
        <QuizModal noteTitle={note.title} noteContent={note.content} onClose={() => setShowQuiz(false)} />
      )}
      <ReadingProgress />
      <CodeCopy />

      {/* Floating nav — appears after scrolling */}
      {!isEditing && showFloatingNav && (
        <div className="fixed bottom-6 right-4 z-40 flex flex-col items-end gap-2.5">
          <button
            onClick={() => {
              setShowMobileToc(true);
              requestAnimationFrame(() => {
                document.getElementById("note-toc-mobile")?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            }}
            className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 shadow-lg backdrop-blur-xl active:scale-95 max-w-[16rem]"
          >
            <List size={13} className="shrink-0" />
            <span className="truncate">{activeSectionLabel}</span>
          </button>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 shadow-lg backdrop-blur-xl active:scale-95"
          >
            <ArrowUp size={13} />
            Top
          </button>
        </div>
      )}

      <PageTransition>
        <div className="flex justify-center max-w-[1440px] mx-auto min-h-screen">

          {/* Main content column */}
          <div className="flex-1 max-w-4xl min-w-0">

            {isEditing ? (
              <div className="px-4 sm:px-8 md:px-12 py-8">
                <NoteBlockEditor
                  initialContent={note.content}
                  initialTitle={note.title}
                  initialDescription={note.description}
                  initialIcon={note.icon}
                  onSave={handleSave}
                  onDone={handleCancel}
                />
              </div>
            ) : (
              <>
                {/* ── Top action bar ── */}
                <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8 md:px-12 py-3 border-b border-zinc-100 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl">
                  <Link
                    href="/"
                    className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors font-medium"
                  >
                    <ChevronLeft size={14} />
                    All notes
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowQuiz(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all text-xs font-semibold"
                    >
                      <Brain size={13} />
                      Quiz
                    </button>
                    <button className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                      <Share2 size={15} />
                    </button>
                    <NoteActions slug={slug} onEdit={() => setIsEditing(true)} />
                  </div>
                </div>

                {/* ── Notion-style page header ── */}
                <div className="px-4 sm:px-8 md:px-16 pt-12 pb-8">

                  {/* Page icon — large, above title */}
                  <div className="mb-5 w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                    <TechIcon name={note.icon} size={36} />
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight leading-tight mb-3">
                    {note.title}
                  </h1>

                  {/* Description */}
                  {note.description && (
                    <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6 max-w-2xl">
                      {note.description}
                    </p>
                  )}

                  {/* Properties — Notion-style key/value row */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/60 pt-5">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600 w-16 shrink-0">Category</span>
                      <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium capitalize">
                        <Hash size={12} className="text-zinc-400" />
                        {note.icon}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600 w-16 shrink-0">Module</span>
                      <span className="text-zinc-600 dark:text-zinc-400 font-medium font-mono text-xs bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                        {slug}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Mobile TOC ── */}
                <div id="note-toc-mobile" className="xl:hidden px-4 sm:px-8 md:px-16 mb-6 scroll-mt-16">
                  <button
                    onClick={() => setShowMobileToc((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                  >
                    <span className="flex items-center gap-2"><List size={13} /> Table of Contents</span>
                    <ChevronDown size={13} className={`transition-transform duration-200 ${showMobileToc ? "rotate-180" : ""}`} />
                  </button>
                  {showMobileToc && (
                    <div className="mt-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-fade-in overflow-hidden">
                      <TableOfContents html={html} mobile />
                    </div>
                  )}
                </div>

                {/* ── Article content ── */}
                <article
                  className="px-4 sm:px-8 md:px-16 pb-16 prose prose-zinc dark:prose-invert max-w-none prose-sm sm:prose-base prose-headings:font-bold prose-headings:tracking-tight prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-code:text-emerald-600 dark:prose-code:text-emerald-400 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none"
                  dangerouslySetInnerHTML={{ __html: html }}
                />

                {/* ── Mobile AI panels ── */}
                <div className="xl:hidden px-4 sm:px-8 md:px-16 pb-16 space-y-6 border-t border-zinc-100 dark:border-zinc-800/60 pt-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <AskNotePanel noteTitle={note.title} noteContent={note.content} />
                    <AiTips noteTitle={note.title} noteContent={note.content} />
                  </div>
                </div>

                {/* ── Footer ── */}
                <div className="px-4 sm:px-8 md:px-16 pb-16 border-t border-zinc-100 dark:border-zinc-800/60 pt-8 flex items-center justify-between">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors font-medium"
                  >
                    <ChevronLeft size={15} />
                    Back to all notes
                  </Link>
                  <span className="text-xs text-zinc-300 dark:text-zinc-700 font-mono">
                    {slug}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* ── Desktop right panel (TOC + AI) ── */}
          {!isEditing && (
            <div className="hidden xl:flex flex-col gap-5 py-8 px-6 sticky top-0 h-screen overflow-y-auto w-80 shrink-0 border-l border-zinc-100 dark:border-zinc-800/60">
              <div className="space-y-5 animate-fade-in">
                <div className="rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/20 overflow-hidden">
                  <TableOfContents html={html} />
                </div>
                <AskNotePanel noteTitle={note.title} noteContent={note.content} />
                <AiTips noteTitle={note.title} noteContent={note.content} />
              </div>
            </div>
          )}

        </div>
      </PageTransition>
    </>
  );
}
