import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ReadingCard from '../components/ReadingCard'
import type { ReadingEntry } from '../components/ReadingCard'

export default function LastRead() {
  const [entries, setEntries] = useState<ReadingEntry[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/last-read')
      .then((res) => {
        if (!res.ok) throw new Error('Failed')
        return res.json()
      })
      .then((data: ReadingEntry[]) => setEntries(data))
      .catch(() => setError(true))
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-10 px-4">
      <Link to="/" className="text-gray-900 no-underline hover:underline">
        <h1 className="text-4xl font-bold text-gray-900">Brynjar's Online Antics</h1>
      </Link>
      {error && <p className="text-gray-500">Could not load reading data.</p>}
      {!error && entries === null && <p className="text-gray-500">Loading...</p>}
      {entries && (
        <div className="flex flex-col md:flex-row gap-6">
          {entries.map((entry) => (
            <ReadingCard key={entry.name} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
