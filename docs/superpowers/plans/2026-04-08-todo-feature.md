# TODO Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-panel TODO editor: backend reads/writes `.txt` files from a `TODO` folder; frontend shows a file list sidebar and a text editor with autosave.

**Architecture:** New `todoFiles.ts` module handles all file I/O; 5 Express routes in `index.ts` expose it; `useTodoFiles` hook owns frontend API state; `Todo.tsx` is rewritten as a full-width two-panel layout.

**Tech Stack:** Node.js, TypeScript, Express, `fs/promises`, React, React Router v7, Vitest, @testing-library/react, supertest

---

## File Map

| Action | File |
|--------|------|
| Create | `backend/src/todoFiles.ts` |
| Create | `backend/src/__tests__/todoFiles.test.ts` |
| Modify | `backend/src/index.ts` |
| Modify | `backend/src/__tests__/index.test.ts` |
| Create | `frontend/src/hooks/useTodoFiles.ts` |
| Create | `frontend/src/hooks/__tests__/useTodoFiles.test.ts` |
| Modify | `frontend/src/pages/Todo.tsx` |
| Modify | `frontend/src/pages/__tests__/Todo.test.tsx` |

---

### Task 1: `todoFiles.ts` — file system module

**Files:**
- Create: `backend/src/todoFiles.ts`
- Create: `backend/src/__tests__/todoFiles.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/__tests__/todoFiles.test.ts`:

```typescript
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import os from 'os'
import fs from 'fs/promises'
import path from 'path'
import {
  ensureDir,
  listFiles,
  readFile,
  createFile,
  saveFile,
  renameFile,
  ensureDefaultFile,
} from '../todoFiles'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'todo-test-'))
  vi.stubEnv('TODO_DIR', tmpDir)
})

afterEach(async () => {
  vi.unstubAllEnvs()
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('ensureDir', () => {
  it('creates the directory when it does not exist', async () => {
    const newDir = path.join(tmpDir, 'subdir')
    vi.stubEnv('TODO_DIR', newDir)
    await ensureDir()
    const stat = await fs.stat(newDir)
    expect(stat.isDirectory()).toBe(true)
  })

  it('does not throw when directory already exists', async () => {
    await expect(ensureDir()).resolves.toBeUndefined()
  })
})

describe('listFiles', () => {
  it('returns an empty array when the folder has no .txt files', async () => {
    expect(await listFiles()).toEqual([])
  })

  it('returns files sorted by filename with names extracted', async () => {
    await fs.writeFile(path.join(tmpDir, '2026-04-08-Alpha.txt'), '')
    await fs.writeFile(path.join(tmpDir, '2026-04-07-Beta.txt'), '')
    const result = await listFiles()
    expect(result).toEqual([
      { filename: '2026-04-07-Beta.txt', name: 'Beta' },
      { filename: '2026-04-08-Alpha.txt', name: 'Alpha' },
    ])
  })

  it('ignores non-.txt files', async () => {
    await fs.writeFile(path.join(tmpDir, '2026-04-08-Note.txt'), '')
    await fs.writeFile(path.join(tmpDir, 'README.md'), '')
    const result = await listFiles()
    expect(result).toHaveLength(1)
    expect(result[0].filename).toBe('2026-04-08-Note.txt')
  })
})

describe('readFile', () => {
  it('returns the content of the file', async () => {
    await fs.writeFile(path.join(tmpDir, '2026-04-08-Note.txt'), 'hello world')
    expect(await readFile('2026-04-08-Note.txt')).toBe('hello world')
  })
})

describe('createFile', () => {
  it('creates a file with today\'s date prefix and returns filename and name', async () => {
    const result = await createFile('MyNote')
    expect(result.filename).toMatch(/^\d{4}-\d{2}-\d{2}-MyNote\.txt$/)
    expect(result.name).toBe('MyNote')
    const stat = await fs.stat(path.join(tmpDir, result.filename))
    expect(stat.isFile()).toBe(true)
  })

  it('creates the file with empty content', async () => {
    const result = await createFile('MyNote')
    expect(await fs.readFile(path.join(tmpDir, result.filename), 'utf8')).toBe('')
  })

  it('appends a counter suffix when a file with that name exists today', async () => {
    const first = await createFile('Note')
    const second = await createFile('Note')
    expect(second.name).toBe('Note-2')
    expect(second.filename).not.toBe(first.filename)
  })

  it('increments the counter further when Note-2 also exists', async () => {
    await createFile('Note')
    await createFile('Note')
    const third = await createFile('Note')
    expect(third.name).toBe('Note-3')
  })
})

describe('saveFile', () => {
  it('writes content to the file', async () => {
    await fs.writeFile(path.join(tmpDir, '2026-04-08-Note.txt'), '')
    await saveFile('2026-04-08-Note.txt', 'updated content')
    expect(await fs.readFile(path.join(tmpDir, '2026-04-08-Note.txt'), 'utf8')).toBe('updated content')
  })
})

describe('renameFile', () => {
  it('renames the file keeping the original date prefix', async () => {
    await fs.writeFile(path.join(tmpDir, '2026-04-08-OldName.txt'), 'content')
    const result = await renameFile('2026-04-08-OldName.txt', 'NewName')
    expect(result.filename).toBe('2026-04-08-NewName.txt')
    await expect(fs.stat(path.join(tmpDir, '2026-04-08-NewName.txt'))).resolves.toBeDefined()
    await expect(fs.stat(path.join(tmpDir, '2026-04-08-OldName.txt'))).rejects.toThrow()
  })

  it('preserves file content after rename', async () => {
    await fs.writeFile(path.join(tmpDir, '2026-04-08-OldName.txt'), 'my content')
    await renameFile('2026-04-08-OldName.txt', 'NewName')
    expect(await fs.readFile(path.join(tmpDir, '2026-04-08-NewName.txt'), 'utf8')).toBe('my content')
  })

  it('throws when filename has no date prefix', async () => {
    await expect(renameFile('badname.txt', 'NewName')).rejects.toThrow('Invalid filename')
  })
})

describe('ensureDefaultFile', () => {
  it('creates a TODO.txt file when the folder is empty', async () => {
    await ensureDefaultFile()
    const files = await listFiles()
    expect(files).toHaveLength(1)
    expect(files[0].name).toBe('TODO')
  })

  it('does nothing when files already exist', async () => {
    await fs.writeFile(path.join(tmpDir, '2026-04-08-Existing.txt'), '')
    await ensureDefaultFile()
    const files = await listFiles()
    expect(files).toHaveLength(1)
    expect(files[0].name).toBe('Existing')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && npm test -- --reporter=verbose todoFiles.test
```

Expected: FAIL — `Cannot find module '../todoFiles'`

- [ ] **Step 3: Create `todoFiles.ts`**

Create `backend/src/todoFiles.ts`:

```typescript
import fs from 'fs/promises'
import path from 'path'

function getTodoDir(): string {
  return process.env.TODO_DIR ?? './TODO'
}

function todayPrefix(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function filenameToName(filename: string): string {
  return filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.txt$/, '')
}

export async function ensureDir(): Promise<void> {
  await fs.mkdir(getTodoDir(), { recursive: true })
}

export async function listFiles(): Promise<{ filename: string; name: string }[]> {
  const entries = await fs.readdir(getTodoDir())
  return entries
    .filter((f) => f.endsWith('.txt'))
    .sort()
    .map((filename) => ({ filename, name: filenameToName(filename) }))
}

export async function readFile(filename: string): Promise<string> {
  return fs.readFile(path.join(getTodoDir(), filename), 'utf8')
}

export async function createFile(name: string): Promise<{ filename: string; name: string }> {
  const existing = await listFiles()
  let candidateName = name
  let counter = 2
  while (existing.some((f) => f.filename === `${todayPrefix()}-${candidateName}.txt`)) {
    candidateName = `${name}-${counter}`
    counter++
  }
  const filename = `${todayPrefix()}-${candidateName}.txt`
  await fs.writeFile(path.join(getTodoDir(), filename), '', 'utf8')
  return { filename, name: candidateName }
}

export async function saveFile(filename: string, content: string): Promise<void> {
  await fs.writeFile(path.join(getTodoDir(), filename), content, 'utf8')
}

export async function renameFile(
  oldFilename: string,
  newName: string
): Promise<{ filename: string }> {
  const match = oldFilename.match(/^(\d{4}-\d{2}-\d{2})-/)
  if (!match) throw new Error(`Invalid filename: ${oldFilename}`)
  const newFilename = `${match[1]}-${newName}.txt`
  await fs.rename(path.join(getTodoDir(), oldFilename), path.join(getTodoDir(), newFilename))
  return { filename: newFilename }
}

export async function ensureDefaultFile(): Promise<void> {
  const files = await listFiles()
  if (files.length === 0) {
    await createFile('TODO')
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && npm test -- --reporter=verbose todoFiles.test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/todoFiles.ts backend/src/__tests__/todoFiles.test.ts
git commit -m "feat: add todoFiles module for TODO folder file operations"
```

---

### Task 2: TODO API routes

**Files:**
- Modify: `backend/src/index.ts`
- Modify: `backend/src/__tests__/index.test.ts`

- [ ] **Step 1: Add `todoFiles` mock and write failing route tests**

At the top of `backend/src/__tests__/index.test.ts`, add the `todoFiles` mock alongside the existing `ollama` and `lastReadCache` mocks (before any imports):

```typescript
vi.mock('../todoFiles', () => ({
  ensureDir: vi.fn(),
  ensureDefaultFile: vi.fn(),
  listFiles: vi.fn(),
  readFile: vi.fn(),
  createFile: vi.fn(),
  saveFile: vi.fn(),
  renameFile: vi.fn(),
}))
```

Then add this import after the existing imports:

```typescript
import * as todoFiles from '../todoFiles'
```

Add this reset inside `beforeEach`:

```typescript
vi.mocked(todoFiles.listFiles).mockReset()
vi.mocked(todoFiles.readFile).mockReset()
vi.mocked(todoFiles.createFile).mockReset()
vi.mocked(todoFiles.saveFile).mockReset()
vi.mocked(todoFiles.renameFile).mockReset()
```

Then add the new test describes at the bottom of the file:

```typescript
describe('GET /api/todo', () => {
  it('returns the file list', async () => {
    vi.mocked(todoFiles.listFiles).mockResolvedValue([
      { filename: '2026-04-08-TODO.txt', name: 'TODO' },
      { filename: '2026-04-08-Work.txt', name: 'Work' },
    ])
    const res = await request(app).get('/api/todo')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([
      { filename: '2026-04-08-TODO.txt', name: 'TODO' },
      { filename: '2026-04-08-Work.txt', name: 'Work' },
    ])
  })

  it('returns 500 when listFiles throws', async () => {
    vi.mocked(todoFiles.listFiles).mockRejectedValue(new Error('disk error'))
    const res = await request(app).get('/api/todo')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to list files' })
  })
})

describe('GET /api/todo/:filename', () => {
  it('returns content of the file', async () => {
    vi.mocked(todoFiles.readFile).mockResolvedValue('my note content')
    const res = await request(app).get('/api/todo/2026-04-08-TODO.txt')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ content: 'my note content' })
  })

  it('returns 500 when readFile throws', async () => {
    vi.mocked(todoFiles.readFile).mockRejectedValue(new Error('not found'))
    const res = await request(app).get('/api/todo/2026-04-08-TODO.txt')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to read file' })
  })
})

describe('POST /api/todo', () => {
  it('creates a file and returns filename and name', async () => {
    vi.mocked(todoFiles.createFile).mockResolvedValue({
      filename: '2026-04-08-New.txt',
      name: 'New',
    })
    const res = await request(app).post('/api/todo').send({ name: 'New' })
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ filename: '2026-04-08-New.txt', name: 'New' })
    expect(vi.mocked(todoFiles.createFile)).toHaveBeenCalledWith('New')
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/todo').send({})
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'name must be a non-empty string' })
  })

  it('returns 500 when createFile throws', async () => {
    vi.mocked(todoFiles.createFile).mockRejectedValue(new Error('disk error'))
    const res = await request(app).post('/api/todo').send({ name: 'New' })
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to create file' })
  })
})

describe('PUT /api/todo/:filename', () => {
  it('saves content and returns 204', async () => {
    vi.mocked(todoFiles.saveFile).mockResolvedValue()
    const res = await request(app)
      .put('/api/todo/2026-04-08-TODO.txt')
      .send({ content: 'new content' })
    expect(res.status).toBe(204)
    expect(vi.mocked(todoFiles.saveFile)).toHaveBeenCalledWith(
      '2026-04-08-TODO.txt',
      'new content'
    )
  })

  it('returns 400 when content is missing', async () => {
    const res = await request(app).put('/api/todo/2026-04-08-TODO.txt').send({})
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'content must be a string' })
  })

  it('returns 500 when saveFile throws', async () => {
    vi.mocked(todoFiles.saveFile).mockRejectedValue(new Error('disk error'))
    const res = await request(app)
      .put('/api/todo/2026-04-08-TODO.txt')
      .send({ content: 'x' })
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to save file' })
  })
})

describe('PATCH /api/todo/:filename', () => {
  it('renames the file and returns the new filename', async () => {
    vi.mocked(todoFiles.renameFile).mockResolvedValue({ filename: '2026-04-08-NewName.txt' })
    const res = await request(app)
      .patch('/api/todo/2026-04-08-OldName.txt')
      .send({ name: 'NewName' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ filename: '2026-04-08-NewName.txt' })
    expect(vi.mocked(todoFiles.renameFile)).toHaveBeenCalledWith(
      '2026-04-08-OldName.txt',
      'NewName'
    )
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app).patch('/api/todo/2026-04-08-OldName.txt').send({})
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'name must be a non-empty string' })
  })

  it('returns 500 when renameFile throws', async () => {
    vi.mocked(todoFiles.renameFile).mockRejectedValue(new Error('disk error'))
    const res = await request(app)
      .patch('/api/todo/2026-04-08-OldName.txt')
      .send({ name: 'NewName' })
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to rename file' })
  })
})
```

- [ ] **Step 2: Run tests to verify new tests fail**

```bash
cd backend && npm test -- --reporter=verbose index.test
```

Expected: existing tests PASS, new todo route tests FAIL with 404.

- [ ] **Step 3: Add routes and startup changes to `index.ts`**

Read `backend/src/index.ts` first. Then apply these changes:

Add this import near the top (after existing imports):

```typescript
import { ensureDir, ensureDefaultFile, listFiles, readFile, createFile, saveFile, renameFile } from './todoFiles'
```

Add the 5 routes before the `export { app }` line:

```typescript
app.get('/api/todo', async (_req, res) => {
  try {
    res.json(await listFiles())
  } catch {
    res.status(500).json({ error: 'Failed to list files' })
  }
})

app.get('/api/todo/:filename', async (req, res) => {
  try {
    const content = await readFile(req.params.filename)
    res.json({ content })
  } catch {
    res.status(500).json({ error: 'Failed to read file' })
  }
})

app.post('/api/todo', async (req, res) => {
  const { name } = req.body
  if (typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'name must be a non-empty string' })
    return
  }
  try {
    const file = await createFile(name.trim())
    res.status(201).json(file)
  } catch {
    res.status(500).json({ error: 'Failed to create file' })
  }
})

app.put('/api/todo/:filename', async (req, res) => {
  const { content } = req.body
  if (typeof content !== 'string') {
    res.status(400).json({ error: 'content must be a string' })
    return
  }
  try {
    await saveFile(req.params.filename, content)
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Failed to save file' })
  }
})

app.patch('/api/todo/:filename', async (req, res) => {
  const { name } = req.body
  if (typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'name must be a non-empty string' })
    return
  }
  try {
    const result = await renameFile(req.params.filename, name.trim())
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Failed to rename file' })
  }
})
```

Replace the startup block (the `if (process.env.NODE_ENV !== 'test')` section at the bottom of the file) with:

```typescript
if (process.env.NODE_ENV !== 'test') {
  ;(async () => {
    await ensureDir()
    await ensureDefaultFile()
    startPolling(10 * 60 * 1000)
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`)
    })
  })()
}
```

- [ ] **Step 4: Run all backend tests to verify they pass**

```bash
cd backend && npm test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/index.ts backend/src/__tests__/index.test.ts
git commit -m "feat: add TODO API routes and startup initialization"
```

---

### Task 3: `useTodoFiles` hook

**Files:**
- Create: `frontend/src/hooks/useTodoFiles.ts`
- Create: `frontend/src/hooks/__tests__/useTodoFiles.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/hooks/__tests__/useTodoFiles.test.ts`:

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useTodoFiles } from '../useTodoFiles'

const FILE_LIST = [
  { filename: '2026-04-07-Alpha.txt', name: 'Alpha' },
  { filename: '2026-04-08-Beta.txt', name: 'Beta' },
]

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function mockFetch(url: string, response: unknown, ok = true) {
  vi.mocked(fetch).mockImplementation((input) => {
    if (String(input) === url) {
      return Promise.resolve({
        ok,
        json: async () => response,
      } as Response)
    }
    return Promise.resolve({ ok: true, json: async () => ({}) } as Response)
  })
}

describe('useTodoFiles', () => {
  it('fetches file list on mount and selects first file', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: 'hello' }) } as Response)

    const { result } = renderHook(() => useTodoFiles())

    await waitFor(() => expect(result.current.files).toEqual(FILE_LIST))
    expect(result.current.selectedFilename).toBe('2026-04-07-Alpha.txt')
    expect(result.current.content).toBe('hello')
  })

  it('starts with empty state before fetch resolves', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useTodoFiles())
    expect(result.current.files).toEqual([])
    expect(result.current.selectedFilename).toBeNull()
    expect(result.current.content).toBe('')
  })

  it('selectFile loads content for the given filename', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: 'alpha content' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: 'beta content' }) } as Response)

    const { result } = renderHook(() => useTodoFiles())
    await waitFor(() => expect(result.current.files).toEqual(FILE_LIST))

    await act(async () => {
      await result.current.selectFile('2026-04-08-Beta.txt')
    })

    expect(result.current.selectedFilename).toBe('2026-04-08-Beta.txt')
    expect(result.current.content).toBe('beta content')
  })

  it('createFile posts to /api/todo, prepends to files, and selects new file', async () => {
    const newFile = { filename: '2026-04-08-New.txt', name: 'New' }
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: '' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => newFile } as Response)

    const { result } = renderHook(() => useTodoFiles())
    await waitFor(() => expect(result.current.files).toEqual(FILE_LIST))

    await act(async () => {
      await result.current.createFile('New')
    })

    expect(result.current.files[0]).toEqual(newFile)
    expect(result.current.selectedFilename).toBe(newFile.filename)
    expect(result.current.content).toBe('')
  })

  it('saveFile puts content to the selected file', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: '' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)

    const { result } = renderHook(() => useTodoFiles())
    await waitFor(() => expect(result.current.selectedFilename).toBe('2026-04-07-Alpha.txt'))

    await act(async () => {
      await result.current.saveFile('new content')
    })

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/todo/2026-04-07-Alpha.txt',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ content: 'new content' }),
      })
    )
  })

  it('renameFile patches the file, updates files list and selectedFilename', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: '' }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ filename: '2026-04-07-Renamed.txt' }),
      } as Response)

    const { result } = renderHook(() => useTodoFiles())
    await waitFor(() => expect(result.current.selectedFilename).toBe('2026-04-07-Alpha.txt'))

    await act(async () => {
      await result.current.renameFile('2026-04-07-Alpha.txt', 'Renamed')
    })

    expect(result.current.selectedFilename).toBe('2026-04-07-Renamed.txt')
    expect(result.current.files[0]).toEqual({ filename: '2026-04-07-Renamed.txt', name: 'Renamed' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- --reporter=verbose useTodoFiles.test
```

Expected: FAIL — `Cannot find module '../useTodoFiles'`

- [ ] **Step 3: Create `useTodoFiles.ts`**

Create `frontend/src/hooks/useTodoFiles.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'

type TodoFile = { filename: string; name: string }

export function useTodoFiles() {
  const [files, setFiles] = useState<TodoFile[]>([])
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null)
  const [content, setContent] = useState('')

  const selectFile = useCallback(async (filename: string) => {
    setSelectedFilename(filename)
    try {
      const res = await fetch(`/api/todo/${filename}`)
      const data: { content: string } = await res.json()
      setContent(data.content)
    } catch {}
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/todo', { signal: controller.signal })
      .then((r) => r.json())
      .then((list: TodoFile[]) => {
        setFiles(list)
        if (list.length > 0) selectFile(list[0].filename)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [selectFile])

  const createFile = useCallback(async (name: string) => {
    try {
      const res = await fetch('/api/todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const newFile: TodoFile = await res.json()
      setFiles((prev) => [newFile, ...prev])
      setSelectedFilename(newFile.filename)
      setContent('')
    } catch {}
  }, [])

  const saveFile = useCallback(
    async (text: string) => {
      if (!selectedFilename) return
      try {
        await fetch(`/api/todo/${selectedFilename}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text }),
        })
      } catch {}
    },
    [selectedFilename]
  )

  const renameFile = useCallback(
    async (oldFilename: string, newName: string) => {
      try {
        const res = await fetch(`/api/todo/${oldFilename}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName }),
        })
        const { filename: newFilename }: { filename: string } = await res.json()
        setFiles((prev) =>
          prev.map((f) =>
            f.filename === oldFilename ? { filename: newFilename, name: newName } : f
          )
        )
        setSelectedFilename((prev) => (prev === oldFilename ? newFilename : prev))
      } catch {}
    },
    []
  )

  return { files, selectedFilename, content, setContent, selectFile, createFile, saveFile, renameFile }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- --reporter=verbose useTodoFiles.test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useTodoFiles.ts frontend/src/hooks/__tests__/useTodoFiles.test.ts
git commit -m "feat: add useTodoFiles hook"
```

---

### Task 4: `Todo.tsx` rewrite

**Files:**
- Modify: `frontend/src/pages/Todo.tsx`
- Modify: `frontend/src/pages/__tests__/Todo.test.tsx`

- [ ] **Step 1: Write the failing tests**

Read `frontend/src/pages/__tests__/Todo.test.tsx` first — the existing 3 tests will become invalid after the rewrite. Replace the entire file with:

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import Todo from '../Todo'

vi.mock('../../hooks/useTodoFiles', () => ({
  useTodoFiles: vi.fn(),
}))

import { useTodoFiles } from '../../hooks/useTodoFiles'

const DEFAULT_HOOK = {
  files: [
    { filename: '2026-04-07-Alpha.txt', name: 'Alpha' },
    { filename: '2026-04-08-Beta.txt', name: 'Beta' },
  ],
  selectedFilename: '2026-04-07-Alpha.txt',
  content: 'alpha content',
  setContent: vi.fn(),
  selectFile: vi.fn(),
  createFile: vi.fn(),
  saveFile: vi.fn(),
  renameFile: vi.fn(),
}

beforeEach(() => {
  vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK })
})

afterEach(() => {
  vi.clearAllMocks()
})

function renderTodo() {
  render(<MemoryRouter><Todo /></MemoryRouter>)
}

describe('Todo', () => {
  it('renders the site title as a link back to home', () => {
    renderTodo()
    const link = screen.getByRole('link', { name: "Brynjar's Online Antics" })
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders all file names in the sidebar', () => {
    renderTodo()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('shows file content in the textarea', () => {
    renderTodo()
    expect(screen.getByRole('textbox', { name: 'File content' })).toHaveValue('alpha content')
  })

  it('calls selectFile when a non-active file is clicked', () => {
    const selectFile = vi.fn()
    vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK, selectFile })
    renderTodo()
    fireEvent.click(screen.getByText('Beta'))
    expect(selectFile).toHaveBeenCalledWith('2026-04-08-Beta.txt')
  })

  it('enters rename mode when the active file is clicked', () => {
    renderTodo()
    fireEvent.click(screen.getByText('Alpha'))
    expect(screen.getByRole('textbox', { name: 'Rename file' })).toHaveValue('Alpha')
  })

  it('commits rename on Enter and calls renameFile', () => {
    const renameFile = vi.fn()
    vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK, renameFile })
    renderTodo()
    fireEvent.click(screen.getByText('Alpha'))
    const input = screen.getByRole('textbox', { name: 'Rename file' })
    fireEvent.change(input, { target: { value: 'NewName' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(renameFile).toHaveBeenCalledWith('2026-04-07-Alpha.txt', 'NewName')
  })

  it('commits rename on blur and calls renameFile', () => {
    const renameFile = vi.fn()
    vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK, renameFile })
    renderTodo()
    fireEvent.click(screen.getByText('Alpha'))
    const input = screen.getByRole('textbox', { name: 'Rename file' })
    fireEvent.change(input, { target: { value: 'NewName' } })
    fireEvent.blur(input)
    expect(renameFile).toHaveBeenCalledWith('2026-04-07-Alpha.txt', 'NewName')
  })

  it('cancels rename on Escape without calling renameFile', () => {
    const renameFile = vi.fn()
    vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK, renameFile })
    renderTodo()
    fireEvent.click(screen.getByText('Alpha'))
    const input = screen.getByRole('textbox', { name: 'Rename file' })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(renameFile).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: 'Rename file' })).not.toBeInTheDocument()
  })

  it('calls createFile with "New" when + button is clicked', () => {
    const createFile = vi.fn()
    vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK, createFile })
    renderTodo()
    fireEvent.click(screen.getByRole('button', { name: 'New file' }))
    expect(createFile).toHaveBeenCalledWith('New')
  })

  it('calls saveFile every 10 seconds while textarea is focused', () => {
    vi.useFakeTimers()
    const saveFile = vi.fn()
    vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK, saveFile })
    renderTodo()
    const textarea = screen.getByRole('textbox', { name: 'File content' })
    fireEvent.focus(textarea)
    act(() => { vi.advanceTimersByTime(10000) })
    expect(saveFile).toHaveBeenCalledTimes(1)
    act(() => { vi.advanceTimersByTime(10000) })
    expect(saveFile).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('stops autosave when textarea loses focus', () => {
    vi.useFakeTimers()
    const saveFile = vi.fn()
    vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK, saveFile })
    renderTodo()
    const textarea = screen.getByRole('textbox', { name: 'File content' })
    fireEvent.focus(textarea)
    fireEvent.blur(textarea)
    act(() => { vi.advanceTimersByTime(20000) })
    expect(saveFile).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- --reporter=verbose Todo.test
```

Expected: most tests FAIL — the stub page doesn't have the expected elements.

- [ ] **Step 3: Rewrite `Todo.tsx`**

Read `frontend/src/pages/Todo.tsx` first. Then replace the entire file with:

```tsx
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTodoFiles } from '../hooks/useTodoFiles'

export default function Todo() {
  const {
    files,
    selectedFilename,
    content,
    setContent,
    selectFile,
    createFile,
    saveFile,
    renameFile,
  } = useTodoFiles()

  const [renamingFilename, setRenamingFilename] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const contentRef = useRef(content)
  const saveFileRef = useRef(saveFile)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { contentRef.current = content }, [content])
  useEffect(() => { saveFileRef.current = saveFile }, [saveFile])

  function handleFileClick(filename: string, name: string) {
    if (filename === selectedFilename) {
      setRenamingFilename(filename)
      setRenameValue(name)
    } else {
      selectFile(filename)
    }
  }

  function handleRenameCommit(filename: string) {
    const trimmed = renameValue.trim()
    if (trimmed) renameFile(filename, trimmed)
    setRenamingFilename(null)
  }

  function handleRenameKeyDown(e: React.KeyboardEvent, filename: string) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRenameCommit(filename)
    } else if (e.key === 'Escape') {
      setRenamingFilename(null)
    }
  }

  function handleFocus() {
    intervalRef.current = setInterval(() => {
      saveFileRef.current(contentRef.current)
    }, 10000)
  }

  function handleBlur() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  return (
    <div className="h-screen flex">
      <div className="w-64 flex flex-col border-r border-gray-200 overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900 mb-3">
            <Link to="/" className="text-gray-900 no-underline hover:underline">
              Brynjar's Online Antics
            </Link>
          </h1>
          <button
            onClick={() => createFile('New')}
            className="text-xl text-gray-600 hover:text-gray-900 leading-none"
            aria-label="New file"
          >
            +
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {files.map(({ filename, name }) => (
            <div
              key={filename}
              className={`px-4 py-2 cursor-pointer text-sm ${
                filename === selectedFilename ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleFileClick(filename, name)}
            >
              {renamingFilename === filename ? (
                <input
                  className="w-full border-b border-gray-400 outline-none text-sm bg-transparent"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRenameCommit(filename)}
                  onKeyDown={(e) => handleRenameKeyDown(e, filename)}
                  aria-label="Rename file"
                  autoFocus
                />
              ) : (
                name
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <textarea
          className="flex-1 p-4 resize-none outline-none text-sm text-gray-800 font-mono"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={selectedFilename ? '' : 'Select a file to edit'}
          disabled={!selectedFilename}
          aria-label="File content"
        />
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

- [ ] **Step 5: Update CLAUDE.md to document the TODO feature**

Read `CLAUDE.md` first. In the Features section, replace the existing TODO stub bullet:

```markdown
- **TODO editor:** `/todo` page is a two-panel editor. Left sidebar lists `.txt` files from a `TODO` folder in the backend's working directory (configurable via `TODO_DIR` env var, defaults to `./TODO`). File names are formatted as `YYYY-MM-DD-<name>.txt`. Click a file to open it; click the active file to rename it inline. Right panel is a `<textarea>` with autosave every 10 seconds while focused. A `+` button creates new files. Backend API: `GET/POST /api/todo`, `GET/PUT/PATCH /api/todo/:filename`.
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Todo.tsx frontend/src/pages/__tests__/Todo.test.tsx CLAUDE.md
git commit -m "feat: implement TODO editor page with sidebar and autosave"
```
