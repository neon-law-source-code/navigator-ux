import { GLYPHS, type IconName } from './icon-glyphs'

export type { IconName }
export { ICON_NAMES } from './icon-glyphs'

export interface IconProps {
  name: IconName
  /**
   * An accessible name. Supply it only when the icon carries meaning no
   * adjacent text already carries — an icon-only button, say. Left off, the
   * glyph is hidden from assistive technology, which is right for the common
   * case of an icon sitting beside its own label.
   */
  title?: string
  className?: string
}

export function Icon({ name, title, className }: IconProps) {
  return (
    <svg
      className={className ? `nav-icon ${className}` : 'nav-icon'}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      fill="currentColor"
      role="img"
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {GLYPHS[name]}
    </svg>
  )
}
