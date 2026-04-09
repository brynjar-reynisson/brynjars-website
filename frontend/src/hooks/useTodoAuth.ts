import { useState, useEffect, useCallback } from 'react'

export function useTodoAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('todo_token')
    if (!token) {
      setIsChecking(false)
      return
    }
    fetch('/api/todo/auth', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(({ valid }: { valid: boolean }) => {
        setIsAuthenticated(valid)
      })
      .catch(() => {})
      .finally(() => {
        setIsChecking(false)
      })
  }, [])

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/todo/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) return false
      const { token }: { token: string } = await res.json()
      localStorage.setItem('todo_token', token)
      setIsAuthenticated(true)
      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('todo_token')
    setIsAuthenticated(false)
  }, [])

  return { isAuthenticated, isChecking, login, logout }
}
