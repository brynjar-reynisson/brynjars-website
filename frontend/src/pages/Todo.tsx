import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTodoFiles } from '../hooks/useTodoFiles'

export default function Todo() {
  const {
    files,
    selectedFilename,
    content,
    setContent,
    selectFile,
    createFile,
    saveFile,
    renameFile,
  } = useTodoFiles()

  const [renamingFilename, setRenamingFilename] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const contentRef = useRef(content)
  const saveFileRef = useRef(saveFile)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { contentRef.current = content }, [content])
  useEffect(() => { saveFileRef.current = saveFile }, [saveFile])

  function handleFileClick(filename: string, name: string) {
    if (filename === selectedFilename) {
      setRenamingFilename(filename)
      setRenameValue(name)
    } else {
      selectFile(filename)
    }
  }

  function handleRenameCommit(filename: string) {
    const trimmed = renameValue.trim()
    if (trimmed) renameFile(filename, trimmed)
    setRenamingFilename(null)
  }

  function handleRenameKeyDown(e: React.KeyboardEvent, filename: string) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRenameCommit(filename)
    } else if (e.key === 'Escape') {
      setRenamingFilename(null)
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [])

  function handleFocus() {
    if (intervalRef.current !== null) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      saveFileRef.current(contentRef.current)
    }, 10000)
  }

  function handleBlur() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  return (
    <div className="h-screen flex">
      <div className="w-64 flex flex-col border-r border-gray-200 overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900 mb-3">
            <Link to="/" className="text-gray-900 no-underline hover:underline">
              Brynjar's Online Antics
            </Link>
          </h1>
          <button
            onClick={() => createFile('New')}
            className="text-xl text-gray-600 hover:text-gray-900 leading-none"
            aria-label="New file"
          >
            +
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {files.map(({ filename, name }) => (
            <div
              key={filename}
              className={`px-4 py-2 cursor-pointer text-sm ${
                filename === selectedFilename ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleFileClick(filename, name)}
            >
              {renamingFilename === filename ? (
                <input
                  className="w-full border-b border-gray-400 outline-none text-sm bg-transparent"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRenameCommit(filename)}
                  onKeyDown={(e) => handleRenameKeyDown(e, filename)}
                  aria-label="Rename file"
                  autoFocus
                />
              ) : (
                name
              )}
            </div>
          ))}
        </div>
      </div>
      <textarea
        className="flex-1 p-4 resize-none outline-none text-sm text-gray-800 font-mono"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={selectedFilename ? '' : 'Select a file to edit'}
        disabled={!selectedFilename}
        aria-label="File content"
      />
    </div>
  )
}
