# System Monitor — Process Filter Design

**Date:** 2026-04-17

## Overview

Filter out `System Idle Process` and `Memory Compression` from the process list in `SystemMonitor.tsx` before deriving the top-3 CPU and top-3 memory tables.

## Implementation

Add a constant in `frontend/src/pages/SystemMonitor.tsx`:

```typescript
const EXCLUDED_PROCESSES = new Set(['System Idle Process', 'Memory Compression'])
```

Derive `visible` from `processes` before sorting:

```typescript
const visible = processes.filter((p) => !EXCLUDED_PROCESSES.has(p.name))
const topCpu = [...visible].sort((a, b) => b.cpu - a.cpu).slice(0, 3)
const topMem = [...visible].sort((a, b) => b.memMb - a.memMb).slice(0, 3)
```

No backend changes. No config needed.

## Testing

Add one test case to `frontend/src/pages/__tests__/SystemMonitor.test.tsx`: include `System Idle Process` and `Memory Compression` in the mock process list and assert neither name appears in the rendered output.
