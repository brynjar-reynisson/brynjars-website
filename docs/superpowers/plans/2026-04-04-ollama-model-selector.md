# Ollama Model Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a settings panel to the Ollama Chat page where the user can select which Ollama model to use, with the preference persisted in a cookie.

**Architecture:** A new `GET /api/models` backend endpoint returns alphabetically sorted model names from `ollama.list()`. The frontend `useOllamaSettings` hook fetches that list and manages the cookie-persisted selection. A `SettingsPanel` slide-in drawer renders the gear button trigger and model selector; `OllamaChat` wires everything together and passes the selected model to `POST /api/chat`.

**Tech Stack:** Express + ollama npm package (backend); React hooks, `@testing-library/react` `renderHook`, jsdom `document.cookie` (frontend); Tailwind CSS v4 for panel styling.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/src/__tests__/index.test.ts` | Modify | Add mock for `ollama.list`; add tests for `GET /api/models` and model override in `POST /api/chat` |
| `backend/src/index.ts` | Modify | Add `GET /api/models` endpoint; update `POST /api/chat` to accept optional `model` |
| `frontend/src/hooks/useOllamaSettings.ts` | Create | Fetch model list, read/write cookie, expose `{ model, setModel, models }` |
| `frontend/src/hooks/__tests__/useOllamaSettings.test.ts` | Create | Unit tests for the hook |
| `frontend/src/components/SettingsPanel.tsx` | Create | Gear button + slide-in drawer with model selector |
| `frontend/src/components/__tests__/SettingsPanel.test.tsx` | Create | Unit tests for the panel |
| `frontend/src/pages/__tests__/OllamaChat.test.tsx` | Modify | Mock `useOllamaSettings`; add tests for settings button and model in fetch body |
| `frontend/src/pages/OllamaChat.tsx` | Modify | Use hook, render gear button and settings panel, include model in chat request |

---

## Task 1: Update backend mock and add `GET /api/models` tests

**Files:**
- Modify: `backend/src/__tests__/index.test.ts`

- [ ] **Step 1: Write the failing tests**

Replace the `vi.mock('ollama', ...)` block and add `GET /api/models` tests. The full updated top of the file and new describe block:

```ts
vi.mock('ollama', () => {
  const mockChat = vi.fn()
  const mockList = vi.fn()
  return {
    Ollama: class {
      chat = mockChat
      list = mockList
    },
    __mockChat: mockChat,
    __mockList: mockList,
  }
})

vi.mock('../lastReadCache', () => ({
  getCache: vi.fn(),
  startPolling: vi.fn(),
}))

import * as ollamaModule from 'ollama'
import { getCache } from '../lastReadCache'
import request from 'supertest'
import { app } from '../index'

const mockChat = (ollamaModule as any).__mockChat
const mockList = (ollamaModule as any).__mockList
const mockedGetCache = vi.mocked(getCache)

beforeEach(() => {
  mockChat.mockReset()
  mockList.mockReset()
  mockedGetCache.mockReset()
})
```

Add this describe block at the end of the file:

```ts
describe('GET /api/models', () => {
  it('returns model names sorted alphabetically', async () => {
    mockList.mockResolvedValue({
      models: [{ name: 'mistral' }, { name: 'codellama' }, { name: 'llama3.2' }],
    })

    const res = await request(app).get('/api/models')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(['codellama', 'llama3.2', 'mistral'])
  })

  it('returns 500 when ollama list throws', async () => {
    mockList.mockRejectedValue(new Error('connection refused'))

    const res = await request(app).get('/api/models')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to connect to Ollama' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && npm test
```

Expected: FAIL — `GET /api/models` route not found (404), and `mockList` is not yet defined on the class.

- [ ] **Step 3: Add `GET /api/models` to the backend**

In `backend/src/index.ts`, add after the `GET /api/last-read` handler:

```ts
app.get('/api/models', async (_req, res) => {
  try {
    const response = await ollama.list()
    const names = response.models.map((m: { name: string }) => m.name).sort()
    res.json(names)
  } catch (error) {
    console.error('Ollama list error:', error)
    res.status(500).json({ error: 'Failed to connect to Ollama' })
  }
})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && npm test
```

Expected: all tests PASS.

---

## Task 2: Accept optional `model` in `POST /api/chat`

**Files:**
- Modify: `backend/src/__tests__/index.test.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Write the failing tests**

Add inside the existing `describe('POST /api/chat', ...)` block:

```ts
it('uses the provided model when given in the request body', async () => {
  mockChat.mockReturnValue(
    (async function* () {
      yield { message: { content: 'hi' } }
    })()
  )

  await request(app)
    .post('/api/chat')
    .send({ messages: [{ role: 'user', content: 'Hi' }], model: 'mistral' })

  expect(mockChat).toHaveBeenCalledWith(
    expect.objectContaining({ model: 'mistral' })
  )
})

it('falls back to OLLAMA_MODEL env default when model is absent', async () => {
  mockChat.mockReturnValue(
    (async function* () {
      yield { message: { content: 'hi' } }
    })()
  )

  await request(app)
    .post('/api/chat')
    .send({ messages: [{ role: 'user', content: 'Hi' }] })

  expect(mockChat).toHaveBeenCalledWith(
    expect.objectContaining({ model: 'llama3.2' })
  )
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && npm test
```

Expected: FAIL — both new tests fail because the backend ignores the `model` field.

- [ ] **Step 3: Update `POST /api/chat` to accept optional model**

In `backend/src/index.ts`, change this line inside `app.post('/api/chat', ...)`:

```ts
// Before:
const { messages } = req.body

// After:
const { messages, model } = req.body
```

And change the `ollama.chat(...)` call:

```ts
// Before:
model: OLLAMA_MODEL,

// After:
model: model ?? OLLAMA_MODEL,
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && npm test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && git add src/__tests__/index.test.ts src/index.ts
git commit -m "feat: add GET /api/models endpoint and optional model override in POST /api/chat"
```

---

## Task 3: `useOllamaSettings` hook

**Files:**
- Create: `frontend/src/hooks/useOllamaSettings.ts`
- Create: `frontend/src/hooks/__tests__/useOllamaSettings.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/hooks/__tests__/useOllamaSettings.test.ts`:

```ts
import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useOllamaSettings } from '../useOllamaSettings'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  document.cookie = 'ollama_model=; expires=Thu, 01 Jan 1970 00:00:00 UTC'
})

describe('useOllamaSettings', () => {
  it('fetches models from /api/models on mount', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ['llama3.2', 'mistral'],
    } as Response)

    const { result } = renderHook(() => useOllamaSettings())

    await waitFor(() => expect(result.current.models).toEqual(['llama3.2', 'mistral']))
  })

  it('initializes model as null when no cookie', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ['llama3.2'],
    } as Response)

    const { result } = renderHook(() => useOllamaSettings())

    await waitFor(() => expect(result.current.models).toEqual(['llama3.2']))
    expect(result.current.model).toBeNull()
  })

  it('initializes model from cookie when value is in the list', async () => {
    document.cookie = 'ollama_model=mistral'
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ['llama3.2', 'mistral'],
    } as Response)

    const { result } = renderHook(() => useOllamaSettings())

    await waitFor(() => expect(result.current.model).toBe('mistral'))
  })

  it('initializes model as null when cookie value is not in list', async () => {
    document.cookie = 'ollama_model=old-model'
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ['llama3.2'],
    } as Response)

    const { result } = renderHook(() => useOllamaSettings())

    await waitFor(() => expect(result.current.models).toEqual(['llama3.2']))
    expect(result.current.model).toBeNull()
  })

  it('setModel writes cookie and updates model', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ['llama3.2', 'mistral'],
    } as Response)

    const { result } = renderHook(() => useOllamaSettings())
    await waitFor(() => expect(result.current.models.length).toBeGreaterThan(0))

    act(() => { result.current.setModel('mistral') })

    expect(result.current.model).toBe('mistral')
    expect(document.cookie).toContain('ollama_model=mistral')
  })

  it('setModel(null) removes cookie and sets model to null', async () => {
    document.cookie = 'ollama_model=mistral'
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ['llama3.2', 'mistral'],
    } as Response)

    const { result } = renderHook(() => useOllamaSettings())
    await waitFor(() => expect(result.current.model).toBe('mistral'))

    act(() => { result.current.setModel(null) })

    expect(result.current.model).toBeNull()
    expect(document.cookie).not.toContain('ollama_model=mistral')
  })

  it('keeps models empty and model null when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useOllamaSettings())

    await new Promise(r => setTimeout(r, 50))

    expect(result.current.models).toEqual([])
    expect(result.current.model).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- src/hooks/__tests__/useOllamaSettings.test.ts
```

Expected: FAIL — `useOllamaSettings` module not found.

- [ ] **Step 3: Implement the hook**

Create `frontend/src/hooks/useOllamaSettings.ts`:

```ts
import { useState, useEffect } from 'react'

const COOKIE_NAME = 'ollama_model'

function readCookie(): string | null {
  const match = document.cookie.split('; ').find(c => c.startsWith(COOKIE_NAME + '='))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

function writeCookie(value: string) {
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; SameSite=Strict`
}

function deleteCookie() {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict`
}

export function useOllamaSettings() {
  const [models, setModels] = useState<string[]>([])
  const [model, setModelState] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/models')
      .then(r => r.json())
      .then((list: string[]) => {
        setModels(list)
        const saved = readCookie()
        if (saved && list.includes(saved)) {
          setModelState(saved)
        } else {
          deleteCookie()
          setModelState(null)
        }
      })
      .catch(() => {})
  }, [])

  function setModel(name: string | null) {
    if (name === null) {
      deleteCookie()
      setModelState(null)
    } else {
      writeCookie(name)
      setModelState(name)
    }
  }

  return { model, setModel, models }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- src/hooks/__tests__/useOllamaSettings.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useOllamaSettings.ts frontend/src/hooks/__tests__/useOllamaSettings.test.ts
git commit -m "feat: add useOllamaSettings hook with model list fetch and cookie persistence"
```

---

## Task 4: `SettingsPanel` component

**Files:**
- Create: `frontend/src/components/SettingsPanel.tsx`
- Create: `frontend/src/components/__tests__/SettingsPanel.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/__tests__/SettingsPanel.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SettingsPanel from '../SettingsPanel'

const defaultProps = {
  model: null as string | null,
  setModel: vi.fn(),
  models: ['llama3.2', 'mistral'],
  isOpen: false,
  onClose: vi.fn(),
}

beforeEach(() => {
  defaultProps.setModel.mockReset()
  defaultProps.onClose.mockReset()
})

describe('SettingsPanel', () => {
  it('does not show the dialog when closed', () => {
    render(<SettingsPanel {...defaultProps} isOpen={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the dialog when open', () => {
    render(<SettingsPanel {...defaultProps} isOpen={true} />)
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<SettingsPanel {...defaultProps} isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close settings' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<SettingsPanel {...defaultProps} isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('settings-backdrop'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows Default option and all models in the select', () => {
    render(<SettingsPanel {...defaultProps} isOpen={true} />)
    expect(screen.getByRole('option', { name: 'Default' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'llama3.2' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'mistral' })).toBeInTheDocument()
  })

  it('selects the Default option when model is null', () => {
    render(<SettingsPanel {...defaultProps} isOpen={true} model={null} />)
    expect(screen.getByRole('combobox', { name: 'Model' })).toHaveValue('')
  })

  it('reflects the current model in the select', () => {
    render(<SettingsPanel {...defaultProps} isOpen={true} model="mistral" />)
    expect(screen.getByRole('combobox', { name: 'Model' })).toHaveValue('mistral')
  })

  it('calls setModel with the name when a model is selected', () => {
    const setModel = vi.fn()
    render(<SettingsPanel {...defaultProps} isOpen={true} setModel={setModel} />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Model' }), { target: { value: 'mistral' } })
    expect(setModel).toHaveBeenCalledWith('mistral')
  })

  it('calls setModel(null) when Default is selected', () => {
    const setModel = vi.fn()
    render(<SettingsPanel {...defaultProps} isOpen={true} model="mistral" setModel={setModel} />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Model' }), { target: { value: '' } })
    expect(setModel).toHaveBeenCalledWith(null)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- src/components/__tests__/SettingsPanel.test.tsx
```

Expected: FAIL — `SettingsPanel` module not found.

- [ ] **Step 3: Implement `SettingsPanel`**

Create `frontend/src/components/SettingsPanel.tsx`:

```tsx
interface SettingsPanelProps {
  model: string | null
  setModel: (m: string | null) => void
  models: string[]
  isOpen: boolean
  onClose: () => void
}

export default function SettingsPanel({ model, setModel, models, isOpen, onClose }: SettingsPanelProps) {
  return (
    <>
      {isOpen && (
        <>
          <div
            data-testid="settings-backdrop"
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Settings"
            className="fixed top-0 right-0 h-full w-72 bg-white shadow-lg z-50 translate-x-0 transition-transform duration-300"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-900 text-xl leading-none"
                aria-label="Close settings"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <select
                id="model-select"
                aria-label="Model"
                value={model ?? ''}
                onChange={e => setModel(e.target.value || null)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="">Default</option>
                {models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </>
  )
}
```

Note on animation: the panel conditionally renders when `isOpen` changes. To get a true CSS slide-in from the right, a follow-up enhancement would be to always render the panel in the DOM and toggle between `translate-x-full` (hidden) and `translate-x-0` (visible). This version is fully functional and testable; the animation enhancement can be done separately.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- src/components/__tests__/SettingsPanel.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/SettingsPanel.tsx frontend/src/components/__tests__/SettingsPanel.test.tsx
git commit -m "feat: add SettingsPanel component with model selector"
```

---

## Task 5: Integrate into `OllamaChat`

**Files:**
- Modify: `frontend/src/pages/__tests__/OllamaChat.test.tsx`
- Modify: `frontend/src/pages/OllamaChat.tsx`

- [ ] **Step 1: Write the failing tests**

At the top of `frontend/src/pages/__tests__/OllamaChat.test.tsx`, add these imports and mock (after the existing imports):

```ts
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useOllamaSettings } from '../../hooks/useOllamaSettings'

vi.mock('../../hooks/useOllamaSettings', () => ({
  useOllamaSettings: vi.fn(),
}))
```

Update `beforeEach` to reset the `useOllamaSettings` mock with a default return value:

```ts
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  vi.mocked(useOllamaSettings).mockReturnValue({ model: null, setModel: vi.fn(), models: [] })
})
```

Add these new test cases inside `describe('OllamaChat', ...)`:

```ts
it('renders a settings gear button', () => {
  render(<MemoryRouter><OllamaChat /></MemoryRouter>)
  expect(screen.getByRole('button', { name: 'Open settings' })).toBeInTheDocument()
})

it('opens the settings panel when the gear button is clicked', () => {
  render(<MemoryRouter><OllamaChat /></MemoryRouter>)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Open settings' }))
  expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
})

it('includes model in fetch body when a model is selected', async () => {
  vi.mocked(useOllamaSettings).mockReturnValue({ model: 'mistral', setModel: vi.fn(), models: ['mistral'] })
  vi.mocked(fetch).mockReturnValue(mockStreamResponse(['ok']))

  render(<MemoryRouter><OllamaChat /></MemoryRouter>)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send' }))

  await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled())
  const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string)
  expect(body.model).toBe('mistral')
})

it('omits model from fetch body when model is null', async () => {
  vi.mocked(useOllamaSettings).mockReturnValue({ model: null, setModel: vi.fn(), models: [] })
  vi.mocked(fetch).mockReturnValue(mockStreamResponse(['ok']))

  render(<MemoryRouter><OllamaChat /></MemoryRouter>)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send' }))

  await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled())
  const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string)
  expect(body.model).toBeUndefined()
})
```

- [ ] **Step 2: Run tests to verify the new ones fail**

```bash
cd frontend && npm test -- src/pages/__tests__/OllamaChat.test.tsx
```

Expected: new tests FAIL; existing tests PASS (the mock prevents hook from calling fetch).

- [ ] **Step 3: Update `OllamaChat.tsx`**

Replace the full contents of `frontend/src/pages/OllamaChat.tsx`:

```tsx
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import { useOllamaSettings } from '../hooks/useOllamaSettings'
import SettingsPanel from '../components/SettingsPanel'

type Message = { role: 'user' | 'assistant'; content: string }

export default function OllamaChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { model, setModel, models } = useOllamaSettings()

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
        body: JSON.stringify({
          messages: [...messages, userMessage],
          ...(model ? { model } : {}),
        }),
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Ollama Chat</h2>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="text-gray-600 hover:text-gray-900 text-xl"
          aria-label="Open settings"
        >
          ⚙
        </button>
      </div>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        model={model}
        setModel={setModel}
        models={models}
      />

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
```

- [ ] **Step 4: Run all frontend tests to verify they pass**

```bash
cd frontend && npm test
```

Expected: all tests PASS.

- [ ] **Step 5: Run all backend tests to verify nothing is broken**

```bash
cd backend && npm test
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/OllamaChat.tsx frontend/src/pages/__tests__/OllamaChat.test.tsx docs/superpowers/specs/2026-04-04-ollama-model-selector-design.md
git commit -m "feat: add Ollama model selector with settings panel and cookie persistence"
```
