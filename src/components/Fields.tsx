import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { dateHeading, monthHeading, monthOf, monthShape, shiftDate, shiftMonth, weekdayIndex } from '../lib/month'
import { useDismissible } from '../lib/use-dismissible'
import { Field } from './Layouts'

/*
 * Slider, InputOTP, and the three date controls — what shadcn builds on Radix
 * and react-day-picker, built here on the platform instead.
 *
 * The dates are where that choice pays most. `react-day-picker` plus
 * `date-fns` is upwards of 60 KB to collect a date that `<input type="date">`
 * already collects, with a native picker that is localized, keyboard-driven,
 * and understood by every autofill implementation. The month grid below exists
 * for the case that input genuinely cannot serve — showing which days are
 * available, or marking deadlines across a matter — and not as a replacement
 * for it.
 *
 * `CalendarPicker` is a third and is the one to reach for last; what it trades
 * away to be a popover instead of an input is on the component itself.
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
  /** Earliest selectable date, ISO `YYYY-MM-DD`. Earlier days render disabled. */
  min?: string
  /** Latest selectable date, ISO `YYYY-MM-DD`. Later days render disabled. */
  max?: string
  /** Focus the day that holds the tab stop once the grid mounts. */
  autoFocus?: boolean
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

/* How far each arrow moves, in days. A week is the vertical step because the
   grid is seven wide — that is what makes Down land under the cursor rather
   than one day along. */
const ARROW_STEP: Record<string, number | undefined> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
}

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
  min,
  max,
  autoFocus = false,
}: CalendarProps) {
  const { days: dayCount, offset } = useMemo(() => monthShape(month), [month])
  const byDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days])
  const heading = useMemo(() => monthHeading(month), [month])
  const gridRef = useRef<HTMLDivElement>(null)

  /* The roving tab stop. One day in the grid is tabbable and the arrows move
     between the rest — the alternative is thirty-one tab stops between the
     month heading and whatever follows the calendar. */
  const [focused, setFocused] = useState<string | null>(null)
  /* Focus only follows the roving stop when a key moved it. Without this the
     grid would steal focus on any re-render, including the parent's. */
  const wantsFocus = useRef(autoFocus)

  const isDisabled = useCallback(
    (date: string) =>
      Boolean(byDate.get(date)?.disabled) ||
      (min !== undefined && date < min) ||
      (max !== undefined && date > max),
    [byDate, min, max],
  )

  const firstDate = `${month}-01`
  /* The stop is whichever of these is in view: where the arrows left it, the
     selection, or the first of the month. */
  const tabStop =
    focused && monthOf(focused) === month
      ? focused
      : selected && monthOf(selected) === month
        ? selected
        : firstDate

  useEffect(() => {
    if (!wantsFocus.current || !onSelect) return
    const day = gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${tabStop}"]`)
    if (!day || day.disabled) return
    wantsFocus.current = false
    day.focus()
  }, [tabStop, onSelect])

  /* Arrow keys land wherever the arithmetic puts them, including on a day that
     is disabled or in a neighboring month. Keep stepping the same direction
     rather than stopping on a day that cannot take focus — a run of booked
     days should be passed over, not be a wall. The bound is two months, which
     is further than any real run of them and terminates on an empty calendar. */
  const step = useCallback(
    (from: string, by: number) => {
      let next = shiftDate(from, by)
      for (let attempt = 0; attempt < 62 && isDisabled(next); attempt += 1) {
        next = shiftDate(next, by > 0 ? 1 : -1)
      }
      return isDisabled(next) ? null : next
    },
    [isDisabled],
  )

  const moveTo = useCallback(
    (date: string | null) => {
      if (!date) return
      wantsFocus.current = true
      setFocused(date)
      if (monthOf(date) !== month) onMonthChange?.(monthOf(date))
    },
    [month, onMonthChange],
  )

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return
    const by = ARROW_STEP[event.key]
    if (by !== undefined) {
      event.preventDefault()
      moveTo(step(tabStop, by))
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      /* Home and End work on the week, not the month — the row under the
         cursor is what they read as "the line", the same way they do in text.
         A week that runs into the next month goes there, which is why this
         lands through `moveTo` rather than clamping to the grid. */
      const index = weekdayIndex(tabStop)
      const edge = shiftDate(tabStop, event.key === 'Home' ? -index : 6 - index)
      moveTo(isDisabled(edge) ? step(edge, event.key === 'Home' ? 1 : -1) : edge)
      return
    }
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault()
      /* A month step keeps the day number where it can — the 31st of a month
         whose neighbor is shorter clamps to that month's last day, which is
         what `shiftMonth` on the date's own month gives once re-joined. */
      const target = shiftMonth(month, event.key === 'PageUp' ? -1 : 1)
      const { days: targetDays } = monthShape(target)
      const dayNumber = Math.min(Number(tabStop.slice(-2)), targetDays)
      const candidate = `${target}-${String(dayNumber).padStart(2, '0')}`
      moveTo(isDisabled(candidate) ? step(candidate, event.key === 'PageUp' ? -1 : 1) : candidate)
    }
  }

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
      <div className="nav-calendar__grid" ref={gridRef} onKeyDown={onKeyDown}>
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
              data-date={date}
              className={isSelected ? 'nav-calendar__day nav-calendar__day--selected' : 'nav-calendar__day'}
              disabled={isDisabled(date) || !onSelect}
              tabIndex={onSelect && date !== tabStop ? -1 : undefined}
              aria-pressed={onSelect ? isSelected : undefined}
              onClick={() => onSelect?.(date)}
            >
              {/* The visible glyph is a bare number, which is not a date to
                  anyone listening rather than looking: the weekday headers and
                  the month above it are what supply the rest, and neither is
                  announced with the cell. The full date is spoken instead, and
                  a note after it — so it stays in the name rather than being
                  swallowed by an `aria-label`. */}
              <span className="nav-visually-hidden">{dateHeading(date)}</span>
              <span className="nav-calendar__number" aria-hidden="true">
                {dayNumber}
              </span>
              {entry?.note ? (
                <>
                  {/* A real text node, so the note does not run into the date
                      in the accessible name — the number between them is hidden
                      and the element boundary alone contributes nothing. */}
                  {' '}
                  <span className="nav-calendar__note">{entry.note}</span>
                </>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* --------------------------------------------------------- CalendarPicker -- */

export interface CalendarPickerProps {
  label: ReactNode
  /** The name the value posts under. */
  name: string
  /** ISO `YYYY-MM-DD`. */
  value?: string
  onValueChange?: (value: string) => void
  /** As `Calendar` takes them. */
  days?: CalendarDay[]
  min?: string
  max?: string
  /** Shown on the trigger before anything is chosen. */
  placeholder?: string
  /** The month opened when there is no value. Defaults to the current month. */
  defaultMonth?: string
  help?: ReactNode
  error?: ReactNode
  required?: boolean
}

/**
 * A date chosen from a month grid in a popover.
 *
 * This is the shape shadcn calls a date picker, and it is the third choice of
 * three rather than the first. `DatePicker` is the default and is better at
 * almost everything: the native picker is localized to the reader rather than
 * to the app, it autofills, and its `min`/`max` are enforced by the platform on
 * a form posted with JavaScript off. The value here rides in a hidden input,
 * and a hidden input is not constraint-validated — `required` on one is a
 * promise the browser will not keep, so a form using this has to check the
 * value itself.
 *
 * What it buys in exchange is the grid: a day can carry a `note`, so a reader
 * picking a hearing date sees which days are already spoken for while they
 * pick. That is the whole reason to take the trade, and if the days in question
 * are interchangeable, take `DatePicker` instead.
 *
 * The popover dismisses through `useDismissible`, like the other non-modal
 * surfaces. Choosing a day closes it as well — the grid is the only thing in
 * there, so staying open would leave a panel over the page with nothing left to
 * do in it.
 */
export function CalendarPicker({
  label,
  name,
  value,
  onValueChange,
  days,
  min,
  max,
  placeholder = 'Choose a date',
  defaultMonth,
  help,
  error,
  required,
}: CalendarPickerProps) {
  const [open, setOpen] = useState(false)
  /* The month is the picker's own state rather than the caller's: which month
     is in view is a property of the open panel and means nothing once it is
     closed. It opens on the value's month, so reopening returns to where the
     reader left off rather than to today. */
  const [month, setMonth] = useState(
    () => defaultMonth ?? (value ? monthOf(value) : monthOf(new Date().toISOString().slice(0, 10))),
  )
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  const close = useCallback(() => setOpen(false), [])
  useDismissible({ open, onClose: close, triggerRef, contentRef })

  const toggle = () => {
    setOpen((current) => {
      if (!current && value) setMonth(monthOf(value))
      return !current
    })
  }

  const select = (date: string) => {
    onValueChange?.(date)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <Field label={label} help={help} error={error} required={required}>
      {(id, describedBy) => (
        <div className="nav-calendar-picker">
          {/* The name is the field's label followed by the value: a button
              takes its name from its own content, so a `<label for>` alone
              would leave the trigger announced as a bare date with no clue
              which field it belongs to. The value span is referenced by its own
              id rather than the button's — pointing `aria-labelledby` back at
              the element carrying it is a self-reference, and what that
              contributes is not agreed on between implementations. */}
          <button
            ref={triggerRef}
            type="button"
            id={id}
            className="nav-calendar-picker__trigger"
            aria-labelledby={`${id}-label ${id}-value`}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error) || undefined}
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            onClick={toggle}
          >
            <span id={`${id}-value`} className={value ? undefined : 'nav-calendar-picker__placeholder'}>
              {value ? dateHeading(value) : placeholder}
            </span>
          </button>
          {/* The posted value. Hidden rather than a disabled date input so a
              form reads one field, and so the trigger stays the only thing in
              the tab order. */}
          <input type="hidden" name={name} value={value ?? ''} />
          {open ? (
            <div className="nav-calendar-picker__panel" ref={contentRef} id={panelId}>
              <Calendar
                month={month}
                days={days}
                selected={value}
                onSelect={select}
                onMonthChange={setMonth}
                min={min}
                max={max}
                label="Choose a date"
                autoFocus
              />
            </div>
          ) : null}
        </div>
      )}
    </Field>
  )
}
