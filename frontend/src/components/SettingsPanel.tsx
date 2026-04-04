import { useEffect } from 'react'

export interface SettingsPanelProps {
  model: string | null
  setModel: (m: string | null) => void
  models: string[]
  isOpen: boolean
  onClose: () => void
}

export default function SettingsPanel({ model, setModel, models, isOpen, onClose }: SettingsPanelProps) {
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        data-testid="settings-backdrop"
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Settings"
        aria-modal="true"
        className="fixed top-0 right-0 h-full w-72 bg-white shadow-lg z-50"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 text-xl leading-none"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <select
            id="model-select"
            aria-label="Model"
            value={model ?? ''}
            onChange={e => setModel(e.target.value || null)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">Default</option>
            {models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  )
}
