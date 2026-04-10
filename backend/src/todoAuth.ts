import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import * as argon2 from 'argon2';

/**
 * OWASP 2024 Recommended Minimums:
 * - memoryCost: 19456 (19 MiB)
 * - timeCost: 2 iterations
 * - parallelism: 1
 */
const hashOptions: argon2.Options = {
  type: argon2.argon2id, // Hybrid mode resistant to GPU/side-channel attacks
  memoryCost: 2 ** 16,   // 64 MiB
  timeCost: 3,           // 3 iterations
  parallelism: 4         // Number of threads
};

function getSessionPath(): string {
  return path.join(process.env.TODO_DIR ?? './TODO', '.session')
}

export async function verifyPassword(_password: string): Promise<boolean> {
  const hashed = process.env.HASHED_PASSWORD
  if (!hashed) {
    return false
  }
  return await argon2.verify(hashed, _password);
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
