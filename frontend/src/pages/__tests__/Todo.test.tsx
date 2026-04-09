import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import Todo from '../Todo'

vi.mock('../../hooks/useTodoFiles', () => ({
  useTodoFiles: vi.fn(),
}))

import { useTodoFiles } from '../../hooks/useTodoFiles'

const DEFAULT_HOOK = {
  files: [
    { filename: '2026-04-07-Alpha.txt', name: 'Alpha' },
    { filename: '2026-04-08-Beta.txt', name: 'Beta' },
  ],
  selectedFilename: '2026-04-07-Alpha.txt',
  content: 'alpha content',
  setContent: vi.fn(),
  selectFile: vi.fn(),
  createFile: vi.fn(),
  saveFile: vi.fn(),
  renameFile: vi.fn(),
}

beforeEach(() => {
  vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK })
})

afterEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

function renderTodo() {
  render(<MemoryRouter><Todo /></MemoryRouter>)
}

describe('Todo', () => {
  it('renders the site title as a link back to home', () => {
    renderTodo()
    const link = screen.getByRole('link', { name: "Brynjar's Online Antics" })
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders all file names in the sidebar', () => {
    renderTodo()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('shows file content in the textarea', () => {
    renderTodo()
    expect(screen.getByRole('textbox', { name: 'File content' })).toHaveValue('alpha content')
  })

  it('calls selectFile when a non-active file is clicked', () => {
    const selectFile = vi.fn()
    vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK, selectFile })
    renderTodo()
    fireEvent.click(screen.getByText('Beta'))
    expect(selectFile).toHaveBeenCalledWith('2026-04-08-Beta.txt')
  })

  it('enters rename mode when the active file is clicked', () => {
    renderTodo()
    fireEvent.click(screen.getByText('Alpha'))
    expect(screen.getByRole('textbox', { name: 'Rename file' })).toHaveValue('Alpha')
  })

  it('commits rename on Enter and calls renameFile', () => {
    const renameFile = vi.fn()
    vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK, renameFile })
    renderTodo()
    fireEvent.click(screen.getByText('Alpha'))
    const input = screen.getByRole('textbox', { name: 'Rename file' })
    fireEvent.change(input, { target: { value: 'NewName' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(renameFile).toHaveBeenCalledWith('2026-04-07-Alpha.txt', 'NewName')
  })

  it('commits rename on blur and calls renameFile', () => {
    const renameFile = vi.fn()
    vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK, renameFile })
    renderTodo()
    fireEvent.click(screen.getByText('Alpha'))
    const input = screen.getByRole('textbox', { name: 'Rename file' })
    fireEvent.change(input, { target: { value: 'NewName' } })
    fireEvent.blur(input)
    expect(renameFile).toHaveBeenCalledWith('2026-04-07-Alpha.txt', 'NewName')
  })

  it('cancels rename on Escape without calling renameFile', () => {
    const renameFile = vi.fn()
    vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK, renameFile })
    renderTodo()
    fireEvent.click(screen.getByText('Alpha'))
    const input = screen.getByRole('textbox', { name: 'Rename file' })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(renameFile).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: 'Rename file' })).not.toBeInTheDocument()
  })

  it('calls createFile with "New" when + button is clicked', () => {
    const createFile = vi.fn()
    vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK, createFile })
    renderTodo()
    fireEvent.click(screen.getByRole('button', { name: 'New file' }))
    expect(createFile).toHaveBeenCalledWith('New')
  })

  it('calls saveFile every 10 seconds while textarea is focused', () => {
    vi.useFakeTimers()
    const saveFile = vi.fn()
    vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK, saveFile })
    renderTodo()
    const textarea = screen.getByRole('textbox', { name: 'File content' })
    fireEvent.focus(textarea)
    act(() => { vi.advanceTimersByTime(10000) })
    expect(saveFile).toHaveBeenCalledTimes(1)
    expect(saveFile).toHaveBeenCalledWith('alpha content')
    act(() => { vi.advanceTimersByTime(10000) })
    expect(saveFile).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('stops autosave when textarea loses focus', () => {
    vi.useFakeTimers()
    const saveFile = vi.fn()
    vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK, saveFile })
    renderTodo()
    const textarea = screen.getByRole('textbox', { name: 'File content' })
    fireEvent.focus(textarea)
    fireEvent.blur(textarea)
    act(() => { vi.advanceTimersByTime(20000) })
    expect(saveFile).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
