import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('ollama', () => {
  const mockChat = vi.fn()
  const mockList = vi.fn()
  return {
    Ollama: class {
      chat = mockChat
      list = mockList
    },
    __mockChat: mockChat,
    __mockList: mockList,
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
const mockList = (ollamaModule as any).__mockList
const mockedGetCache = vi.mocked(getCache)

beforeEach(() => {
  mockChat.mockReset()
  mockList.mockReset()
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

function stubChatResponse() {
  mockChat.mockReturnValue(
    (async function* () {
      yield { message: { content: 'hi' } }
    })()
  )
}

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

  it('returns 400 when model is not a string', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Hi' }], model: 42 })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'model must be a string' })
  })

  it('uses the provided model when given in the request body', async () => {
    stubChatResponse()

    await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Hi' }], model: 'mistral' })

    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'mistral' })
    )
  })

  it('falls back to OLLAMA_MODEL env default when model is absent', async () => {
    stubChatResponse()

    await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Hi' }] })

    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'llama3.2' })
    )
  })
})

describe('GET /api/models', () => {
  it('returns model names sorted alphabetically', async () => {
    mockList.mockResolvedValue({
      models: [{ name: 'mistral' }, { name: 'codellama' }, { name: 'llama3.2' }],
    })

    const res = await request(app).get('/api/models')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(['codellama', 'llama3.2', 'mistral'])
  })

  it('returns 500 when ollama list throws', async () => {
    mockList.mockRejectedValue(new Error('connection refused'))

    const res = await request(app).get('/api/models')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to connect to Ollama' })
  })
})
