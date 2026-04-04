import { useState, useEffect, useCallback } from 'react'

const COOKIE_NAME = 'ollama_model'

function readCookie(): string | null {
  const match = document.cookie.split('; ').find(c => c.startsWith(COOKIE_NAME + '='))
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null
}

function writeCookie(value: string) {
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`
}

function deleteCookie() {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`
}

export function useOllamaSettings() {
  const [models, setModels] = useState<string[]>([])
  const [model, setModelState] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/models', { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((list: string[]) => {
        setModels(list)
        const saved = readCookie()
        if (saved && list.includes(saved)) {
          setModelState(saved)
        } else {
          if (saved) deleteCookie()
          setModelState(null)
        }
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const setModel = useCallback((name: string | null) => {
    if (name === null) {
      deleteCookie()
      setModelState(null)
    } else {
      writeCookie(name)
      setModelState(name)
    }
  }, [])

  return { model, setModel, models }
}
