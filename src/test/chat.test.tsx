import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { fakeCaption, fakeMatterCode, fakePerson } from '../../fixtures/fake.mjs'
import { Chat, ChatComposer, type ChatMessage } from '../index'

const SPEAKER = fakePerson('chat/speaker')
const CAPTION = fakeCaption('chat/matter')
const MATTER_CODE = fakeMatterCode('chat/matter')

const TURN: ChatMessage[] = [
  {
    id: 'sys',
    role: 'system',
    parts: [{ type: 'text', id: 'notice', text: 'Staff thread. Nothing here is legal advice.' }],
  },
  {
    id: 'u1',
    role: 'user',
    name: SPEAKER.name,
    initials: SPEAKER.initials,
    parts: [{ type: 'text', id: 'ask', text: 'Update the project title.' }],
  },
  {
    id: 'a1',
    role: 'assistant',
    parts: [
      { type: 'text', id: 'ack', text: 'I will patch the matter and show the receipt.' },
      {
        type: 'tool',
        tool: {
          id: 'patch',
          kind: 'api',
          name: 'Update project',
          command: 'PATCH /app/api/projects/00000000-0000-4000-8000-000000000001',
          status: 'done',
          result: `Title set to ${CAPTION}.`,
        },
      },
      {
        type: 'card',
        id: 'facts',
        children: <p>{`Matter code ${MATTER_CODE} is still open.`}</p>,
      },
    ],
  },
]

describe('Chat', () => {
  it('renders the log, speakers, a tool receipt, and an embedded card', () => {
    render(<Chat messages={TURN} aria-label="Matter copilot" />)

    expect(screen.getByRole('log', { name: 'Matter copilot' })).toBeInTheDocument()
    expect(screen.getByText('Staff thread. Nothing here is legal advice.')).toBeInTheDocument()
    expect(screen.getByText(SPEAKER.name)).toBeInTheDocument()
    expect(screen.getByText('Navigator')).toBeInTheDocument()
    expect(screen.getByText('Update project')).toBeInTheDocument()
    expect(screen.getByText('API')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(
      screen.getByText('PATCH /app/api/projects/00000000-0000-4000-8000-000000000001'),
    ).toBeInTheDocument()
    expect(screen.getByText(`Matter code ${MATTER_CODE} is still open.`)).toBeInTheDocument()
    expect(document.querySelector('[data-role="user"]')).not.toBeNull()
    expect(document.querySelector('[data-status="done"]')).toHaveAttribute('data-kind', 'api')
  })

  it('renders CLI, MCP, pending, and error receipts, and default speaker names', () => {
    render(
      <Chat
        messages={[
          { id: 'u', role: 'user', parts: [{ type: 'text', id: 'u-t', text: 'Go.' }] },
          {
            id: 'a',
            role: 'assistant',
            parts: [
              {
                type: 'tool',
                tool: {
                  id: 'mcp',
                  kind: 'mcp',
                  name: 'List matters',
                  command: 'aida_list_projects',
                  status: 'pending',
                },
              },
              {
                type: 'tool',
                tool: {
                  id: 'cli',
                  kind: 'cli',
                  name: 'Render',
                  command: 'navigator template render --notation x',
                  status: 'error',
                  result: 'Template missing.',
                },
              },
            ],
          },
        ]}
      />,
    )
    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByText('MCP')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('CLI')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('Template missing.')).toBeInTheDocument()
  })

  it('shows a spinner on a running tool', () => {
    render(
      <Chat
        messages={[
          {
            id: 'a',
            role: 'assistant',
            parts: [
              {
                type: 'tool',
                tool: {
                  id: 'run',
                  kind: 'cli',
                  name: 'Render answer',
                  command: 'navigator template render --notation eviction-answer',
                  status: 'running',
                },
              },
            ],
          },
        ]}
      />,
    )
    expect(screen.getByText('Render answer running')).toBeInTheDocument()
    expect(document.querySelector('[data-status="running"]')).not.toBeNull()
  })

  it('shows the empty state when the thread has no turns', () => {
    render(<Chat messages={[]} />)
    expect(screen.getByText('No messages yet')).toBeInTheDocument()
  })

  it('takes a custom empty and a composer', () => {
    render(
      <Chat
        messages={[]}
        empty={<p>Ask about the matter.</p>}
        composer={<ChatComposer action="/app/api/projects/1/conversation/messages" />}
      />,
    )
    expect(screen.getByText('Ask about the matter.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
    expect(document.querySelector('form')).toHaveAttribute(
      'action',
      '/app/api/projects/1/conversation/messages',
    )
  })
})

describe('ChatComposer', () => {
  it('calls onSend with the trimmed body and clears the field', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatComposer onSend={onSend} />)

    const field = screen.getByRole('textbox', { name: 'Message' })
    await user.type(field, '  list the matters  ')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(onSend).toHaveBeenCalledTimes(1)
    expect(onSend).toHaveBeenCalledWith('list the matters')
    expect(field).toHaveValue('')
  })

  it('does not send an empty body', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatComposer onSend={onSend} />)
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSend).not.toHaveBeenCalled()
  })

  it('sends on Enter and inserts a line on Shift+Enter', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatComposer onSend={onSend} />)
    const field = screen.getByRole('textbox', { name: 'Message' })

    await user.type(field, 'first line')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    await user.type(field, 'second line')
    expect(field).toHaveValue('first line\nsecond line')

    await user.keyboard('{Enter}')
    expect(onSend).toHaveBeenCalledWith('first line\nsecond line')
  })

  it('posts as a native form when onSend is omitted', () => {
    const { container } = render(
      <ChatComposer action="/app/api/projects/1/conversation/messages" method="post" />,
    )
    const form = container.querySelector('form')
    expect(form).toHaveAttribute('action', '/app/api/projects/1/conversation/messages')
    expect(form).toHaveAttribute('method', 'post')
    expect(form).toHaveAttribute('class', 'nav-chat__composer')
  })
})

function LiveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  return (
    <Chat
      messages={messages}
      composer={
        <ChatComposer
          onSend={(text) => {
            setMessages((prev) => [
              ...prev,
              { id: `u-${prev.length}`, role: 'user', parts: [{ type: 'text', id: `t-${prev.length}`, text }] },
            ])
          }}
        />
      }
    />
  )
}

describe('Chat with a live composer', () => {
  it('appends the sent turn to the log', async () => {
    const user = userEvent.setup()
    render(<LiveChat />)
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Show the docket')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(screen.getByText('Show the docket')).toBeInTheDocument()
    expect(screen.queryByText('No messages yet')).toBeNull()
  })
})
