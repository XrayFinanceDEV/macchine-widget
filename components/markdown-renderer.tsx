'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        code(props) {
          const { node, inline, className, children, ...rest } = props as any

          // For inline code, just use styled span
          if (inline) {
            return (
              <code
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                {...rest}
              >
                {children}
              </code>
            )
          }

          // For code blocks, use a pre-styled block
          return (
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm my-2">
              <code className="font-mono text-foreground">
                {children}
              </code>
            </pre>
          )
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>
        },
        ul({ children }) {
          return <ul className="list-disc list-inside mb-2">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside mb-2">{children}</ol>
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              className="text-blue-600 dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          )
        }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
