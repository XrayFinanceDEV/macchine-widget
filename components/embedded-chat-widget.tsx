'use client'

import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'
import chatIcon from '@/public/chat-icon.png'
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from '@/components/ai-elements/prompt-input'
import { Loader } from '@/components/ai-elements/loader'
import { ChatMessage } from '@/components/chat-message'

// Simple UUID generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface EmbeddedChatWidgetProps {
  apiEndpoint?: string
  welcomeMessage?: string
  quickActions?: string[]
  title?: string
  subtitle?: string
}

/**
 * EmbeddedChatWidget - versione always-open del widget, pensata per iframe embedding.
 * Nessun pulsante flottante, nessun Sheet: il chat è sempre visibile e occupa tutto il container.
 */
export function EmbeddedChatWidget({
  apiEndpoint = '/api/chat',
  welcomeMessage = 'Ciao! Come posso aiutarti?',
  quickActions = [
    'Di cosa parla questo documento?',
    'Quali sono le regole principali?',
    'Spiegami meglio',
  ],
  title = 'AI Assistant',
  subtitle,
}: EmbeddedChatWidgetProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const messageContent = input
    setInput('')

    const userMessage: ChatMessage = {
      id: generateUUID(),
      role: 'user',
      content: messageContent,
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    const assistantMessageId = generateUUID()
    setMessages(prev => [
      ...prev,
      { id: assistantMessageId, role: 'assistant', content: '' },
    ])

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No response body')

      let accumulatedContent = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulatedContent += decoder.decode(value, { stream: true })
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedContent }
              : msg
          )
        )
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-background/95 backdrop-blur shrink-0">
        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="font-semibold text-sm">{title}</span>
        {subtitle && (
          <Badge variant="outline" className="text-xs ml-1">
            {subtitle}
          </Badge>
        )}
      </div>

      {/* Messages area */}
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="flex flex-col gap-4 p-4">
          {messages.length === 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 p-3 rounded-r">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {welcomeMessage}
              </p>
            </div>
          )}

          {messages.map(message => (
            <Message key={message.id} from={message.role}>
              <div className="flex gap-2 items-start">
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <Image src={chatIcon} alt="AI" width={20} height={20} className="object-contain" />
                  </div>
                )}
                <MessageContent>
                  {message.role === 'assistant'
                    ? <ChatMessage content={message.content} />
                    : <MessageResponse>{message.content}</MessageResponse>
                  }
                </MessageContent>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-xs">👤</span>
                  </div>
                )}
              </div>
            </Message>
          ))}

          {isLoading && (
            <Message from="assistant">
              <div className="flex gap-2 items-start">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <Image src={chatIcon} alt="AI" width={20} height={20} className="object-contain" />
                </div>
                <MessageContent>
                  <div className="flex items-center gap-2">
                    <Loader size={14} />
                    <span className="text-xs text-muted-foreground">Sto elaborando...</span>
                  </div>
                </MessageContent>
              </div>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Quick actions + input */}
      <div className="p-3 pt-2 border-t shrink-0">
        {messages.length === 0 && quickActions.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
            {quickActions.map(action => (
              <button
                key={action}
                className="text-xs whitespace-nowrap px-2 py-1 rounded border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setInput(action)}
              >
                {action}
              </button>
            ))}
          </div>
        )}

        <PromptInput
          onSubmit={(message, event) => {
            handleSubmit(event)
          }}
        >
          <PromptInputTextarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Scrivi un messaggio..."
          />
          <PromptInputFooter>
            <div />
            <PromptInputSubmit disabled={isLoading || !input.trim()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}
