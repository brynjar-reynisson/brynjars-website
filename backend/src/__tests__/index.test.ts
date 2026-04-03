import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('ollama', () => {
  const mockChat = vi.fn()
  return {
    Ollama: class {
      constructor() {
        this.chat = mockChat
      }
      chat: ReturnType<typeof vi.fn>
    },
    __mockChat: mockChat,
  }
})
vi.mock('child_process')

import { execFile, type ExecFileException } from 'child_process'
import * as ollamaModule from 'ollama'
import request from 'supertest'
import { app } from '../index'

const mockedExecFile = vi.mocked(execFile)
const mockChat = (ollamaModule as any).__mockChat

type ExecFileCallback = (err: ExecFileException | null, stdout: string, stderr: string) => void

function mockExecFile(err: ExecFileException | null, stdout: string): void {
  mockedExecFile.mockImplementation((_f, _a, _o, cb) => {
    (cb as ExecFileCallback)(err, stdout, '')
    return undefined as any
  })
}

beforeEach(() => {
  mockedExecFile.mockReset()
  mockChat.mockReset()
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

describe('POST /api/chat', () => {
  it('returns 400 when messages is missing', async () => {
    const res = await request(app).post('/api/chat').send({})
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'messages must be a non-empty array' })
  })

  it('returns 400 when messages is an empty array', async () => {
    const res = await request(app).post('/api/chat').send({ messages: [] })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'messages must be a non-empty array' })
  })

  it('streams response text when messages are valid', async () => {
    mockChat.mockReturnValue((async function* () {
      yield { message: { content: 'Hello' } }
      yield { message: { content: ' world' } }
    })())

    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Hi' }] })

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/plain/)
    expect(res.text).toBe('Hello world')
  })

  it('returns 500 when ollama throws', async () => {
    mockChat.mockRejectedValue(new Error('connection refused'))

    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Hi' }] })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to connect to Ollama' })
  })
})
