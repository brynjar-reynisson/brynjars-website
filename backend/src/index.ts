import express from 'express'
import cors from 'cors'
import { execFile } from 'child_process'

const app = express()
const PORT = process.env.PORT ?? 3001
const LAST_READ_DIR =
  process.env.LAST_READ_DIR ?? 'C:\\Users\\Lenovo\\misc_projects\\last-read'

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }))

app.get('/api/last-read', (_req, res) => {
  execFile('python', ['last_read.py', '--json'], { cwd: LAST_READ_DIR }, (error, stdout) => {
    if (error) {
      res.status(500).json({ error: 'Failed to fetch reading data' })
      return
    }
    try {
      const data = JSON.parse(stdout)
      res.json(data)
    } catch {
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
