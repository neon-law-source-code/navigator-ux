import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Badge, Button, LinkButton, type BadgeTone } from './Primitives'

/** A pin-cite jump within the source document: label plus PDF page. */
export interface AuthorityJump {
  label: string
  page: number | string
}

export interface Authority {
  /** Stable key used for ordering and for the verified-state record. */
  key: string
  title: string
  /** Provenance label shown above the title, e.g. "Westlaw source". */
  sourceType: string
  citation: string
  /** Pin cite, e.g. "754-56". */
  pin: string
  holding: string
  /** What the citing document uses this authority for. */
  support: string
  quote?: string
  /** Adverse points and limits. Surfaced in the amber caution block. */
  limits?: string
  outcome?: string
  verification?: string
  /** Path to the source PDF. */
  pdf: string
  /** Optional Westlaw DOCX companion. */
  docx?: string
  /** Page the viewer opens on. */
  page?: number | string
  jumps?: AuthorityJump[]
  badges?: { label: string; tone?: BadgeTone }[]
}

function readVerified(storageKey: string): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function writeVerified(storageKey: string, value: Record<string, boolean>): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value))
  } catch {
    // Losing the marker is acceptable; blocking the review is not.
  }
}

function sourceHref(item: Authority, page?: number | string): string {
  return page ? `${item.pdf}#page=${encodeURIComponent(String(page))}` : item.pdf
}

export interface AuthorityListProps {
  authorities: Authority[]
  /**
   * localStorage key holding which authorities the reader has verified.
   * Scope it per page, e.g. "<matter>-review-0724-authority-review-v1".
   */
  storageKey: string
  children?: ReactNode
}

/**
 * A list of citable authorities, each opening a side-by-side source viewer.
 *
 * Reproduces the review popup from the static matter pages: the PDF renders
 * next to the holding, pin cite, supporting proposition, and adverse limits,
 * and "Verify & next" walks counsel through the stack while remembering what
 * has already been checked.
 */
export function AuthorityList({ authorities, storageKey, children }: AuthorityListProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [verified, setVerified] = useState<Record<string, boolean>>(() => ({}))
  const returnFocus = useRef<HTMLElement | null>(null)

  // Read persisted state after mount so the component stays render-pure.
  useEffect(() => setVerified(readVerified(storageKey)), [storageKey])

  const order = useMemo(() => authorities.map((item) => item.key), [authorities])
  const active = useMemo(
    () => authorities.find((item) => item.key === activeKey) ?? null,
    [authorities, activeKey],
  )

  const open = useCallback((key: string, trigger: HTMLElement | null) => {
    returnFocus.current = trigger
    setActiveKey(key)
  }, [])

  const close = useCallback(() => {
    setActiveKey(null)
    const target = returnFocus.current
    if (target?.isConnected) target.focus({ preventScroll: true })
  }, [])

  const move = useCallback(
    (delta: number) => {
      setActiveKey((current) => {
        if (current === null) return current
        const index = order.indexOf(current)
        if (index === -1) return current
        return order[(index + delta + order.length) % order.length] ?? current
      })
    },
    [order],
  )

  const verifyAndAdvance = useCallback(() => {
    if (!activeKey) return
    const next = { ...verified, [activeKey]: true }
    setVerified(next)
    writeVerified(storageKey, next)
    move(1)
  }, [activeKey, verified, storageKey, move])

  // The backdrop covers the page, so the page itself must not scroll under it.
  useEffect(() => {
    if (!active) return undefined
    const { documentElement, body } = document
    const previousRoot = documentElement.style.overflow
    const previousBody = body.style.overflow
    documentElement.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      documentElement.style.overflow = previousRoot
      body.style.overflow = previousBody
    }
  }, [active])

  useEffect(() => {
    if (!active) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [active, close])

  return (
    <>
      {authorities.map((item) => (
        <article className="authority" key={item.key}>
          <div className="authority__head">
            <h3>
              <button
                type="button"
                className="authority__open"
                data-verified={String(Boolean(verified[item.key]))}
                onClick={(event) => open(item.key, event.currentTarget)}
              >
                {item.title}
              </button>
            </h3>
            {item.badges?.length ? (
              <div className="authority__badges">
                {item.badges.map((badge) => (
                  <Badge key={badge.label} tone={badge.tone ?? 'default'}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          <p>{item.holding}</p>
        </article>
      ))}
      {children}
      {active ? (
        <AuthorityDialog
          authority={active}
          onClose={close}
          onPrevious={() => move(-1)}
          onNext={() => move(1)}
          onVerify={verifyAndAdvance}
        />
      ) : null}
    </>
  )
}

/**
 * Default viewer sandbox. Permits the browser's own PDF viewer to load a
 * same-origin document and to hand the reader a download, and nothing else.
 */
export const DEFAULT_VIEWER_SANDBOX = 'allow-same-origin allow-downloads allow-popups'

interface AuthorityDialogProps {
  authority: Authority
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  onVerify: () => void
  /** Override only if a browser refuses to render PDFs under the default. */
  sandbox?: string
}

export function AuthorityDialog({
  authority,
  onClose,
  onPrevious,
  onNext,
  onVerify,
  sandbox = DEFAULT_VIEWER_SANDBOX,
}: AuthorityDialogProps) {
  const [page, setPage] = useState<number | string | undefined>(authority.page)
  const closeRef = useRef<HTMLButtonElement | null>(null)

  // Each authority opens at its own default pin, not the previous one's page.
  useEffect(() => setPage(authority.page), [authority])

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
  }, [])

  const titleId = `authority-dialog-title-${authority.key}`

  return (
    <div
      className="authority-dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="authority-dialog__panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="authority-dialog__bar">
          <div>
            <span>{authority.sourceType}</span>
            <strong id={titleId}>{authority.title}</strong>
          </div>
          <Button ref={closeRef} onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="authority-dialog__body">
          <div className="authority-dialog__viewer">
            {/*
              Source documents are litigation exhibits — opposing parties'
              productions among them — so the viewer is sandboxed. `allow-scripts`
              is deliberately absent: with `allow-same-origin` present it would
              amount to no sandbox at all for a same-origin document.
            */}
            <iframe
              title={`${authority.title} — source`}
              src={sourceHref(authority, page)}
              sandbox={sandbox}
            />
          </div>
          <section className="authority-dialog__detail">
            <p>
              <strong>Citation:</strong> {authority.citation}
            </p>
            <p>
              <strong>Pin:</strong> {authority.pin}
            </p>
            <p>
              <strong>Holding:</strong> {authority.holding}
            </p>
            <p>
              <strong>What it supports:</strong> {authority.support}
            </p>
            {authority.quote ? <blockquote>{authority.quote}</blockquote> : null}
            {authority.limits ? (
              <div className="authority-dialog__caution">
                <strong>Limits / adverse point:</strong> {authority.limits}
              </div>
            ) : null}
            {authority.outcome ? (
              <p style={{ marginTop: 10 }}>
                <strong>Outcome:</strong> {authority.outcome}
              </p>
            ) : null}
            {authority.verification ? (
              <p>
                <strong>Verification:</strong> {authority.verification}
              </p>
            ) : null}
            {authority.jumps?.length ? (
              <div className="authority-dialog__jumps">
                {authority.jumps.map((jump) => (
                  <Button key={`${jump.label}-${jump.page}`} onClick={() => setPage(jump.page)}>
                    {jump.label}
                  </Button>
                ))}
              </div>
            ) : null}
            <div className="authority-dialog__links">
              <LinkButton variant="primary" target="_blank" rel="noopener noreferrer" href={authority.pdf}>
                Open full PDF
              </LinkButton>
              {authority.docx ? <LinkButton href={authority.docx}>Westlaw DOCX</LinkButton> : null}
            </div>
            <div className="authority-dialog__nav">
              <Button onClick={onPrevious}>Previous authority</Button>
              <Button variant="primary" onClick={onVerify}>
                Verify &amp; next
              </Button>
              <Button onClick={onNext}>Next authority</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
