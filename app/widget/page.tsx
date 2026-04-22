import { EmbeddedChatWidget } from '@/components/embedded-chat-widget'

export const metadata = {
  title: 'CSI Brescia Calcio a 7',
}

export default function WidgetPage() {
  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <EmbeddedChatWidget
        title="CSI Brescia Calcio a 7"
        subtitle="Powered by brix-ia.com"
        welcomeMessage="Ciao! Sono l'assistente AI del CSI Brescia Calcio a 7. Chiedimi tutto sul regolamento, tessere e campionati!"
        quickActions={[
          'Posso tesserare un giocatore di prima categoria?',
          'La rimessa laterale si fa con le mani o con i piedi?',
          'Dopo quanti gialli devo saltare una giornata?',
        ]}
      />
    </div>
  )
}
