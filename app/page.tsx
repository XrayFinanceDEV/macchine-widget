import { AIChatWidget } from '@/components/ai-chat-widget'

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex gap-2 items-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
            <span className="font-bold text-xl">Regolamento Macchine &mdash; Assistente AI</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container py-24 md:py-32">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
            <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm">
              📘 Regolamento (UE) 2023/1230 &mdash; Sicurezza delle Macchine
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Assistente AI
              <br />
              <span className="text-blue-600">sul Regolamento Macchine</span>
            </h1>

            <p className="max-w-2xl text-lg text-muted-foreground">
              Interroga il Regolamento (UE) 2023/1230 e il materiale correlato sulle criticità applicative.
              Risposte con citazioni alle fonti, ricerca semantica sull&apos;intero corpus normativo.
            </p>
          </div>
        </section>

        <section id="demo" className="container py-24 border-t">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Inizia a fare domande
            </h2>
            <p className="text-muted-foreground mb-8">
              Apri la chat in basso a destra per iniziare.
            </p>

            <div className="rounded-lg border bg-muted/50 p-8 min-h-[300px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-6xl">⚙️</div>
                <p className="text-lg font-medium">Clicca il pulsante della chat qui sotto</p>
                <p className="text-sm text-muted-foreground">
                  L&apos;assistente cerca nel notebook e risponde con riferimenti alle sezioni del regolamento.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            Powered by Open-Notebook &middot; Reg. (UE) 2023/1230
          </p>
        </div>
      </footer>

      <AIChatWidget
        title="Regolamento Macchine"
        subtitle="Reg. (UE) 2023/1230"
        welcomeMessage="Ciao! Sono l'assistente AI sul Regolamento Macchine (UE) 2023/1230. Fammi una domanda sul testo del regolamento o sulle sue criticità applicative."
        quickActions={[
          "Quali macchine sono ad alto rischio nell'Allegato I?",
          "Qual è la differenza tra Parte A e Parte B?",
          "Cosa cambia rispetto alla Direttiva 2006/42/CE?",
          "Quali sono gli obblighi del fabbricante?",
        ]}
      />
    </div>
  )
}
