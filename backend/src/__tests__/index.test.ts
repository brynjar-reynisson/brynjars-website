import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../todoFiles', () => ({
  ensureDir: vi.fn(),
  ensureDefaultFile: vi.fn(),
  listFiles: vi.fn(),
  readFile: vi.fn(),
  createFile: vi.fn(),
  saveFile: vi.fn(),
  renameFile: vi.fn(),
}))

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

vi.mock('../todoAuth', () => ({
  verifyPassword: vi.fn(),
  generateToken: vi.fn(),
  loadToken: vi.fn(),
  saveToken: vi.fn(),
}))

import * as ollamaModule from 'ollama'
import { getCache } from '../lastReadCache'
import request from 'supertest'
import { app } from '../index'
import * as todoFiles from '../todoFiles'
import * as todoAuth from '../todoAuth'

const mockChat = (ollamaModule as any).__mockChat
const mockList = (ollamaModule as any).__mockList
const mockedGetCache = vi.mocked(getCache)

const TOKEN = 'valid-token'
function authed(req: any) {
  return req.set('Authorization', `Bearer ${TOKEN}`)
}

beforeEach(() => {
  mockChat.mockReset()
  mockList.mockReset()
  mockedGetCache.mockReset()
  vi.mocked(todoFiles.listFiles).mockReset()
  vi.mocked(todoFiles.readFile).mockReset()
  vi.mocked(todoFiles.createFile).mockReset()
  vi.mocked(todoFiles.saveFile).mockReset()
  vi.mocked(todoFiles.renameFile).mockReset()
  vi.mocked(todoAuth.verifyPassword).mockReset()
  vi.mocked(todoAuth.generateToken).mockReset()
  vi.mocked(todoAuth.loadToken).mockReset().mockResolvedValue('valid-token')
  vi.mocked(todoAuth.saveToken).mockReset()
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

describe('GET /api/todo', () => {
  it('returns the file list', async () => {
    vi.mocked(todoFiles.listFiles).mockResolvedValue([
      { filename: '2026-04-08-TODO.txt', name: 'TODO' },
      { filename: '2026-04-08-Work.txt', name: 'Work' },
    ])
    const res = await authed(request(app).get('/api/todo'))
    expect(res.status).toBe(200)
    expect(res.body).toEqual([
      { filename: '2026-04-08-TODO.txt', name: 'TODO' },
      { filename: '2026-04-08-Work.txt', name: 'Work' },
    ])
  })

  it('returns 500 when listFiles throws', async () => {
    vi.mocked(todoFiles.listFiles).mockRejectedValue(new Error('disk error'))
    const res = await authed(request(app).get('/api/todo'))
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to list files' })
  })
})

describe('GET /api/todo/:filename', () => {
  it('returns content of the file', async () => {
    vi.mocked(todoFiles.readFile).mockResolvedValue('my note content')
    const res = await authed(request(app).get('/api/todo/2026-04-08-TODO.txt'))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ content: 'my note content' })
  })

  it('returns 500 when readFile throws', async () => {
    vi.mocked(todoFiles.readFile).mockRejectedValue(new Error('not found'))
    const res = await authed(request(app).get('/api/todo/2026-04-08-TODO.txt'))
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to read file' })
  })

  it('returns 400 when readFile throws Invalid filename', async () => {
    vi.mocked(todoFiles.readFile).mockRejectedValue(new Error('Invalid filename'))
    const res = await authed(request(app).get('/api/todo/..%2Fetc%2Fpasswd'))
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Invalid filename' })
  })
})

describe('POST /api/todo', () => {
  it('creates a file and returns filename and name', async () => {
    vi.mocked(todoFiles.createFile).mockResolvedValue({
      filename: '2026-04-08-New.txt',
      name: 'New',
    })
    const res = await authed(request(app).post('/api/todo').send({ name: 'New' }))
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ filename: '2026-04-08-New.txt', name: 'New' })
    expect(vi.mocked(todoFiles.createFile)).toHaveBeenCalledWith('New')
  })

  it('returns 400 when name is missing', async () => {
    const res = await authed(request(app).post('/api/todo').send({}))
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'name must be a non-empty string' })
  })

  it('returns 500 when createFile throws', async () => {
    vi.mocked(todoFiles.createFile).mockRejectedValue(new Error('disk error'))
    const res = await authed(request(app).post('/api/todo').send({ name: 'New' }))
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to create file' })
  })
})

describe('PUT /api/todo/:filename', () => {
  it('saves content and returns 204', async () => {
    vi.mocked(todoFiles.saveFile).mockResolvedValue()
    const res = await authed(
      request(app).put('/api/todo/2026-04-08-TODO.txt').send({ content: 'new content' })
    )
    expect(res.status).toBe(204)
    expect(vi.mocked(todoFiles.saveFile)).toHaveBeenCalledWith(
      '2026-04-08-TODO.txt',
      'new content'
    )
  })

  it('returns 400 when content is missing', async () => {
    const res = await authed(request(app).put('/api/todo/2026-04-08-TODO.txt').send({}))
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'content must be a string' })
  })

  it('returns 500 when saveFile throws', async () => {
    vi.mocked(todoFiles.saveFile).mockRejectedValue(new Error('disk error'))
    const res = await authed(
      request(app).put('/api/todo/2026-04-08-TODO.txt').send({ content: 'x' })
    )
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to save file' })
  })

  it('returns 400 when saveFile throws Invalid filename', async () => {
    vi.mocked(todoFiles.saveFile).mockRejectedValue(new Error('Invalid filename'))
    const res = await authed(
      request(app).put('/api/todo/..%2Fetc%2Fpasswd').send({ content: 'x' })
    )
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Invalid filename' })
  })
})

describe('PATCH /api/todo/:filename', () => {
  it('renames the file and returns the new filename', async () => {
    vi.mocked(todoFiles.renameFile).mockResolvedValue({ filename: '2026-04-08-NewName.txt' })
    const res = await authed(
      request(app).patch('/api/todo/2026-04-08-OldName.txt').send({ name: 'NewName' })
    )
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ filename: '2026-04-08-NewName.txt' })
    expect(vi.mocked(todoFiles.renameFile)).toHaveBeenCalledWith(
      '2026-04-08-OldName.txt',
      'NewName'
    )
  })

  it('returns 400 when name is missing', async () => {
    const res = await authed(request(app).patch('/api/todo/2026-04-08-OldName.txt').send({}))
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'name must be a non-empty string' })
  })

  it('returns 500 when renameFile throws', async () => {
    vi.mocked(todoFiles.renameFile).mockRejectedValue(new Error('disk error'))
    const res = await authed(
      request(app).patch('/api/todo/2026-04-08-OldName.txt').send({ name: 'NewName' })
    )
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to rename file' })
  })

  it('returns 400 when renameFile throws Invalid filename', async () => {
    vi.mocked(todoFiles.renameFile).mockRejectedValue(new Error('Invalid filename'))
    const res = await authed(
      request(app).patch('/api/todo/..%2Fetc%2Fpasswd').send({ name: 'NewName' })
    )
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Invalid filename' })
  })
})

describe('POST /api/todo/auth', () => {
  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/todo/auth').send({})
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'password is required' })
  })

  it('returns 400 when password is not a string', async () => {
    const res = await request(app).post('/api/todo/auth').send({ password: 42 })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'password is required' })
  })

  it('returns 401 when verifyPassword returns false', async () => {
    vi.mocked(todoAuth.verifyPassword).mockResolvedValue(false)
    const res = await request(app).post('/api/todo/auth').send({ password: 'wrong' })
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Invalid password' })
  })

  it('returns 200 with token when verifyPassword returns true', async () => {
    vi.mocked(todoAuth.verifyPassword).mockResolvedValue(true)
    vi.mocked(todoAuth.generateToken).mockReturnValue('new-token-hex')
    vi.mocked(todoAuth.saveToken).mockResolvedValue()
    const res = await request(app).post('/api/todo/auth').send({ password: 'correct' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ token: 'new-token-hex' })
    expect(vi.mocked(todoAuth.saveToken)).toHaveBeenCalledWith('new-token-hex')
  })

  it('returns 500 when verifyPassword throws', async () => {
    vi.mocked(todoAuth.verifyPassword).mockRejectedValue(new Error('argon2 error'))
    const res = await request(app).post('/api/todo/auth').send({ password: 'any' })
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Authentication failed' })
  })
})

describe('GET /api/todo/auth', () => {
  it('returns { valid: false } when no Authorization header', async () => {
    const res = await request(app).get('/api/todo/auth')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ valid: false })
  })

  it('returns { valid: true } when token matches stored token', async () => {
    vi.mocked(todoAuth.loadToken).mockResolvedValue('stored-token')
    const res = await request(app)
      .get('/api/todo/auth')
      .set('Authorization', 'Bearer stored-token')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ valid: true })
  })

  it('returns { valid: false } when token does not match', async () => {
    vi.mocked(todoAuth.loadToken).mockResolvedValue('stored-token')
    const res = await request(app)
      .get('/api/todo/auth')
      .set('Authorization', 'Bearer wrong-token')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ valid: false })
  })

  it('returns { valid: false } when no session file exists', async () => {
    vi.mocked(todoAuth.loadToken).mockResolvedValue(null)
    const res = await request(app)
      .get('/api/todo/auth')
      .set('Authorization', 'Bearer anything')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ valid: false })
  })
})

describe('requireTodoAuth middleware', () => {
  it('returns 401 on GET /api/todo without auth header', async () => {
    const res = await request(app).get('/api/todo')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 on GET /api/todo with wrong token', async () => {
    vi.mocked(todoAuth.loadToken).mockResolvedValue('valid-token')
    const res = await request(app)
      .get('/api/todo')
      .set('Authorization', 'Bearer wrong-token')
    expect(res.status).toBe(401)
  })

  it('returns 401 on GET /api/todo when no session file exists', async () => {
    vi.mocked(todoAuth.loadToken).mockResolvedValue(null)
    const res = await request(app)
      .get('/api/todo')
      .set('Authorization', 'Bearer anything')
    expect(res.status).toBe(401)
  })
})
