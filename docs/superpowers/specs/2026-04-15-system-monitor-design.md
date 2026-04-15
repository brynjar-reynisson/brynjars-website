# Design: System Monitor Page

## Summary

The System Monitor page displays live CPU and memory usage for the host machine, polling every 10 seconds while the page is open.

## Backend

**Endpoint:** `GET /api/system`

Added directly to `backend/src/index.ts` using Node's built-in `os` module. No new module or file needed.

**CPU sampling:** Take two snapshots of `os.cpus()` separated by 100ms. For each core, compute the delta of idle ticks and total ticks. Sum across all cores and calculate:

```
cpuPercent = (1 - totalIdleDelta / totalTicksDelta) * 100
```

Round to one decimal place.

**Memory:** Read `os.totalmem()` and `os.freemem()` directly (no sampling needed).

**Response shape:**
```json
{ "cpuPercent": 14.3, "memUsedMb": 9012, "memTotalMb": 16384 }
```

Values are in MB (bytes divided by 1048576, rounded to integer).

**No authentication required.** Public endpoint, same as `/api/last-read`.

## Frontend

**File:** `frontend/src/pages/SystemMonitor.tsx`

**Polling:** On mount, fetch `/api/system` immediately, then repeat every 10 seconds via `setInterval`. Clear interval on unmount. Inline in the component — no custom hook (same pattern as `LastRead.tsx`).

**States:**
- Loading: "Loading…" until first successful response
- Error: "Could not load system stats." if any fetch fails
- Data: display CPU and memory

**Display:**
- Header: `"Brynjar's Online Antics"` linked to `/` (same style as About and LastRead)
- CPU: percentage with a simple filled bar (Tailwind, no library)
- Memory: used / total in GB with a simple filled bar

**Bar style:** Same approach for both — a grey background div with a coloured inner div whose width is set as an inline style percentage. No animation.

## Out of Scope

- Per-core CPU breakdown
- Historical charts or graphs
- Disk or network stats
- Authentication
