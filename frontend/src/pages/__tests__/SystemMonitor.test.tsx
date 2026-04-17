import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import SystemMonitor from '../SystemMonitor'

const MOCK_STATS = { cpuPercent: 42.5, memUsedMb: 8192, memTotalMb: 16384 }

const MOCK_PROCESSES = [
  { pid: 1, name: 'chrome.exe', cpu: 15.2, memMb: 512 },
  { pid: 2, name: 'node.exe', cpu: 8.5, memMb: 350 },
  { pid: 3, name: 'code.exe', cpu: 5.1, memMb: 420 },
  { pid: 4, name: 'svchost.exe', cpu: 0.1, memMb: 900 },
]

function stubFetch() {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = input as string
    if (url === '/api/system') {
      return Promise.resolve({ ok: true, json: async () => MOCK_STATS } as Response)
    }
    return Promise.resolve({ ok: true, json: async () => MOCK_PROCESSES } as Response)
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SystemMonitor', () => {
  it('renders the site title as a link back to home', async () => {
    stubFetch()

    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )

    const heading = screen.getByRole('heading', { name: "Brynjar's Online Antics" })
    expect(heading).toBeInTheDocument()
    expect(heading.querySelector('a')).toHaveAttribute('href', '/')
  })

  it('shows loading state before fetch resolves', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders cpu percentage after fetch succeeds', async () => {
    stubFetch()

    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText(/CPU: 42\.5%/)).toBeInTheDocument())
  })

  it('renders memory usage in GB after fetch succeeds', async () => {
    stubFetch()

    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )

    // memUsedMb 8192 → 8.0 GB, memTotalMb 16384 → 16.0 GB, 50%
    await waitFor(() => expect(screen.getByText(/8\.0 \/ 16\.0 GB/)).toBeInTheDocument())
  })

  it('shows error message when fetch rejects', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )

    await waitFor(() =>
      expect(screen.getByText('Could not load system stats.')).toBeInTheDocument()
    )
  })

  it('shows error message when server returns non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)

    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )

    await waitFor(() =>
      expect(screen.getByText('Could not load system stats.')).toBeInTheDocument()
    )
  })

  it('sets up polling interval of 10 seconds', async () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval')
    stubFetch()

    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText(/CPU:/)).toBeInTheDocument())
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 10000)
    setIntervalSpy.mockRestore()
  })
})

describe('GET /api/processes — process tables', () => {
  it('renders Top CPU and Top Memory headings when processes are available', async () => {
    stubFetch()
    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByText('Top CPU')).toBeInTheDocument())
    expect(screen.getByText('Top Memory')).toBeInTheDocument()
  })

  it('renders the top CPU process name in the table', async () => {
    stubFetch()
    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )
    // chrome.exe has highest CPU (15.2)
    await waitFor(() =>
      expect(screen.getAllByText('chrome.exe').length).toBeGreaterThan(0)
    )
  })

  it('renders the top memory process name in the table', async () => {
    stubFetch()
    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )
    // svchost.exe has highest memMb (900)
    await waitFor(() =>
      expect(screen.getAllByText('svchost.exe').length).toBeGreaterThan(0)
    )
  })

  it('does not render process tables when /api/processes fetch fails', async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = input as string
      if (url === '/api/system') {
        return Promise.resolve({ ok: true, json: async () => MOCK_STATS } as Response)
      }
      return Promise.reject(new Error('Network error'))
    })
    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByText(/CPU: 42\.5%/)).toBeInTheDocument())
    expect(screen.queryByText('Top CPU')).not.toBeInTheDocument()
    expect(screen.queryByText('Top Memory')).not.toBeInTheDocument()
  })
})
