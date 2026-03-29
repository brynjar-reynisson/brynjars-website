import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NavCard from '../NavCard'

describe('NavCard', () => {
  it('renders the icon', () => {
    render(<MemoryRouter><NavCard icon="🎛" title="VST Plugins" to="#" /></MemoryRouter>)
    expect(screen.getByText('🎛')).toBeInTheDocument()
  })

  it('renders the title', () => {
    render(<MemoryRouter><NavCard icon="🎛" title="VST Plugins" to="#" /></MemoryRouter>)
    expect(screen.getByText('VST Plugins')).toBeInTheDocument()
  })

  it('renders as a link with the given to path', () => {
    render(<MemoryRouter><NavCard icon="🎛" title="VST Plugins" to="/vst" /></MemoryRouter>)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/vst')
  })
})
