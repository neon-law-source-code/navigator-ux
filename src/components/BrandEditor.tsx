import { useMemo, useState, type ChangeEvent } from 'react'
import { FormCard, SelectField, TextField, type SelectOption } from './Form'

/*
 * A brand-editor panel — gallery/dev-tool leaf components, not a runtime
 * consumer-facing surface (ENG-594).
 *
 * Brand CRUD is Owner/Admin-only in Navigator (`/app/brands`) and has no
 * Project-portal consumer today. The plausible case for building a
 * colour-contrast-gate-plus-upload editor in this library specifically is
 * authoring a layer-2 brand override file — see `docs/brand-theming.md` — so
 * these are plain leaf controls that take handlers and validation results as
 * props. None of them talk to `/app/api`; a host application wires the actual
 * upload and the actual persistence.
 *
 * The colour math mirrors `store::brands::validate_primary_hex` on the
 * Navigator side (relative luminance, WCAG contrast, the two floors below).
 * `scripts/check-contrast.mjs` recomputes the same ratios for `tokens.css`,
 * but as a private build script it exposes no reusable function this
 * component could import — the duplication is intentional for now and is a
 * gap worth closing by exporting that script's math instead of copying it a
 * third time.
 */

type Rgb = readonly [number, number, number]

/** The two possible on-primary ink colours a caller's primary renders text in. */
const LIGHT_INK: Rgb = [255, 255, 255]
const DARK_INK: Rgb = [0, 0, 0]
/** The page ground every primary swatch previews against — `--nav-color-bg`'s
 * light-mode default in `tokens.css`. */
const PAGE_GROUND: Rgb = [255, 255, 255]

/** WCAG AA floor for the primary against its chosen on-primary ink. */
const MIN_INK_CONTRAST = 4.5
/** WCAG 1.4.11 floor for the primary as a non-text UI element against the page. */
const MIN_GROUND_CONTRAST = 3.0

function parseHex(value: string): Rgb | null {
  const trimmed = value.trim()
  if (trimmed.length !== 7 || trimmed[0] !== '#') return null
  const bytes: number[] = []
  for (let offset = 1; offset < 7; offset += 2) {
    const byte = Number.parseInt(trimmed.slice(offset, offset + 2), 16)
    if (Number.isNaN(byte)) return null
    bytes.push(byte)
  }
  return bytes as unknown as Rgb
}

function toHex([r, g, b]: Rgb): string {
  const channel = (value: number) => value.toString(16).padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

function channelLuminance(byte: number): number {
  const c = byte / 255
  return c <= 0.039_28 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export interface BrandColorEvaluation {
  valid: boolean
  /** Which ink the primary reads better against — the deterministic choice
   * `store::brands::validate_primary_hex` makes, never "the best of both". */
  ink: 'light' | 'dark'
  inkContrast: number
  groundContrast: number
  /** Set only when `valid` is false, naming the actual ratio measured. */
  reason?: string
}

/**
 * Validate a proposed brand primary colour against the two backgrounds it
 * actually renders on: its own on-primary text (4.5:1) and the page ground a
 * primary-coloured control sits on (3:1). Mirrors the Navigator-side gate
 * exactly, so a colour this accepts is a colour the store will too.
 */
export function evaluateBrandPrimaryColor(hex: string): BrandColorEvaluation {
  const rgb = parseHex(hex)
  if (!rgb) {
    return {
      valid: false,
      ink: 'light',
      inkContrast: 0,
      groundContrast: 0,
      reason: `"${hex}" is not a 6-digit hex colour.`,
    }
  }

  const onLightRatio = contrastRatio(rgb, LIGHT_INK)
  const onDarkRatio = contrastRatio(rgb, DARK_INK)
  const useLightInk = onLightRatio >= onDarkRatio
  const ink: BrandColorEvaluation['ink'] = useLightInk ? 'light' : 'dark'
  const inkContrast = useLightInk ? onLightRatio : onDarkRatio
  const groundContrast = contrastRatio(rgb, PAGE_GROUND)

  if (inkContrast < MIN_INK_CONTRAST) {
    return {
      valid: false,
      ink,
      inkContrast,
      groundContrast,
      reason: `${hex} clears only ${inkContrast.toFixed(2)}:1 against its ${ink} on-primary text; it must clear ${MIN_INK_CONTRAST}:1.`,
    }
  }
  if (groundContrast < MIN_GROUND_CONTRAST) {
    return {
      valid: false,
      ink,
      inkContrast,
      groundContrast,
      reason: `${hex} clears only ${groundContrast.toFixed(2)}:1 against the page ground; it must clear ${MIN_GROUND_CONTRAST}:1.`,
    }
  }
  return { valid: true, ink, inkContrast, groundContrast }
}

/** A synthetic starting point for the gallery specimen — not a shipped
 * default, just a value visibly distinct from the library's own identity. */
export const SYNTHETIC_SAMPLE_PRIMARY = toHex([109, 40, 217])

/* ------------------------------------------------------------ BrandColorField */

export interface BrandColorFieldProps {
  label?: string
  value: string
  onChange: (hex: string, evaluation: BrandColorEvaluation) => void
  help?: string
  required?: boolean
}

/**
 * A hex input behind the WCAG contrast gate: a value under either floor is
 * refused inline, naming the ratio actually measured, before the host form
 * ever sees a submit.
 */
export function BrandColorField({
  label = 'Primary colour',
  value,
  onChange,
  help = `A 6-digit hex value, e.g. ${SYNTHETIC_SAMPLE_PRIMARY}.`,
  required,
}: BrandColorFieldProps) {
  const evaluation = useMemo(() => evaluateBrandPrimaryColor(value), [value])

  return (
    <TextField
      label={label}
      required={required}
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onChange(event.target.value, evaluateBrandPrimaryColor(event.target.value))
      }
      help={help}
      error={evaluation.valid ? undefined : evaluation.reason}
      spellCheck={false}
      addon={
        <span
          className="brand-editor__swatch"
          style={{ background: parseHex(value) ? value : 'transparent' }}
        />
      }
    />
  )
}

/* -------------------------------------------------------- font upload field */

/** Mirrors `store::brands::FONT_LICENCES` — the closed list a Firm's uploaded
 * font must be attested under. */
export const FONT_LICENCES = ['OFL-1.1', 'Apache-2.0', 'UFL-1.0'] as const
export type BrandLicence = (typeof FONT_LICENCES)[number]

const LICENCE_OPTIONS: SelectOption[] = FONT_LICENCES.map((licence) => ({
  value: licence,
  label: licence,
}))

/** A client-side size hint only — the authoritative limit is whatever the
 * host application's upload endpoint enforces. */
const DEFAULT_MAX_FONT_BYTES = 512_000

export interface BrandFontUploadFieldProps {
  label?: string
  licence: BrandLicence | ''
  onLicenceChange: (licence: BrandLicence | '') => void
  onFileChange: (file: File | null, tooLarge: boolean) => void
  maxBytes?: number
  help?: string
  error?: string
}

/**
 * A `.woff2` upload paired with a licence choice from the closed list. The
 * size check here is advisory — a UX nicety flagged in `onFileChange`, not a
 * refusal this component enforces — the authoritative limit stays server-side.
 */
export function BrandFontUploadField({
  label = 'Custom typeface',
  licence,
  onLicenceChange,
  onFileChange,
  maxBytes = DEFAULT_MAX_FONT_BYTES,
  help = 'WOFF2 only. Leave blank to keep the shipped typeface.',
  error,
}: BrandFontUploadFieldProps) {
  return (
    <div className="brand-editor__upload">
      <TextField
        label={label}
        type="file"
        accept=".woff2"
        help={help}
        error={error}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0] ?? null
          onFileChange(file, Boolean(file && file.size > maxBytes))
        }}
      />
      <SelectField
        label="Font licence"
        options={LICENCE_OPTIONS}
        placeholder="No custom font"
        value={licence}
        onChange={(event) => onLicenceChange(event.target.value as BrandLicence | '')}
      />
    </div>
  )
}

/* -------------------------------------------------------- logo upload field */

/** A client-side size hint only — see `BrandFontUploadFieldProps`. */
const DEFAULT_MAX_LOGO_BYTES = 2_000_000

export interface BrandLogoUploadFieldProps {
  label?: string
  onFileChange: (file: File | null, tooLarge: boolean) => void
  maxBytes?: number
  help?: string
  error?: string
}

/**
 * An SVG-or-raster logo upload. Any client-side content check here would be a
 * UX nicety at best: the authoritative refusal (script tags, event-handler
 * attributes, `foreignObject`, an external reference, a malware scan) lives
 * server-side, wherever this control's host application is, and this
 * component never claims to replace it.
 */
export function BrandLogoUploadField({
  label = 'Logo',
  onFileChange,
  maxBytes = DEFAULT_MAX_LOGO_BYTES,
  help = 'SVG or PNG.',
  error,
}: BrandLogoUploadFieldProps) {
  return (
    <TextField
      label={label}
      type="file"
      accept="image/svg+xml,image/png"
      help={help}
      error={error}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null
        onFileChange(file, Boolean(file && file.size > maxBytes))
      }}
    />
  )
}

/* -------------------------------------------------------------- the panel -- */

export interface BrandEditorPanelProps {
  title?: string
  intro?: string
  /** Field-level and form-level errors, surfaced by the host form. */
  error?: string
}

/**
 * The three controls composed into one panel, for the gallery specimen and
 * for a real host to model its own editor on. Synthetic, uncontrolled-by-the-
 * host state only — a real consumer owns persistence and passes its own
 * handlers to each field individually rather than rendering this exact panel.
 */
export function BrandEditorPanel({
  title = 'Brand',
  intro = 'A worked composition of the three controls above, with synthetic state only.',
  error,
}: BrandEditorPanelProps) {
  const [color, setColor] = useState(SYNTHETIC_SAMPLE_PRIMARY)
  const [licence, setLicence] = useState<BrandLicence | ''>('')
  const [fontNotice, setFontNotice] = useState<string | undefined>(undefined)
  const [logoNotice, setLogoNotice] = useState<string | undefined>(undefined)

  return (
    <FormCard title={title} intro={intro} error={error}>
      <BrandColorField value={color} onChange={setColor} required />
      <BrandFontUploadField
        licence={licence}
        onLicenceChange={setLicence}
        onFileChange={(file, tooLarge) =>
          setFontNotice(tooLarge ? `${file?.name} is larger than this preview accepts.` : undefined)
        }
        error={fontNotice}
      />
      <BrandLogoUploadField
        onFileChange={(file, tooLarge) =>
          setLogoNotice(tooLarge ? `${file?.name} is larger than this preview accepts.` : undefined)
        }
        error={logoNotice}
      />
    </FormCard>
  )
}
