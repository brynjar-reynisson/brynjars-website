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

function assertSafeFilename(s: string): void {
  if (path.basename(s) !== s) throw new Error('Invalid filename')
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
  assertSafeFilename(filename)
  return fs.readFile(path.join(getTodoDir(), filename), 'utf8')
}

export async function createFile(name: string): Promise<{ filename: string; name: string }> {
  assertSafeFilename(name)
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
  assertSafeFilename(filename)
  await fs.writeFile(path.join(getTodoDir(), filename), content, 'utf8')
}

export async function renameFile(
  oldFilename: string,
  newName: string
): Promise<{ filename: string }> {
  assertSafeFilename(oldFilename)
  assertSafeFilename(newName)
  const match = oldFilename.match(/^(\d{4}-\d{2}-\d{2})-/)
  if (!match) throw new Error('Invalid filename')
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
