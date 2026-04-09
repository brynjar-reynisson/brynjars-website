import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

function getSessionPath(): string {
  return path.join(process.env.TODO_DIR ?? './TODO', '.session')
}

export async function verifyPassword(_password: string): Promise<boolean> {
  return false
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function loadToken(): Promise<string | null> {
  try {
    return await fs.readFile(getSessionPath(), 'utf8')
  } catch {
    return null
  }
}

export async function saveToken(token: string): Promise<void> {
  await fs.writeFile(getSessionPath(), token, 'utf8')
}
