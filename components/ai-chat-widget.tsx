'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'
import chatIcon from '@/public/chat-icon.png'
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from '@/components/ai-elements/prompt-input'
import { Loader } from '@/components/ai-elements/loader'
import { ModeToggle } from '@/components/mode-toggle'
import { ChatMessage } from '@/components/chat-message'

// Simple UUID generator for environments where crypto.randomUUID() is unavailable
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

interface AIChatWidgetProps {
  apiEndpoint?: string
  welcomeMessage?: string
  quickActions?: string[]
  title?: string
  subtitle?: string
}

export function AIChatWidget({
  apiEndpoint = '/api/chat',
  welcomeMessage = 'Hi! Ask me anything.',
  quickActions = [
    "How can you help me?",
    "What can you do?",
    "Tell me more",
  ],
  title = 'AI Assistant',
  subtitle
}: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const messageContent = input
    setInput('')

    // Add user message
    const userMessage: ChatMessage = {
      id: generateUUID(),
      role: 'user',
      content: messageContent
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // Create assistant message that will be updated as stream comes in
    const assistantMessageId = generateUUID()
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: ''
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      // Send to API
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      })

      if (!response.ok) throw new Error('Failed to get response')

      // Read the streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulatedContent += chunk

        // Update the assistant message with accumulated content
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
      // Remove the assistant message if there was an error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
    } finally {
      setIsLoading(false)
    }
  }

  const onQuickAction = (action: string) => {
    setInput(action)
  }

  return (
    <Sheet modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg z-50 hover:scale-110 transition-transform bg-primary hover:bg-primary/90"
        >
          <Image
            src={chatIcon}
            alt="Chat"
            width={40}
            height={40}
            className="object-contain"
          />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:w-[66vw] lg:w-[40vw] max-w-[1400px] flex flex-col p-0 shadow-2xl border-l"
      >
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <SheetTitle>{title}</SheetTitle>
            </div>
            <ModeToggle />
          </div>
          <SheetDescription className="sr-only">
            Chat with the AI assistant
          </SheetDescription>
          {subtitle && (
            <Badge variant="outline" className="w-fit mt-2">
              {subtitle}
            </Badge>
          )}
        </SheetHeader>

        <Conversation className="flex-1">
          <ConversationContent className="flex flex-col gap-6">
            {messages.length === 0 && (
              <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 p-4 rounded-r">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {welcomeMessage}
                </p>
              </div>
            )}

            {messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <div className="flex gap-3 items-start">
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Image
                        src={chatIcon}
                        alt="AI"
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </div>
                  )}
                  <MessageContent>
                    {message.role === 'assistant'
                      ? <ChatMessage content={message.content} />
                      : <MessageResponse>{message.content}</MessageResponse>
                    }
                  </MessageContent>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-sm">👤</span>
                    </div>
                  )}
                </div>
              </Message>
            ))}

            {isLoading && (
              <Message from="assistant">
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Image
                      src={chatIcon}
                      alt="AI"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                  <MessageContent>
                    <div className="flex items-center gap-2">
                      <Loader size={16} />
                      <span className="text-sm text-muted-foreground">AI is thinking...</span>
                    </div>
                  </MessageContent>
                </div>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="p-6 pt-4 border-t">
          {messages.length === 0 && quickActions.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {quickActions.map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  className="text-xs whitespace-nowrap"
                  onClick={() => onQuickAction(action)}
                >
                  {action}
                </Button>
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
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
            />
            <PromptInputFooter>
              <div />
              <PromptInputSubmit disabled={isLoading || !input.trim()} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </SheetContent>
    </Sheet>
  )
}
