export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-blue-500/20 bg-blue-500/[0.04] px-4 py-3.5 shadow-sm dark:border-blue-400/10 dark:bg-blue-400/[0.04]">
      <span
        className="h-2 w-2 rounded-full bg-blue-500/70 animate-bounce dark:bg-blue-400/70"
        style={{ animationDelay: "0ms", animationDuration: "1s" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-blue-500/70 animate-bounce dark:bg-blue-400/70"
        style={{ animationDelay: "160ms", animationDuration: "1s" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-blue-500/70 animate-bounce dark:bg-blue-400/70"
        style={{ animationDelay: "320ms", animationDuration: "1s" }}
      />
    </div>
  )
}
