# Ollama Chat UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a streaming multi-turn chat UI on `/ollama-chat` backed by an updated `POST /api/chat` that accepts a full messages array.

**Architecture:** Two tasks — first update the backend to accept `messages[]` (replacing the single `message` string), then implement the chat UI in `OllamaChat.tsx` using `fetch` + `ReadableStream` to render responses token by token as they stream in.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, React Router v7, Vitest, @testing-library/react, Express, ollama npm package, supertest

---

## File Map

- Modify: `backend/src/index.ts` — update `/api/chat` to accept `messages` array
- Modify: `backend/src/__tests__/index.test.ts` — add tests for new `/api/chat` contract; mock ollama
- Modify: `frontend/src/pages/OllamaChat.tsx` — implement full chat UI
- Modify: `frontend/src/pages/__tests__/OllamaChat.test.tsx` — replace placeholder tests with chat UI tests

---

### Task 1: Update backend /api/chat to accept messages array

**Files:**
- Modify: `backend/src/index.ts`
- Modify: `backend/src/__tests__/index.test.ts`

- [ ] **Step 1: Replace the test file with updated tests including ollama mock**

Replace the full contents of `backend/src/__tests__/index.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('ollama', () => ({
  Ollama: vi.fn().mockImplementation(() => ({
    chat: vi.fn(),
  })),
}))
vi.mock('child_process')

import { Ollama } from 'ollama'
import { execFile, type ExecFileException } from 'child_process'
import request from 'supertest'
import { app } from '../index'

const mockOllama = vi.mocked(Ollama).mock.results[0].value as { chat: ReturnType<typeof vi.fn> }
const mockedExecFile = vi.mocked(execFile)

type ExecFileCallback = (err: ExecFileException | null, stdout: string, stderr: string) => void

function mockExecFile(err: ExecFileException | null, stdout: string): void {
  mockedExecFile.mockImplementation((_f, _a, _o, cb) => {
    (cb as ExecFileCallback)(err, stdout, '')
    return undefined as any
  })
}

beforeEach(() => {
  mockedExecFile.mockReset()
  mockOllama.chat.mockReset()
})

const MOCK_DATA = [
  {
    name: 'Viktor',
    pages: '23-24',
    weekday_english: 'Thursday',
    weekday_icelandic: 'Fimmtudagur',
  },
]

describe('GET /api/last-read', () => {
  it('returns parsed JSON from the python script', async () => {
    mockExecFile(null, JSON.stringify(MOCK_DATA))
    const res = await request(app).get('/api/last-read')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(MOCK_DATA)
  })

  it('returns 500 when the script exits with an error', async () => {
    mockExecFile(new Error('script failed') as ExecFileException, '')
    const res = await request(app).get('/api/last-read')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to fetch reading data' })
  })

  it('returns 500 when stdout is not valid JSON', async () => {
    mockExecFile(null, 'not valid json')
    const res = await request(app).get('/api/last-read')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to fetch reading data' })
  })
})

describe('POST /api/chat', () => {
  it('returns 400 when messages is missing', async () => {
    const res = await request(app).post('/api/chat').send({})
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'messages must be a non-empty array' })
  })

  it('returns 400 when messages is an empty array', async () => {
    const res = await request(app).post('/api/chat').send({ messages: [] })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'messages must be a non-empty array' })
  })

  it('streams response text when messages are valid', async () => {
    mockOllama.chat.mockReturnValue((async function* () {
      yield { message: { content: 'Hello' } }
      yield { message: { content: ' world' } }
    })())

    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Hi' }] })

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/plain/)
    expect(res.text).toBe('Hello world')
  })

  it('returns 500 when ollama throws', async () => {
    mockOllama.chat.mockRejectedValue(new Error('connection refused'))

    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Hi' }] })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to connect to Ollama' })
  })
})
```

- [ ] **Step 2: Run tests to verify new /api/chat tests fail**

```bash
cd backend && npm test -- --run
```

Expected: 3 `GET /api/last-read` tests pass, 4 `POST /api/chat` tests fail (endpoint has wrong contract).

- [ ] **Step 3: Update /api/chat in index.ts**

Replace the `/api/chat` route handler in `backend/src/index.ts` (the `app.post('/api/chat', ...)` block):

```ts
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages must be a non-empty array' })
    return
  }

  try {
    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages,
      stream: true,
    })

    res.setHeader('Content-Type', 'text/plain')
    for await (const chunk of response) {
      res.write(chunk.message.content)
    }
    res.end()
  } catch (error) {
    console.error('Ollama chat error:', error)
    res.status(500).json({ error: 'Failed to connect to Ollama' })
  }
})
```

- [ ] **Step 4: Run all backend tests to verify they pass**

```bash
cd backend && npm test -- --run
```

Expected: All 7 tests pass (3 last-read + 4 chat).

- [ ] **Step 5: Commit**

```bash
git add backend/src/index.ts backend/src/__tests__/index.test.ts
git commit -m "feat: update /api/chat to accept messages array for multi-turn support"
```

---

### Task 2: Implement streaming chat UI

**Files:**
- Modify: `frontend/src/pages/OllamaChat.tsx`
- Modify: `frontend/src/pages/__tests__/OllamaChat.test.tsx`

- [ ] **Step 1: Replace the test file with chat UI tests**

Replace the full contents of `frontend/src/pages/__tests__/OllamaChat.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import OllamaChat from '../OllamaChat'

function mockStreamResponse(chunks: string[]) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })
  return Promise.resolve({ ok: true, body: stream } as Response)
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

describe('OllamaChat', () => {
  it('renders the page heading', () => {
    render(<MemoryRouter><OllamaChat /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Ollama Chat' })).toBeInTheDocument()
  })

  it('renders the site title as a link back to home', () => {
    render(<MemoryRouter><OllamaChat /></MemoryRouter>)
    const heading = screen.getByRole('heading', { name: "Brynjar's Online Antics" })
    expect(heading.closest('a')).toHaveAttribute('href', '/')
  })

  it('renders a textarea and Send button', () => {
    render(<MemoryRouter><OllamaChat /></MemoryRouter>)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })

  it('shows user message and streamed assistant reply after sending', async () => {
    vi.mocked(fetch).mockReturnValue(mockStreamResponse(['The sky ', 'is blue.']))

    render(<MemoryRouter><OllamaChat /></MemoryRouter>)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Why is the sky blue?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => expect(screen.getByText('Why is the sky blue?')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText(/The sky is blue/)).toBeInTheDocument())
  })

  it('clears the input after sending', async () => {
    vi.mocked(fetch).mockReturnValue(mockStreamResponse(['ok']))

    render(<MemoryRouter><OllamaChat /></MemoryRouter>)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => expect(textarea).toHaveValue(''))
  })

  it('sends on Enter key', async () => {
    vi.mocked(fetch).mockReturnValue(mockStreamResponse(['ok']))

    render(<MemoryRouter><OllamaChat /></MemoryRouter>)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledOnce())
  })

  it('does not send on Shift+Enter', () => {
    render(<MemoryRouter><OllamaChat /></MemoryRouter>)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('disables Send button while streaming', async () => {
    let resolveStream!: () => void
    const pendingStream = new Promise<Response>((resolve) => {
      resolveStream = () => {
        const stream = new ReadableStream({ start(c) { c.close() } })
        resolve({ ok: true, body: stream } as Response)
      }
    })
    vi.mocked(fetch).mockReturnValue(pendingStream)

    render(<MemoryRouter><OllamaChat /></MemoryRouter>)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled())

    resolveStream()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled())
  })

  it('shows error message when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    render(<MemoryRouter><OllamaChat /></MemoryRouter>)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(screen.getByText('Error: could not reach Ollama')).toBeInTheDocument()
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- OllamaChat --run
```

Expected: Most tests fail — OllamaChat is still a placeholder.

- [ ] **Step 3: Implement the chat UI**

Replace the full contents of `frontend/src/pages/OllamaChat.tsx`:

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'

type Message = { role: 'user' | 'assistant'; content: string }

export default function OllamaChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  async function sendMessage() {
    if (!input.trim() || isStreaming) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const nextMessages = [...messages, userMessage]
    setMessages([...nextMessages, { role: 'assistant', content: '' }])
    setInput('')
    setIsStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })

      if (!res.ok || !res.body) throw new Error('Bad response')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'Error: could not reach Ollama' }
        return updated
      })
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
    <div className="min-h-screen bg-white flex flex-col px-6 py-12 max-w-2xl mx-auto">
      <Link to="/" className="text-gray-900 no-underline hover:underline">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Brynjar's Online Antics
        </h1>
      </Link>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Ollama Chat</h2>

      <div className="flex-1 flex flex-col gap-3 mb-4 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'self-end bg-gray-900 text-white'
                : 'self-start bg-gray-100 text-gray-800'
            }`}
          >
            {msg.content}
          </div>
        ))}
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
          disabled={isStreaming || !input.trim()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold disabled:opacity-50 self-end"
        >
          Send
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run all frontend tests to verify they pass**

```bash
cd frontend && npm test -- --run
```

Expected: All tests pass (existing App/NavCard/ReadingCard tests + new OllamaChat tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/OllamaChat.tsx frontend/src/pages/__tests__/OllamaChat.test.tsx
git commit -m "feat: implement Ollama chat UI with streaming and multi-turn support"
```
