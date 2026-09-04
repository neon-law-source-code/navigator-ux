import {
  useId,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { Avatar } from './Display'
import { Empty, Spinner } from './Indicators'
import { NavButton } from './Navigation'
import { Badge, type BadgeTone } from './Primitives'

/*
 * A conversational thread with a composer.
 *
 * This is a record of what was asked and what Navigator did — not a runtime
 * that does it. Messages arrive as props. A card is whatever the caller
 * already rendered (a chart, a fact grid). A tool part is a receipt for a
 * CLI, MCP, or `/app/api` call the consuming app made; the leaf rule still
 * holds, so nothing here shells out, talks to an MCP server, or calls
 * `apiFetch`. `SourceThread` remains the verbatim correspondence surface.
 */

export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatToolKind = 'cli' | 'mcp' | 'api'

export type ChatToolStatus = 'pending' | 'running' | 'done' | 'error'

export interface ChatToolCall {
  id: string
  kind: ChatToolKind
  /** Short name for the work — "Update project", "List matters". */
  name: string
  /** The invocation as the reader would type or inspect it. */
  command: string
  status: ChatToolStatus
  /** Short result line. Never a dump of a privileged payload. */
  result?: ReactNode
}

export type ChatPart =
  | { type: 'text'; id: string; text: ReactNode }
  | { type: 'card'; id: string; children: ReactNode }
  | { type: 'tool'; tool: ChatToolCall }

export interface ChatMessage {
  id: string
  role: ChatRole
  /** Who is speaking. Defaults by role. */
  name?: string
  initials?: string
  parts: ChatPart[]
}

export interface ChatProps {
  messages: ChatMessage[]
  'aria-label'?: string
  composer?: ReactNode
  empty?: ReactNode
}

export interface ChatComposerProps {
  /** Called with the trimmed body. When set, the form does not navigate. */
  onSend?: (text: string) => void
  /** Where it posts if `onSend` is omitted — same contract as `FormCard`. */
  action?: string
  method?: 'get' | 'post'
  /** Field name for the body. Defaults to `body`, matching the conversation API. */
  name?: string
  placeholder?: string
  disabled?: boolean
  label?: string
  sendLabel?: string
}

const ROLE_NAME: Record<ChatRole, string> = {
  user: 'You',
  assistant: 'Navigator',
  system: 'Notice',
}

const KIND_LABEL: Record<ChatToolKind, string> = {
  cli: 'CLI',
  mcp: 'MCP',
  api: 'API',
}

const STATUS_LABEL: Record<ChatToolStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  done: 'Done',
  error: 'Failed',
}

const STATUS_TONE: Record<ChatToolStatus, BadgeTone> = {
  pending: 'next',
  running: 'review',
  done: 'ready',
  error: 'blocked',
}

function speakerName(message: ChatMessage): string {
  return message.name ?? ROLE_NAME[message.role]
}

function ChatToolCard({ tool }: { tool: ChatToolCall }) {
  const headingId = useId()
  return (
    <details className="nav-chat__tool" data-kind={tool.kind} data-status={tool.status} open>
      <summary className="nav-chat__tool-summary" id={headingId}>
        {tool.status === 'running' ? <Spinner size="sm" label={`${tool.name} running`} /> : null}
        <span className="nav-chat__tool-name">{tool.name}</span>
        <Badge>{KIND_LABEL[tool.kind]}</Badge>
        <Badge tone={STATUS_TONE[tool.status]}>{STATUS_LABEL[tool.status]}</Badge>
      </summary>
      <div className="nav-code">
        <pre>
          <code>{tool.command}</code>
        </pre>
      </div>
      {tool.result ? <div className="nav-chat__tool-result">{tool.result}</div> : null}
    </details>
  )
}

function MessageParts({ parts }: { parts: ChatPart[] }) {
  return (
    <div className="nav-chat__parts">
      {parts.map((part) => {
        if (part.type === 'text') {
          return (
            <div className="nav-chat__text" key={part.id}>
              {part.text}
            </div>
          )
        }
        if (part.type === 'card') {
          return (
            <div className="nav-chat__card" key={part.id}>
              {part.children}
            </div>
          )
        }
        return <ChatToolCard key={part.tool.id} tool={part.tool} />
      })}
    </div>
  )
}

/**
 * A back-and-forth thread that can hold cards and tool receipts.
 *
 * The log is a live region so a newly arrived assistant turn is announced.
 * The composer is a separate form the caller supplies, typically
 * `ChatComposer`.
 */
export function Chat({
  messages,
  'aria-label': ariaLabel = 'Conversation',
  composer,
  empty,
}: ChatProps) {
  return (
    <div className="nav-chat">
      <div className="nav-chat__log" role="log" aria-live="polite" aria-label={ariaLabel}>
        {messages.length === 0
          ? (empty ?? (
              <Empty
                title="No messages yet"
                description="Ask for a matter, a chart, or a Navigator command."
              />
            ))
          : messages.map((message) => (
              <article
                className="nav-chat__message"
                data-role={message.role}
                key={message.id}
              >
                {message.role === 'system' ? (
                  <p className="nav-chat__system">
                    {message.parts[0]?.type === 'text' ? message.parts[0].text : null}
                  </p>
                ) : (
                  <>
                    <header className="nav-chat__head">
                      <Avatar name={speakerName(message)} initials={message.initials} size="sm" />
                      <span className="nav-chat__speaker">{speakerName(message)}</span>
                    </header>
                    <MessageParts parts={message.parts} />
                  </>
                )}
              </article>
            ))}
      </div>
      {composer}
    </div>
  )
}

/**
 * The field at the bottom of a thread.
 *
 * A native form. Without `onSend` it posts like any other form — which is how
 * a portal can hit `POST /app/api/projects/{id}/conversation/messages` with no
 * client bundle. Enter sends; Shift+Enter inserts a line.
 */
export function ChatComposer({
  onSend,
  action,
  method = 'post',
  name = 'body',
  placeholder = 'Write a message',
  disabled,
  label = 'Message',
  sendLabel = 'Send',
}: ChatComposerProps) {
  const id = useId()
  const formRef = useRef<HTMLFormElement>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    if (!onSend) return
    event.preventDefault()
    const form = event.currentTarget
    const field = form.elements.namedItem(name)
    const value = field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement ? field.value.trim() : ''
    if (!value) return
    onSend(value)
    form.reset()
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    formRef.current?.requestSubmit()
  }

  return (
    <form
      className="nav-chat__composer"
      ref={formRef}
      action={action}
      method={method}
      onSubmit={submit}
    >
      <label className="nav-visually-hidden" htmlFor={id}>
        {label}
      </label>
      <textarea
        className="nav-input nav-chat__input"
        id={id}
        name={name}
        rows={3}
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={onKeyDown}
      />
      <NavButton variant="primary" type="submit" disabled={disabled}>
        {sendLabel}
      </NavButton>
    </form>
  )
}
