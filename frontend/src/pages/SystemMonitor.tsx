import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type SystemStats = {
  cpuPercent: number
  memUsedMb: number
  memTotalMb: number
}

function StatBar({ percent }: { percent: number }) {
  return (
    <div className="w-full bg-gray-200 rounded h-4">
      <div className="bg-blue-500 h-4 rounded" style={{ width: `${percent}%` }} />
    </div>
  )
}

export default function SystemMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    function fetchStats() {
      fetch('/api/system')
        .then((res) => {
          if (!res.ok) throw new Error('Failed')
          return res.json()
        })
        .then((data: SystemStats) => {
          setStats(data)
          setError(false)
        })
        .catch(() => setError(true))
    }

    fetchStats()
    const id = setInterval(fetchStats, 10000)
    return () => clearInterval(id)
  }, [])

  const memPercent = stats ? Math.round((stats.memUsedMb / stats.memTotalMb) * 100) : 0

  return (
    <div className="min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-10">
        <Link to="/" className="text-gray-900 no-underline hover:underline">
          Brynjar's Online Antics
        </Link>
      </h1>
      {error && <p className="text-red-500">Could not load system stats.</p>}
      {!error && !stats && <p className="text-gray-500">Loading...</p>}
      {stats && (
        <div className="flex flex-col gap-8">
          <div>
            <p className="text-gray-700 mb-2 font-medium">CPU: {stats.cpuPercent}%</p>
            <StatBar percent={stats.cpuPercent} />
          </div>
          <div>
            <p className="text-gray-700 mb-2 font-medium">
              Memory: {(stats.memUsedMb / 1024).toFixed(1)} / {(stats.memTotalMb / 1024).toFixed(1)} GB ({memPercent}%)
            </p>
            <StatBar percent={memPercent} />
          </div>
        </div>
      )}
    </div>
  )
}
