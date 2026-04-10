import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import Todo from '../Todo'

vi.mock('../../hooks/useTodoFiles', () => ({
  useTodoFiles: vi.fn(),
}))

vi.mock('../../hooks/useTodoAuth', () => ({
  useTodoAuth: vi.fn(),
}))

import { useTodoFiles } from '../../hooks/useTodoFiles'
import { useTodoAuth } from '../../hooks/useTodoAuth'

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

const DEFAULT_AUTH = {
  isAuthenticated: true,
  isChecking: false,
  login: vi.fn(),
  logout: vi.fn(),
}

beforeEach(() => {
  vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK })
  vi.mocked(useTodoAuth).mockReturnValue({ ...DEFAULT_AUTH })
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

  it('renders nothing while isChecking is true', () => {
    vi.mocked(useTodoAuth).mockReturnValue({ ...DEFAULT_AUTH, isChecking: true })
    const { container } = render(<MemoryRouter><Todo /></MemoryRouter>)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows lock icon button when not authenticated', () => {
    vi.mocked(useTodoAuth).mockReturnValue({ ...DEFAULT_AUTH, isAuthenticated: false })
    renderTodo()
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
  })

  it('shows unlock icon button when authenticated', () => {
    renderTodo()
    expect(screen.getByRole('button', { name: 'Authenticated' })).toBeInTheDocument()
  })

  it('clicking lock icon reveals password input', () => {
    vi.mocked(useTodoAuth).mockReturnValue({ ...DEFAULT_AUTH, isAuthenticated: false })
    renderTodo()
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('shows error message when login fails', async () => {
    const login = vi.fn().mockResolvedValue(false)
    vi.mocked(useTodoAuth).mockReturnValue({ ...DEFAULT_AUTH, isAuthenticated: false, login })
    renderTodo()
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'OK' }))
    })
    expect(screen.getByText('Incorrect password')).toBeInTheDocument()
  })

  it('hides password input after successful login', async () => {
    const login = vi.fn().mockResolvedValue(true)
    vi.mocked(useTodoAuth).mockReturnValue({ ...DEFAULT_AUTH, isAuthenticated: false, login })
    renderTodo()
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'OK' }))
    })
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
  })

  it('textarea is readOnly when not authenticated', () => {
    vi.mocked(useTodoAuth).mockReturnValue({ ...DEFAULT_AUTH, isAuthenticated: false })
    renderTodo()
    const textarea = screen.getByRole('textbox', { name: 'File content' })
    expect(textarea).toHaveAttribute('readonly')
  })

  it('textarea is not readOnly when authenticated', () => {
    renderTodo()
    const textarea = screen.getByRole('textbox', { name: 'File content' })
    expect(textarea).not.toHaveAttribute('readonly')
  })

  it('does not enter rename mode when clicking active file while not authenticated', () => {
    vi.mocked(useTodoAuth).mockReturnValue({ ...DEFAULT_AUTH, isAuthenticated: false })
    renderTodo()
    fireEvent.click(screen.getByText('Alpha'))
    expect(screen.queryByRole('textbox', { name: 'Rename file' })).not.toBeInTheDocument()
  })

  it('does not call createFile when + is clicked while not authenticated', () => {
    const createFile = vi.fn()
    vi.mocked(useTodoFiles).mockReturnValue({ ...DEFAULT_HOOK, createFile })
    vi.mocked(useTodoAuth).mockReturnValue({ ...DEFAULT_AUTH, isAuthenticated: false })
    renderTodo()
    fireEvent.click(screen.getByRole('button', { name: 'New file' }))
    expect(createFile).not.toHaveBeenCalled()
  })
})
