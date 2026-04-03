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

vi.mock('../lastReadCache', () => ({
  getCache: vi.fn(),
  startPolling: vi.fn(),
}))

import * as ollamaModule from 'ollama'
import { getCache } from '../lastReadCache'
import request from 'supertest'
import { app } from '../index'

const mockChat = (ollamaModule as any).__mockChat
const mockedGetCache = vi.mocked(getCache)

beforeEach(() => {
  mockChat.mockReset()
  mockedGetCache.mockReset()
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
  it('returns 503 with pending: true when cache is null', async () => {
    mockedGetCache.mockReturnValue(null)
    const res = await request(app).get('/api/last-read')
    expect(res.status).toBe(503)
    expect(res.body).toEqual({ pending: true })
  })

  it('returns cached data when cache is populated', async () => {
    mockedGetCache.mockReturnValue(MOCK_DATA)
    const res = await request(app).get('/api/last-read')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(MOCK_DATA)
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
    mockChat.mockReturnValue(
      (async function* () {
        yield { message: { content: 'Hello' } }
        yield { message: { content: ' world' } }
      })()
    )

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
