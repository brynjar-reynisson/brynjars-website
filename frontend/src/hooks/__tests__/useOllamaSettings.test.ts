import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useOllamaSettings } from '../useOllamaSettings'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  document.cookie = 'ollama_model=; expires=Thu, 01 Jan 1970 00:00:00 UTC'
})

describe('useOllamaSettings', () => {
  it('fetches models from /api/models on mount', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ['llama3.2', 'mistral'],
    } as Response)

    const { result } = renderHook(() => useOllamaSettings())

    await waitFor(() => expect(result.current.models).toEqual(['llama3.2', 'mistral']))
  })

  it('initializes model as null when no cookie', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ['llama3.2'],
    } as Response)

    const { result } = renderHook(() => useOllamaSettings())

    await waitFor(() => expect(result.current.models).toEqual(['llama3.2']))
    expect(result.current.model).toBeNull()
  })

  it('initializes model from cookie when value is in the list', async () => {
    document.cookie = 'ollama_model=mistral'
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ['llama3.2', 'mistral'],
    } as Response)

    const { result } = renderHook(() => useOllamaSettings())

    await waitFor(() => expect(result.current.model).toBe('mistral'))
  })

  it('initializes model as null when cookie value is not in list', async () => {
    document.cookie = 'ollama_model=old-model'
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ['llama3.2'],
    } as Response)

    const { result } = renderHook(() => useOllamaSettings())

    await waitFor(() => expect(result.current.models).toEqual(['llama3.2']))
    expect(result.current.model).toBeNull()
  })

  it('setModel writes cookie and updates model', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ['llama3.2', 'mistral'],
    } as Response)

    const { result } = renderHook(() => useOllamaSettings())
    await waitFor(() => expect(result.current.models.length).toBeGreaterThan(0))

    act(() => { result.current.setModel('mistral') })

    expect(result.current.model).toBe('mistral')
    expect(document.cookie).toContain('ollama_model=mistral')
  })

  it('setModel(null) removes cookie and sets model to null', async () => {
    document.cookie = 'ollama_model=mistral'
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ['llama3.2', 'mistral'],
    } as Response)

    const { result } = renderHook(() => useOllamaSettings())
    await waitFor(() => expect(result.current.model).toBe('mistral'))

    act(() => { result.current.setModel(null) })

    expect(result.current.model).toBeNull()
    expect(document.cookie).not.toContain('ollama_model=mistral')
  })

  it('keeps models empty and model null when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useOllamaSettings())

    await new Promise(r => setTimeout(r, 50))

    expect(result.current.models).toEqual([])
    expect(result.current.model).toBeNull()
  })
})
