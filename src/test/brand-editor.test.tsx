import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  BrandColorField,
  BrandEditorPanel,
  BrandFontUploadField,
  BrandLogoUploadField,
  evaluateBrandPrimaryColor,
  FONT_LICENCES,
} from '../components/BrandEditor'

// `#007c91` is the compiled `neon` brand's own primary (store/src/brands.rs) —
// a real, shipped value that must clear both floors.
const NEON_PRIMARY = '#007c91'
// A near-white value: it can still pick a readable on-primary ink, but all but
// disappears against the page ground it also has to clear (ENG-629).
const TOO_PALE = '#fefefe'

describe('evaluateBrandPrimaryColor', () => {
  it('accepts a colour that clears both floors', () => {
    const result = evaluateBrandPrimaryColor(NEON_PRIMARY)
    expect(result.valid).toBe(true)
    expect(result.inkContrast).toBeGreaterThanOrEqual(4.5)
    expect(result.groundContrast).toBeGreaterThanOrEqual(3)
  })

  it('refuses a value that is not a 6-digit hex colour', () => {
    const result = evaluateBrandPrimaryColor('not-a-colour')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('not a 6-digit hex colour')
  })

  it('refuses a pale colour and names the actual ground ratio', () => {
    const result = evaluateBrandPrimaryColor(TOO_PALE)
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/page ground/)
    expect(result.reason).toContain(result.groundContrast.toFixed(2))
  })

  it('picks the ink that reads better, deterministically', () => {
    // A dark, saturated primary should read against a light ink.
    const dark = evaluateBrandPrimaryColor('#123456')
    expect(dark.ink).toBe('light')
  })
})

describe('BrandColorField', () => {
  it('surfaces the refusal inline, before any submit', () => {
    const onChange = vi.fn()
    render(<BrandColorField value={TOO_PALE} onChange={onChange} />)
    expect(screen.getByRole('alert')).toHaveTextContent('page ground')
  })

  it('renders no error for a colour that clears both floors', () => {
    const onChange = vi.fn()
    render(<BrandColorField value={NEON_PRIMARY} onChange={onChange} />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('reports both the raw value and the evaluation on change', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<BrandColorField value="" onChange={onChange} />)
    await user.type(screen.getByLabelText('Primary colour'), '#')
    expect(onChange).toHaveBeenCalledWith('#', expect.objectContaining({ valid: false }))
  })
})

describe('BrandFontUploadField', () => {
  it('offers exactly the closed licence list, plus "no custom font"', () => {
    render(
      <BrandFontUploadField licence="" onLicenceChange={vi.fn()} onFileChange={vi.fn()} />,
    )
    const select = screen.getByLabelText('Font licence') as HTMLSelectElement
    const optionLabels = Array.from(select.options).map((option) => option.textContent)
    for (const licence of FONT_LICENCES) {
      expect(optionLabels).toContain(licence)
    }
    expect(optionLabels).toContain('No custom font')
  })

  it('accepts only .woff2', () => {
    render(<BrandFontUploadField licence="" onLicenceChange={vi.fn()} onFileChange={vi.fn()} />)
    expect(screen.getByLabelText('Custom typeface')).toHaveAttribute('accept', '.woff2')
  })
})

describe('BrandLogoUploadField', () => {
  it('accepts only SVG or PNG', () => {
    render(<BrandLogoUploadField onFileChange={vi.fn()} />)
    expect(screen.getByLabelText('Logo')).toHaveAttribute('accept', 'image/svg+xml,image/png')
  })
})

describe('BrandEditorPanel', () => {
  it('composes all three controls with synthetic state', () => {
    render(<BrandEditorPanel />)
    // The colour field renders `required`, so its accessible label carries
    // the asterisk too — match loosely rather than the exact string.
    expect(screen.getByLabelText(/Primary colour/)).toBeInTheDocument()
    expect(screen.getByLabelText('Custom typeface')).toBeInTheDocument()
    expect(screen.getByLabelText('Font licence')).toBeInTheDocument()
    expect(screen.getByLabelText('Logo')).toBeInTheDocument()
  })

  it('never calls an API — every handler stays local, synthetic state', () => {
    const { container } = render(<BrandEditorPanel />)
    expect(container.querySelector('form')).toHaveAttribute('method', 'post')
    expect(container.querySelector('form')).not.toHaveAttribute('action')
  })
})
