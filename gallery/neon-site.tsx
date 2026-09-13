import { useEffect, useState, type ReactNode } from 'react'

import {
  Accordion, ActionList, Badge, NavButton, ButtonRow, Callout, Card, Empty,
  FormCard, Hero, NavLinkButton, PricingCard, PricingGrid, type HeroImage,
  PublicShell, SelectField, SiteFooter, SiteHeader, TextField, TextareaField,
} from '../src/index'
import './gallery.css'
import { FindNeed } from './find-need'
import {
  en, pages, relatedSkus, skuById,
  type NeonPageId, type PageAction, type PageDoc, type Sku, type SkuCategory,
  type SubscriptionPlan,
} from './content/load'
import { neonHref, pageHref, readGalleryLocation } from './routes'

const HOME_HERO_IMAGE: HeroImage = {
  sources: [
    { type: 'image/avif', srcSet: `${import.meta.env.BASE_URL}images/neon-hero.avif 1600w` },
    { type: 'image/jpeg', srcSet: `${import.meta.env.BASE_URL}images/neon-hero.jpg 1600w` },
  ],
  src: `${import.meta.env.BASE_URL}images/neon-hero.jpg`,
  alt: 'An invented city skyline at twilight across a calm river.',
  sizes: '100vw',
}

function emailHref(subject: string) {
  return `mailto:${en.email}?subject=${encodeURIComponent(subject)}`
}

function actionHref(action: PageAction): string {
  if (action.href.startsWith('mailto:') || action.href.startsWith('http')) return action.href
  return neonHref(action.href, action.sku)
}

function Blocks({ body }: { body: string }) {
  if (!body) return null
  return (
    <div className="neon-site__block">
      {body.split(/\n\n+/).map((block) =>
        block.startsWith('## ') ? <h2 key={block}>{block.slice(3)}</h2> : <p key={block}>{block.replace(/\n/g, ' ')}</p>,
      )}
    </div>
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
      actions={matter.primary ? (
        <ButtonRow>
          <NavLinkButton size="lg" variant="primary" href={actionHref(matter.primary)}>{matter.primary.label}</NavLinkButton>
          {matter.secondary ? <NavLinkButton size="lg" href={actionHref(matter.secondary)}>{matter.secondary.label}</NavLinkButton> : null}
        </ButtonRow>
      ) : undefined}
    />
  )
}

function NeonFrame({ page, children }: { page: NeonPageId; children: ReactNode }) {
  useEffect(() => {
    const previous = document.title
    const title = page === 'home' ? en.find.prompt : page === 'checkout' ? en.checkout.eyebrow : pages[page].matter.eyebrow
    document.title = `${title} | ${en.brand}`
    return () => { document.title = previous }
  }, [page])

  return (
    <PublicShell
      header={
        <SiteHeader
          brand={en.brand}
          brandHref={neonHref('home')}
          links={en.nav.map((link) => ({
            label: link.label,
            href: neonHref(link.id),
            current: link.id === page || (link.id === 'services' && page === 'checkout'),
          }))}
        />
      }
      footer={
        <SiteFooter
          cta={{ label: en.footer_cta, href: `mailto:${en.email}` }}
          phone={en.phone}
          links={[
            { label: 'Home', href: neonHref('home') },
            ...en.nav.map((link) => ({ label: link.label, href: neonHref(link.id) })),
            { label: 'Design gallery', href: pageHref('home') },
          ]}
          offices={[{ label: en.office.label, address: en.office.address }]}
          legal={<>{en.legal.map((line) => <p key={line}>{line}</p>)}<p>{en.specimen}</p></>}
        />
      }
    >
      <div className="neon-site">{children}</div>
    </PublicShell>
  )
}

function PlanHeader({ plan, showPhoto = false }: { plan: SubscriptionPlan; showPhoto?: boolean }) {
  return (
    <div className="neon-site__plan-heading">
      <div>
        <span className="neon-site__eyebrow">{plan.audience}</span>
        <h3>{plan.name}</h3>
      </div>
      {showPhoto ? <img className="neon-site__plan-photo" src={plan.image.src} alt={plan.image.alt} loading="lazy" decoding="async" /> : null}
    </div>
  )
}

function PlanCards({ plans = en.plans, service }: { plans?: SubscriptionPlan[]; service?: Sku }) {
  return (
    <PricingGrid columns={plans.length}>
      {plans.map((plan) => (
        <PricingCard
          key={plan.id}
          name={<PlanHeader plan={plan} />}
          amount={plan.amount}
          period={plan.period}
          summary={plan.summary}
          features={plan.highlights}
          cta={{ label: en.subscriptions.cta, href: neonHref(plan.id, service?.id) }}
        />
      ))}
    </PricingGrid>
  )
}

function PlanTerms() {
  return (
    <div className="neon-site__terms">
      <p>{en.subscriptions.forms}</p>
      <p>{en.subscriptions.reviews}</p>
    </div>
  )
}

function Subscriptions({ showHeading = true }: { showHeading?: boolean }) {
  return (
    <section className="neon-site__section" aria-label={showHeading ? undefined : en.subscriptions.title} aria-labelledby={showHeading ? 'plans-title' : undefined} id="plans">
      {showHeading ? <div className="neon-site__section-head">
        <h2 id="plans-title">{en.subscriptions.title}</h2>
        <p>{en.subscriptions.intro}</p>
      </div> : null}
      <PlanCards />
      <PlanTerms />
    </section>
  )
}

function LitigationOffer() {
  return (
    <section className="neon-site__litigation" aria-labelledby="litigation-title">
      <div>
        <span className="neon-site__eyebrow">{pages.litigation.matter.eyebrow}</span>
        <h2 id="litigation-title">{en.litigation.title}</h2>
        <p>{en.litigation.body}</p>
      </div>
      <div>
        <NavLinkButton size="lg" href={neonHref('litigation')}>{en.litigation.cta}</NavLinkButton>
        <p className="neon-site__muted">{en.litigation.note}</p>
      </div>
    </section>
  )
}

function HomePage() {
  const doc = pages.home
  return (
    <>
      <div className="neon-site__opening"><FindNeed heroImage={HOME_HERO_IMAGE} /></div>
      <section className="neon-site__mission" aria-labelledby="mission-title">
        <h2 id="mission-title">{doc.matter.title}</h2>
        <div>
          <p className="neon-site__north-star">{doc.matter.lede.trim()}</p>
          <Blocks body={doc.body} />
        </div>
      </section>
      <section className="neon-site__practices" aria-labelledby="practices-title">
        <div className="neon-site__section-head">
          <h2 id="practices-title">{en.practices_heading}</h2>
        </div>
        <div className="neon-site__practice-grid">
          {en.practices.map((practice) => (
            <Card key={practice.heading} icon={practice.icon} className="neon-site__practice-card">
              <h3><a href={neonHref(practice.href.replace(/^\//, ''))}>{practice.heading}</a></h3>
              <p>{practice.body}</p>
            </Card>
          ))}
        </div>
      </section>
      <Subscriptions />
      <LitigationOffer />
      <section className="neon-site__browse">
        <div><h2>{en.catalog.title}</h2><p>{en.catalog.note}</p></div>
        <NavLinkButton size="lg" href={neonHref('services')}>{pages.services.matter.eyebrow}</NavLinkButton>
      </section>
    </>
  )
}

function matches(needle: string, text: string) {
  const terms = needle.toLowerCase().split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term && !/^(i|a|an|the|my|our|need|help|with|for|to|me|about|have|want|am|is)$/.test(term))
  return terms.every((term) => text.toLowerCase().includes(term))
}

function matchesService(sku: Sku, needle: string) {
  const category = en.categories.find((entry) => entry.value === sku.category)?.label ?? ''
  const audience = sku.category === 'estate' ? 'personal family legacy' : ''
  return matches(needle, `${sku.item} ${sku.name} ${sku.blurb} ${category} ${audience} ${(sku.keywords ?? []).join(' ')}`)
}

function ServiceFee({ sku }: { sku: Sku }) {
  const label = sku.membersOnly ? en.catalog.member_fee_label
    : sku.flatFee === 'form' ? en.catalog.form_fee_label : en.catalog.fee_label
  return (
    <p className="neon-site__service-fee">
      <span className="neon-site__eyebrow">{label}</span>
      <strong>{sku.flatFee ? en.catalog.flat_fee : sku.amount}</strong> <span>{sku.period}</span>
      {sku.flatFee === 'form' ? <span className="neon-site__fee-note">{en.catalog.form_fee_note}</span> : null}
    </p>
  )
}

function ServiceList({ items }: { items: Sku[] }) {
  return (
    <ul className="neon-site__services">
      {items.map((sku) => (
        <li key={sku.id}>
          <div>
            <h3><a href={neonHref('checkout', sku.id)}>{sku.name}</a></h3>
            <p>{sku.blurb}</p>
            {sku.membersOnly ? <Badge>{en.catalog.members}</Badge> : null}
          </div>
          <ServiceFee sku={sku} />
          <NavLinkButton size="lg" href={neonHref('checkout', sku.id)}>
            {sku.membersOnly ? en.catalog.choose_plan : en.catalog.start}
          </NavLinkButton>
        </li>
      ))}
    </ul>
  )
}

function ServicesPage({ initialQuery }: { initialQuery: string }) {
  const [category, setCategory] = useState<SkuCategory | 'all'>('all')
  const [query, setQuery] = useState(initialQuery)
  const needle = query.trim()
  const items = en.skus.filter((sku) => (category === 'all' || sku.category === category) && matchesService(sku, needle))
  const plans = needle && category === 'all'
    ? en.plans.filter((plan) => matches(needle, `${plan.name} ${plan.summary} ${plan.keywords.join(' ')}`)) : []
  const litigation = !!needle && (category === 'all' || category === 'urgent')
    && matches(needle, `${en.litigation.body} ${en.litigation.keywords.join(' ')}`)
  const noResults = !items.length && !plans.length && !litigation

  function changeQuery(value: string) {
    setQuery(value)
    setCategory('all')
  }

  return (
    <>
      <PageHero doc={pages.services} />
      {!needle ? <><Subscriptions showHeading={false} /><LitigationOffer /></> : null}
      <section className="neon-site__section" aria-label={en.catalog.title}>
        <FindNeed headingLevel={2} query={query} onQueryChange={changeQuery} />
        <nav className="neon-site__categories" aria-label={en.catalog.category_label}>
          {en.categories.map((entry) => (
            <button
              key={entry.value} type="button"
              className={category === entry.value ? 'neon-site__chip is-current' : 'neon-site__chip'}
              aria-pressed={category === entry.value}
              onClick={() => setCategory(entry.value)}
            >{entry.label}</button>
          ))}
        </nav>
        {needle ? <PlanTerms /> : null}
        {plans.length ? <PlanCards plans={plans} /> : null}
        {litigation ? <LitigationOffer /> : null}
        <div aria-live="polite" aria-atomic="true">
          {noResults ? (
            <Empty
              title={en.catalog.empty} description={en.catalog.empty_help}
              action={<ButtonRow>
                <NavLinkButton size="lg" href={`mailto:${en.email}`}>{en.find.help_cta}</NavLinkButton>
                <NavButton size="lg" onClick={() => changeQuery('')}>{en.catalog.clear}</NavButton>
              </ButtonRow>}
            />
          ) : null}
        </div>
        {items.length ? <ServiceList items={items} /> : null}
      </section>
      <section className="neon-site__section" aria-labelledby="process-title">
        <h2 id="process-title">{en.process.title}</h2>
        <ActionList items={en.process.steps} />
      </section>
      <Accordion exclusive items={en.faq.map((item) => ({ id: item.id, trigger: item.trigger, children: <p>{item.body}</p> }))} />
    </>
  )
}

function PlanPage({ plan, skuId }: { plan: SubscriptionPlan; skuId: string | null }) {
  const service = en.skus.find((sku) => sku.id === skuId)
  const subject = `${plan.name} membership${service ? ` — ${service.name}` : ''}`
  return (
    <>
      <PageHero doc={pages[plan.id]} />
      {service ? <p>{en.subscriptions.interest}: <strong>{service.name}</strong></p> : null}
      <div className="neon-site__plan-detail">
        <PricingCard
          name={<PlanHeader plan={plan} showPhoto />} amount={plan.amount} period={plan.period}
          summary={plan.summary} features={[...plan.highlights, ...plan.features]}
          cta={{ label: en.subscriptions.join, href: emailHref(subject) }}
        />
        <div className="neon-site__stack"><PlanTerms />{service?.membersOnly ? <ServiceFee sku={service} /> : null}</div>
      </div>
    </>
  )
}

function CheckoutPage({ skuId }: { skuId: string | null }) {
  const sku = skuById(skuId)
  const [sent, setSent] = useState(false)
  const copy = en.checkout
  const related = relatedSkus(sku)

  return (
    <>
      <Hero align="start" eyebrow={copy.eyebrow} title={sku.name} lede={sku.blurb} />
      {sent ? <Callout tone="success">{copy.sent}</Callout> : null}
      <Card header={copy.sku_header}>
        <div className="neon-site__stack">
          <ServiceFee sku={sku} />
          <ul>{sku.includes.map((line) => <li key={line}>{line}</li>)}</ul>
          {sku.stateFee ? <p><Badge>{copy.state_fee_badge}</Badge></p> : null}
          <PlanTerms />
          {!sku.membersOnly ? <NavLinkButton size="lg" href={`${neonHref('services')}#plans`}>{en.subscriptions.cta}</NavLinkButton> : null}
          {related.length ? (
            <div className="neon-site__related">
              <h2>{en.catalog.related_header}</h2>
              <p>{en.catalog.related_note}</p>
              <ul>{related.map((item) => <li key={item.id}><a href={neonHref('checkout', item.id)}>{item.name}</a></li>)}</ul>
            </div>
          ) : null}
        </div>
      </Card>
      {sku.membersOnly ? (
        <section className="neon-site__section" aria-labelledby="membership-title">
          <div className="neon-site__section-head">
            <h2 id="membership-title">{en.subscriptions.member_title}</h2>
            <p>{en.subscriptions.member_intro}</p>
          </div>
          <PlanCards service={sku} />
          <a href={emailHref(`Subscriber request — ${sku.name}`)}>{en.subscriptions.member_cta}</a>
        </section>
      ) : (
        <FormCard title={copy.form_title} intro={copy.form_intro} onSubmit={(event) => { event.preventDefault(); setSent(true) }}>
          <input type="hidden" name="sku" value={sku.id} />
          <TextField label={copy.name} name="name" required />
          <TextField label={copy.email} name="email" type="email" required />
          <SelectField label={copy.jurisdiction} name="jurisdiction" placeholder={copy.jurisdiction_placeholder} options={copy.jurisdictions} required />
          <TextareaField label={copy.notes} name="notes" rows={3} help={copy.notes_help} />
          <NavButton size="lg" variant="primary" type="submit">{copy.continue}</NavButton>
        </FormCard>
      )}
      <NavLinkButton size="lg" href={neonHref('services')}>{copy.back}</NavLinkButton>
    </>
  )
}

export function NeonSite() {
  const { pageId, sku, q = '' } = readGalleryLocation()
  const page: NeonPageId = pageId === 'checkout' || (pageId && pageId in pages) ? pageId as NeonPageId : 'home'
  const plan = en.plans.find((entry) => entry.id === page)
  const body = page === 'services' ? <ServicesPage initialQuery={q} />
    : page === 'checkout' ? <CheckoutPage skuId={sku} />
    : plan ? <PlanPage plan={plan} skuId={sku} />
    : page === 'litigation' ? <><PageHero doc={pages.litigation} /><Blocks body={pages.litigation.body} /></>
    : <HomePage />
  return <NeonFrame page={page}>{body}</NeonFrame>
}
