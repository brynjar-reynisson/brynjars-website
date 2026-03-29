import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../App'

describe('App', () => {
  it('renders the page title', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: "Brynjar's Online Antics" })).toBeInTheDocument()
  })

  it('renders the VST Plugins card', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('VST Plugins')).toBeInTheDocument()
  })

  it('renders the Last Read card', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('Last Read')).toBeInTheDocument()
  })

  it('renders the About Me card', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByText('About Me')).toBeInTheDocument()
  })
})
