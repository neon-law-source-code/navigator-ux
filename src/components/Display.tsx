import type { CSSProperties, ReactNode } from 'react'
import { initialsFor } from '../lib/initials'

/*
 * Display primitives — shadcn's Separator, Avatar, Skeleton, Progress, and
 * AspectRatio.
 *
 * These are the parts of shadcn that are almost entirely styling. Taking them
 * as source and swapping the Tailwind for `nav-*` classes is the whole port;
 * what is worth keeping is the semantics each one settled on, which is where
 * hand-rolled versions usually go wrong.
 */

/* -------------------------------------------------------------- Separator -- */

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  /**
   * Purely visual, with no structural meaning. Hidden from assistive
   * technology, which is right for a rule between two things a reader can
   * already tell apart.
   */
  decorative?: boolean
  className?: string
}

export function Separator({
  orientation = 'horizontal',
  decorative,
  className,
}: SeparatorProps) {
  const classes = ['nav-separator', `nav-separator--${orientation}`, className]
    .filter(Boolean)
    .join(' ')

  // A <div role="separator"> rather than an <hr>: `<hr>` is a thematic break in
  // content, and a vertical rule between two toolbar buttons is not that.
  return (
    <div
      className={classes}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative || orientation === 'horizontal' ? undefined : 'vertical'}
    />
  )
}

/* ----------------------------------------------------------------- Avatar -- */

export interface AvatarProps {
  /** Portrait URL. Without one, the initials fallback renders. */
  src?: string
  /**
   * Who this depicts. Required even with an image, because it is what the
   * fallback shows and what a screen reader announces.
   */
  name: string
  /** Override the derived initials. */
  initials?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ src, name, initials, size = 'md' }: AvatarProps) {
  const classes = `nav-avatar nav-avatar--${size}`

  // The image carries the name; the fallback is decorative because the name is
  // announced by the wrapper's own label. Announcing both reads it twice.
  return src ? (
    <img className={classes} src={src} alt={name} />
  ) : (
    <span className={`${classes} nav-avatar--initials`} role="img" aria-label={name}>
      <span aria-hidden="true">{initials ?? initialsFor(name)}</span>
    </span>
  )
}

/* --------------------------------------------------------------- Skeleton -- */

export interface SkeletonProps {
  /** CSS length — "12rem", "100%". */
  width?: string
  height?: string
  /** Rounded like an avatar rather than a line of text. */
  circle?: boolean
  /** What is loading, for assistive technology. */
  label?: string
}

/**
 * A loading placeholder.
 *
 * `aria-hidden` unless given a label: a screen reader announcing six grey boxes
 * is worse than silence. When the surrounding region is a live region, give the
 * skeleton a label instead so the reader is told something is coming.
 */
export function Skeleton({ width, height, circle, label }: SkeletonProps) {
  const style: CSSProperties = {}
  if (width) style.width = width
  if (height) style.height = height

  return (
    <span
      className={circle ? 'nav-skeleton nav-skeleton--circle' : 'nav-skeleton'}
      style={style}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}

/* --------------------------------------------------------------- Progress -- */

export interface ProgressProps {
  /** 0–100. Omit for an indeterminate bar. */
  value?: number
  /** Names the thing being measured. */
  label: string
  /** Show the percentage beside the bar. */
  showValue?: boolean
}

/**
 * A determinate or indeterminate progress bar.
 *
 * `role="progressbar"` on a div rather than a native `<progress>`: the native
 * element cannot be styled consistently across engines without resetting its
 * appearance per-browser, and once reset it is a div with extra steps. The ARIA
 * attributes are the part that matters and they are identical either way.
 */
export function Progress({ value, label, showValue }: ProgressProps) {
  const clamped = value === undefined ? undefined : Math.max(0, Math.min(100, value))

  return (
    <div className="nav-progress">
      <div
        className={
          clamped === undefined ? 'nav-progress__track nav-progress__track--indeterminate' : 'nav-progress__track'
        }
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={clamped === undefined ? undefined : 0}
        aria-valuemax={clamped === undefined ? undefined : 100}
      >
        <div
          className="nav-progress__fill"
          style={clamped === undefined ? undefined : { width: `${clamped}%` }}
        />
      </div>
      {showValue && clamped !== undefined ? (
        <span className="nav-progress__value">{clamped}%</span>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------ AspectRatio -- */

export interface AspectRatioProps {
  /** Width divided by height — 16 / 9. */
  ratio?: number
  children: ReactNode
}

/**
 * Holds a box at a fixed ratio.
 *
 * shadcn's version is a Radix component that does the padding-top percentage
 * trick. The CSS `aspect-ratio` property has been baseline since 2021 and needs
 * neither a wrapper nor a runtime.
 */
export function AspectRatio({ ratio = 16 / 9, children }: AspectRatioProps) {
  return (
    <div className="nav-aspect" style={{ aspectRatio: String(ratio) }}>
      {children}
    </div>
  )
}
