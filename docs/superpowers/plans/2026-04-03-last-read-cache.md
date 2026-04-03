# Last-Read Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-fetch reading data on backend startup, serve from memory cache, refresh every 10 minutes, and show a retrying "Loading, this may take a while…" state in the frontend while the cache warms up.

**Architecture:** A new `lastReadCache.ts` module owns cache state and polling; `index.ts` imports `getCache`/`startPolling` and the `/api/last-read` handler becomes a simple cache read returning 503 `{ pending: true }` when null. The frontend detects 503+pending and retries after 3 seconds.

**Tech Stack:** Node.js, TypeScript, Express, Vitest, Supertest, React, @testing-library/react

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `backend/src/lastReadCache.ts` | Create | Cache state, populate(), getCache(), startPolling() |
| `backend/src/__tests__/lastReadCache.test.ts` | Create | Unit tests for cache module |
| `backend/src/index.ts` | Modify | Use getCache/startPolling; return 503 when null |
| `backend/src/__tests__/index.test.ts` | Modify | Mock lastReadCache; replace execFile-based tests |
| `frontend/src/pages/LastRead.tsx` | Modify | Handle 503+pending state; retry after 3s |
| `frontend/src/pages/__tests__/LastRead.test.tsx` | Modify | Add tests for pending message and retry scheduling |

---

### Task 1: `lastReadCache.ts` module

**Files:**
- Create: `backend/src/lastReadCache.ts`
- Create: `backend/src/__tests__/lastReadCache.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/__tests__/lastReadCache.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('child_process')

import { execFile, type ExecFileException } from 'child_process'
import { getCache, populate, startPolling, _resetForTest } from '../lastReadCache'

const mockedExecFile = vi.mocked(execFile)

type ExecFileCallback = (err: ExecFileException | null, stdout: string, stderr: string) => void

function mockExecFile(err: ExecFileException | null, stdout: string): void {
  mockedExecFile.mockImplementation((_f, _a, _o, cb) => {
    ;(cb as ExecFileCallback)(err, stdout, '')
    return undefined as any
  })
}

beforeEach(() => {
  mockedExecFile.mockReset()
  _resetForTest()
})

const MOCK_DATA = [
  {
    name: 'Viktor',
    pages: '23-24',
    weekday_english: 'Thursday',
    weekday_icelandic: 'Fimmtudagur',
  },
]

describe('getCache', () => {
  it('returns null before any populate call', () => {
    expect(getCache()).toBeNull()
  })
})

describe('populate', () => {
  it('sets cache on successful script execution', async () => {
    mockExecFile(null, JSON.stringify(MOCK_DATA))
    await populate()
    expect(getCache()).toEqual(MOCK_DATA)
  })

  it('leaves cache as null when script exits with an error', async () => {
    mockExecFile(new Error('script failed') as ExecFileException, '')
    await populate()
    expect(getCache()).toBeNull()
  })

  it('leaves cache as null when stdout is not valid JSON', async () => {
    mockExecFile(null, 'not valid json')
    await populate()
    expect(getCache()).toBeNull()
  })
})

describe('startPolling', () => {
  it('calls populate immediately', () => {
    vi.useFakeTimers()
    mockExecFile(null, JSON.stringify(MOCK_DATA))
    startPolling(60000)
    expect(getCache()).toEqual(MOCK_DATA)
    vi.useRealTimers()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && npx vitest run src/__tests__/lastReadCache.test.ts
```

Expected: FAIL — module `../lastReadCache` not found.

- [ ] **Step 3: Implement `lastReadCache.ts`**

Create `backend/src/lastReadCache.ts`:

```ts
import { execFile } from 'child_process'

export interface ReadingEntry {
  name: string
  pages: string
  weekday_english: string
  weekday_icelandic: string
}

const LAST_READ_DIR =
  process.env.LAST_READ_DIR ?? 'C:\\Users\\Lenovo\\misc_projects\\last-read'

let cache: ReadingEntry[] | null = null

export function getCache(): ReadingEntry[] | null {
  return cache
}

export function _resetForTest(): void {
  cache = null
}

export function populate(): Promise<void> {
  return new Promise((resolve) => {
    execFile(
      'python',
      ['last_read.py', '--json'],
      { cwd: LAST_READ_DIR, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } },
      (error, stdout) => {
        if (error) {
          console.error('Last-read script error:', error)
          resolve()
          return
        }
        try {
          cache = JSON.parse(stdout)
        } catch (e) {
          console.error('Last-read JSON parse error:', e)
        }
        resolve()
      }
    )
  })
}

export function startPolling(intervalMs: number): void {
  populate()
  setInterval(populate, intervalMs)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && npx vitest run src/__tests__/lastReadCache.test.ts
```

Expected: 5 tests passing, 0 failing.

- [ ] **Step 5: Commit**

```bash
cd backend && git add src/lastReadCache.ts src/__tests__/lastReadCache.test.ts
git commit -m "feat: add lastReadCache module with populate, getCache, startPolling"
```

---

### Task 2: Update `index.ts` and `index.test.ts`

**Files:**
- Modify: `backend/src/index.ts`
- Modify: `backend/src/__tests__/index.test.ts`

- [ ] **Step 1: Update the test file first (write failing tests)**

Replace `backend/src/__tests__/index.test.ts` entirely with:

```ts
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('ollama', () => {
  const mockChat = vi.fn()
  return {
    Ollama: class {
      constructor() {
        this.chat = mockChat
      }
      chat: ReturnType<typeof vi.fn>
    },
    __mockChat: mockChat,
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
const mockedGetCache = vi.mocked(getCache)

beforeEach(() => {
  mockChat.mockReset()
  mockedGetCache.mockReset()
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
  it('returns 503 with pending: true when cache is null', async () => {
    mockedGetCache.mockReturnValue(null)
    const res = await request(app).get('/api/last-read')
    expect(res.status).toBe(503)
    expect(res.body).toEqual({ pending: true })
  })

  it('returns cached data when cache is populated', async () => {
    mockedGetCache.mockReturnValue(MOCK_DATA)
    const res = await request(app).get('/api/last-read')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(MOCK_DATA)
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
    mockChat.mockReturnValue(
      (async function* () {
        yield { message: { content: 'Hello' } }
        yield { message: { content: ' world' } }
      })()
    )

    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Hi' }] })

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/plain/)
    expect(res.text).toBe('Hello world')
  })

  it('returns 500 when ollama throws', async () => {
    mockChat.mockRejectedValue(new Error('connection refused'))

    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Hi' }] })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to connect to Ollama' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && npx vitest run src/__tests__/index.test.ts
```

Expected: FAIL — `getCache` mock not wiring up yet because `index.ts` still uses `execFile`.

- [ ] **Step 3: Update `index.ts`**

Replace `backend/src/index.ts` entirely with:

```ts
import express from 'express'
import cors from 'cors'
import { Ollama } from 'ollama'
import { getCache, startPolling } from './lastReadCache'

const app = express()
const PORT = process.env.PORT ?? 3001
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2'

const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGIN ?? 'http://localhost:5173,https://breynisson.org'
).split(',')
app.use(cors({ origin: ALLOWED_ORIGINS }))
app.use(express.json())

const ollama = new Ollama({ host: process.env.OLLAMA_HOST ?? 'http://localhost:11434' })

app.get('/api/last-read', (_req, res) => {
  const data = getCache()
  if (data === null) {
    res.status(503).json({ pending: true })
    return
  }
  res.json(data)
})

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

export { app }

if (process.env.NODE_ENV !== 'test') {
  startPolling(10 * 60 * 1000)
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`)
  })
}
```

- [ ] **Step 4: Run all backend tests to verify they pass**

```bash
cd backend && npx vitest run
```

Expected: 6 tests passing (2 last-read + 4 chat), 0 failing.

- [ ] **Step 5: Commit**

```bash
cd backend
git add src/index.ts src/__tests__/index.test.ts
git commit -m "feat: use lastReadCache in index.ts, return 503 when cache pending"
```

---

### Task 3: Update `LastRead.tsx` and `LastRead.test.tsx`

**Files:**
- Modify: `frontend/src/pages/LastRead.tsx`
- Modify: `frontend/src/pages/__tests__/LastRead.test.tsx`

- [ ] **Step 1: Add failing tests for new behavior**

Replace `frontend/src/pages/__tests__/LastRead.test.tsx` entirely with:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import LastRead from '../LastRead'

const MOCK_ENTRIES = [
  {
    name: 'Viktor',
    pages: '23-24',
    weekday_english: 'Thursday',
    weekday_icelandic: 'Fimmtudagur',
  },
  {
    name: 'Alexander',
    pages: '126-127',
    weekday_english: 'Wednesday',
    weekday_icelandic: 'Miðvikudagur',
  },
]

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LastRead', () => {
  it('renders the site title as a link back to home', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => MOCK_ENTRIES,
    } as Response)

    render(
      <MemoryRouter>
        <LastRead />
      </MemoryRouter>
    )
    const heading = screen.getByRole('heading', { name: "Brynjar's Online Antics" })
    expect(heading).toBeInTheDocument()
    expect(heading.closest('a')).toHaveAttribute('href', '/')
  })

  it('shows loading state before fetch resolves', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    render(
      <MemoryRouter>
        <LastRead />
      </MemoryRouter>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders a card for each entry after fetch succeeds', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => MOCK_ENTRIES,
    } as Response)

    render(
      <MemoryRouter>
        <LastRead />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByText('Viktor')).toBeInTheDocument())
    expect(screen.getByText('Alexander')).toBeInTheDocument()
  })

  it('shows error message when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    render(
      <MemoryRouter>
        <LastRead />
      </MemoryRouter>
    )
    await waitFor(() =>
      expect(screen.getByText('Could not load reading data.')).toBeInTheDocument()
    )
  })

  it('shows pending message when server responds 503 with pending: true', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ pending: true }),
    } as Response)

    render(
      <MemoryRouter>
        <LastRead />
      </MemoryRouter>
    )
    await waitFor(() =>
      expect(
        screen.getByText('Loading, this may take a while\u2026')
      ).toBeInTheDocument()
    )
  })

  it('schedules a retry 3 seconds after a pending response', async () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ pending: true }),
    } as Response)

    render(
      <MemoryRouter>
        <LastRead />
      </MemoryRouter>
    )

    await waitFor(() =>
      expect(
        screen.getByText('Loading, this may take a while\u2026')
      ).toBeInTheDocument()
    )

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000)
    setTimeoutSpy.mockRestore()
  })

  it('shows error message when server responds with non-503 error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response)

    render(
      <MemoryRouter>
        <LastRead />
      </MemoryRouter>
    )
    await waitFor(() =>
      expect(screen.getByText('Could not load reading data.')).toBeInTheDocument()
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npx vitest run src/pages/__tests__/LastRead.test.tsx
```

Expected: the 2 new tests (pending message, retry scheduling) fail; the existing 4 may pass or fail depending on Response shape.

- [ ] **Step 3: Update `LastRead.tsx`**

Replace `frontend/src/pages/LastRead.tsx` entirely with:

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ReadingCard from '../components/ReadingCard'
import type { ReadingEntry } from '../components/ReadingCard'

export default function LastRead() {
  const [entries, setEntries] = useState<ReadingEntry[] | null>(null)
  const [error, setError] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    function fetchData() {
      fetch('/api/last-read')
        .then(async (res) => {
          if (res.status === 503) {
            const body = await res.json()
            if (body.pending) {
              setPending(true)
              retryTimer = setTimeout(fetchData, 3000)
              return
            }
          }
          if (!res.ok) throw new Error('Failed')
          setPending(false)
          const data: ReadingEntry[] = await res.json()
          setEntries(data)
        })
        .catch(() => setError(true))
    }

    fetchData()

    return () => {
      if (retryTimer !== null) clearTimeout(retryTimer)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-10 px-4">
      <Link to="/" className="text-gray-900 no-underline hover:underline">
        <h1 className="text-4xl font-bold text-gray-900">Brynjar's Online Antics</h1>
      </Link>
      {error && <p className="text-gray-500">Could not load reading data.</p>}
      {!error && !pending && entries === null && (
        <p className="text-gray-500">Loading...</p>
      )}
      {!error && pending && (
        <p className="text-gray-500">Loading, this may take a while…</p>
      )}
      {entries && (
        <div className="flex flex-col md:flex-row gap-6">
          {entries.map((entry) => (
            <ReadingCard key={entry.name} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run all frontend tests to verify they pass**

```bash
cd frontend && npx vitest run
```

Expected: all tests passing (7 LastRead + 9 OllamaChat = 16 total), 0 failing.

- [ ] **Step 5: Commit**

```bash
cd frontend
git add src/pages/LastRead.tsx src/pages/__tests__/LastRead.test.tsx
git commit -m "feat: handle 503 pending state in LastRead with retry after 3s"
```
