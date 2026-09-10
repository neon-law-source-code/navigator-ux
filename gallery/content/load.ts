import { parse } from 'yaml'

import enRaw from './en.yaml?raw'
import fractionalGcMd from './pages/fractional-gc.md?raw'
import homeMd from './pages/home.md?raw'
import litigationMd from './pages/litigation.md?raw'
import personalPlanMd from './pages/personal-plan.md?raw'
import servicesMd from './pages/services.md?raw'

export type NeonPageId = 'home' | 'services' | 'litigation' | 'fractional-gc' | 'personal-plan' | 'checkout'
export type SkuCategory = 'company' | 'compliance' | 'identity' | 'estate' | 'contracts' | 'urgent'

export interface PageAction {
  label: string
  href: string
  sku?: string
}

export interface PageMatter {
  eyebrow: string
  title: string
  lede: string
  primary: PageAction
  secondary?: PageAction
}

export interface PageDoc {
  matter: PageMatter
  body: string
}

export interface Sku {
  id: string
  item: string
  status: string
  name: string
  blurb: string
  amount: string
  period: string
  category: SkuCategory
  includes: string[]
  stateFee: boolean
  related?: string[]
}

export interface EnCopy {
  brand: string
  catalog_label: string
  email: string
  phone: { label: string; href: string }
  office: { label: string; address: string }
  footer_cta: string
  legal: string[]
  nav: { id: NeonPageId; label: string }[]
  doors: { id: NeonPageId; title: string; body: string }[]
  categories: { value: SkuCategory | 'all'; label: string; blurb: string }[]
  packages: {
    id: string
    name: string
    amount: string
    period: string
    summary: string
    sku: string | null
    recommended: boolean
    cta: string
    href: 'checkout' | NeonPageId
    features: string[]
  }[]
  skus: Sku[]
  catalog: {
    title: string
    note: string
    search_label: string
    search_placeholder: string
    item_header: string
    name_header: string
    status_header: string
    price_header: string
    add: string
    empty: string
    status_active: string
    details_for: string
    related_header: string
    related_note: string
  }
  llc_panel: { title: string; note: string }
  shelf: { title: string; note: string; start_filing: string; category_label: string }
  process: { title: string; note: string; steps: { id: string; title: string; detail: string }[] }
  compare: { title: string; note: string; caption: string; headers: string[]; rows: string[][] }
  testimonials: {
    heading: string
    intro: string
    items: { key: string; label: string; quote: string; title: string }[]
  }
  faq: { id: string; trigger: string; body: string }[]
  disclaimer: string
  callout: string
  gc: { name: string; amount: string; period: string; summary: string; cta: string; features: string[] }
  personal: { name: string; amount: string; period: string; summary: string; cta: string; features: string[] }
  checkout: {
    eyebrow: string
    sent: string
    form_title: string
    form_intro: string
    name: string
    email: string
    jurisdiction: string
    jurisdiction_placeholder: string
    jurisdictions: { value: string; label: string }[]
    plan_legend: string
    plans: { value: string; label: string; description: string }[]
    notes: string
    notes_help: string
    continue: string
    back: string
    sku_header: string
    state_fee_badge: string
    disclaimer: string
  }
  fallback_sku: string
}

function splitNotation(raw: string): PageDoc {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match?.[1]) throw new Error('neon content: missing YAML front matter')
  return { matter: parse(match[1]) as PageMatter, body: (match[2] ?? '').trim() }
}

export const en = parse(enRaw) as EnCopy

export const pages: Record<Exclude<NeonPageId, 'checkout'>, PageDoc> = {
  home: splitNotation(homeMd),
  services: splitNotation(servicesMd),
  litigation: splitNotation(litigationMd),
  'fractional-gc': splitNotation(fractionalGcMd),
  'personal-plan': splitNotation(personalPlanMd),
}

export function skuById(id: string | null): Sku {
  const found = en.skus.find((sku) => sku.id === id)
  if (found) return found
  const fallback = en.skus.find((sku) => sku.id === en.fallback_sku)
  if (!fallback) throw new Error(`neon content: missing fallback SKU ${en.fallback_sku}`)
  return fallback
}

export function relatedSkus(sku: Sku): Sku[] {
  return (sku.related ?? [])
    .map((id) => en.skus.find((item) => item.id === id))
    .filter((item): item is Sku => item != null)
}
