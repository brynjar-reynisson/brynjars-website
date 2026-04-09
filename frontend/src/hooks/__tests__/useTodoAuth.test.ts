import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTodoAuth } from '../useTodoAuth'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useTodoAuth', () => {
  it('sets isChecking=false and isAuthenticated=false immediately when no token in localStorage', async () => {
    const { result } = renderHook(() => useTodoAuth())
    await waitFor(() => expect(result.current.isChecking).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('validates stored token on mount and sets isAuthenticated=true when valid', async () => {
    localStorage.setItem('todo_token', 'my-token')
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true }),
    } as Response)

    const { result } = renderHook(() => useTodoAuth())
    await waitFor(() => expect(result.current.isChecking).toBe(false))

    expect(result.current.isAuthenticated).toBe(true)
    expect(vi.mocked(fetch)).toHaveBeenCalledWith('/api/todo/auth', {
      headers: { Authorization: 'Bearer my-token' },
    })
  })

  it('sets isAuthenticated=false when stored token is invalid', async () => {
    localStorage.setItem('todo_token', 'bad-token')
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ valid: false }),
    } as Response)

    const { result } = renderHook(() => useTodoAuth())
    await waitFor(() => expect(result.current.isChecking).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('login stores token, sets isAuthenticated=true, and returns true on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'new-token' }),
    } as Response)

    const { result } = renderHook(() => useTodoAuth())
    await waitFor(() => expect(result.current.isChecking).toBe(false))

    let loginResult!: boolean
    await act(async () => {
      loginResult = await result.current.login('mypassword')
    })

    expect(loginResult).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('todo_token')).toBe('new-token')
    expect(vi.mocked(fetch)).toHaveBeenCalledWith('/api/todo/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'mypassword' }),
    })
  })

  it('login returns false and does not set isAuthenticated on 401', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
    } as Response)

    const { result } = renderHook(() => useTodoAuth())
    await waitFor(() => expect(result.current.isChecking).toBe(false))

    let loginResult!: boolean
    await act(async () => {
      loginResult = await result.current.login('wrong')
    })

    expect(loginResult).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('todo_token')).toBeNull()
  })

  it('login returns false on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useTodoAuth())
    await waitFor(() => expect(result.current.isChecking).toBe(false))

    let loginResult!: boolean
    await act(async () => {
      loginResult = await result.current.login('any')
    })

    expect(loginResult).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('logout clears localStorage and sets isAuthenticated=false', async () => {
    localStorage.setItem('todo_token', 'my-token')
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true }),
    } as Response)

    const { result } = renderHook(() => useTodoAuth())
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))

    act(() => { result.current.logout() })

    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('todo_token')).toBeNull()
  })
})
