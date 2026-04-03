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
