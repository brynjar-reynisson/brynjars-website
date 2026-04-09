import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('fs/promises')

import fs from 'fs/promises'
import { verifyPassword, generateToken, loadToken, saveToken } from '../todoAuth'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('verifyPassword', () => {
  it('returns false (stub implementation)', async () => {
    await expect(verifyPassword('any')).resolves.toBe(false)
  })
})

describe('generateToken', () => {
  it('returns a 64-character lowercase hex string', () => {
    const token = generateToken()
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('returns a different value each call', () => {
    expect(generateToken()).not.toBe(generateToken())
  })
})

describe('loadToken', () => {
  it('returns the token string when session file exists', async () => {
    const mockReadFile = vi.mocked(fs.readFile)
    mockReadFile.mockResolvedValue('abc123' as any)
    await expect(loadToken()).resolves.toBe('abc123')
  })

  it('returns null when session file does not exist (ENOENT)', async () => {
    const mockReadFile = vi.mocked(fs.readFile)
    const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    mockReadFile.mockRejectedValue(err)
    await expect(loadToken()).resolves.toBeNull()
  })

  it('returns null when session file cannot be read for other reasons', async () => {
    const mockReadFile = vi.mocked(fs.readFile)
    mockReadFile.mockRejectedValue(new Error('permission denied'))
    await expect(loadToken()).resolves.toBeNull()
  })

  it('reads from the path containing .session', async () => {
    const mockReadFile = vi.mocked(fs.readFile)
    mockReadFile.mockResolvedValue('tok' as any)
    await loadToken()
    expect(mockReadFile).toHaveBeenCalledWith(
      expect.stringContaining('.session'),
      'utf8'
    )
  })
})

describe('saveToken', () => {
  it('writes the token to the session file', async () => {
    const mockWriteFile = vi.mocked(fs.writeFile)
    mockWriteFile.mockResolvedValue()
    await saveToken('mytoken')
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('.session'),
      'mytoken',
      'utf8'
    )
  })
})
