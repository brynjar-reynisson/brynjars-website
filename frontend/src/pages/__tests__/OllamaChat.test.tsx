import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import OllamaChat from '../OllamaChat'

describe('OllamaChat', () => {
  it('renders the page heading', () => {
    render(<MemoryRouter><OllamaChat /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Ollama Chat' })).toBeInTheDocument()
  })

  it('renders the site title as a link back to home', () => {
    render(<MemoryRouter><OllamaChat /></MemoryRouter>)
    const heading = screen.getByRole('heading', { name: "Brynjar's Online Antics" })
    expect(heading).toBeInTheDocument()
    expect(heading.closest('a')).toHaveAttribute('href', '/')
  })
})
