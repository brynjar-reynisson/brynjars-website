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
