import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/*
 * PdfViewer, against a stubbed pdf.js.
 *
 * jsdom has no canvas and no worker, so the real library cannot run here — and
 * mocking it is not a compromise. What is worth testing is this component's
 * own logic: that a render in flight is cancelled before another starts, that
 * a cancellation is not reported as a failure, and that the controls clamp to
 * the document. None of that is pdf.js's behavior.
 */

const renderTask = { promise: Promise.resolve(), cancel: vi.fn() }
const getViewport = vi.fn(({ scale }: { scale: number }) => ({
  width: 612 * scale,
  height: 792 * scale,
}))
const page = { getViewport, render: vi.fn(() => renderTask), getTextContent: vi.fn() }

const getPage = vi.fn(async () => page)
const destroy = vi.fn(async () => {})
const getDocument = vi.fn(() => ({
  promise: Promise.resolve({ numPages: 3, getPage, destroy }),
}))

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: (...args: unknown[]) => getDocument(...(args as [])),
}))

// eslint-disable-next-line import/first
import { PdfViewer } from '../index'

beforeEach(() => {
  vi.clearAllMocks()
  renderTask.cancel = vi.fn()
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({}) as CanvasRenderingContext2D) as never
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PdfViewer', () => {
  it('opens a document and reports the page count', async () => {
    render(<PdfViewer src="/documents/notice.pdf" label="Notice of rescission" />)

    // The spinner names the document, not the widget.
    expect(screen.getByText('Opening Notice of rescission')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByText('Page 1 of 3')).toBeInTheDocument())
    expect(getDocument).toHaveBeenCalledWith({ url: '/documents/notice.pdf' })
  })

  it('pages forward and clamps at both ends', async () => {
    const user = userEvent.setup()
    render(<PdfViewer src="/a.pdf" label="Draft" />)
    await waitFor(() => expect(screen.getByText('Page 1 of 3')).toBeInTheDocument())

    // Already at the first page, so back is unavailable.
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Next page' }))
    await waitFor(() => expect(screen.getByText('Page 2 of 3')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Next page' }))
    await waitFor(() => expect(screen.getByText('Page 3 of 3')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('zooms within bounds and rescales the viewport', async () => {
    const user = userEvent.setup()
    render(<PdfViewer src="/a.pdf" label="Draft" initialScale={1} />)
    await waitFor(() => expect(screen.getByText('100%')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    await waitFor(() => expect(screen.getByText('120%')).toBeInTheDocument())
    // The viewport is recomputed at the new scale, which is what resizes the
    // canvas and the text layer together.
    await waitFor(() => expect(getViewport).toHaveBeenCalledWith({ scale: 1.2 }))

    await user.click(screen.getByRole('button', { name: 'Zoom out' }))
    await waitFor(() => expect(screen.getByText('100%')).toBeInTheDocument())
  })

  it('clamps an out-of-range initial page to the document', async () => {
    render(<PdfViewer src="/a.pdf" label="Draft" initialPage={99} />)
    await waitFor(() => expect(screen.getByText('Page 3 of 3')).toBeInTheDocument())
  })

  it('reports a failure to open rather than showing an empty frame', async () => {
    getDocument.mockImplementationOnce(
      () => ({ promise: Promise.reject(new Error('Missing PDF header')) }) as never,
    )
    render(<PdfViewer src="/broken.pdf" label="Draft" />)

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Missing PDF header'))
  })

  it('treats a cancelled render as expected, not as an error', async () => {
    page.render.mockImplementationOnce(
      () =>
        ({
          promise: Promise.reject(new Error('Rendering cancelled')),
          cancel: vi.fn(),
        }) as never,
    )
    render(<PdfViewer src="/a.pdf" label="Draft" />)

    await waitFor(() => expect(screen.getByText('Page 1 of 3')).toBeInTheDocument())
    // A cancellation is the normal path when a reader pages quickly.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('destroys the document on unmount so the worker is released', async () => {
    const { unmount } = render(<PdfViewer src="/a.pdf" label="Draft" />)
    await waitFor(() => expect(screen.getByText('Page 1 of 3')).toBeInTheDocument())
    unmount()
    await waitFor(() => expect(destroy).toHaveBeenCalled())
  })
})

describe('PdfViewer edge paths', () => {
  it('stops short rather than throwing when the canvas has no 2d context', async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as never
    render(<PdfViewer src="/a.pdf" label="Draft" />)
    await waitFor(() => expect(screen.getByText('Page 1 of 3')).toBeInTheDocument())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('surfaces a non-Error rejection as readable text', async () => {
    getDocument.mockImplementationOnce(() => ({ promise: Promise.reject('nope') }) as never)
    render(<PdfViewer src="/a.pdf" label="Draft" />)
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('The document could not be opened.'),
    )
  })

  it('reports a genuine render failure', async () => {
    page.render.mockImplementationOnce(
      () => ({ promise: Promise.reject(new Error('Corrupt page tree')), cancel: vi.fn() }) as never,
    )
    render(<PdfViewer src="/a.pdf" label="Draft" />)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Corrupt page tree'))
  })

  it('discards a document that resolves after unmount', async () => {
    const { unmount } = render(<PdfViewer src="/late.pdf" label="Draft" />)
    unmount()
    await waitFor(() => expect(destroy).toHaveBeenCalled())
  })
})
