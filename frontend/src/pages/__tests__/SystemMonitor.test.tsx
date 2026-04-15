import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import SystemMonitor from '../SystemMonitor'

const MOCK_STATS = { cpuPercent: 42.5, memUsedMb: 8192, memTotalMb: 16384 }

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SystemMonitor', () => {
  it('renders the site title as a link back to home', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_STATS,
    } as Response)

    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )

    const heading = screen.getByRole('heading', { name: "Brynjar's Online Antics" })
    expect(heading).toBeInTheDocument()
    expect(heading.closest('a')).toHaveAttribute('href', '/')
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
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_STATS,
    } as Response)

    render(
      <MemoryRouter>
        <SystemMonitor />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText(/CPU: 42\.5%/)).toBeInTheDocument())
  })

  it('renders memory usage in GB after fetch succeeds', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_STATS,
    } as Response)

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
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_STATS,
    } as Response)

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
