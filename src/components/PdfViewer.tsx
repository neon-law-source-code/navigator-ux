import { useCallback, useEffect, useRef, useState } from 'react'

import { Spinner } from './Indicators'

/*
 * PdfViewer — a rendered document, with a real text layer.
 *
 * The documents this is for come out of `navigator template render`: Typst
 * compiled to PDF, on court-paper geometry, from a validated notation template.
 * A lawyer reading one needs to quote from it and cite a page, so a canvas-only
 * viewer is not enough — the text layer is the feature, not a nicety. It is
 * what makes the document selectable, searchable by the browser's own find, and
 * copyable into a brief without retyping.
 *
 * pdf.js is imported for its side-effect-free API only; the worker is resolved
 * through `import.meta.url` so the bundler emits it as a same-origin asset.
 * Pointing `workerSrc` at a CDN is the usual shortcut and it would fail
 * `check:bundle`, which reads `dist` for exactly that.
 *
 * Rendering is cancellable. A reader paging quickly can start a second render
 * before the first resolves, and pdf.js will happily draw both onto the same
 * canvas — the interleaved result is a page with two documents on it.
 */

export interface PdfViewerProps {
  /** URL of the PDF. Same-origin, or CORS-enabled. */
  src: string
  /** Names the document for assistive technology. */
  label: string
  /** First page to show, 1-based. */
  initialPage?: number
  /** Rendering scale. 1 is the PDF's own page size. */
  initialScale?: number
  /**
   * Where to load the pdf.js worker from.
   *
   * Only needed under a bundler that cannot resolve it automatically — see the
   * note below on why the CJS build cannot. Must be same-origin: a CDN URL
   * here works, and fails `check:bundle` in any app that has the same rule.
   */
  workerSrc?: string
}

type Status = 'loading' | 'ready' | 'failed'

/** Minimal structural types — pdf.js ships its own, but only the parts used. */
interface PdfPage {
  getViewport(options: { scale: number }): { width: number; height: number }
  render(options: {
    canvasContext: CanvasRenderingContext2D
    viewport: { width: number; height: number }
  }): { promise: Promise<void>; cancel(): void }
  getTextContent(): Promise<{ items: unknown[] }>
}

interface PdfDocument {
  numPages: number
  getPage(pageNumber: number): Promise<PdfPage>
  destroy(): Promise<void>
}

/**
 * The bundled worker's URL, or `null` where it cannot be resolved.
 *
 * `import.meta.url` is how a bundler is told to emit the worker as a
 * same-origin asset, and it is the whole reason this does not point at a CDN.
 * But the library also ships a CJS build, and there `import.meta` is replaced
 * with `{}` at build time — so `import.meta.url` is `undefined`, `new URL()`
 * throws, and a CJS consumer would get a crash instead of a document.
 *
 * Returning `null` leaves pdf.js on its own default, which is the right
 * outcome: the viewer still works, and a consumer whose bundler needs help can
 * pass `workerSrc` explicitly.
 */
function defaultWorkerSrc(): string | null {
  try {
    const base = import.meta.url
    if (!base) return null
    return new URL('pdfjs-dist/build/pdf.worker.min.mjs', base).toString()
  } catch {
    return null
  }
}

export function PdfViewer({
  src,
  label,
  initialPage = 1,
  initialScale = 1.2,
  workerSrc,
}: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const documentRef = useRef<PdfDocument | null>(null)
  const renderRef = useRef<{ cancel(): void } | null>(null)

  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [page, setPage] = useState(initialPage)
  const [scale, setScale] = useState(initialScale)

  // Load the document. Re-runs only when the source changes, so paging and
  // zooming never re-fetch.
  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setError(null)

    ;(async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        const worker = workerSrc ?? defaultWorkerSrc()
        if (worker) pdfjs.GlobalWorkerOptions.workerSrc = worker

        const task = pdfjs.getDocument({ url: src })
        const loaded = (await task.promise) as unknown as PdfDocument
        if (cancelled) {
          await loaded.destroy()
          return
        }
        documentRef.current = loaded
        setPageCount(loaded.numPages)
        setPage((current) => Math.min(Math.max(1, current), loaded.numPages))
        setStatus('ready')
      } catch (cause) {
        if (cancelled) return
        setStatus('failed')
        setError(cause instanceof Error ? cause.message : 'The document could not be opened.')
      }
    })()

    return () => {
      cancelled = true
      const loaded = documentRef.current
      documentRef.current = null
      void loaded?.destroy()
    }
  }, [src, workerSrc])

  // Draw the current page. Any in-flight render is cancelled first.
  useEffect(() => {
    if (status !== 'ready') return
    const loaded = documentRef.current
    const canvas = canvasRef.current
    if (!loaded || !canvas) return

    let cancelled = false
    ;(async () => {
      try {
        const target = await loaded.getPage(page)
        if (cancelled) return
        const viewport = target.getViewport({ scale })
        const context = canvas.getContext('2d')
        if (!context) return

        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`

        renderRef.current?.cancel()
        const task = target.render({ canvasContext: context, viewport })
        renderRef.current = task
        await task.promise
        if (cancelled) return
        renderRef.current = null

        // The text layer is positioned over the canvas at the same scale, so
        // its box has to track the viewport too.
        const layer = textLayerRef.current
        if (layer) {
          layer.style.width = `${viewport.width}px`
          layer.style.height = `${viewport.height}px`
        }
      } catch (cause) {
        // A cancelled render rejects, and that is the expected path when a
        // reader pages quickly. Only a real failure should surface.
        if (cancelled) return
        const message = cause instanceof Error ? cause.message : String(cause)
        if (message.toLowerCase().includes('cancel')) return
        setStatus('failed')
        setError(message)
      }
    })()

    return () => {
      cancelled = true
      renderRef.current?.cancel()
      renderRef.current = null
    }
  }, [status, page, scale])

  const step = useCallback(
    (by: number) => setPage((current) => Math.min(Math.max(1, current + by), pageCount || 1)),
    [pageCount],
  )

  return (
    <div className="nav-pdf">
      <div className="nav-pdf__bar">
        <div className="nav-pdf__pager" role="group" aria-label="Page navigation">
          <button
            type="button"
            className="nav-pdf__control"
            onClick={() => step(-1)}
            disabled={status !== 'ready' || page <= 1}
            aria-label="Previous page"
          >
            <span aria-hidden="true">&#8249;</span>
          </button>
          <span className="nav-pdf__count" aria-live="polite">
            {status === 'ready' ? `Page ${page} of ${pageCount}` : '—'}
          </span>
          <button
            type="button"
            className="nav-pdf__control"
            onClick={() => step(1)}
            disabled={status !== 'ready' || page >= pageCount}
            aria-label="Next page"
          >
            <span aria-hidden="true">&#8250;</span>
          </button>
        </div>
        <div className="nav-pdf__zoom" role="group" aria-label="Zoom">
          <button
            type="button"
            className="nav-pdf__control"
            onClick={() => setScale((current) => Math.max(0.5, current - 0.2))}
            disabled={status !== 'ready'}
            aria-label="Zoom out"
          >
            <span aria-hidden="true">&#8722;</span>
          </button>
          <span className="nav-pdf__scale">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            className="nav-pdf__control"
            onClick={() => setScale((current) => Math.min(3, current + 0.2))}
            disabled={status !== 'ready'}
            aria-label="Zoom in"
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>

      <div className="nav-pdf__stage" aria-label={label} role="document">
        {status === 'loading' ? (
          <div className="nav-pdf__status">
            <Spinner label={`Opening ${label}`} />
          </div>
        ) : null}
        {status === 'failed' ? (
          <p className="nav-pdf__status nav-pdf__status--failed" role="alert">
            {error ?? 'The document could not be opened.'}
          </p>
        ) : null}
        <div className="nav-pdf__page" hidden={status !== 'ready'}>
          <canvas className="nav-pdf__canvas" ref={canvasRef} />
          <div className="nav-pdf__text" ref={textLayerRef} />
        </div>
      </div>
    </div>
  )
}
