"use client";

import { useState } from "react";
import { X, Brain, ChevronRight, RotateCcw, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface QuizModalProps {
  noteTitle: string;
  noteContent: string;
  onClose: () => void;
}

type Phase = "idle" | "loading" | "quiz" | "result";

export function QuizModal({ noteTitle, noteContent, onClose }: QuizModalProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ selected: string; correct: boolean }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateQuiz = async () => {
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: noteTitle, content: noteContent }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Failed to generate quiz";
        throw new Error(msg.includes("429") || msg.includes("quota") ? "Rate limit reached. Wait a minute and try again." : msg);
      }
      setQuestions(data.questions);
      setCurrentIndex(0);
      setSelected(null);
      setScore(0);
      setAnswers([]);
      setPhase("quiz");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("idle");
    }
  };

  const handleSelect = (option: string) => {
    if (selected) return;
    setSelected(option);
  };

  const handleNext = () => {
    if (!selected) return;
    const correct = selected === questions[currentIndex].answer;
    const newAnswers = [...answers, { selected, correct }];
    setAnswers(newAnswers);
    if (correct) setScore((s) => s + 1);

    if (currentIndex + 1 >= questions.length) {
      setPhase("result");
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
    }
  };

  const reset = () => {
    setPhase("idle");
    setSelected(null);
    setScore(0);
    setAnswers([]);
    setCurrentIndex(0);
    setQuestions([]);
  };

  const q = questions[currentIndex];
  const total = questions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Brain size={20} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-black uppercase tracking-[0.2em] text-zinc-500">AI Quiz</div>
              <div className="text-sm font-bold text-white truncate max-w-xs">{noteTitle}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-8 py-6 sm:py-8">
          {/* Idle State */}
          {phase === "idle" && (
            <div className="text-center py-8">
              <div className="text-5xl mb-6">🧠</div>
              <h2 className="text-2xl font-black text-white mb-3">Test Your Knowledge</h2>
              <p className="text-zinc-400 text-sm mb-8 max-w-sm mx-auto">
                OpenAI will generate 5 multiple choice questions based on this note&apos;s content.
              </p>
              {error && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <button
                onClick={generateQuiz}
                className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm transition-all active:scale-[0.98]"
              >
                Generate Quiz
              </button>
            </div>
          )}

          {/* Loading State */}
          {phase === "loading" && (
            <div className="text-center py-16">
              <Loader2 size={40} className="text-emerald-400 animate-spin mx-auto mb-4" />
              <p className="text-zinc-400 text-sm font-mono">OpenAI is generating your quiz...</p>
            </div>
          )}

          {/* Quiz State */}
          {phase === "quiz" && q && (
            <div>
              {/* Progress */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] font-mono font-black uppercase tracking-[0.2em] text-zinc-500">
                  Question {currentIndex + 1} of {total}
                </span>
                <div className="flex gap-1.5">
                  {questions.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-8 rounded-full transition-all ${
                        i < currentIndex
                          ? answers[i]?.correct
                            ? "bg-emerald-500"
                            : "bg-red-500"
                          : i === currentIndex
                          ? "bg-zinc-400"
                          : "bg-zinc-800"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Question */}
              <h3 className="text-lg font-bold text-white mb-6 leading-relaxed">{q.question}</h3>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {q.options.map((option) => {
                  const isSelected = selected === option;
                  const isCorrect = option === q.answer;
                  const showResult = selected !== null;

                  let style = "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 hover:text-white";
                  if (showResult && isCorrect) style = "border-emerald-500 bg-emerald-500/10 text-emerald-300";
                  else if (showResult && isSelected && !isCorrect) style = "border-red-500 bg-red-500/10 text-red-300";

                  return (
                    <button
                      key={option}
                      onClick={() => handleSelect(option)}
                      className={`w-full text-left px-5 py-4 rounded-2xl border text-sm font-medium transition-all ${style} ${
                        !selected ? "cursor-pointer active:scale-[0.99]" : "cursor-default"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {showResult && isCorrect && <CheckCircle size={16} className="text-emerald-400 shrink-0" />}
                        {showResult && isSelected && !isCorrect && <XCircle size={16} className="text-red-400 shrink-0" />}
                        {option}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {selected && (
                <div className="mb-6 px-5 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-400">
                  <span className="font-bold text-zinc-300">Explanation: </span>
                  {q.explanation}
                </div>
              )}

              <button
                onClick={handleNext}
                disabled={!selected}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black text-sm transition-all active:scale-[0.98]"
              >
                {currentIndex + 1 >= total ? "See Results" : "Next Question"}
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Result State */}
          {phase === "result" && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">
                {score === total ? "🏆" : score >= total / 2 ? "💪" : "📚"}
              </div>
              <h2 className="text-3xl font-black text-white mb-2">
                {score} / {total}
              </h2>
              <p className="text-zinc-400 text-sm mb-2">
                {score === total
                  ? "Perfect score! You mastered this module."
                  : score >= total / 2
                  ? "Good job! Keep studying to improve."
                  : "Keep practicing — review the note again."}
              </p>

              {/* Answer review */}
              <div className="mt-6 space-y-2 text-left mb-8">
                {answers.map((a, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                      a.correct
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                        : "border-red-500/30 bg-red-500/5 text-red-300"
                    }`}
                  >
                    {a.correct ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span className="font-mono text-xs text-zinc-500 shrink-0">Q{i + 1}</span>
                    <span className="truncate">{questions[i]?.question}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={reset}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 font-black text-sm transition-all"
                >
                  <RotateCcw size={15} />
                  Try Again
                </button>
                <button
                  onClick={generateQuiz}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm transition-all"
                >
                  <Brain size={15} />
                  New Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
