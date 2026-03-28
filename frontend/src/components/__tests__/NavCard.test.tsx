import { render, screen } from '@testing-library/react'
import NavCard from '../NavCard'

describe('NavCard', () => {
  it('renders the icon', () => {
    render(<NavCard icon="🎛" title="VST Plugins" href="#" />)
    expect(screen.getByText('🎛')).toBeInTheDocument()
  })

  it('renders the title', () => {
    render(<NavCard icon="🎛" title="VST Plugins" href="#" />)
    expect(screen.getByText('VST Plugins')).toBeInTheDocument()
  })

  it('renders as a link with the given href', () => {
    render(<NavCard icon="🎛" title="VST Plugins" href="/vst" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/vst')
  })
})
