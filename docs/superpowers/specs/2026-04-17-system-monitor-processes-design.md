# System Monitor — Process Tables Design

**Date:** 2026-04-17

## Overview

Extend the `/system-monitor` page to show the top 3 CPU-using and top 3 memory-using processes, fetched from the new `GET /api/processes` endpoint on the same 10-second polling interval as the existing system stats.

## Data

### New type

```typescript
type ProcessEntry = {
  pid: number
  name: string
  cpu: number
  mem: number
  memMb: number
}
```

### State

Add one new state variable to `SystemMonitor`:

```typescript
const [processes, setProcesses] = useState<ProcessEntry[]>([])
```

### Fetching

Extend the existing `fetchStats` function (inside the `useEffect`) to also call `GET /api/processes`. Both fetches share the same 10-second `setInterval`. Process fetch errors are silent — they do not affect the existing system stats error state.

### Derived data (computed at render)

```typescript
const topCpu = [...processes].sort((a, b) => b.cpu - a.cpu).slice(0, 3)
const topMem = [...processes].sort((a, b) => b.memMb - a.memMb).slice(0, 3)
```

## Layout

Below the existing CPU and memory progress bars, render two side-by-side sections (flexbox row, wraps on narrow screens):

- **Top CPU** — table with columns: Name, PID, CPU%, Mem MB
- **Top Memory** — table with columns: Name, PID, CPU%, Mem MB

Both sections only render when `processes.length > 0`.

## Error Handling

- Process fetch failure: silent — `processes` stays empty, sections are not shown.
- System stats fetch failure: existing behaviour unchanged (shows "Could not load system stats.").

## Testing

Extend `frontend/src/pages/__tests__/SystemMonitor.test.tsx`:

- Mock `fetch` to dispatch by URL: `/api/system` returns `MOCK_STATS`, `/api/processes` returns a mock process list.
- Assert "Top CPU" and "Top Memory" headings appear.
- Assert the correct process name appears in each section (top CPU process in the CPU table, top memory process in the memory table).
- Assert process tables are not rendered when `/api/processes` fetch fails.
