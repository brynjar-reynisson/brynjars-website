import express from 'express'
import cors from 'cors'
import { Ollama } from 'ollama'
import { getCache, startPolling } from './lastReadCache'

const app = express()
const PORT = process.env.PORT ?? 3001
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2'

const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGIN ?? 'http://localhost:5173,https://breynisson.org'
).split(',')
app.use(cors({ origin: ALLOWED_ORIGINS }))
app.use(express.json())

const ollama = new Ollama({ host: process.env.OLLAMA_HOST ?? 'http://localhost:11434' })

app.get('/api/last-read', (_req, res) => {
  const data = getCache()
  if (data === null) {
    res.status(503).json({ pending: true })
    return
  }
  res.json(data)
})

app.get('/api/models', async (_req, res) => {
  try {
    const response = await ollama.list()
    const names = response.models.map((m) => m.name).sort((a, b) => a.localeCompare(b))
    res.json(names)
  } catch (error) {
    console.error('Ollama list error:', error)
    res.status(500).json({ error: 'Failed to connect to Ollama' })
  }
})

app.post('/api/chat', async (req, res) => {
  const { messages, model } = req.body
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages must be a non-empty array' })
    return
  }

  try {
    const response = await ollama.chat({
      model: model ?? OLLAMA_MODEL,
      messages,
      stream: true,
    })

    res.setHeader('Content-Type', 'text/plain')
    for await (const chunk of response) {
      res.write(chunk.message.content)
    }
    res.end()
  } catch (error) {
    console.error('Ollama chat error:', error)
    res.status(500).json({ error: 'Failed to connect to Ollama' })
  }
})

export { app }

if (process.env.NODE_ENV !== 'test') {
  startPolling(10 * 60 * 1000)
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`)
  })
}
