import {
  ActionList,
  AreaChart,
  BarChart,
  Callout,
  Decision,
  DecisionGrid,
  FactCard,
  FactGrid,
  LineChart,
  PieChart,
  type ChatMessage,
} from '../src/index'

/*
 * Twelve mocked copilot threads — one per zodiac — for the gallery.
 *
 * Each turn is invented specimen data (Northwind / Vance). The tool lines
 * name real Navigator seams (`navigator` CLI, `aida_*` MCP tools, `/app/api`)
 * but nothing here executes them.
 */

const PROJECT = '00000000-0000-4000-8000-000000000001'

export interface ZodiacChat {
  id: string
  sign: string
  glyph: string
  title: string
  note: string
  messages: ChatMessage[]
}

function user(id: string, text: string): ChatMessage {
  return {
    id,
    role: 'user',
    name: 'Dana Whitfield',
    initials: 'DW',
    parts: [{ type: 'text', id: `${id}-t`, text }],
  }
}

function notice(text: string): ChatMessage {
  return {
    id: 'notice',
    role: 'system',
    parts: [{ type: 'text', id: 'notice-t', text }],
  }
}

export const ZODIAC_CHATS: ZodiacChat[] = [
  {
    id: 'aries',
    sign: 'Aries',
    glyph: '♈',
    title: 'Answer due tonight',
    note: 'Name the fire: the deadline, then the call.',
    messages: [
      notice('Staff copilot. This thread is not a filing and not legal advice.'),
      user('a1', 'Five-day notice. Answer is due tonight. What is on the Northwind eviction matter?'),
      {
        id: 'a2',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            id: 'a2-t',
            text: 'The matter is open. I will read it and queue a template render — neither is a court filing.',
          },
          {
            type: 'tool',
            tool: {
              id: 'get-project',
              kind: 'api',
              name: 'Read matter',
              command: `GET /app/api/projects/${PROJECT}`,
              status: 'done',
              result: 'NW-0724 · answer due 4 Sep 2026 · status open.',
            },
          },
          {
            type: 'tool',
            tool: {
              id: 'render',
              kind: 'cli',
              name: 'Render answer template',
              command: 'navigator template render --notation eviction-answer --project NW-0724',
              status: 'running',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'taurus',
    sign: 'Taurus',
    glyph: '♉',
    title: 'Make the LLC record solid',
    note: 'A title change is a receipt, not a vibe.',
    messages: [
      notice('Staff copilot. This thread is not a filing and not legal advice.'),
      user('t1', 'Rename the formation matter so it matches the articles: Northwind Supply LLC.'),
      {
        id: 't2',
        role: 'assistant',
        parts: [
          { type: 'text', id: 't2-t', text: 'Updating the project title in the store. The articles themselves are unchanged.' },
          {
            type: 'tool',
            tool: {
              id: 'cli-update',
              kind: 'cli',
              name: 'Update project',
              command: 'navigator project update --id NW-0724 --title "Northwind Supply LLC"',
              status: 'done',
              result: 'Title is now Northwind Supply LLC.',
            },
          },
          {
            type: 'card',
            id: 't-facts',
            children: (
              <FactGrid>
                <FactCard title="Entity">Northwind Supply LLC</FactCard>
                <FactCard title="Jurisdiction">Nevada</FactCard>
                <FactCard title="Status">Articles drafted, not filed</FactCard>
              </FactGrid>
            ),
          },
        ],
      },
    ],
  },
  {
    id: 'gemini',
    sign: 'Gemini',
    glyph: '♊',
    title: 'Two worlds, one notation',
    note: 'English prompt, Spanish answers — same matter.',
    messages: [
      notice('Staff copilot. This thread is not a filing and not legal advice.'),
      user('g1', 'The family answers in Spanish. Open a notation that can carry a localized prompt.'),
      {
        id: 'g2',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            id: 'g2-t',
            text: 'A questionnaire prompt may carry an attorney-reviewed localized variant. The template body stays English. Creating the notation.',
          },
          {
            type: 'tool',
            tool: {
              id: 'create-notation',
              kind: 'mcp',
              name: 'Create notation',
              command: 'aida_create_notation · project NW-0724 · kind intake',
              status: 'done',
              result: 'Notation ntn_northwind_intake created.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'cancer',
    sign: 'Cancer',
    glyph: '♋',
    title: 'One next step for the household',
    note: 'Do not ask an exhausted caregiver to hunt a form.',
    messages: [
      notice('Staff copilot. This thread is not a filing and not legal advice.'),
      user('c1', 'Post a short note on the guardianship matter so the family sees one next step.'),
      {
        id: 'c2',
        role: 'assistant',
        parts: [
          { type: 'text', id: 'c2-t', text: 'Posting to the client-visible thread. One sentence, one date.' },
          {
            type: 'tool',
            tool: {
              id: 'post-msg',
              kind: 'api',
              name: 'Post conversation message',
              command: `POST /app/api/projects/${PROJECT}/conversation/messages`,
              status: 'done',
              result: '204 · “Please send the hospital letter by Friday. That is all we need this week.”',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'leo',
    sign: 'Leo',
    glyph: '♌',
    title: 'Phase 0 before the fight',
    note: 'A chart of exposure, then a dignified next step.',
    messages: [
      notice('Staff copilot. This thread is not a filing and not legal advice.'),
      user('l1', 'They want to sue Northwind. Show me the Phase 0 assessment, not a pep talk.'),
      {
        id: 'l2',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            id: 'l2-t',
            text: 'Listing the caller’s matters and the invented exposure series from the gallery. This is a specimen, not a case valuation.',
          },
          {
            type: 'tool',
            tool: {
              id: 'list-projects',
              kind: 'mcp',
              name: 'List matters',
              command: 'aida_list_projects',
              status: 'done',
              result: '1 open matter · NW-0724 Vance v. Northwind.',
            },
          },
          {
            type: 'card',
            id: 'exposure',
            children: (
              <BarChart
                label="Claimed quarterly exposure, thousands"
                data={[
                  { label: 'Q1', value: 128 },
                  { label: 'Q2', value: 206 },
                  { label: 'Q3', value: 174 },
                  { label: 'Q4', value: 261 },
                ]}
              />
            ),
          },
          {
            type: 'card',
            id: 'decision',
            children: (
              <DecisionGrid>
                <Decision title="Phase 0" kicker="Next" tone="ready">
                  Flat-fee case assessment. No complaint is filed from this thread.
                </Decision>
                <Decision title="Referral out" kicker="Boundary" tone="wait">
                  If the caption is outside our lane, the no is still a path.
                </Decision>
              </DecisionGrid>
            ),
          },
        ],
      },
    ],
  },
  {
    id: 'virgo',
    sign: 'Virgo',
    glyph: '♍',
    title: 'Exact form, exact deadline',
    note: 'Name the filing. Vague dates are a risk.',
    messages: [
      notice('Staff copilot. This thread is not a filing and not legal advice.'),
      user('v1', 'Nevada annual list. What form, what due date, which entity?'),
      {
        id: 'v2',
        role: 'assistant',
        parts: [
          { type: 'text', id: 'v2-t', text: 'Reading the entity record. The obligation is the Annual List of Officers, due the last day of the anniversary month.' },
          {
            type: 'tool',
            tool: {
              id: 'entity',
              kind: 'api',
              name: 'Read entity',
              command: 'GET /app/api/entities/00000000-0000-4000-8000-0000000000e1',
              status: 'done',
              result: 'Northwind Supply LLC · formed 12 Mar 2025 · NV.',
            },
          },
          {
            type: 'card',
            id: 'deadlines',
            children: (
              <FactGrid>
                <FactCard title="Form">Nevada Annual List of Officers</FactCard>
                <FactCard title="Due">31 March 2027</FactCard>
                <FactCard title="Entity file">NV-2025-0001844 (specimen)</FactCard>
              </FactGrid>
            ),
          },
        ],
      },
    ],
  },
  {
    id: 'libra',
    sign: 'Libra',
    glyph: '♎',
    title: 'Worth walking in?',
    note: 'Weigh opening a matter against doing it themselves.',
    messages: [
      notice('Staff copilot. This thread is not a filing and not legal advice.'),
      user('lb1', 'Prospective client. LLC vs doing it on the Secretary of State site. Should we open a matter?'),
      {
        id: 'lb2',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            id: 'lb2-t',
            text: 'I will not open a matter from a maybe. Here is the comparison they can actually use. A lawyer still decides.',
          },
          {
            type: 'card',
            id: 'weigh',
            children: (
              <FactGrid>
                <FactCard title="DIY">File articles on the state site. No operating agreement review.</FactCard>
                <FactCard title="With us">Articles, registered agent, and an agreement, one flat fee.</FactCard>
                <FactCard title="Decision">Open only after conflict check and attestation.</FactCard>
              </FactGrid>
            ),
          },
        ],
      },
    ],
  },
  {
    id: 'scorpio',
    sign: 'Scorpio',
    glyph: '♏',
    title: 'Ask without exposing the story',
    note: 'The receipt names the request id, not the facts.',
    messages: [
      notice('Staff copilot. This thread is not a filing and not legal advice.'),
      user('s1', 'They asked about sealing. List expunge requests. Do not put the underlying facts in this thread.'),
      {
        id: 's2',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            id: 's2-t',
            text: 'Listing request ids only. The application body stays in the matter record, not here.',
          },
          {
            type: 'tool',
            tool: {
              id: 'expunge',
              kind: 'api',
              name: 'List expunge requests',
              command: 'GET /app/api/expunge-requests',
              status: 'done',
              result: '1 request · xpg_7f3a · status pending counsel review.',
            },
          },
          {
            type: 'card',
            id: 'privacy',
            children: (
              <Callout tone="warning">
                Do not paste charging documents or identifying facts into chat. The tool already
                returned an id.
              </Callout>
            ),
          },
        ],
      },
    ],
  },
  {
    id: 'sagittarius',
    sign: 'Sagittarius',
    glyph: '♐',
    title: 'Open the matter and keep moving',
    note: 'Create the project, then the next horizon.',
    messages: [
      notice('Staff copilot. This thread is not a filing and not legal advice.'),
      user('sg1', 'Founder is ready. Open a formation matter for Northwind Supply LLC.'),
      {
        id: 'sg2',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            id: 'sg2-t',
            text: 'Opening requires a pre-existing client person, an entity, and a true attestation. Running the MCP tool with specimen ids.',
          },
          {
            type: 'tool',
            tool: {
              id: 'create-project',
              kind: 'mcp',
              name: 'Open matter',
              command:
                'aida_create_project · entity ent_northwind · client ppl_amara · attestation true',
              status: 'done',
              result: `Opened ${PROJECT} · code NW-0724.`,
            },
          },
          {
            type: 'card',
            id: 'next',
            children: (
              <ActionList
                items={[
                  { id: 'agent', title: 'Registered agent', detail: 'Confirm the Nevada agent before articles.' },
                  { id: 'oa', title: 'Operating agreement', detail: 'Draft after the name is locked.' },
                  { id: 'ein', title: 'EIN', detail: 'Only after the entity exists at the state.' },
                ]}
              />
            ),
          },
        ],
      },
    ],
  },
  {
    id: 'capricorn',
    sign: 'Capricorn',
    glyph: '♑',
    title: 'A will that still reads in ten years',
    note: 'Update the project. Do not rush the gravity.',
    messages: [
      notice('Staff copilot. This thread is not a filing and not legal advice.'),
      user('cp1', 'Estate plan for an elder. Set the project title to the trust name and show the funding timeline.'),
      {
        id: 'cp2',
        role: 'assistant',
        parts: [
          { type: 'text', id: 'cp2-t', text: 'Title updated. The timeline is a specimen of funding steps, not a promise of what was signed.' },
          {
            type: 'tool',
            tool: {
              id: 'estate-update',
              kind: 'cli',
              name: 'Update project',
              command: 'navigator project update --id NW-0724 --title "Northwind Family Trust"',
              status: 'done',
              result: 'Title is now Northwind Family Trust.',
            },
          },
          {
            type: 'card',
            id: 'funding',
            children: (
              <LineChart
                label="Specimen funding steps completed"
                data={[
                  { label: 'Will', value: 1 },
                  { label: 'Trust', value: 1 },
                  { label: 'Deed', value: 0 },
                  { label: 'Accounts', value: 0 },
                ]}
              />
            ),
          },
        ],
      },
    ],
  },
  {
    id: 'aquarius',
    sign: 'Aquarius',
    glyph: '♒',
    title: 'A co-op is still an entity',
    note: 'List what exists before forcing a textbook LLC.',
    messages: [
      notice('Staff copilot. This thread is not a filing and not legal advice.'),
      user('aq1', 'Mutual-aid group. They are not a standard LLC. What entity types do we even have?'),
      {
        id: 'aq2',
        role: 'assistant',
        parts: [
          { type: 'text', id: 'aq2-t', text: 'Listing entity types and entities. A co-op is not an error; it is a shape the forms have to name.' },
          {
            type: 'tool',
            tool: {
              id: 'types',
              kind: 'api',
              name: 'List entity types',
              command: 'GET /app/api/entity-types',
              status: 'done',
              result: 'llc · corporation · cooperative · unincorporated-association.',
            },
          },
          {
            type: 'tool',
            tool: {
              id: 'entities',
              kind: 'mcp',
              name: 'List entities',
              command: 'aida_list_entities',
              status: 'done',
              result: 'Northwind Workers Cooperative · draft.',
            },
          },
          {
            type: 'card',
            id: 'mix',
            children: (
              <PieChart
                label="Specimen matters by entity shape"
                data={[
                  { label: 'LLC', value: 12 },
                  { label: 'Co-op', value: 3 },
                  { label: 'Unincorporated', value: 2 },
                ]}
              />
            ),
          },
        ],
      },
    ],
  },
  {
    id: 'pisces',
    sign: 'Pisces',
    glyph: '♓',
    title: 'The door that does not ask too much',
    note: 'One field. A pending call. Then one sentence back.',
    messages: [
      notice('Staff copilot. This thread is not a filing and not legal advice.'),
      user('p1', 'I need help and I do not know the name of anything.'),
      {
        id: 'p2',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            id: 'p2-t',
            text: 'You do not have to name the form. I will list the matters on this login. If none fit, a lawyer reads the sentence you already wrote.',
          },
          {
            type: 'tool',
            tool: {
              id: 'list-pending',
              kind: 'mcp',
              name: 'List matters',
              command: 'aida_list_projects',
              status: 'pending',
            },
          },
          {
            type: 'card',
            id: 'volume',
            children: (
              <AreaChart
                label="Specimen weekly intakes, last six weeks"
                data={[
                  { label: 'W1', value: 4 },
                  { label: 'W2', value: 6 },
                  { label: 'W3', value: 5 },
                  { label: 'W4', value: 9 },
                  { label: 'W5', value: 7 },
                  { label: 'W6', value: 8 },
                ]}
              />
            ),
          },
        ],
      },
    ],
  },
]
