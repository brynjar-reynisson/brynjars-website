import express from 'express'
import cors from 'cors'
import { execFile } from 'child_process'
import { Ollama } from 'ollama'

const app = express()
const PORT = process.env.PORT ?? 3001
const LAST_READ_DIR =
  process.env.LAST_READ_DIR ?? 'C:\\Users\\Lenovo\\misc_projects\\last-read'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2'

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,https://breynisson.org').split(',')
app.use(cors({ origin: ALLOWED_ORIGINS }))
app.use(express.json())

const ollama = new Ollama({ host: process.env.OLLAMA_HOST ?? 'http://localhost:11434' })

app.get('/api/last-read', (_req, res) => {
  execFile('python', ['last_read.py', '--json'], { cwd: LAST_READ_DIR, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } }, (error, stdout) => {
    if (error) {
      console.error('Python script error:', error)
      res.status(500).json({ error: 'Failed to fetch reading data' })
      return
    }
    try {
      const data = JSON.parse(stdout)
      res.json(data)
    } catch (e) {
      console.error('JSON parse error:', e)
      res.status(500).json({ error: 'Failed to fetch reading data' })
    }
  })
})

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages must be a non-empty array' })
    return
  }

  try {
    const response = await ollama.chat({
      model: OLLAMA_MODEL,
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
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`)
  })
}
