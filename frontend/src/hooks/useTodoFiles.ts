import { useState, useEffect, useCallback } from 'react'

export type TodoFile = { filename: string; name: string }

export function useTodoFiles() {
  const [files, setFiles] = useState<TodoFile[]>([])
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null)
  const [content, setContent] = useState('')

  const selectFile = useCallback(async (filename: string) => {
    setSelectedFilename(filename)
    try {
      const res = await fetch(`/api/todo/${filename}`)
      const data: { content: string } = await res.json()
      setContent(data.content)
    } catch {}
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/todo', { signal: controller.signal })
      .then((r) => r.json())
      .then((list: TodoFile[]) => {
        setFiles(list)
        if (list.length > 0) selectFile(list[0].filename)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [selectFile])

  const createFile = useCallback(async (name: string) => {
    try {
      const res = await fetch('/api/todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const newFile: TodoFile = await res.json()
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
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName }),
        })
        const { filename: newFilename }: { filename: string } = await res.json()
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

  return { files, selectedFilename, content, setContent, selectFile, createFile, saveFile, renameFile }
}
