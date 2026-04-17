# System Monitor Process Tables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the System Monitor page to show two compact tables — Top 3 by CPU and Top 3 by Memory — fetched from `GET /api/processes` on the same 10-second interval.

**Architecture:** Extend the existing `fetchStats` function to also call `/api/processes` on each tick. Store the full process list in a second state variable and derive the two sorted top-3 slices at render time. Add a `ProcessTable` sub-component in the same file. Process fetch errors are silent.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, Vitest, @testing-library/react

---

### Task 1: Write failing tests

**Files:**
- Modify: `frontend/src/pages/__tests__/SystemMonitor.test.tsx`

- [ ] **Step 1: Add `MOCK_PROCESSES` constant and `stubFetch` helper after the existing `MOCK_STATS` constant**

```typescript
const MOCK_PROCESSES = [
  { pid: 1, name: 'chrome.exe', cpu: 15.2, mem: 2.1, memMb: 512 },
  { pid: 2, name: 'node.exe', cpu: 8.5, mem: 1.4, memMb: 350 },
  { pid: 3, name: 'code.exe', cpu: 5.1, mem: 1.8, memMb: 420 },
  { pid: 4, name: 'svchost.exe', cpu: 0.1, mem: 3.5, memMb: 900 },
]

function stubFetch() {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = input as string
    if (url === '/api/system') {
      return Promise.resolve({ ok: true, json: async () => MOCK_STATS } as Response)
    }
    return Promise.resolve({ ok: true, json: async () => MOCK_PROCESSES } as Response)
  })
}
```

- [ ] **Step 2: Update 4 existing tests that use `mockResolvedValue({ ok: true, json: async () => MOCK_STATS })` to use `stubFetch()` instead**

The 4 tests to update are:
- `renders the site title as a link back to home`
- `renders cpu percentage after fetch succeeds`
- `renders memory usage in GB after fetch succeeds`
- `sets up polling interval of 10 seconds`

In each of those tests, replace:
```typescript
vi.mocked(fetch).mockResolvedValue({
  ok: true,
  json: async () => MOCK_STATS,
} as Response)
```
with:
```typescript
stubFetch()
```

- [ ] **Step 3: Add the new test suite at the end of the file**

```typescript
describe('GET /api/processes — process tables', () => {
  it('renders Top CPU and Top Memory headings when processes are available', async () => {
    stubFetch()
    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByText('Top CPU')).toBeInTheDocument())
    expect(screen.getByText('Top Memory')).toBeInTheDocument()
  })

  it('renders the top CPU process name in the table', async () => {
    stubFetch()
    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )
    // chrome.exe has highest CPU (15.2)
    await waitFor(() =>
      expect(screen.getAllByText('chrome.exe').length).toBeGreaterThan(0)
    )
  })

  it('renders the top memory process name in the table', async () => {
    stubFetch()
    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )
    // svchost.exe has highest memMb (900)
    await waitFor(() =>
      expect(screen.getAllByText('svchost.exe').length).toBeGreaterThan(0)
    )
  })

  it('does not render process tables when /api/processes fetch fails', async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = input as string
      if (url === '/api/system') {
        return Promise.resolve({ ok: true, json: async () => MOCK_STATS } as Response)
      }
      return Promise.reject(new Error('Network error'))
    })
    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByText(/CPU: 42\.5%/)).toBeInTheDocument())
    expect(screen.queryByText('Top CPU')).not.toBeInTheDocument()
    expect(screen.queryByText('Top Memory')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run the tests to verify the new tests fail**

```bash
cd c:/Users/Lenovo/misc_projects/brynjars-website/frontend && npx vitest run src/pages/__tests__/SystemMonitor.test.tsx 2>&1 | tail -20
```

Expected: the 4 new tests in `GET /api/processes — process tables` fail (headings not found), existing tests pass.

---

### Task 2: Implement the component

**Files:**
- Modify: `frontend/src/pages/SystemMonitor.tsx`

- [ ] **Step 1: Replace the full content of `frontend/src/pages/SystemMonitor.tsx` with the following**

```typescript
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type SystemStats = {
  cpuPercent: number
  memUsedMb: number
  memTotalMb: number
}

type ProcessEntry = {
  pid: number
  name: string
  cpu: number
  mem: number
  memMb: number
}

function StatBar({ percent }: { percent: number }) {
  return (
    <div className="w-full bg-gray-200 rounded h-4">
      <div className="bg-blue-500 h-4 rounded" style={{ width: `${percent}%` }} />
    </div>
  )
}

function ProcessTable({ title, rows }: { title: string; rows: ProcessEntry[] }) {
  return (
    <div>
      <p className="text-gray-700 mb-2 font-medium">{title}</p>
      <table className="w-full text-sm text-left text-gray-700">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="pb-1 pr-4 font-medium">Name</th>
            <th className="pb-1 pr-4 font-medium">PID</th>
            <th className="pb-1 pr-4 font-medium">CPU%</th>
            <th className="pb-1 font-medium">Mem MB</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.pid} className="border-b border-gray-100">
              <td className="py-1 pr-4">{p.name}</td>
              <td className="py-1 pr-4">{p.pid}</td>
              <td className="py-1 pr-4">{p.cpu.toFixed(1)}</td>
              <td className="py-1">{p.memMb}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SystemMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [error, setError] = useState(false)
  const [processes, setProcesses] = useState<ProcessEntry[]>([])

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

      fetch('/api/processes')
        .then((res) => {
          if (!res.ok) throw new Error('Failed')
          return res.json()
        })
        .then((data: ProcessEntry[]) => setProcesses(data))
        .catch(() => {})
    }

    fetchStats()
    const id = setInterval(fetchStats, 10000)
    return () => clearInterval(id)
  }, [])

  const memPercent = stats ? Math.round((stats.memUsedMb / stats.memTotalMb) * 100) : 0
  const topCpu = [...processes].sort((a, b) => b.cpu - a.cpu).slice(0, 3)
  const topMem = [...processes].sort((a, b) => b.memMb - a.memMb).slice(0, 3)

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
          {processes.length > 0 && (
            <div className="flex gap-8 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <ProcessTable title="Top CPU" rows={topCpu} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <ProcessTable title="Top Memory" rows={topMem} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run all frontend tests and verify they pass**

```bash
cd c:/Users/Lenovo/misc_projects/brynjars-website/frontend && npx vitest run 2>&1 | tail -8
```

Expected: all tests pass (the 4 new process-table tests now green).

- [ ] **Step 3: Commit**

```bash
cd c:/Users/Lenovo/misc_projects/brynjars-website
git add frontend/src/pages/SystemMonitor.tsx frontend/src/pages/__tests__/SystemMonitor.test.tsx
git commit -m "feat: show top 3 CPU and memory processes on system monitor page"
```

---

### Task 3: Update docs

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Extend the System Monitor bullet in the Features section to mention the process tables**

Find the sentence that was added in the previous session:
```
A companion endpoint `GET /api/processes` returns all running processes as `[{ pid, name, cpu, mem, memMb }]` where `memMb` is RSS memory in MB (one decimal place).
```

Replace it with:
```
A companion endpoint `GET /api/processes` returns all running processes as `[{ pid, name, cpu, mem, memMb }]` where `memMb` is RSS memory in MB (one decimal place). The frontend polls this endpoint on the same 10-second interval and renders two tables below the progress bars: **Top CPU** and **Top Memory**, each showing the top 3 processes by that metric with name, PID, CPU%, and Mem MB columns.
```

- [ ] **Step 2: Commit**

```bash
cd c:/Users/Lenovo/misc_projects/brynjars-website
git add CLAUDE.md
git commit -m "docs: document process tables on system monitor page"
```
