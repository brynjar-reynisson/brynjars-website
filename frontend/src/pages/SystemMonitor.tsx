import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type SystemStats = {
  cpuPercent: number
  memUsedMb: number
  memTotalMb: number
}

type ProcessEntry = {
  pid: number
  name: string
  command: string
  cpu: number
  memMb: number
}

const EXCLUDED_PROCESSES = new Set(['System Idle Process', 'Memory Compression'])

// Add process names here to collapse all instances into one aggregated row
const AGGREGATED_PROCESSES = new Set(['msedge.exe', 'ollama.exe', 'Code.exe'])

type DisplayEntry = ProcessEntry & { count?: number; aggregateCommand?: string }

function aggregateProcesses(processes: ProcessEntry[]): DisplayEntry[] {
  const groups = new Map<string, DisplayEntry>()
  const result: DisplayEntry[] = []

  for (const p of processes) {
    if (AGGREGATED_PROCESSES.has(p.name)) {
      const existing = groups.get(p.name)
      if (existing) {
        existing.cpu += p.cpu
        existing.memMb += p.memMb
        existing.count = (existing.count ?? 1) + 1
      } else {
        const entry: DisplayEntry = { ...p, count: 1, aggregateCommand: p.command }
        groups.set(p.name, entry)
        result.push(entry)
      }
    } else {
      result.push(p)
    }
  }

  return result
}

function StatBar({ percent }: { percent: number }) {
  return (
    <div className="w-full bg-gray-200 rounded h-4">
      <div className="bg-blue-500 h-4 rounded" style={{ width: `${percent}%` }} />
    </div>
  )
}

function truncateName(name: string): string {
  return name.length > 20 ? name.slice(0, 17) + '...' : name
}

function Tooltip({ text, italic, children }: { text: string; italic?: boolean; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  return (
    <span
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && text && (
        <span
          className="fixed z-50 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none"
          style={{ left: pos.x + 12, top: pos.y + 12 }}
        >
          {italic ? <em>{text}</em> : text}
        </span>
      )}
    </span>
  )
}

function ProcessTable({ title, rows }: { title: string; rows: DisplayEntry[] }) {
  return (
    <div>
      <p className="text-gray-700 mb-2 font-medium">{title}</p>
      <table className="text-sm text-left text-gray-700 table-fixed w-full">
        <colgroup>
          <col style={{ width: '22ch' }} />
          <col style={{ width: '6ch' }} />
          <col style={{ width: '6ch' }} />
          <col style={{ width: '8ch' }} />
        </colgroup>
        <thead>
          <tr className="border-b border-gray-200">
            <th className="pb-1 pr-4 font-medium">Name</th>
            <th className="pb-1 pr-4 font-medium">PID</th>
            <th className="pb-1 pr-4 font-medium">CPU%</th>
            <th className="pb-1 font-medium">Mem MB</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.count != null ? p.name : p.pid} className="border-b border-gray-100">
              <td className="py-1 pr-4">
                <Tooltip
                  text={p.count != null ? (p.aggregateCommand ?? '') : (p.command !== p.name ? p.command : '')}
                  italic={p.count != null}
                >
                  {truncateName(p.name)}{p.count != null ? ` (${p.count})` : ''}
                </Tooltip>
              </td>
              <td className="py-1 pr-4">{p.count != null ? '—' : p.pid}</td>
              <td className="py-1 pr-4">{p.cpu.toFixed(1)}</td>
              <td className="py-1">{p.memMb.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SystemMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [error, setError] = useState(false)
  const [processes, setProcesses] = useState<ProcessEntry[]>([])

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

      fetch('/api/processes')
        .then((res) => {
          if (!res.ok) throw new Error('Failed')
          return res.json()
        })
        .then((data: ProcessEntry[]) => setProcesses(data))
        .catch(() => {})
    }

    fetchStats()
    const id = setInterval(fetchStats, 10000)
    return () => clearInterval(id)
  }, [])

  const memPercent = stats ? Math.round((stats.memUsedMb / stats.memTotalMb) * 100) : 0
  const visible = aggregateProcesses(processes.filter((p) => !EXCLUDED_PROCESSES.has(p.name)))
  const topCpu = [...visible].sort((a, b) => b.cpu - a.cpu).slice(0, 10)
  const topMem = [...visible].sort((a, b) => b.memMb - a.memMb).slice(0, 10)

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
          {processes.length > 0 && (
            <div className="flex gap-8 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <ProcessTable title="Top CPU" rows={topCpu} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <ProcessTable title="Top Memory" rows={topMem} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
