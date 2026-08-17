import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

/*
 * Switch, ToggleGroup, and Combobox — shadcn's remaining form controls.
 *
 * Each is built on the native element that already has the semantics, rather
 * than on a div with ARIA bolted to it. That is not purity: a native checkbox
 * is reachable by the platform's own form autofill, submits inside a `<form>`
 * with no JavaScript, and is announced correctly by screen readers that have
 * never heard of this library.
 */

/* ----------------------------------------------------------------- Switch -- */

export type SwitchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'role' | 'id' | 'children'
> & {
  label: ReactNode
  /** Sub-label under the switch, describing what turning it on does. */
  description?: ReactNode
}

/**
 * An on/off control.
 *
 * A checkbox carrying `role="switch"`, which is the one ARIA role that changes
 * how a checkbox is announced without changing what it is: "on/off" instead of
 * "checked/unchecked". It still posts as a checkbox, still toggles on Space,
 * and still works with no JavaScript — none of which is true of shadcn's
 * button-based version.
 *
 * Use it for a setting that takes effect immediately. A checkbox that only
 * matters once the form is submitted should stay a `CheckboxField`.
 */
export function Switch({ label, description, ...rest }: SwitchProps) {
  const id = useId()
  const descriptionId = `${id}-description`

  return (
    <div className="nav-switch">
      <input
        className="nav-switch__input"
        type="checkbox"
        role="switch"
        id={id}
        aria-describedby={description ? descriptionId : undefined}
        {...rest}
      />
      <label className="nav-switch__label" htmlFor={id}>
        {label}
        {description ? (
          <span className="nav-switch__description" id={descriptionId}>
            {description}
          </span>
        ) : null}
      </label>
    </div>
  )
}

/* ------------------------------------------------------------ ToggleGroup -- */

export interface ToggleOption {
  value: string
  label: ReactNode
  disabled?: boolean
}

export interface ToggleGroupProps {
  /** Names the group for assistive technology. */
  label: string
  options: ToggleOption[]
  value: string
  onValueChange: (value: string) => void
}

/**
 * A single-select segmented control.
 *
 * Buttons with `aria-pressed`, inside a labelled group. Controlled, because
 * unlike the other controls here it has no form value to post — it filters
 * what is on screen, so the caller owns the state.
 *
 * Not a radio group: radios are for a choice being submitted, and announcing
 * "radio button, 1 of 3" for a view filter tells the reader the wrong thing
 * about what pressing it does.
 */
export function ToggleGroup({ label, options, value, onValueChange }: ToggleGroupProps) {
  return (
    <div className="nav-toggle-group" role="group" aria-label={label}>
      {options.map((option) => {
        const pressed = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            className={pressed ? 'nav-toggle nav-toggle--on' : 'nav-toggle'}
            aria-pressed={pressed}
            disabled={option.disabled}
            onClick={() => onValueChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* --------------------------------------------------------------- Combobox -- */

export interface ComboboxProps {
  label: ReactNode
  name: string
  /** The suggestions. The reader may still type something not on the list. */
  options: string[]
  help?: ReactNode
  error?: ReactNode
  defaultValue?: string
  placeholder?: string
  required?: boolean
}

/**
 * A text input with suggestions.
 *
 * `<input list>` plus `<datalist>` — the platform's own combobox. shadcn's is a
 * Popover wrapping a Command component wrapping a virtualized list, roughly
 * 300 lines and three Radix packages, and it stops working the moment
 * JavaScript fails.
 *
 * The platform version cannot be styled — the dropdown is drawn by the browser
 * — and that is the actual trade. Take it where the list is suggestions over a
 * free-text field, which is what a combobox is; reach for a `SelectField` where
 * the value must be one of the options.
 */
export function Combobox({
  label,
  name,
  options,
  help,
  error,
  defaultValue,
  placeholder,
  required,
}: ComboboxProps) {
  const id = useId()
  const listId = `${id}-list`
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const describedBy = [error ? errorId : null, help ? helpId : null].filter(Boolean).join(' ')

  return (
    <div className={error ? 'nav-field nav-field--invalid' : 'nav-field'}>
      <label className="nav-label" htmlFor={id}>
        {label}
        {required ? (
          <span className="nav-required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      <input
        className="nav-input"
        id={id}
        name={name}
        list={listId}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error) || undefined}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      {help ? (
        <p className="nav-field__help" id={helpId}>
          {help}
        </p>
      ) : null}
      {error ? (
        <p className="nav-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
