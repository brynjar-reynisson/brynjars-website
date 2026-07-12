import { Link } from 'react-router-dom'
import ReadingCard from '../components/ReadingCard'
import type { ReadingEntry } from '../components/ReadingCard'
// import { useEffect, useState } from 'react'

// School is out for the summer, so live polling of /api/last-read (which
// shells out to the Python reading tracker) is temporarily disabled below.
// These are the final stats from the last day of school. Re-enable the
// commented-out fetch logic and remove STATIC_ENTRIES once school resumes.
const STATIC_ENTRIES: ReadingEntry[] = [
  {
    name: 'Viktor Daði',
    pages: '99-100',
    weekday_english: 'Sunday',
    weekday_icelandic: 'Sunnudagur',
  },
  {
    name: 'Alexander Leó',
    pages: '210-211',
    weekday_english: 'Sunday',
    weekday_icelandic: 'Sunnudagur',
  },
]

export default function LastRead() {
  // const [entries, setEntries] = useState<ReadingEntry[] | null>(null)
  // const [error, setError] = useState(false)
  // const [pending, setPending] = useState(false)

  // useEffect(() => {
  //   let retryTimer: ReturnType<typeof setTimeout> | null = null
  //
  //   function fetchData() {
  //     fetch('/api/last-read')
  //       .then(async (res) => {
  //         if (res.status === 503) {
  //           const body = await res.json()
  //           if (body.pending) {
  //             setPending(true)
  //             retryTimer = setTimeout(fetchData, 3000)
  //             return
  //           }
  //         }
  //         if (!res.ok) throw new Error('Failed')
  //         setPending(false)
  //         const data: ReadingEntry[] = await res.json()
  //         setEntries(data)
  //       })
  //       .catch(() => setError(true))
  //   }
  //
  //   fetchData()
  //
  //   return () => {
  //     if (retryTimer !== null) clearTimeout(retryTimer)
  //   }
  // }, [])

  // Original render used `error`/`pending`/`entries` state from the fetch
  // above; while polling is disabled we render STATIC_ENTRIES directly.
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-10 px-4">
      <Link to="/" className="text-gray-900 no-underline hover:underline">
        <h1 className="text-4xl font-bold text-gray-900">Brynjar's Online Antics</h1>
      </Link>
      <div className="flex flex-col md:flex-row gap-6">
        {STATIC_ENTRIES.map((entry) => (
          <ReadingCard key={entry.name} entry={entry} />
        ))}
      </div>
    </div>
  )
}
