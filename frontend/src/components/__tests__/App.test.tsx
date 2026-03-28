import { render, screen } from '@testing-library/react'
import App from '../../App'

describe('App', () => {
  it('renders the page title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: "Brynjar's stuff" })).toBeInTheDocument()
  })

  it('renders the VST Plugins card', () => {
    render(<App />)
    expect(screen.getByText('VST Plugins')).toBeInTheDocument()
  })

  it('renders the Last Read card', () => {
    render(<App />)
    expect(screen.getByText('Last Read')).toBeInTheDocument()
  })

  it('renders the About Me card', () => {
    render(<App />)
    expect(screen.getByText('About Me')).toBeInTheDocument()
  })
})
