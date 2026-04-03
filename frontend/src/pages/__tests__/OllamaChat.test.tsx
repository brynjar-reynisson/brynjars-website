import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import OllamaChat from '../OllamaChat'

function mockStreamResponse(chunks: string[]) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })
  return Promise.resolve({ ok: true, body: stream } as Response)
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

describe('OllamaChat', () => {
  it('renders the page heading', () => {
    render(<MemoryRouter><OllamaChat /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Ollama Chat' })).toBeInTheDocument()
  })

  it('renders the site title as a link back to home', () => {
    render(<MemoryRouter><OllamaChat /></MemoryRouter>)
    const heading = screen.getByRole('heading', { name: "Brynjar's Online Antics" })
    expect(heading.closest('a')).toHaveAttribute('href', '/')
  })

  it('renders a textarea and Send button', () => {
    render(<MemoryRouter><OllamaChat /></MemoryRouter>)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })

  it('shows user message and streamed assistant reply after sending', async () => {
    vi.mocked(fetch).mockReturnValue(mockStreamResponse(['The sky ', 'is blue.']))

    render(<MemoryRouter><OllamaChat /></MemoryRouter>)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Why is the sky blue?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => expect(screen.getByText('Why is the sky blue?')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText(/The sky is blue/)).toBeInTheDocument())
  })

  it('clears the input after sending', async () => {
    vi.mocked(fetch).mockReturnValue(mockStreamResponse(['ok']))

    render(<MemoryRouter><OllamaChat /></MemoryRouter>)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => expect(textarea).toHaveValue(''))
  })

  it('sends on Enter key', async () => {
    vi.mocked(fetch).mockReturnValue(mockStreamResponse(['ok']))

    render(<MemoryRouter><OllamaChat /></MemoryRouter>)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledOnce())
  })

  it('does not send on Shift+Enter', () => {
    render(<MemoryRouter><OllamaChat /></MemoryRouter>)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('disables Send button while streaming', async () => {
    let resolveStream!: () => void
    const pendingStream = new Promise<Response>((resolve) => {
      resolveStream = () => {
        const stream = new ReadableStream({ start(c) { c.close() } })
        resolve({ ok: true, body: stream } as Response)
      }
    })
    vi.mocked(fetch).mockReturnValue(pendingStream)

    render(<MemoryRouter><OllamaChat /></MemoryRouter>)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled())

    resolveStream()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled())
  })

  it('shows error message when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    render(<MemoryRouter><OllamaChat /></MemoryRouter>)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(screen.getByText('Error: could not reach Ollama')).toBeInTheDocument()
    )
  })
})
