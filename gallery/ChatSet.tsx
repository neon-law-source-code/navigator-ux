import { useState, type ComponentType, type ReactNode } from 'react'

import { Chat, ChatComposer, type ChatMessage } from '../src/index'
import { ZODIAC_CHATS } from './zodiac-chats'

interface SectionProps {
  title: string
  note?: ReactNode
  children: ReactNode
}

function LiveCopilot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'notice',
      role: 'system',
      parts: [
        {
          type: 'text',
          id: 'notice-t',
          text: 'Staff copilot specimen. Messages stay in this page. Nothing is sent.',
        },
      ],
    },
  ])

  function onSend(text: string) {
    const n = messages.length
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${n}`,
        role: 'user',
        name: 'Dana Whitfield',
        initials: 'DW',
        parts: [{ type: 'text', id: `u-${n}-t`, text }],
      },
      {
        id: `a-${n}`,
        role: 'assistant',
        parts: [
          {
            type: 'text',
            id: `a-${n}-t`,
            text: 'Specimen reply. In a portal this is where the app would call Navigator and append a tool receipt.',
          },
          {
            type: 'tool',
            tool: {
              id: `tool-${n}`,
              kind: 'cli',
              name: 'Echo (specimen)',
              command: `navigator project update --id NW-0724 --note ${JSON.stringify(text)}`,
              status: 'done',
              result: 'Not executed. The composer only appends to this page.',
            },
          },
        ],
      },
    ])
  }

  return (
    <Chat
      messages={messages}
      aria-label="Live specimen copilot"
      composer={<ChatComposer onSend={onSend} placeholder="Ask to update a project, list matters, or render a chart." />}
    />
  )
}

export function ChatSet({ Section }: { Section: ComponentType<SectionProps> }) {
  const [sign, setSign] = useState(ZODIAC_CHATS[0]?.id ?? 'aries')
  const chat = ZODIAC_CHATS.find((entry) => entry.id === sign) ?? ZODIAC_CHATS[0]

  return (
    <>
      <Section
        title="Chat"
        note="A thread of asks, cards, and receipts for CLI, MCP, and API work. The library renders; the app executes."
      >
        <LiveCopilot />
      </Section>
      <Section
        title="Twelve zodiac threads"
        note="One mocked copilot conversation per sign. Invented Northwind facts; the commands name real Navigator seams."
      >
        <div className="gallery__zodiac" role="group" aria-label="Zodiac chats">
          {ZODIAC_CHATS.map((entry) => {
            const selected = entry.id === sign
            return (
              <button
                type="button"
                aria-pressed={selected}
                className={selected ? 'gallery__zodiac-tab is-current' : 'gallery__zodiac-tab'}
                key={entry.id}
                onClick={() => setSign(entry.id)}
              >
                <span aria-hidden="true">{entry.glyph}</span> {entry.sign}
              </button>
            )
          })}
        </div>
        {chat ? (
          <>
            <p className="gallery__note">
              {chat.glyph} {chat.title} — {chat.note}
            </p>
            <Chat
              messages={chat.messages}
              aria-label={`${chat.sign} specimen conversation`}
              composer={<ChatComposer disabled placeholder="This specimen is read-only." />}
            />
          </>
        ) : null}
      </Section>
    </>
  )
}
