'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FileText, Lightbulb, Loader2, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export type ReferenceType = 'source' | 'source_insight'

interface SourcePopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: ReferenceType | null
  id: string | null
}

interface InsightData {
  id: string
  source_id?: string
  insight_type?: string
  content?: string
  created?: string
}

interface SourceData {
  id: string
  title?: string
  status?: string
  full_text?: string
  created?: string
}

export function SourcePopup({ open, onOpenChange, type, id }: SourcePopupProps) {
  const [data, setData] = useState<InsightData | SourceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !type || !id) return

    setLoading(true)
    setError(null)
    setData(null)

    // Strip prefix if present, use only the raw ID for the proxy route
    const rawId = id.includes(':') ? id.split(':')[1] : id
    const endpoint = type === 'source_insight'
      ? `/api/insights/${rawId}`
      : `/api/sources/${rawId}`

    fetch(endpoint)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [open, type, id])

  const isInsight = type === 'source_insight'
  const insight = data as InsightData
  const source = data as SourceData

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {isInsight
              ? <Lightbulb className="h-4 w-4 text-yellow-500" />
              : <FileText className="h-4 w-4 text-blue-500" />
            }
            {isInsight ? 'Estratto dalla fonte' : 'Documento di riferimento'}
            {isInsight && insight?.insight_type && (
              <Badge variant="outline" className="ml-2 text-xs uppercase">
                {insight.insight_type}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 mt-2">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Caricamento...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive py-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">Impossibile caricare il contenuto: {error}</span>
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-3">
              {/* Insight: mostra il contenuto testuale */}
              {isInsight && insight.content && (
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {insight.content}
                  </ReactMarkdown>
                </div>
              )}

              {/* Source: mostra titolo + full_text se disponibile */}
              {!isInsight && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{source.title || 'Documento senza titolo'}</p>
                      {source.status && (
                        <Badge variant="secondary" className="mt-1 text-xs">{source.status}</Badge>
                      )}
                    </div>
                  </div>
                  {source.full_text && (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed border-t pt-3">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {source.full_text.length > 8000
                          ? source.full_text.substring(0, 8000) + '\n\n*[documento troncato per visualizzazione]*'
                          : source.full_text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              )}

              {/* Footer con ID */}
              <p className="text-xs text-muted-foreground pt-2 border-t font-mono">
                {type}:{id?.includes(':') ? id.split(':')[1] : id}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
