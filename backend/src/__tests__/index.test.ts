import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('child_process')

import { execFile, type ExecFileException } from 'child_process'
import request from 'supertest'
import { app } from '../index'

const mockedExecFile = vi.mocked(execFile)

type ExecFileCallback = (err: ExecFileException | null, stdout: string, stderr: string) => void

function mockExecFile(err: ExecFileException | null, stdout: string): void {
  mockedExecFile.mockImplementation((_f, _a, _o, cb) => {
    (cb as ExecFileCallback)(err, stdout, '')
    return undefined as any
  })
}

beforeEach(() => {
  mockedExecFile.mockReset()
})

const MOCK_DATA = [
  {
    name: 'Viktor',
    pages: '23-24',
    weekday_english: 'Thursday',
    weekday_icelandic: 'Fimmtudagur',
  },
]

describe('GET /api/last-read', () => {
  it('returns parsed JSON from the python script', async () => {
    mockExecFile(null, JSON.stringify(MOCK_DATA))

    const res = await request(app).get('/api/last-read')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(MOCK_DATA)
  })

  it('returns 500 when the script exits with an error', async () => {
    mockExecFile(new Error('script failed') as ExecFileException, '')

    const res = await request(app).get('/api/last-read')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to fetch reading data' })
  })

  it('returns 500 when stdout is not valid JSON', async () => {
    mockExecFile(null, 'not valid json')

    const res = await request(app).get('/api/last-read')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to fetch reading data' })
  })
})
