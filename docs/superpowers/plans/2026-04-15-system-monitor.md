# System Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a System Monitor page that displays live CPU and memory usage, polled from a new backend endpoint every 10 seconds.

**Architecture:** A new `GET /api/system` endpoint in the Express backend uses Node's `os` module to sample CPU ticks over 100ms and read memory figures. The frontend polls this endpoint every 10 seconds via `setInterval` and renders two labelled bars.

**Tech Stack:** Node.js `os` module, Express, React, TypeScript, Tailwind CSS, Vitest, supertest, @testing-library/react

---

### Task 1: Backend `GET /api/system` endpoint

**Files:**
- Modify: `backend/src/index.ts`
- Modify: `backend/src/__tests__/index.test.ts`

- [ ] **Step 1: Add `os` mock to the top of the test file**

Open `backend/src/__tests__/index.test.ts`. Add this `vi.mock` block immediately after the existing `vi.mock('../todoAuth', ...)` call:

```ts
vi.mock('os', () => {
  const mockCpus = vi.fn()
  const mockTotalmem = vi.fn()
  const mockFreemem = vi.fn()
  return {
    default: { cpus: mockCpus, totalmem: mockTotalmem, freemem: mockFreemem },
    __mockCpus: mockCpus,
    __mockTotalmem: mockTotalmem,
    __mockFreemem: mockFreemem,
  }
})
```

- [ ] **Step 2: Import `os` and wire up mock refs**

Add this import after the existing imports (after `import * as todoAuth from '../todoAuth'`):

```ts
import os from 'os'
```

Add these lines after `const mockedGetCache = vi.mocked(getCache)`:

```ts
const mockCpus = (os as any).__mockCpus as ReturnType<typeof vi.fn>
const mockTotalmem = (os as any).__mockTotalmem as ReturnType<typeof vi.fn>
const mockFreemem = (os as any).__mockFreemem as ReturnType<typeof vi.fn>
```

- [ ] **Step 3: Reset `os` mocks in `beforeEach`**

Add these three lines to the existing `beforeEach` block (after the `vi.mocked(todoAuth.saveToken).mockReset()` line):

```ts
  mockCpus.mockReset()
  mockTotalmem.mockReset()
  mockFreemem.mockReset()
```

- [ ] **Step 4: Write the failing tests**

Add this describe block at the end of `backend/src/__tests__/index.test.ts`:

```ts
describe('GET /api/system', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns cpuPercent, memUsedMb, and memTotalMb', async () => {
    const startCpus = [{ times: { user: 100, nice: 0, sys: 50, idle: 850, irq: 0 } }]
    const endCpus   = [{ times: { user: 200, nice: 0, sys: 100, idle: 900, irq: 0 } }]
    mockCpus.mockReturnValueOnce(startCpus).mockReturnValueOnce(endCpus)
    mockTotalmem.mockReturnValue(16 * 1024 * 1024 * 1024)
    mockFreemem.mockReturnValue(7 * 1024 * 1024 * 1024)

    const responsePromise = request(app).get('/api/system')
    await vi.advanceTimersByTimeAsync(100)
    const res = await responsePromise

    // idle delta: 900-850=50, total delta: (200+100+900)-(100+50+850)=200
    // cpuPercent = (1 - 50/200) * 100 = 75.0
    // memTotalMb = round(16*1024^3 / 1048576) = 16384
    // memUsedMb  = round((16-7)*1024^3 / 1048576) = 9216
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ cpuPercent: 75.0, memUsedMb: 9216, memTotalMb: 16384 })
  })

  it('averages cpu across multiple cores', async () => {
    const startCpus = [
      { times: { user: 100, nice: 0, sys: 50, idle: 850, irq: 0 } },
      { times: { user: 200, nice: 0, sys: 100, idle: 700, irq: 0 } },
    ]
    const endCpus = [
      { times: { user: 200, nice: 0, sys: 100, idle: 900, irq: 0 } },
      { times: { user: 300, nice: 0, sys: 150, idle: 750, irq: 0 } },
    ]
    mockCpus.mockReturnValueOnce(startCpus).mockReturnValueOnce(endCpus)
    mockTotalmem.mockReturnValue(8 * 1024 * 1024 * 1024)
    mockFreemem.mockReturnValue(4 * 1024 * 1024 * 1024)

    const responsePromise = request(app).get('/api/system')
    await vi.advanceTimersByTimeAsync(100)
    const res = await responsePromise

    // Core 0: idle delta=50, total delta=200 → 75% used
    // Core 1: idle delta=50, total delta=200 → 75% used
    // Combined: idle delta=100, total delta=400 → cpuPercent=75.0
    // memTotalMb=8192, memUsedMb=4096
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ cpuPercent: 75.0, memUsedMb: 4096, memTotalMb: 8192 })
  })

  it('returns 500 when os.cpus throws', async () => {
    mockCpus.mockImplementation(() => { throw new Error('os error') })
    mockTotalmem.mockReturnValue(8 * 1024 * 1024 * 1024)
    mockFreemem.mockReturnValue(4 * 1024 * 1024 * 1024)

    const responsePromise = request(app).get('/api/system')
    await vi.advanceTimersByTimeAsync(100)
    const res = await responsePromise

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to get system stats' })
  })
})
```

- [ ] **Step 5: Run the new tests to confirm they fail**

```bash
cd backend && npx vitest run src/__tests__/index.test.ts 2>&1 | tail -10
```

Expected: 3 new tests FAIL (`GET /api/system` not found), existing tests still pass.

- [ ] **Step 6: Implement `GET /api/system` in `backend/src/index.ts`**

Add `import os from 'os'` at the top of `backend/src/index.ts`, after the existing imports:

```ts
import os from 'os'
```

Add this function and endpoint just before `export { app }`:

```ts
function getCpuPercent(): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      const start = os.cpus()
      setTimeout(() => {
        try {
          const end = os.cpus()
          let idleDelta = 0
          let totalDelta = 0
          for (let i = 0; i < start.length; i++) {
            const s = start[i].times
            const e = end[i].times
            idleDelta += e.idle - s.idle
            totalDelta += (e.user + e.nice + e.sys + e.idle + e.irq) -
                          (s.user + s.nice + s.sys + s.idle + s.irq)
          }
          resolve(Math.round((1 - idleDelta / totalDelta) * 1000) / 10)
        } catch (err) {
          reject(err)
        }
      }, 100)
    } catch (err) {
      reject(err)
    }
  })
}

app.get('/api/system', async (_req, res) => {
  try {
    const cpuPercent = await getCpuPercent()
    const totalMb = Math.round(os.totalmem() / 1048576)
    const freeMb = Math.round(os.freemem() / 1048576)
    res.json({ cpuPercent, memUsedMb: totalMb - freeMb, memTotalMb: totalMb })
  } catch {
    res.status(500).json({ error: 'Failed to get system stats' })
  }
})
```

- [ ] **Step 7: Run tests to confirm all pass**

```bash
cd backend && npx vitest run src/__tests__/index.test.ts 2>&1 | tail -10
```

Expected: All tests PASS including the 3 new ones.

- [ ] **Step 8: Commit**

```bash
git add backend/src/index.ts backend/src/__tests__/index.test.ts
git commit -m "feat: add GET /api/system endpoint for cpu and memory stats"
```

---

### Task 2: Frontend SystemMonitor page

**Files:**
- Modify: `frontend/src/pages/SystemMonitor.tsx`
- Create: `frontend/src/pages/__tests__/SystemMonitor.test.tsx`

- [ ] **Step 1: Create the test file with failing tests**

Create `frontend/src/pages/__tests__/SystemMonitor.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import SystemMonitor from '../SystemMonitor'

const MOCK_STATS = { cpuPercent: 42.5, memUsedMb: 8192, memTotalMb: 16384 }

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SystemMonitor', () => {
  it('renders the site title as a link back to home', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_STATS,
    } as Response)

    render(
      <MemoryRouter>
        <SystemMonitor />
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
        <SystemMonitor />
      </MemoryRouter>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders cpu percentage after fetch succeeds', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_STATS,
    } as Response)

    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText(/CPU: 42\.5%/)).toBeInTheDocument())
  })

  it('renders memory usage in GB after fetch succeeds', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_STATS,
    } as Response)

    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )

    // memUsedMb 8192 → 8.0 GB, memTotalMb 16384 → 16.0 GB, 50%
    await waitFor(() => expect(screen.getByText(/8\.0 \/ 16\.0 GB/)).toBeInTheDocument())
  })

  it('shows error message when fetch rejects', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )

    await waitFor(() =>
      expect(screen.getByText('Could not load system stats.')).toBeInTheDocument()
    )
  })

  it('shows error message when server returns non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)

    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )

    await waitFor(() =>
      expect(screen.getByText('Could not load system stats.')).toBeInTheDocument()
    )
  })

  it('sets up polling interval of 10 seconds', async () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval')
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_STATS,
    } as Response)

    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText(/CPU:/)).toBeInTheDocument())
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 10000)
    setIntervalSpy.mockRestore()
  })
})
```

- [ ] **Step 2: Run the new tests to confirm they fail**

```bash
cd frontend && npx vitest run src/pages/__tests__/SystemMonitor.test.tsx 2>&1 | tail -10
```

Expected: All 7 tests FAIL (current `SystemMonitor` is a placeholder with no title or stats).

- [ ] **Step 3: Implement `SystemMonitor.tsx`**

Replace the entire contents of `frontend/src/pages/SystemMonitor.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type SystemStats = {
  cpuPercent: number
  memUsedMb: number
  memTotalMb: number
}

function StatBar({ percent }: { percent: number }) {
  return (
    <div className="w-full bg-gray-200 rounded h-4">
      <div className="bg-blue-500 h-4 rounded" style={{ width: `${percent}%` }} />
    </div>
  )
}

export default function SystemMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    function fetchStats() {
      fetch('/api/system')
        .then((res) => {
          if (!res.ok) throw new Error('Failed')
          return res.json()
        })
        .then((data: SystemStats) => {
          setStats(data)
          setError(false)
        })
        .catch(() => setError(true))
    }

    fetchStats()
    const id = setInterval(fetchStats, 10000)
    return () => clearInterval(id)
  }, [])

  const memPercent = stats ? Math.round((stats.memUsedMb / stats.memTotalMb) * 100) : 0

  return (
    <div className="min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-10">
        <Link to="/" className="text-gray-900 no-underline hover:underline">
          Brynjar's Online Antics
        </Link>
      </h1>
      {error && <p className="text-red-500">Could not load system stats.</p>}
      {!error && !stats && <p className="text-gray-500">Loading...</p>}
      {stats && (
        <div className="flex flex-col gap-8">
          <div>
            <p className="text-gray-700 mb-2 font-medium">CPU: {stats.cpuPercent}%</p>
            <StatBar percent={stats.cpuPercent} />
          </div>
          <div>
            <p className="text-gray-700 mb-2 font-medium">
              Memory: {(stats.memUsedMb / 1024).toFixed(1)} / {(stats.memTotalMb / 1024).toFixed(1)} GB ({memPercent}%)
            </p>
            <StatBar percent={memPercent} />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the SystemMonitor tests to confirm all pass**

```bash
cd frontend && npx vitest run src/pages/__tests__/SystemMonitor.test.tsx 2>&1 | tail -10
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Run the full frontend test suite to confirm no regressions**

```bash
cd frontend && npx vitest run 2>&1 | tail -5
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/SystemMonitor.tsx frontend/src/pages/__tests__/SystemMonitor.test.tsx
git commit -m "feat: implement system monitor page with cpu and memory bars"
```
