import { useEffect, type RefObject } from 'react'

/*
 * The dismissal behavior every non-modal overlay needs, written once.
 *
 * Esc closes, an outside click closes, and focus returns to the trigger. Each
 * of those is a thing hand-rolled popovers routinely get wrong, and the count
 * of surfaces needing them has only gone up — Popover, DropdownMenu, and
 * Tooltip were the original three, and HoverCard, ContextMenu, and Menubar
 * join them.
 *
 * It moved out of `Overlay.tsx` when the second file needed it. A hook copied
 * into a second module is a hook that drifts: the copy that fixes a focus bug
 * is never the copy the next component imports.
 *
 * The modal pair — `Dialog` and `Sheet` — deliberately does not use this. A
 * native `<dialog>` gets Esc, the focus trap, the top layer, and an inert
 * background from the platform, and layering a second Esc handler over that
 * would close two things with one key.
 */

export interface DismissibleOptions {
  open: boolean
  onClose: () => void
  /** Focus returns here on close. */
  triggerRef: RefObject<HTMLElement | null>
  contentRef: RefObject<HTMLElement | null>
  /** Skip focus restoration for hover-driven surfaces like a tooltip. */
  restoreFocus?: boolean
}

export function useDismissible({
  open,
  onClose,
  triggerRef,
  contentRef,
  restoreFocus = true,
}: DismissibleOptions) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // Stop the Esc from also closing a dialog this sits inside.
      event.stopPropagation()
      onClose()
      if (restoreFocus) triggerRef.current?.focus()
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      // A click on the trigger is the trigger's own business — treating it as
      // "outside" would close and immediately reopen.
      if (contentRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      onClose()
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [open, onClose, triggerRef, contentRef, restoreFocus])
}
