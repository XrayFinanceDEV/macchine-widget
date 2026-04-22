/**
 * Layout dedicato per la route /widget — nessun padding, nessun margine,
 * body e html a 100% height. Ottimizzato per iframe embedding.
 */
export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
