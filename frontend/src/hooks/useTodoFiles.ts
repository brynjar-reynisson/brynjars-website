import { useState, useEffect, useCallback } from 'react'

export type TodoFile = { filename: string; name: string }

const LAST_OPEN_KEY = 'todo_last_open'

function authHeader(): { Authorization: string } {
  return { Authorization: `Bearer ${localStorage.getItem('todo_token') ?? ''}` }
}

function resolveInitialFile(list: TodoFile[]): string {
  const stored = localStorage.getItem(LAST_OPEN_KEY)
  if (stored) {
    const match = list.find((f) => f.filename === stored)
    if (match) return match.filename
  }
  return list[0].filename
}

export function useTodoFiles() {
  const [files, setFiles] = useState<TodoFile[]>([])
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null)
  const [content, setContent] = useState('')

  const selectFile = useCallback(async (filename: string) => {
    localStorage.setItem(LAST_OPEN_KEY, filename)
    setSelectedFilename(filename)
    try {
      const res = await fetch(`/api/todo/${filename}`, {
        headers: authHeader(),
      })
      if (!res.ok) return
      const data: { content: string } = await res.json()
      setContent(data.content)
    } catch {}
  }, [])

  const loadFiles = useCallback(async () => {
    const res = await fetch('/api/todo', { headers: authHeader() }).catch(() => null)
    if (!res?.ok) return
    const list: TodoFile[] = await res.json()
    setFiles(list)
    if (list.length > 0) selectFile(resolveInitialFile(list))
  }, [selectFile])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/todo', {
      signal: controller.signal,
      headers: authHeader(),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((list: TodoFile[] | null) => {
        if (!list) return
        setFiles(list)
        if (list.length > 0) selectFile(resolveInitialFile(list))
      })
      .catch(() => {})
    return () => controller.abort()
  }, [selectFile])

  const createFile = useCallback(async (name: string) => {
    try {
      const res = await fetch('/api/todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ name }),
      })
      const newFile: TodoFile = await res.json()
      localStorage.setItem(LAST_OPEN_KEY, newFile.filename)
      setFiles((prev) => [newFile, ...prev])
      setSelectedFilename(newFile.filename)
      setContent('')
    } catch {}
  }, [])

  const saveFile = useCallback(
    async (text: string) => {
      if (!selectedFilename) return
      try {
        await fetch(`/api/todo/${selectedFilename}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({ content: text }),
        })
      } catch {}
    },
    [selectedFilename]
  )

  const renameFile = useCallback(
    async (oldFilename: string, newName: string) => {
      try {
        const res = await fetch(`/api/todo/${oldFilename}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({ name: newName }),
        })
        const { filename: newFilename }: { filename: string } = await res.json()
        if (localStorage.getItem(LAST_OPEN_KEY) === oldFilename) {
          localStorage.setItem(LAST_OPEN_KEY, newFilename)
        }
        setFiles((prev) =>
          prev.map((f) =>
            f.filename === oldFilename ? { filename: newFilename, name: newName } : f
          )
        )
        setSelectedFilename((prev) => (prev === oldFilename ? newFilename : prev))
      } catch {}
    },
    []
  )

  return { files, selectedFilename, content, setContent, selectFile, createFile, saveFile, renameFile, loadFiles }
}
