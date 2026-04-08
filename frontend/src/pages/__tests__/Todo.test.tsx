import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import Todo from '../Todo'

describe('Todo', () => {
  beforeEach(() => {
    render(<MemoryRouter><Todo /></MemoryRouter>)
  })

  it('renders the site title as a link back to home', () => {
    const heading = screen.getByRole('heading', { name: "Brynjar's Online Antics" })
    expect(heading).toBeInTheDocument()
    expect(heading.querySelector('a')).toHaveAttribute('href', '/')
  })

  it('renders the TODO heading', () => {
    expect(screen.getByRole('heading', { name: 'TODO' })).toBeInTheDocument()
  })

  it('renders a coming soon message', () => {
    expect(screen.getByText('Coming soon.')).toBeInTheDocument()
  })
})
