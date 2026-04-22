'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SourcePopup, ReferenceType } from './source-popup'

interface Reference {
  type: ReferenceType
  id: string
  number: number
}

interface ParsedMessage {
  text: string
  references: Reference[]
}

/**
 * Parse source references from text and convert to numbered citations.
 * Handles: source_insight:ID, source:ID, source:ID_chunk_N
 */
function parseReferences(text: string): ParsedMessage {
  const pattern = /(source_insight|source):([a-zA-Z0-9_]+)/g
  const refMap = new Map<string, Reference>()
  let counter = 1
  let match: RegExpExecArray | null

  // First pass: collect unique references
  while ((match = pattern.exec(text)) !== null) {
    const type = match[1] as ReferenceType
    const id = match[2]
    const key = `${type}:${id}`
    if (!refMap.has(key)) {
      refMap.set(key, { type, id, number: counter++ })
    }
  }

  if (refMap.size === 0) {
    return { text, references: [] }
  }

  // Second pass: replace references with numbered citations
  // Process from end to start to preserve string indices
  const allMatches: Array<{ start: number; end: number; key: string }> = []
  pattern.lastIndex = 0

  // Also strip surrounding brackets [ ] or [[ ]]
  const broadPattern = /(\[{1,2})(source_insight|source):([a-zA-Z0-9_]+)(\]{1,2})/g
  let result = text
  let broadMatch: RegExpExecArray | null

  while ((broadMatch = broadPattern.exec(text)) !== null) {
    const type = broadMatch[2] as ReferenceType
    const id = broadMatch[3]
    const key = `${type}:${id}`
    allMatches.push({ start: broadMatch.index, end: broadMatch.index + broadMatch[0].length, key })
  }

  // Also catch references NOT in brackets
  pattern.lastIndex = 0
  while ((match = pattern.exec(text)) !== null) {
    const key = `${match[1]}:${match[2]}`
    // Skip if already captured by broadPattern
    const alreadyCaptured = allMatches.some(m => m.start <= match!.index && m.end >= match!.index + match![0].length)
    if (!alreadyCaptured) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, key })
    }
  }

  // Sort by position descending (process from end)
  allMatches.sort((a, b) => b.start - a.start)

  for (const m of allMatches) {
    const ref = refMap.get(m.key)
    if (ref) {
      result = result.substring(0, m.start) + `[${ref.number}](#ref-${ref.type}-${ref.id})` + result.substring(m.end)
    }
  }

  return {
    text: result,
    references: Array.from(refMap.values()).sort((a, b) => a.number - b.number)
  }
}

interface ChatMessageProps {
  content: string
}

export function ChatMessage({ content }: ChatMessageProps) {
  const [popupOpen, setPopupOpen] = useState(false)
  const [popupType, setPopupType] = useState<ReferenceType | null>(null)
  const [popupId, setPopupId] = useState<string | null>(null)

  const { text, references } = parseReferences(content)

  const handleRefClick = (type: ReferenceType, id: string) => {
    setPopupType(type)
    setPopupId(id)
    setPopupOpen(true)
  }

  // Custom link component for ReactMarkdown
  const LinkComponent = ({
    href,
    children,
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => {
    if (href?.startsWith('#ref-')) {
      // Parse: #ref-source_insight-abc123 or #ref-source-abc123
      const withoutPrefix = href.substring(5) // Remove '#ref-'
      // type is first segment, id is everything after first dash
      const dashIdx = withoutPrefix.indexOf('-')
      if (dashIdx === -1) return <>{children}</>
      // Handle source_insight which has underscore
      let type: ReferenceType
      let id: string
      if (withoutPrefix.startsWith('source_insight-')) {
        type = 'source_insight'
        id = withoutPrefix.substring('source_insight-'.length)
      } else {
        type = 'source'
        id = withoutPrefix.substring(dashIdx + 1)
      }

      return (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleRefClick(type, id)
          }}
          className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors cursor-pointer align-middle mx-0.5"
          title={`Apri fonte: ${type}:${id}`}
        >
          {children}
        </button>
      )
    }

    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
        {children}
      </a>
    )
  }

  return (
    <>
      <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: LinkComponent,
            p({ children }) {
              return <p className="mb-2 last:mb-0">{children}</p>
            },
            ul({ children }) {
              return <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>
            },
            ol({ children }) {
              return <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>
            },
            code({ className, children, ...rest }) {
              const isInline = !className
              if (isInline) {
                return <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...rest}>{children}</code>
              }
              return (
                <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-xs my-2">
                  <code className="font-mono">{children}</code>
                </pre>
              )
            },
            strong({ children }) {
              return <strong className="font-semibold">{children}</strong>
            },
          }}
        >
          {text}
        </ReactMarkdown>

        {/* References footer */}
        {references.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Fonti:</p>
            <div className="flex flex-wrap gap-1.5">
              {references.map(ref => (
                <button
                  key={`${ref.type}:${ref.id}`}
                  type="button"
                  onClick={() => handleRefClick(ref.type, ref.id)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-border bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                  title={`${ref.type}:${ref.id}`}
                >
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-[10px]">
                    {ref.number}
                  </span>
                  {ref.type === 'source_insight' ? 'Insight' : 'Fonte'} {ref.number}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <SourcePopup
        open={popupOpen}
        onOpenChange={setPopupOpen}
        type={popupType}
        id={popupId}
      />
    </>
  )
}
