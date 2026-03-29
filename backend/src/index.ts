import express from 'express'
import cors from 'cors'
import { execFile } from 'child_process'

const app = express()
const PORT = process.env.PORT ?? 3001
const LAST_READ_DIR =
  process.env.LAST_READ_DIR ?? 'C:\\Users\\Lenovo\\misc_projects\\last-read'

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,https://breynisson.org').split(',')
app.use(cors({ origin: ALLOWED_ORIGINS }))

app.get('/api/last-read', (_req, res) => {
  execFile('python', ['last_read.py', '--json'], { cwd: LAST_READ_DIR, encoding: 'utf8' }, (error, stdout) => {
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

export { app }

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`)
  })
}
