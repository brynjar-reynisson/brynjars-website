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

  it('renders an image icon when given a path instead of an emoji', () => {
    const { container } = render(
      <MemoryRouter><NavCard icon="/rubiks-cube.svg" title="Rubik's Cube" to="#" /></MemoryRouter>
    )
    expect(container.querySelector('img')).toHaveAttribute('src', '/rubiks-cube.svg')
  })
})
