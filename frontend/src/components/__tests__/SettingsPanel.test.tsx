import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SettingsPanel from '../SettingsPanel'

const defaultProps = {
  model: null as string | null,
  setModel: vi.fn(),
  models: ['llama3.2', 'mistral'],
  isOpen: false,
  onClose: vi.fn(),
}

beforeEach(() => {
  defaultProps.setModel.mockReset()
  defaultProps.onClose.mockReset()
})

describe('SettingsPanel', () => {
  it('does not show the dialog when closed', () => {
    render(<SettingsPanel {...defaultProps} isOpen={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the dialog when open', () => {
    render(<SettingsPanel {...defaultProps} isOpen={true} />)
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<SettingsPanel {...defaultProps} isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close settings' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<SettingsPanel {...defaultProps} isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('settings-backdrop'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows Default option and all models in the select', () => {
    render(<SettingsPanel {...defaultProps} isOpen={true} />)
    expect(screen.getByRole('option', { name: 'Default' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'llama3.2' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'mistral' })).toBeInTheDocument()
  })

  it('selects the Default option when model is null', () => {
    render(<SettingsPanel {...defaultProps} isOpen={true} model={null} />)
    expect(screen.getByRole('combobox', { name: 'Model' })).toHaveValue('')
  })

  it('reflects the current model in the select', () => {
    render(<SettingsPanel {...defaultProps} isOpen={true} model="mistral" />)
    expect(screen.getByRole('combobox', { name: 'Model' })).toHaveValue('mistral')
  })

  it('calls setModel with the name when a model is selected', () => {
    const setModel = vi.fn()
    render(<SettingsPanel {...defaultProps} isOpen={true} setModel={setModel} />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Model' }), { target: { value: 'mistral' } })
    expect(setModel).toHaveBeenCalledWith('mistral')
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<SettingsPanel {...defaultProps} isOpen={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls setModel(null) when Default is selected', () => {
    const setModel = vi.fn()
    render(<SettingsPanel {...defaultProps} isOpen={true} model="mistral" setModel={setModel} />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Model' }), { target: { value: '' } })
    expect(setModel).toHaveBeenCalledWith(null)
  })
})
