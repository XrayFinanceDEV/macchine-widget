import { EmbeddedChatWidget } from '@/components/embedded-chat-widget'

export const metadata = {
  title: 'Regolamento Macchine — Assistente AI',
}

export default function WidgetPage() {
  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <EmbeddedChatWidget
        title="Regolamento Macchine"
        subtitle="Reg. (UE) 2023/1230"
        welcomeMessage="Ciao! Sono l'assistente AI sul Regolamento Macchine (UE) 2023/1230. Clicca su ✨ Cominciamo per un'introduzione, oppure fammi direttamente una domanda."
        quickActions={[
          '✨ Cominciamo: dammi un indice generale del Nuovo Regolamento Macchine UE',
          "Quali macchine sono ad alto rischio nell'Allegato I?",
          'Qual è la differenza tra Parte A e Parte B?',
          'Cosa cambia rispetto alla Direttiva 2006/42/CE?',
          'Quali sono gli obblighi del fabbricante?',
        ]}
      />
    </div>
  )
}
