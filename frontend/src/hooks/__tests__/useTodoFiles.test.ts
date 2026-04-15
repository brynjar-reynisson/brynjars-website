import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTodoFiles } from '../useTodoFiles'

const FILE_LIST = [
  { filename: '2026-04-07-Alpha.txt', name: 'Alpha' },
  { filename: '2026-04-08-Beta.txt', name: 'Beta' },
]

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('useTodoFiles', () => {
  it('fetches file list on mount and selects first file', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: 'hello' }) } as Response)

    const { result } = renderHook(() => useTodoFiles())

    await waitFor(() => expect(result.current.files).toEqual(FILE_LIST))
    expect(result.current.selectedFilename).toBe('2026-04-07-Alpha.txt')
    expect(result.current.content).toBe('hello')
  })

  it('starts with empty state before fetch resolves', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useTodoFiles())
    expect(result.current.files).toEqual([])
    expect(result.current.selectedFilename).toBeNull()
    expect(result.current.content).toBe('')
  })

  it('selectFile loads content for the given filename', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: 'alpha content' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: 'beta content' }) } as Response)

    const { result } = renderHook(() => useTodoFiles())
    await waitFor(() => expect(result.current.files).toEqual(FILE_LIST))

    await act(async () => {
      await result.current.selectFile('2026-04-08-Beta.txt')
    })

    expect(result.current.selectedFilename).toBe('2026-04-08-Beta.txt')
    expect(result.current.content).toBe('beta content')
  })

  it('createFile posts to /api/todo, prepends to files, and selects new file', async () => {
    const newFile = { filename: '2026-04-08-New.txt', name: 'New' }
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: '' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => newFile } as Response)

    const { result } = renderHook(() => useTodoFiles())
    await waitFor(() => expect(result.current.files).toEqual(FILE_LIST))

    await act(async () => {
      await result.current.createFile('New')
    })

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/todo',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'New' }),
      })
    )

    expect(result.current.files[0]).toEqual(newFile)
    expect(result.current.selectedFilename).toBe(newFile.filename)
    expect(result.current.content).toBe('')
  })

  it('saveFile puts content to the selected file', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: '' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)

    const { result } = renderHook(() => useTodoFiles())
    await waitFor(() => expect(result.current.selectedFilename).toBe('2026-04-07-Alpha.txt'))

    await act(async () => {
      await result.current.saveFile('new content')
    })

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/todo/2026-04-07-Alpha.txt',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ content: 'new content' }),
      })
    )
  })

  it('renameFile patches the file, updates files list and selectedFilename', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: '' }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ filename: '2026-04-07-Renamed.txt' }),
      } as Response)

    const { result } = renderHook(() => useTodoFiles())
    await waitFor(() => expect(result.current.selectedFilename).toBe('2026-04-07-Alpha.txt'))

    await act(async () => {
      await result.current.renameFile('2026-04-07-Alpha.txt', 'Renamed')
    })

    expect(result.current.selectedFilename).toBe('2026-04-07-Renamed.txt')
    expect(result.current.files[0]).toEqual({ filename: '2026-04-07-Renamed.txt', name: 'Renamed' })
  })

  it('includes Authorization header in list and file fetch on mount', async () => {
    localStorage.setItem('todo_token', 'test-token')
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: '' }) } as Response)

    renderHook(() => useTodoFiles())
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2))

    expect(vi.mocked(fetch)).toHaveBeenNthCalledWith(
      1,
      '/api/todo',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    )
    expect(vi.mocked(fetch)).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/todo/'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    )
  })

  it('restores last-opened file from localStorage on mount', async () => {
    localStorage.setItem('todo_last_open', '2026-04-08-Beta.txt')
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: 'beta content' }) } as Response)

    const { result } = renderHook(() => useTodoFiles())

    await waitFor(() => expect(result.current.selectedFilename).toBe('2026-04-08-Beta.txt'))
    expect(result.current.content).toBe('beta content')
  })

  it('falls back to first file when stored key is not in file list', async () => {
    localStorage.setItem('todo_last_open', 'deleted-file.txt')
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: 'alpha content' }) } as Response)

    const { result } = renderHook(() => useTodoFiles())

    await waitFor(() => expect(result.current.selectedFilename).toBe('2026-04-07-Alpha.txt'))
    expect(result.current.content).toBe('alpha content')
  })

  it('selectFile writes the selected filename to localStorage', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: '' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: 'beta content' }) } as Response)

    const { result } = renderHook(() => useTodoFiles())
    await waitFor(() => expect(result.current.files).toEqual(FILE_LIST))

    await act(async () => {
      await result.current.selectFile('2026-04-08-Beta.txt')
    })

    expect(localStorage.getItem('todo_last_open')).toBe('2026-04-08-Beta.txt')
  })

  it('createFile writes the new filename to localStorage', async () => {
    const newFile = { filename: '2026-04-09-Gamma.txt', name: 'Gamma' }
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: '' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => newFile } as Response)

    const { result } = renderHook(() => useTodoFiles())
    await waitFor(() => expect(result.current.files).toEqual(FILE_LIST))

    await act(async () => {
      await result.current.createFile('Gamma')
    })

    expect(localStorage.getItem('todo_last_open')).toBe('2026-04-09-Gamma.txt')
  })

  it('renameFile updates localStorage when the renamed file was the stored key', async () => {
    localStorage.setItem('todo_last_open', '2026-04-07-Alpha.txt')
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: '' }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ filename: '2026-04-07-Renamed.txt' }),
      } as Response)

    const { result } = renderHook(() => useTodoFiles())
    await waitFor(() => expect(result.current.selectedFilename).toBe('2026-04-07-Alpha.txt'))

    await act(async () => {
      await result.current.renameFile('2026-04-07-Alpha.txt', 'Renamed')
    })

    expect(localStorage.getItem('todo_last_open')).toBe('2026-04-07-Renamed.txt')
  })

  it('renameFile does not change localStorage when a different file is renamed', async () => {
    localStorage.setItem('todo_last_open', '2026-04-08-Beta.txt')
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => FILE_LIST } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: '' }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ filename: '2026-04-07-Renamed.txt' }),
      } as Response)

    const { result } = renderHook(() => useTodoFiles())
    await waitFor(() => expect(result.current.selectedFilename).toBe('2026-04-08-Beta.txt'))

    await act(async () => {
      await result.current.renameFile('2026-04-07-Alpha.txt', 'Renamed')
    })

    expect(localStorage.getItem('todo_last_open')).toBe('2026-04-08-Beta.txt')
  })
})
