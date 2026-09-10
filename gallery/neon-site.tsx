import { useState, type ReactNode } from 'react'

import { fakePerson } from '../fixtures/fake.mjs'
import {
  Accordion,
  ActionList,
  Badge,
  Button,
  ButtonRow,
  Callout,
  Card,
  ChoiceGroup,
  FormCard,
  Hero,
  LegalDisclaimer,
  LinkButton,
  Panel,
  PricingCard,
  PricingGrid,
  PublicShell,
  SelectField,
  SiteFooter,
  SiteHeader,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TestimonialCard,
  TestimonialSection,
  TextField,
  TextareaField,
} from '../src/index'
import { COMPONENTS_HREF, neonHref, pageHref } from './routes'

type NeonPage = 'home' | 'services' | 'litigation' | 'fractional-gc' | 'personal-plan' | 'checkout'
type SkuCategory = 'company' | 'compliance' | 'identity' | 'estate' | 'contracts' | 'urgent'

interface Sku {
  id: string
  name: string
  blurb: string
  amount: string
  period: string
  category: SkuCategory
  includes: string[]
  stateFee?: boolean
}

const PAGES: readonly NeonPage[] = [
  'home',
  'services',
  'litigation',
  'fractional-gc',
  'personal-plan',
  'checkout',
]

function isNeonPage(value: string | null): value is NeonPage {
  return PAGES.includes(value as NeonPage)
}

const FOUNDER = fakePerson('neon-site/review-founder')
const FILER = fakePerson('neon-site/review-filer')
const TENANT = fakePerson('neon-site/review-tenant')

const SKUS: Sku[] = [
  {
    id: 'llc-file',
    name: 'LLC — File',
    blurb: 'Articles a licensed attorney reviews, then files. The state fee is billed at cost.',
    amount: '$249',
    period: '+ state fee',
    category: 'company',
    includes: ['Name check', 'Articles of organization', 'Attorney review before filing'],
    stateFee: true,
  },
  {
    id: 'llc-launch',
    name: 'LLC — Launch',
    blurb: 'The filing plus the papers a bank actually asks for.',
    amount: '$449',
    period: '+ state fee',
    category: 'company',
    includes: ['Everything in File', 'Operating agreement', 'EIN'],
    stateFee: true,
  },
  {
    id: 'nonprofit',
    name: 'Nonprofit and 501(c)(3)',
    blurb: 'Articles, bylaws, a conflict policy, and Form 1023. IRS user fee at cost.',
    amount: 'Quoted',
    period: 'before we start',
    category: 'company',
    includes: ['Articles and bylaws', 'Conflict-of-interest policy', 'Form 1023 through filing'],
    stateFee: true,
  },
  {
    id: 'annual-report',
    name: 'Nevada annual report',
    blurb: 'The annual list and the state business licence renewal for one entity.',
    amount: '$99',
    period: '+ state fee',
    category: 'compliance',
    includes: ['Annual list', 'Business licence renewal', 'Filed after attorney review'],
    stateFee: true,
  },
  {
    id: 'nv-address',
    name: 'Nevada business address',
    blurb: 'A Nevada street address for service of process and mail, forwarded to you.',
    amount: '$350',
    period: 'per year',
    category: 'compliance',
    includes: ['Street address for service', 'Mail forwarded'],
  },
  {
    id: 'trademark',
    name: 'Trademark application',
    blurb: 'A clearance search and one class of one application, through filing.',
    amount: '$399',
    period: '+ USPTO fee',
    category: 'identity',
    includes: ['Clearance search', 'One class, one application', 'Filed after attorney review'],
    stateFee: true,
  },
  {
    id: 'name-change',
    name: 'Uncontested name change',
    blurb: 'The petition, the publication notice, and the hearing.',
    amount: '$399',
    period: '+ court and publication costs',
    category: 'identity',
    includes: ['Petition', 'Publication notice', 'Hearing appearance'],
    stateFee: true,
  },
  {
    id: 'will',
    name: 'Simple will',
    blurb: 'One will, drafted from your answers and reviewed by a licensed attorney.',
    amount: '$499',
    period: 'one scope',
    category: 'estate',
    includes: ['Questionnaire to notation', 'Attorney-reviewed will', 'Signing and witnessing'],
  },
  {
    id: 'estate-package',
    name: 'Estate package',
    blurb: 'A will, a financial power of attorney, and a healthcare directive that agree with one another.',
    amount: '$899',
    period: 'one scope',
    category: 'estate',
    includes: ['Will', 'Financial power of attorney', 'Healthcare directive'],
  },
  {
    id: 'trust',
    name: 'Revocable living trust',
    blurb: 'The trust, a pour-over will, and the deed transferring one Nevada property into it.',
    amount: 'Quoted',
    period: 'before we start',
    category: 'estate',
    includes: ['Trust', 'Pour-over will', 'One Nevada deed'],
  },
  {
    id: 'nda',
    name: 'Mutual NDA review',
    blurb: 'One NDA, read end-to-end and redlined, with a short note on what changed and why.',
    amount: '$100',
    period: 'per contract',
    category: 'contracts',
    includes: ['Full read', 'Redline', 'Cover note'],
  },
  {
    id: 'consulting',
    name: 'Consulting agreement review',
    blurb: 'One consulting or independent-contractor agreement, redlined against your interests.',
    amount: '$250',
    period: 'per contract',
    category: 'contracts',
    includes: ['Full read', 'Redline', 'Independent-contractor terms'],
  },
  {
    id: 'employment',
    name: 'Employment agreement review',
    blurb: 'One offer letter or employment agreement, including any equity or non-compete terms.',
    amount: '$350',
    period: 'per contract',
    category: 'contracts',
    includes: ['Offer or employment agreement', 'Equity and non-compete review'],
  },
  {
    id: 'msa',
    name: 'MSA review',
    blurb: "The counterparty's master services agreement, not one we drafted for you.",
    amount: '$500',
    period: 'per contract',
    category: 'contracts',
    includes: ['Full read', 'Redline of their paper'],
  },
  {
    id: 'form-review',
    name: 'Form review',
    blurb: 'Filling out and reviewing one government or intake form, returned by a licensed attorney.',
    amount: '$50',
    period: '+ $5 per extra form in the same packet',
    category: 'contracts',
    includes: ['One form reviewed', 'Government fees at cost'],
  },
  {
    id: 'send-template',
    name: 'Send a template contract',
    blurb: 'One of our own template contracts, sent to your counterparty through DocuSign.',
    amount: '$5',
    period: 'per contract sent',
    category: 'contracts',
    includes: ['Firm template', 'DocuSign send and track'],
  },
  {
    id: 'demand',
    name: 'Demand letter',
    blurb: "One letter over the firm's signature, after we read what you have. It is not a retainer to litigate.",
    amount: '$350',
    period: 'one letter',
    category: 'urgent',
    includes: ['Read the record you send', 'One signed letter'],
  },
  {
    id: 'eviction',
    name: 'Tenant eviction defense',
    blurb: 'The answer and one hearing in a Nevada summary eviction.',
    amount: '$750',
    period: 'one hearing',
    category: 'urgent',
    includes: ['Answer', 'One summary-eviction hearing'],
  },
]

const CATEGORIES: { value: SkuCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All filings' },
  { value: 'company', label: 'Start a company' },
  { value: 'compliance', label: 'Stay current' },
  { value: 'identity', label: 'Name and mark' },
  { value: 'estate', label: 'Estate' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'urgent', label: 'Need it now' },
]

function skuById(id: string | null): Sku {
  const found = SKUS.find((sku) => sku.id === id)
  if (found) return found
  const fallback = SKUS.find((sku) => sku.id === 'llc-launch')
  if (!fallback) throw new Error('neon-site: llc-launch is missing from the catalog')
  return fallback
}

const LEGAL = (
  <>
    <p>
      Shook Law PLLC d/b/a Neon Law. Nevada. 5150 Mae Anne Ave Ste 405-9002, Reno, NV 89523.
      This gallery page is a public specimen — it does not open a matter, take payment, or file
      anything.
    </p>
    <p>© 2026 Shook Law PLLC.</p>
  </>
)

function neonLinks(current: NeonPage) {
  return [
    { label: 'Litigation', href: neonHref('litigation'), current: current === 'litigation' },
    { label: 'Fractional GC', href: neonHref('fractional-gc'), current: current === 'fractional-gc' },
    { label: 'Personal Plan', href: neonHref('personal-plan'), current: current === 'personal-plan' },
    {
      label: 'Services',
      href: neonHref('services'),
      current: current === 'services' || current === 'checkout',
    },
  ]
}

function NeonFrame({ page, children }: { page: NeonPage; children: ReactNode }) {
  return (
    <PublicShell
      header={
        <SiteHeader
          brand="Neon Law"
          brandHref={neonHref('home')}
          links={neonLinks(page)}
          utility={[
            { label: 'Catalog', href: pageHref('home') },
            { label: 'Components', href: COMPONENTS_HREF },
            { label: 'Contact', href: 'mailto:contact@neonlaw.com' },
          ]}
        />
      }
      footer={
        <SiteFooter
          cta={{ label: 'Email us', href: 'mailto:contact@neonlaw.com' }}
          phone={{ label: '+1 510 800 2080', href: 'tel:+15108002080' }}
          links={[
            { label: 'Home', href: neonHref('home') },
            { label: 'Services', href: neonHref('services') },
            { label: 'Litigation', href: neonHref('litigation') },
            { label: 'Fractional GC', href: neonHref('fractional-gc') },
            { label: 'Personal Plan', href: neonHref('personal-plan') },
            { label: 'Sample pages', href: pageHref('home') },
          ]}
          offices={[{ label: 'Nevada', address: '5150 Mae Anne Ave Ste 405-9002, Reno, NV 89523' }]}
          legal={LEGAL}
        />
      }
    >
      {children}
    </PublicShell>
  )
}

function HomePage() {
  return (
    <Stack>
      <Hero
        align="start"
        eyebrow="Neon Law"
        title="Everyone deserves to be seen."
        lede="Come in with the case you have. We take cases of every kind. The work we care about most is impact litigation: work whose point is to make a person's life better, and the lives of people in the same position. We listen, we move early, and we work as a team. That is how we work. It is not a promise about a result."
        actions={
          <ButtonRow>
            <LinkButton variant="primary" href={neonHref('litigation')}>
              Talk about a case
            </LinkButton>
            <LinkButton href={neonHref('services')}>File something today</LinkButton>
          </ButtonRow>
        }
      />

      <section className="neon-site__block">
        <h2>You have a place here.</h2>
        <p>
          The litigation practice is plaintiff and defense. We take the case that walks in, as long
          as we are not conflicted out. The work we seek is the dispute that changes a person&rsquo;s
          situation, and that can change it for people like them.
        </p>
        <p>
          We work as a team. You can meet us, and we bring in the specialists a matter needs. Speed
          is how we work. A person who is not heard loses ground whether or not the case is close.
          Moving early is how we keep that from happening quietly.
        </p>
        <p>
          We are also company counsel, a personal legal plan, and the lawyers for a will, a
          formation, or a filing. That work is the rest of the firm, not a sideline. Pick the door
          that fits.
        </p>
      </section>

      <div className="neon-site__doors">
        <a className="neon-site__door" href={neonHref('litigation')}>
          <Card header="Litigation">
            <p>
              Impact litigation, and every other dispute that walks in. Plaintiff and defense. We
              listen first.
            </p>
          </Card>
        </a>
        <a className="neon-site__door" href={neonHref('fractional-gc')}>
          <Card header="Fractional GC">
            <p>
              Ongoing company counsel on one flat annual or daily fee: contracts, licences,
              financings, and the advice under them, at the pace the sales cycle already runs.
            </p>
          </Card>
        </a>
        <a className="neon-site__door" href={neonHref('personal-plan')}>
          <Card header="Personal Plan">
            <p>
              Tax filing, privacy protection, and credit monitoring (beta), on one flat annual or
              daily fee.
            </p>
          </Card>
        </a>
        <a className="neon-site__door" href={neonHref('services')}>
          <Card header="One-Time Services">
            <p>
              A will, a trust, a formation, a trademark, an annual report. One scope and one flat
              fee, agreed before we start.
            </p>
          </Card>
        </a>
      </div>
    </Stack>
  )
}

function ServicesPage() {
  const [category, setCategory] = useState<SkuCategory | 'all'>('all')
  const items = SKUS.filter((sku) => category === 'all' || sku.category === category)

  return (
    <Stack>
      <Hero
        align="start"
        eyebrow="Filings · attorney-reviewed · notation-powered"
        title="Speedy, affordable legal filings. Buy the one you need."
        lede="Answers become a notation a licensed attorney reviews, then we file. Government fees pass through at cost. No membership required to start — a plan is cheaper if you will be back."
        actions={
          <ButtonRow>
            <LinkButton variant="primary" href={neonHref('checkout', 'llc-launch')}>
              Start an LLC
            </LinkButton>
            <LinkButton href={neonHref('fractional-gc')}>See the $10/day plan</LinkButton>
          </ButtonRow>
        }
      />

      <Callout tone="info">
        Specimen storefront. Prices marked quoted stay quoted; published contract-review fees match
        neonlaw.com. Nothing here charges a card or files with a state.
      </Callout>

      <section className="neon-site__block">
        <h2>Why this is not a $0 form mill</h2>
        <p>
          Bizee, LegalZoom, and Northwest sell speed and a published price. We want those too. What
          they cannot sell is a licensed attorney reading the packet, and a filing whose source is a
          notation — the same format Navigator uses for a brief — instead of a wizard that forgets
          why a box was checked.
        </p>
      </section>

      <Panel
        title="Form an LLC today"
        note="Three packages, state fee at cost. Launch is the one a bank actually accepts."
      >
        <PricingGrid>
          <PricingCard
            name="File"
            amount="$249"
            period="+ state fee"
            summary="Make the entity official."
            features={['Articles of organization', 'Name check', 'Attorney review before filing']}
            cta={{ label: 'Start File', href: neonHref('checkout', 'llc-file') }}
          />
          <PricingCard
            name="Launch"
            amount="$449"
            period="+ state fee"
            summary="File, then bank and hire."
            features={['Everything in File', 'Operating agreement', 'EIN']}
            cta={{ label: 'Start Launch', href: neonHref('checkout', 'llc-launch') }}
            recommended
          />
          <PricingCard
            name="Counsel"
            amount="$10"
            period="per day, billed annually, plus Launch"
            summary="The filing, then company counsel on call."
            features={[
              'Everything in Launch',
              'Fractional GC at $3,650 / year',
              'Standard document library',
              'Redline of paper you bring us at $100',
            ]}
            cta={{ label: 'Start with counsel', href: neonHref('fractional-gc') }}
          />
        </PricingGrid>
      </Panel>

      <Panel title="The rest of the shelf" note="Pick a category, then start. One scope, one price.">
        <div className="neon-site__chips" role="group" aria-label="Filing category">
          {CATEGORIES.map((entry) => (
            <button
              key={entry.value}
              type="button"
              className={
                category === entry.value ? 'neon-site__chip is-current' : 'neon-site__chip'
              }
              aria-pressed={category === entry.value}
              onClick={() => setCategory(entry.value)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <div className="neon-site__skus">
          {items.map((sku) => (
            <article className="neon-site__sku" key={sku.id}>
              <div className="neon-site__sku-topline">
                <h3>{sku.name}</h3>
                <p className="neon-site__price">
                  <strong>{sku.amount}</strong>
                  <span> {sku.period}</span>
                </p>
              </div>
              <p>{sku.blurb}</p>
              <ul>
                {sku.includes.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <LinkButton variant="primary" href={neonHref('checkout', sku.id)}>
                Start this filing
              </LinkButton>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="How a filing actually moves" note="Four steps. The notation is step two.">
        <ActionList
          items={[
            {
              id: 'account',
              title: 'Create an account',
              detail: 'Everything about the matter lives in one place.',
            },
            {
              id: 'answers',
              title: 'Answer some questions',
              detail:
                'A short questionnaire, scoped to the filing. Your answers become a notation — Markdown under YAML that names the source — not a trapped form.',
            },
            {
              id: 'docs',
              title: 'Upload what we ask for',
              detail: 'We tell you which documents the matter actually needs.',
            },
            {
              id: 'file',
              title: 'We file it, expeditiously',
              detail:
                'A licensed attorney reviews the notation, then we file and send the confirmation when it comes back.',
            },
          ]}
        />
      </Panel>

      <Panel title="Against the mills" note="Speed and a sticker price, without pretending a form is a lawyer.">
        <Table caption="How this storefront differs from a typical online formation mill">
          <TableHeader>
            <TableRow>
              <TableHead>What you are buying</TableHead>
              <TableHead>Typical mill</TableHead>
              <TableHead>This specimen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Who reads the packet</TableCell>
              <TableCell>A wizard, then a filing clerk</TableCell>
              <TableCell>A licensed attorney, every time</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Where the answers live</TableCell>
              <TableCell>A vendor form you cannot quote from</TableCell>
              <TableCell>A notation you can reuse in the next filing</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Government fees</TableCell>
              <TableCell>Often bundled until checkout</TableCell>
              <TableCell>Pass-through at cost, named on the card</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Headline price</TableCell>
              <TableCell>$0 plus add-ons</TableCell>
              <TableCell>The attorney fee, published up front</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Membership to buy a filing</TableCell>
              <TableCell>Upsells after you start</TableCell>
              <TableCell>Optional. Start à la carte.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Panel>

      <TestimonialSection
        heading="What people came in for"
        intro="Invented quotes on generated names. A specimen, not a review wall."
      >
        <TestimonialCard
          label="LLC — Launch"
          quote="I needed articles, an operating agreement, and an EIN before the bank appointment. The price was on the card."
          name={FOUNDER.name}
          title="First-time founder"
        />
        <TestimonialCard
          label="Nevada annual report"
          quote="Deadline on the calendar, fee on the page, filed after someone actually read it."
          name={FILER.name}
          title="One-person company"
        />
        <TestimonialCard
          label="Tenant eviction defense"
          quote="A five-day notice is not a newsletter signup. I could start the answer the same night."
          name={TENANT.name}
          title="Nevada tenant"
        />
      </TestimonialSection>

      <Accordion
        exclusive
        items={[
          {
            id: 'plan-required',
            trigger: 'Do I need a Fractional GC or Personal Plan?',
            children: (
              <p>
                Not to buy a filing on this page. The live neonlaw.com services page still requires
                a plan; this specimen is the storefront rewrite — à la carte first, plan as the
                better value if you will be back.
              </p>
            ),
          },
          {
            id: 'state-fees',
            trigger: 'Who sets the state or USPTO fee?',
            children: (
              <p>
                The government body. We pass it through at cost. We cannot control it, and we do
                not mark it up.
              </p>
            ),
          },
          {
            id: 'notation',
            trigger: 'What does “powered by notation” mean?',
            children: (
              <p>
                Your answers are stored as Markdown with YAML front matter — the same format a
                brief cites. Counsel reviews that source, not a screenshot of a wizard. A later
                annual report or amendment starts from the same file.
              </p>
            ),
          },
          {
            id: 'speed',
            trigger: 'How fast is it, really?',
            children: (
              <p>
                A document from the firm library can go out the same business day. A filing is as
                fast as the agency. We do not promise a result, and we do not pretend the Secretary
                of State works on our clock.
              </p>
            ),
          },
        ]}
      />

      <LegalDisclaimer>
        Attorney advertising. This page is a design specimen, not an offer to represent you, not a
        guarantee of a result, and not a substitute for advice on your facts. Engagement starts only
        after a conflicts check and a signed scope.
      </LegalDisclaimer>
    </Stack>
  )
}

function LitigationPage() {
  return (
    <Stack>
      <Hero
        align="start"
        eyebrow="Litigation"
        title="Litigation built for speed."
        lede="Come in with the case you have. We do as much as we can, as early as we can, and we work as a team. That is not the right approach for every case. It could be the right one for yours."
        actions={
          <ButtonRow>
            <LinkButton variant="primary" href="mailto:contact@neonlaw.com">
              Email the firm
            </LinkButton>
            <LinkButton href={neonHref('home')}>All doors</LinkButton>
          </ButtonRow>
        }
      />
      <section className="neon-site__block">
        <p>
          We represent those who haven&rsquo;t been justly seen. We take cases of every kind, for
          people and for companies. We focus on impact litigation: work whose point is to make a
          person&rsquo;s life better, and the lives of people in the same position. As long as we
          are not conflicted out, we will listen to your story and bring in the specialists it
          needs.
        </p>
        <p>
          All litigation matters run on Neon Law Navigator. Filings land on the matter by kind.
          Speed is how we work. It is not a promise about your result.
        </p>
      </section>
    </Stack>
  )
}

function FractionalGcPage() {
  return (
    <Stack>
      <Hero
        align="start"
        eyebrow="Fractional GC"
        title="Accurate. Efficient. Speedy."
        lede="One simple flat annual fee for just $10 a day that includes all your company basics, with predictable flat fees for the rest."
        actions={
          <LinkButton variant="primary" href="mailto:contact@neonlaw.com">
            Ask about a plan
          </LinkButton>
        }
      />
      <PricingGrid columns={1}>
        <PricingCard
          name="Base package"
          amount="$3,650"
          period="per year · $10 a day"
          summary="Standard document library, covered by one flat annual fee."
          features={[
            'Cap table management',
            'Standard employee and contractor agreements',
            'NDAs and standard commercial forms',
            'Basic taxes and state filings',
            'Corporate housekeeping',
            'Counsel on call, answered within three business days',
            'Redline of a document you bring us at $100, up to 100 pages',
            'DocuSign sent and tracked at $5 per contract',
          ]}
          cta={{ label: 'Email to start', href: 'mailto:contact@neonlaw.com' }}
          recommended
        />
      </PricingGrid>
    </Stack>
  )
}

function PersonalPlanPage() {
  return (
    <Stack>
      <Hero
        align="start"
        eyebrow="Personal Plan"
        title="Protected. Personally."
        lede="One simple flat fee — just $1 a day — for the legal work a person returns to year after year: taxes filed, your data kept private, and your credit watched."
        actions={
          <LinkButton variant="primary" href="mailto:contact@neonlaw.com">
            Ask about a spot
          </LinkButton>
        }
      />
      <PricingGrid columns={1}>
        <PricingCard
          name="Personal Legal Plan"
          amount="$365"
          period="per year · $1 a day"
          summary="We take on a limited number of members at a time."
          features={[
            'Tax filing and preparation',
            'Privacy protection requests',
            'Credit monitoring (beta)',
          ]}
          cta={{ label: 'Email to start', href: 'mailto:contact@neonlaw.com' }}
          recommended
        />
      </PricingGrid>
    </Stack>
  )
}

function CheckoutPage({ skuId }: { skuId: string | null }) {
  const sku = skuById(skuId)
  const [sent, setSent] = useState(false)

  return (
    <Stack>
      <Hero
        align="start"
        eyebrow="Start a filing"
        title={sku.name}
        lede={`${sku.amount} ${sku.period}. ${sku.blurb}`}
      />
      {sent ? (
        <Callout tone="success">
          Specimen only — nothing was charged or filed. A production app would run a conflicts check
          next, then open the questionnaire that emits the notation.
        </Callout>
      ) : null}
      <div className="neon-site__checkout">
        <FormCard
          title="Who is this filing for?"
          intro="Short on purpose. The questionnaire for this SKU comes after a conflicts check — this page only captures who to email."
          onSubmit={(event) => {
            event.preventDefault()
            setSent(true)
          }}
        >
          <input type="hidden" name="sku" value={sku.id} />
          <TextField label="Your name" name="name" required />
          <TextField label="Email address" name="email" type="email" required />
          <SelectField
            label="Where should we file?"
            name="jurisdiction"
            placeholder="Choose one"
            options={[
              { value: 'nv', label: 'Nevada' },
              { value: 'other', label: 'Another state — we will say if we can' },
            ]}
            required
          />
          <ChoiceGroup
            legend="Add Fractional GC at $10 a day?"
            name="plan"
            defaultValue="filing-only"
            choices={[
              {
                value: 'filing-only',
                label: 'Just this filing',
                description: 'À la carte. You can add a plan later.',
              },
              {
                value: 'with-gc',
                label: 'Filing plus Fractional GC',
                description: '$3,650 / year after this filing.',
              },
            ]}
          />
          <TextareaField
            label="Anything we should know before the questionnaire?"
            name="notes"
            rows={4}
            help="Do not include account passwords or payment card numbers."
          />
          <ButtonRow>
            <Button variant="primary" type="submit">
              Continue
            </Button>
            <LinkButton href={neonHref('services')}>Back to services</LinkButton>
          </ButtonRow>
        </FormCard>
        <Card header="This SKU">
          <p className="neon-site__price">
            <strong>{sku.amount}</strong>
            <span> {sku.period}</span>
          </p>
          <ul>
            {sku.includes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {sku.stateFee ? (
            <p>
              <Badge>Government fee at cost</Badge>
            </p>
          ) : null}
        </Card>
      </div>
      <LegalDisclaimer>
        Submitting this specimen does not create an attorney-client relationship and does not start
        a filing.
      </LegalDisclaimer>
    </Stack>
  )
}

export function NeonSite() {
  const params =
    typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)
  const requested = params.get('id')
  const page: NeonPage = isNeonPage(requested) ? requested : 'home'
  const sku = params.get('sku')

  let body = <HomePage />
  if (page === 'services') body = <ServicesPage />
  else if (page === 'litigation') body = <LitigationPage />
  else if (page === 'fractional-gc') body = <FractionalGcPage />
  else if (page === 'personal-plan') body = <PersonalPlanPage />
  else if (page === 'checkout') body = <CheckoutPage skuId={sku} />

  return <NeonFrame page={page}>{body}</NeonFrame>
}
