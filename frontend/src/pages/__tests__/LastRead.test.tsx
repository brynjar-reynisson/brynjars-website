import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, beforeEach, describe, it, expect } from 'vitest'
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

describe('LastRead', () => {
  it('renders the site title as a link back to home', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_ENTRIES,
    } as Response)

    render(<MemoryRouter><LastRead /></MemoryRouter>)
    const heading = screen.getByRole('heading', { name: "Brynjar's Online Antics" })
    expect(heading).toBeInTheDocument()
    expect(heading.closest('a')).toHaveAttribute('href', '/')
  })

  it('shows loading state before fetch resolves', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    render(<MemoryRouter><LastRead /></MemoryRouter>)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders a card for each entry after fetch succeeds', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_ENTRIES,
    } as Response)

    render(<MemoryRouter><LastRead /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Viktor')).toBeInTheDocument())
    expect(screen.getByText('Alexander')).toBeInTheDocument()
  })

  it('shows error message when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    render(<MemoryRouter><LastRead /></MemoryRouter>)
    await waitFor(() =>
      expect(screen.getByText('Could not load reading data.')).toBeInTheDocument()
    )
  })
})
