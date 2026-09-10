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
import './gallery.css'
import {
  en,
  pages,
  skuById,
  type NeonPageId,
  type PageAction,
  type PageDoc,
  type SkuCategory,
} from './content/load'
import { neonHref, pageHref } from './routes'

const PAGE_IDS: readonly NeonPageId[] = [
  'home',
  'services',
  'litigation',
  'fractional-gc',
  'personal-plan',
  'checkout',
]

function isNeonPage(value: string | null): value is NeonPageId {
  return PAGE_IDS.includes(value as NeonPageId)
}

function actionHref(action: PageAction): string {
  if (action.href.startsWith('mailto:') || action.href.startsWith('http')) return action.href
  return neonHref(action.href, action.sku)
}

function Blocks({ body }: { body: string }) {
  if (!body) return null
  return (
    <section className="neon-site__block">
      {body.split(/\n\n+/).map((block) =>
        block.startsWith('## ') ? (
          <h2 key={block}>{block.slice(3)}</h2>
        ) : (
          <p key={block}>{block.replace(/\n/g, ' ')}</p>
        ),
      )}
    </section>
  )
}

function PageHero({ doc }: { doc: PageDoc }) {
  const { matter } = doc
  return (
    <Hero
      align="start"
      eyebrow={matter.eyebrow}
      title={matter.title}
      lede={matter.lede.trim()}
      actions={
        <ButtonRow>
          <LinkButton variant="primary" href={actionHref(matter.primary)}>
            {matter.primary.label}
          </LinkButton>
          {matter.secondary ? <LinkButton href={actionHref(matter.secondary)}>{matter.secondary.label}</LinkButton> : null}
        </ButtonRow>
      }
    />
  )
}

function neonLinks(current: NeonPageId) {
  return en.nav.map((link) => ({
    label: link.label,
    href: neonHref(link.id),
    current: link.id === current || (link.id === 'services' && current === 'checkout'),
  }))
}

function NeonFrame({ page, children }: { page: NeonPageId; children: ReactNode }) {
  return (
    <PublicShell
      header={
        <SiteHeader
          brand={en.brand}
          brandHref={neonHref('home')}
          links={neonLinks(page)}
          utility={[{ label: en.catalog_label, href: pageHref('home') }]}
        />
      }
      footer={
        <SiteFooter
          cta={{ label: en.footer_cta, href: `mailto:${en.email}` }}
          phone={en.phone}
          links={[
            { label: 'Home', href: neonHref('home') },
            ...en.nav.map((link) => ({ label: link.label, href: neonHref(link.id) })),
            { label: 'Sample pages', href: pageHref('home') },
          ]}
          offices={[{ label: en.office.label, address: en.office.address }]}
          legal={
            <>
              {en.legal.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </>
          }
        />
      }
    >
      {children}
    </PublicShell>
  )
}

function HomePage() {
  const doc = pages.home
  return (
    <Stack>
      <PageHero doc={doc} />
      <Blocks body={doc.body} />
      <div className="neon-site__doors">
        {en.doors.map((door) => (
          <a className="neon-site__door" href={neonHref(door.id)} key={door.id}>
            <Card header={door.title}>
              <p>{door.body}</p>
            </Card>
          </a>
        ))}
      </div>
    </Stack>
  )
}

function ServicesPage() {
  const [category, setCategory] = useState<SkuCategory | 'all'>('all')
  const items = en.skus.filter((sku) => category === 'all' || sku.category === category)
  const doc = pages.services

  return (
    <Stack>
      <PageHero doc={doc} />
      <Callout tone="info">{en.callout}</Callout>
      <Blocks body={doc.body} />
      <Panel title={en.llc_panel.title} note={en.llc_panel.note}>
        <PricingGrid>
          {en.packages.map((plan) => (
            <PricingCard
              key={plan.id}
              name={plan.name}
              amount={plan.amount}
              period={plan.period}
              summary={plan.summary}
              features={plan.features}
              recommended={plan.recommended}
              cta={{
                label: plan.cta,
                href: plan.sku ? neonHref('checkout', plan.sku) : neonHref(plan.href),
              }}
            />
          ))}
        </PricingGrid>
      </Panel>
      <Panel title={en.shelf.title} note={en.shelf.note}>
        <div className="neon-site__chips" role="group" aria-label={en.shelf.category_label}>
          {en.categories.map((entry) => (
            <button
              key={entry.value}
              type="button"
              className={category === entry.value ? 'neon-site__chip is-current' : 'neon-site__chip'}
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
                {en.shelf.start_filing}
              </LinkButton>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title={en.process.title} note={en.process.note}>
        <ActionList items={en.process.steps} />
      </Panel>
      <Panel title={en.compare.title} note={en.compare.note}>
        <Table caption={en.compare.caption}>
          <TableHeader>
            <TableRow>
              {en.compare.headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {en.compare.rows.map((row) => (
              <TableRow key={row[0]}>
                {row.map((cell) => (
                  <TableCell key={cell}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
      <TestimonialSection heading={en.testimonials.heading} intro={en.testimonials.intro}>
        {en.testimonials.items.map((item) => (
          <TestimonialCard
            key={item.key}
            label={item.label}
            quote={item.quote}
            name={fakePerson(item.key).name}
            title={item.title}
          />
        ))}
      </TestimonialSection>
      <Accordion
        exclusive
        items={en.faq.map((item) => ({
          id: item.id,
          trigger: item.trigger,
          children: <p>{item.body}</p>,
        }))}
      />
      <LegalDisclaimer>{en.disclaimer}</LegalDisclaimer>
    </Stack>
  )
}

function DoorPage({ id }: { id: Exclude<NeonPageId, 'home' | 'services' | 'checkout'> }) {
  const doc = pages[id]
  const plan = id === 'fractional-gc' ? en.gc : id === 'personal-plan' ? en.personal : null
  return (
    <Stack>
      <PageHero doc={doc} />
      <Blocks body={doc.body} />
      {plan ? (
        <PricingGrid columns={1}>
          <PricingCard
            name={plan.name}
            amount={plan.amount}
            period={plan.period}
            summary={plan.summary}
            features={plan.features}
            cta={{ label: plan.cta, href: `mailto:${en.email}` }}
            recommended
          />
        </PricingGrid>
      ) : null}
    </Stack>
  )
}

function CheckoutPage({ skuId }: { skuId: string | null }) {
  const sku = skuById(skuId)
  const [sent, setSent] = useState(false)
  const copy = en.checkout

  return (
    <Stack>
      <Hero align="start" eyebrow={copy.eyebrow} title={sku.name} lede={`${sku.amount} ${sku.period}. ${sku.blurb}`} />
      {sent ? <Callout tone="success">{copy.sent}</Callout> : null}
      <div className="neon-site__checkout">
        <FormCard
          title={copy.form_title}
          intro={copy.form_intro}
          onSubmit={(event) => {
            event.preventDefault()
            setSent(true)
          }}
        >
          <input type="hidden" name="sku" value={sku.id} />
          <TextField label={copy.name} name="name" required />
          <TextField label={copy.email} name="email" type="email" required />
          <SelectField
            label={copy.jurisdiction}
            name="jurisdiction"
            placeholder={copy.jurisdiction_placeholder}
            options={copy.jurisdictions}
            required
          />
          <ChoiceGroup
            legend={copy.plan_legend}
            name="plan"
            defaultValue="filing-only"
            choices={copy.plans}
          />
          <TextareaField label={copy.notes} name="notes" rows={4} help={copy.notes_help} />
          <ButtonRow>
            <Button variant="primary" type="submit">
              {copy.continue}
            </Button>
            <LinkButton href={neonHref('services')}>{copy.back}</LinkButton>
          </ButtonRow>
        </FormCard>
        <Card header={copy.sku_header}>
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
              <Badge>{copy.state_fee_badge}</Badge>
            </p>
          ) : null}
        </Card>
      </div>
      <LegalDisclaimer>{copy.disclaimer}</LegalDisclaimer>
    </Stack>
  )
}

export function NeonSite() {
  const params =
    typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)
  const requested = params.get('id')
  const page: NeonPageId = isNeonPage(requested) ? requested : 'home'
  const sku = params.get('sku')

  let body = <HomePage />
  if (page === 'services') body = <ServicesPage />
  else if (page === 'litigation' || page === 'fractional-gc' || page === 'personal-plan') {
    body = <DoorPage id={page} />
  } else if (page === 'checkout') body = <CheckoutPage skuId={sku} />

  return <NeonFrame page={page}>{body}</NeonFrame>
}
