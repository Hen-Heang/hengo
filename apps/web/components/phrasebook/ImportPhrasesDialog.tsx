"use client"

import { useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IMPORT_CSV_TEMPLATE,
  importableRows,
  isRowComplete,
  parseCsvImport,
  parseJsonImport,
  rowToCardContent,
  validateImportRows,
  type ImportPreview,
} from "@/lib/korean-phrasebook/import"
import { phrasebookApi, getApiErrorMessage } from "@/lib/api"
import type { PhraseCollection } from "@/lib/types"

interface ImportPhrasesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collections: PhraseCollection[]
  onImported: () => void
}

function downloadTemplate() {
  const blob = new Blob([IMPORT_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "phrasebook-import-template.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export function ImportPhrasesDialog({
  open,
  onOpenChange,
  collections,
  onImported,
}: ImportPhrasesDialogProps) {
  const [text, setText] = useState("")
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "")
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [parseError, setParseError] = useState("")
  const [importing, setImporting] = useState(false)

  const ready = useMemo(() => {
    if (!preview) return []
    return importableRows(preview).filter(isRowComplete)
  }, [preview])
  const incompleteCount = preview ? importableRows(preview).length - ready.length : 0

  function handlePreview() {
    setParseError("")
    setPreview(null)
    if (!text.trim()) return
    try {
      const trimmed = text.trim()
      const rawRows = trimmed.startsWith("[") ? parseJsonImport(trimmed) : parseCsvImport(trimmed)
      setPreview(validateImportRows(rawRows))
    } catch (err) {
      setParseError(
        err instanceof Error
          ? err.message
          : "Could not parse this file — check the format and try again.",
      )
    }
  }

  async function handleImport() {
    if (ready.length === 0 || !collectionId) return
    setImporting(true)
    try {
      for (const row of ready) {
        await phrasebookApi.createCard(collectionId, rowToCardContent(row))
      }
      toast.success(`Imported ${ready.length} ${ready.length === 1 ? "card" : "cards"}`)
      setText("")
      setPreview(null)
      onImported()
      onOpenChange(false)
    } catch (err) {
      toast.error("Import failed partway through", {
        description: getApiErrorMessage(err, "Please try again."),
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Q&A cards</DialogTitle>
          <DialogDescription>
            Paste JSON or CSV, preview the rows, then confirm what gets imported.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Target collection</p>
            <Select value={collectionId} onValueChange={setCollectionId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.titleEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">
                JSON array or CSV with header row
              </p>
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Download size={12} /> Template
              </button>
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder='[{"category":"workplace","situation":"deadline","questionKorean":"...","answerKorean":"..."}]'
              className="font-mono text-xs"
            />
          </div>

          {parseError && (
            <p className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive">
              <AlertCircle size={14} /> {parseError}
            </p>
          )}

          {preview && (
            <div className="space-y-2 rounded-2xl border border-border bg-accent/5 p-3 text-xs">
              <p className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={14} /> {ready.length} ready to import
              </p>
              {incompleteCount > 0 && (
                <p className="text-amber-600 dark:text-amber-400">
                  {incompleteCount} row(s) are missing romanization/English/register and were
                  skipped.
                </p>
              )}
              {preview.duplicateRows.length > 0 && (
                <p className="text-muted-foreground">
                  {preview.duplicateRows.length} duplicate row(s) skipped.
                </p>
              )}
              {preview.invalidRows.length > 0 && (
                <div className="space-y-1">
                  <p className="font-semibold text-destructive">
                    {preview.invalidRows.length} invalid row(s):
                  </p>
                  <ul className="max-h-24 space-y-0.5 overflow-y-auto text-destructive/80">
                    {preview.invalidRows.slice(0, 10).map((issue) => (
                      <li key={issue.index}>
                        Row {issue.index + 1}: {issue.errors.join("; ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {preview ? (
            <>
              <Button variant="outline" onClick={() => setPreview(null)}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={ready.length === 0 || !collectionId || importing}
              >
                {importing ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                Import {ready.length > 0 ? ready.length : ""}
              </Button>
            </>
          ) : (
            <Button onClick={handlePreview} disabled={!text.trim()}>
              Preview
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
