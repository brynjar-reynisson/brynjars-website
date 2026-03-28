import { render, screen } from '@testing-library/react'
import ReadingCard from '../ReadingCard'
import type { ReadingEntry } from '../ReadingCard'

const ENTRY: ReadingEntry = {
  name: 'Viktor',
  pages: '23-24',
  weekday_english: 'Thursday',
  weekday_icelandic: 'Fimmtudagur',
}

describe('ReadingCard', () => {
  it('renders the name', () => {
    render(<ReadingCard entry={ENTRY} />)
    expect(screen.getByText('Viktor')).toBeInTheDocument()
  })

  it('renders the pages', () => {
    render(<ReadingCard entry={ENTRY} />)
    expect(screen.getByText('Pages 23-24')).toBeInTheDocument()
  })

  it('renders the weekday in both languages', () => {
    render(<ReadingCard entry={ENTRY} />)
    expect(screen.getByText('Thursday · Fimmtudagur')).toBeInTheDocument()
  })

  it('is not a link', () => {
    render(<ReadingCard entry={ENTRY} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
