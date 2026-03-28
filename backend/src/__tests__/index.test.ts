import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('child_process')

import { execFile } from 'child_process'
import request from 'supertest'
import { app } from '../index'

const mockedExecFile = vi.mocked(execFile)

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
    mockedExecFile.mockImplementation((_f: any, _a: any, _o: any, cb: any) => {
      cb(null, JSON.stringify(MOCK_DATA), '')
      return undefined as any
    })

    const res = await request(app).get('/api/last-read')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(MOCK_DATA)
  })

  it('returns 500 when the script exits with an error', async () => {
    mockedExecFile.mockImplementation((_f: any, _a: any, _o: any, cb: any) => {
      cb(new Error('script failed'), '', '')
      return undefined as any
    })

    const res = await request(app).get('/api/last-read')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to fetch reading data' })
  })

  it('returns 500 when stdout is not valid JSON', async () => {
    mockedExecFile.mockImplementation((_f: any, _a: any, _o: any, cb: any) => {
      cb(null, 'not valid json', '')
      return undefined as any
    })

    const res = await request(app).get('/api/last-read')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to fetch reading data' })
  })
})
