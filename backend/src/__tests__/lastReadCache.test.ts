import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('child_process')

import { execFile, type ExecFileException } from 'child_process'
import { getCache, populate, startPolling, _resetForTest } from '../lastReadCache'

const mockedExecFile = vi.mocked(execFile)

type ExecFileCallback = (err: ExecFileException | null, stdout: string, stderr: string) => void

function mockExecFile(err: ExecFileException | null, stdout: string): void {
  mockedExecFile.mockImplementation((_f, _a, _o, cb) => {
    ;(cb as ExecFileCallback)(err, stdout, '')
    return undefined as any
  })
}

beforeEach(() => {
  mockedExecFile.mockReset()
  _resetForTest()
})

const MOCK_DATA = [
  {
    name: 'Viktor',
    pages: '23-24',
    weekday_english: 'Thursday',
    weekday_icelandic: 'Fimmtudagur',
  },
]

describe('getCache', () => {
  it('returns null before any populate call', () => {
    expect(getCache()).toBeNull()
  })
})

describe('populate', () => {
  it('sets cache on successful script execution', async () => {
    mockExecFile(null, JSON.stringify(MOCK_DATA))
    await populate()
    expect(getCache()).toEqual(MOCK_DATA)
  })

  it('leaves cache as null when script exits with an error', async () => {
    mockExecFile(new Error('script failed') as ExecFileException, '')
    await populate()
    expect(getCache()).toBeNull()
  })

  it('leaves cache as null when stdout is not valid JSON', async () => {
    mockExecFile(null, 'not valid json')
    await populate()
    expect(getCache()).toBeNull()
  })
})

describe('startPolling', () => {
  it('calls populate immediately', () => {
    vi.useFakeTimers()
    mockExecFile(null, JSON.stringify(MOCK_DATA))
    startPolling(60000)
    expect(getCache()).toEqual(MOCK_DATA)
    vi.useRealTimers()
  })
})
