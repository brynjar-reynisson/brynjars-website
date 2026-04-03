import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Markdown from 'react-markdown'

type Message = { role: 'user' | 'assistant'; content: string }

export default function OllamaChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function updateLastMessage(updater: (msg: Message) => Message) {
    setMessages(prev => {
      const updated = [...prev]
      updated[updated.length - 1] = updater(updated[updated.length - 1])
      return updated
    })
  }

  async function sendMessage() {
    if (!input.trim() || isStreaming) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }])
    setInput('')
    setIsStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!res.ok || !res.body) throw new Error('Bad response')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        updateLastMessage(msg => ({ ...msg, content: msg.content + chunk }))
      }
    } catch {
      updateLastMessage(msg => ({ ...msg, content: 'Error: could not reach Ollama' }))
    } finally {
      setIsStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-screen bg-white flex flex-col px-6 py-12 max-w-2xl mx-auto">
      <Link to="/" className="text-gray-900 no-underline hover:underline">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Brynjar's Online Antics
        </h1>
      </Link>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Ollama Chat</h2>

      <div className="flex-1 flex flex-col gap-3 mb-4 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={`${msg.role}-${i}`}
            className={`max-w-[80%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'self-end bg-gray-900 text-white'
                : 'self-start bg-gray-100 text-gray-800'
            }`}
          >
            {msg.role === 'assistant' ? <Markdown>{msg.content}</Markdown> : msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <textarea
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
          rows={3}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder="Type a message..."
          aria-label="Message input"
        />
        <button
          onClick={sendMessage}
          disabled={isStreaming}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold disabled:opacity-50 self-end"
        >
          Send
        </button>
      </div>
    </div>
  )
}
