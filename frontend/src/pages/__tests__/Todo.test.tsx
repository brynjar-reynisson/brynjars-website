import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Todo from '../Todo'

describe('Todo', () => {
  it('renders the site title as a link back to home', () => {
    render(<MemoryRouter><Todo /></MemoryRouter>)
    const heading = screen.getByRole('heading', { name: "Brynjar's Online Antics" })
    expect(heading).toBeInTheDocument()
    expect(heading.closest('a')).toHaveAttribute('href', '/')
  })

  it('renders the TODO heading', () => {
    render(<MemoryRouter><Todo /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'TODO' })).toBeInTheDocument()
  })

  it('renders a coming soon message', () => {
    render(<MemoryRouter><Todo /></MemoryRouter>)
    expect(screen.getByText('Coming soon.')).toBeInTheDocument()
  })
})
