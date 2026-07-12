import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import LastRead from '../LastRead'

const MOCK_ENTRIES = [
  {
    name: 'Viktor',
    pages: '23-24',
    weekday_english: 'Thursday',
    weekday_icelandic: 'Fimmtudagur',
  },
  {
    name: 'Alexander',
    pages: '126-127',
    weekday_english: 'Wednesday',
    weekday_icelandic: 'Miðvikudagur',
  },
]

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LastRead', () => {
  it('renders the site title as a link back to home', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => MOCK_ENTRIES,
    } as Response)

    render(
      <MemoryRouter>
        <LastRead />
      </MemoryRouter>
    )
    const heading = screen.getByRole('heading', { name: "Brynjar's Online Antics" })
    expect(heading).toBeInTheDocument()
    expect(heading.closest('a')).toHaveAttribute('href', '/')
  })

  it('renders the static reading cards while polling is disabled', () => {
    render(
      <MemoryRouter>
        <LastRead />
      </MemoryRouter>
    )
    expect(screen.getByText('Viktor Daði')).toBeInTheDocument()
    expect(screen.getByText('Alexander Leó')).toBeInTheDocument()
  })

  // The tests below cover the fetch/polling behavior in LastRead.tsx, which
  // is temporarily commented out while school is out. Re-enable these once
  // the fetch logic is restored.
  it.skip('shows loading state before fetch resolves', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    render(
      <MemoryRouter>
        <LastRead />
      </MemoryRouter>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it.skip('renders a card for each entry after fetch succeeds', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => MOCK_ENTRIES,
    } as Response)

    render(
      <MemoryRouter>
        <LastRead />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByText('Viktor')).toBeInTheDocument())
    expect(screen.getByText('Alexander')).toBeInTheDocument()
  })

  it.skip('shows error message when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    render(
      <MemoryRouter>
        <LastRead />
      </MemoryRouter>
    )
    await waitFor(() =>
      expect(screen.getByText('Could not load reading data.')).toBeInTheDocument()
    )
  })

  it.skip('shows pending message when server responds 503 with pending: true', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ pending: true }),
    } as Response)

    render(
      <MemoryRouter>
        <LastRead />
      </MemoryRouter>
    )
    await waitFor(() =>
      expect(
        screen.getByText('Loading, this may take a while…')
      ).toBeInTheDocument()
    )
  })

  it.skip('schedules a retry 3 seconds after a pending response', async () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ pending: true }),
    } as Response)

    render(
      <MemoryRouter>
        <LastRead />
      </MemoryRouter>
    )

    await waitFor(() =>
      expect(
        screen.getByText('Loading, this may take a while…')
      ).toBeInTheDocument()
    )

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000)
    setTimeoutSpy.mockRestore()
  })

  it.skip('shows error message when server responds with non-503 error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response)

    render(
      <MemoryRouter>
        <LastRead />
      </MemoryRouter>
    )
    await waitFor(() =>
      expect(screen.getByText('Could not load reading data.')).toBeInTheDocument()
    )
  })
})
