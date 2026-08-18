import {
  useCallback,
  useId,
  useMemo,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { monthHeading, monthShape, shiftMonth } from '../lib/month'
import { Field } from './Layouts'

/*
 * Slider, InputOTP, Calendar, and DatePicker — the controls shadcn builds on
 * Radix and react-day-picker, built here on the platform instead.
 *
 * The date pair is where that choice pays most. `react-day-picker` plus
 * `date-fns` is upwards of 60 KB to collect a date that `<input type="date">`
 * already collects, with a native picker that is localized, keyboard-driven,
 * and understood by every autofill implementation. The month grid below exists
 * for the case that input genuinely cannot serve — showing which days are
 * available, or marking deadlines across a matter — and not as a replacement
 * for it.
 */

/* ----------------------------------------------------------------- Slider -- */

export interface SliderProps {
  label: ReactNode
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Renders the current value beside the label. Pass a formatter for units. */
  format?: (value: number) => string
  help?: ReactNode
  disabled?: boolean
}

/**
 * A value on a range.
 *
 * `<input type="range">`, which brings keyboard stepping, Home/End, the correct
 * `slider` role, and touch handling with no code. shadcn's is a div with six
 * ARIA attributes and a pointer-event handler that reimplements all of it.
 *
 * The displayed value is not `aria-valuetext` — the input reports its own value
 * — it is a visible readout, because a slider whose value only exists as a
 * thumb position is unreadable to everyone.
 */
export function Slider({
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  format,
  help,
  disabled,
}: SliderProps) {
  return (
    <Field label={<span className="nav-slider__label">{label}<span className="nav-slider__value">{format ? format(value) : value}</span></span>} help={help}>
      {(id, describedBy) => (
        <input
          className="nav-slider"
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-describedby={describedBy}
          onChange={(event) => onValueChange(Number(event.target.value))}
        />
      )}
    </Field>
  )
}

/* --------------------------------------------------------------- InputOTP -- */

export interface InputOTPProps {
  label: ReactNode
  value: string
  onValueChange: (value: string) => void
  length?: number
  help?: ReactNode
  error?: ReactNode
}

/**
 * A fixed-length code, one box per character.
 *
 * The three things that make or break this control are all edge cases rather
 * than layout: pasting the whole code into any box must fill every box,
 * Backspace on an empty box must move to the previous one, and the value must
 * stay a single string so the caller never reassembles it from an array.
 *
 * `inputMode="numeric"` and `autoComplete="one-time-code"` are what get a phone
 * to offer the code from an SMS. Without the latter the control works and the
 * platform's best feature silently does not.
 */
export function InputOTP({ label, value, onValueChange, length = 6, help, error }: InputOTPProps) {
  const id = useId()
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const characters = useMemo(
    () => Array.from({ length }, (_, index) => value[index] ?? ''),
    [value, length],
  )

  const write = useCallback(
    (index: number, next: string) => {
      const chars = Array.from({ length }, (_, i) => value[i] ?? '')
      chars[index] = next
      onValueChange(chars.join('').trimEnd())
    },
    [value, length, onValueChange],
  )

  const onPaste = useCallback(
    (event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault()
      const pasted = event.clipboardData.getData('text').replace(/\s/g, '').slice(0, length)
      if (!pasted) return
      onValueChange(pasted)
      refs.current[Math.min(pasted.length, length - 1)]?.focus()
    },
    [length, onValueChange],
  )

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !event.currentTarget.value && index > 0) {
      refs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight') refs.current[index + 1]?.focus()
  }, [])

  return (
    <div className={error ? 'nav-field nav-field--invalid' : 'nav-field'}>
      <span className="nav-label" id={`${id}-label`}>
        {label}
      </span>
      <div
        className="nav-otp"
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
      >
        {characters.map((character, index) => (
          <input
            /* eslint-disable-next-line react/no-array-index-key */
            key={index}
            ref={(node) => {
              refs.current[index] = node
            }}
            className="nav-otp__slot"
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={character}
            aria-label={`Character ${index + 1} of ${length}`}
            onPaste={onPaste}
            onKeyDown={(event) => onKeyDown(event, index)}
            onChange={(event) => {
              const next = event.target.value.slice(-1)
              write(index, next)
              if (next) refs.current[index + 1]?.focus()
            }}
          />
        ))}
      </div>
      {help ? (
        <p className="nav-field__help" id={`${id}-help`}>
          {help}
        </p>
      ) : null}
      {error ? (
        <p className="nav-field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------- DatePicker -- */

export interface DatePickerProps {
  label: ReactNode
  name: string
  /** ISO `YYYY-MM-DD`. */
  value?: string
  onValueChange?: (value: string) => void
  min?: string
  max?: string
  help?: ReactNode
  error?: ReactNode
  required?: boolean
}

/**
 * One date.
 *
 * `<input type="date">`. The native picker is localized to the reader's locale
 * rather than the app's, honors their calendar preferences, and is the only
 * version that autofill can complete. `min` and `max` are enforced by the
 * platform, which also means they survive a form posted with JavaScript off.
 *
 * The value is ISO in and ISO out regardless of how it is displayed — that is
 * the input's contract, not this component's, and it is the reason a date
 * collected here can be compared as a string.
 */
export function DatePicker({
  label,
  name,
  value,
  onValueChange,
  min,
  max,
  help,
  error,
  required,
}: DatePickerProps) {
  return (
    <Field label={label} help={help} error={error} required={required}>
      {(id, describedBy) => (
        <input
          className="nav-input"
          id={id}
          name={name}
          type="date"
          value={value}
          min={min}
          max={max}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error) || undefined}
          onChange={(event) => onValueChange?.(event.target.value)}
        />
      )}
    </Field>
  )
}

/* --------------------------------------------------------------- Calendar -- */

export interface CalendarDay {
  /** ISO `YYYY-MM-DD`. */
  date: string
  /** A short note shown under the number — a deadline, a hearing. */
  note?: ReactNode
  disabled?: boolean
}

export interface CalendarProps {
  /** The month to show, as `YYYY-MM`. */
  month: string
  /** Days carrying a note or a disabled state. Absent days render plain. */
  days?: CalendarDay[]
  selected?: string
  onSelect?: (date: string) => void
  onMonthChange?: (month: string) => void
  label?: string
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

/* A module-level constant so the default prop keeps referential equality —
   an inline `[]` is a new array every render and re-runs every memo below. */
const NO_DAYS: CalendarDay[] = []

/**
 * A month grid.
 *
 * Not a date input — `DatePicker` is that, and it should be the default. This
 * is for the case where the month itself is the information: which days in a
 * matter carry a deadline, which dates a witness is available. That is why a
 * day takes a `note` and why nothing here posts a form value.
 *
 * All arithmetic is UTC. A grid built from local-time `Date`s puts the month
 * boundary in the wrong place for anyone east or west of the server, and the
 * bug only appears for readers in some timezones — which is how it ships.
 */
export function Calendar({
  month,
  days = NO_DAYS,
  selected,
  onSelect,
  onMonthChange,
  label = 'Calendar',
}: CalendarProps) {
  const { days: dayCount, offset } = useMemo(() => monthShape(month), [month])
  const byDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days])
  const heading = useMemo(() => monthHeading(month), [month])

  return (
    <div className="nav-calendar" role="group" aria-label={label}>
      <div className="nav-calendar__head">
        <button
          type="button"
          className="nav-calendar__nav"
          onClick={() => onMonthChange?.(shiftMonth(month, -1))}
          disabled={!onMonthChange}
          aria-label="Previous month"
        >
          <span aria-hidden="true">&#8249;</span>
        </button>
        <p className="nav-calendar__month" aria-live="polite">
          {heading}
        </p>
        <button
          type="button"
          className="nav-calendar__nav"
          onClick={() => onMonthChange?.(shiftMonth(month, 1))}
          disabled={!onMonthChange}
          aria-label="Next month"
        >
          <span aria-hidden="true">&#8250;</span>
        </button>
      </div>
      <div className="nav-calendar__grid">
        {WEEKDAYS.map((weekday) => (
          <span className="nav-calendar__weekday" key={weekday}>
            {weekday}
          </span>
        ))}
        {Array.from({ length: offset }, (_, index) => (
          <span className="nav-calendar__pad" key={`pad-${index}`} />
        ))}
        {Array.from({ length: dayCount }, (_, index) => {
          const dayNumber = index + 1
          const date = `${month}-${String(dayNumber).padStart(2, '0')}`
          const entry = byDate.get(date)
          const isSelected = selected === date
          return (
            <button
              key={date}
              type="button"
              className={isSelected ? 'nav-calendar__day nav-calendar__day--selected' : 'nav-calendar__day'}
              disabled={entry?.disabled || !onSelect}
              aria-pressed={onSelect ? isSelected : undefined}
              onClick={() => onSelect?.(date)}
            >
              <span className="nav-calendar__number">{dayNumber}</span>
              {entry?.note ? <span className="nav-calendar__note">{entry.note}</span> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
