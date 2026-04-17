# Process Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exclude `System Idle Process` and `Memory Compression` from the process tables on the System Monitor page.

**Architecture:** Add an `EXCLUDED_PROCESSES` constant in `SystemMonitor.tsx`, derive a `visible` array from `processes` by filtering on that set, and use `visible` instead of `processes` for the `topCpu`/`topMem` derivations.

**Tech Stack:** React, TypeScript, Vitest, @testing-library/react

---

### Task 1: Filter excluded processes

**Files:**
- Modify: `frontend/src/pages/SystemMonitor.tsx`
- Modify: `frontend/src/pages/__tests__/SystemMonitor.test.tsx`

- [ ] **Step 1: Write the failing test — add it to the existing `describe('GET /api/processes — process tables', ...)` block in the test file**

The test stubs fetch so that `MOCK_PROCESSES` includes `System Idle Process` and `Memory Compression`. It asserts neither name appears in the rendered output after the tables load.

Insert this test into `frontend/src/pages/__tests__/SystemMonitor.test.tsx` inside the `describe('GET /api/processes — process tables', ...)` block, after the last existing test:

```typescript
it('does not render System Idle Process or Memory Compression', async () => {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = input as string
    if (url === '/api/system') {
      return Promise.resolve({ ok: true, json: async () => MOCK_STATS } as Response)
    }
    return Promise.resolve({
      ok: true,
      json: async () => [
        ...MOCK_PROCESSES,
        { pid: 100, name: 'System Idle Process', cpu: 99.0, memMb: 0.1 },
        { pid: 101, name: 'Memory Compression', cpu: 0.5, memMb: 800 },
      ],
    } as Response)
  })

  render(
    <MemoryRouter>
      <SystemMonitor />
    </MemoryRouter>
  )

  await waitFor(() => expect(screen.getByText('Top CPU')).toBeInTheDocument())
  expect(screen.queryByText('System Idle Process')).not.toBeInTheDocument()
  expect(screen.queryByText('Memory Compression')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd c:/Users/Lenovo/misc_projects/brynjars-website/frontend && npx vitest run src/pages/__tests__/SystemMonitor.test.tsx 2>&1 | tail -10
```

Expected: 1 new test fails — `System Idle Process` or `Memory Compression` is found in the DOM (because the filter doesn't exist yet).

- [ ] **Step 3: Add `EXCLUDED_PROCESSES` constant and `visible` derivation to `SystemMonitor.tsx`**

Add the constant after the `ProcessEntry` type definition (after line 15):

```typescript
const EXCLUDED_PROCESSES = new Set(['System Idle Process', 'Memory Compression'])
```

Replace lines 86–87:
```typescript
const topCpu = [...processes].sort((a, b) => b.cpu - a.cpu).slice(0, 3)
const topMem = [...processes].sort((a, b) => b.memMb - a.memMb).slice(0, 3)
```

With:
```typescript
const visible = processes.filter((p) => !EXCLUDED_PROCESSES.has(p.name))
const topCpu = [...visible].sort((a, b) => b.cpu - a.cpu).slice(0, 3)
const topMem = [...visible].sort((a, b) => b.memMb - a.memMb).slice(0, 3)
```

- [ ] **Step 4: Run all frontend tests to verify they pass**

```bash
cd c:/Users/Lenovo/misc_projects/brynjars-website/frontend && npx vitest run 2>&1 | tail -6
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd c:/Users/Lenovo/misc_projects/brynjars-website
git add frontend/src/pages/SystemMonitor.tsx frontend/src/pages/__tests__/SystemMonitor.test.tsx
git commit -m "feat: exclude System Idle Process and Memory Compression from process tables"
```
