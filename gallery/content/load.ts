import { parse } from 'yaml'

import { resolveShared } from './catalog'
import enRaw from './en.yaml?raw'
import fractionalGcMd from './pages/fractional-gc.md?raw'
import homeMd from './pages/home.md?raw'
import litigationMd from './pages/litigation.md?raw'
import personalPlanMd from './pages/personal-plan.md?raw'
import servicesMd from './pages/services.md?raw'

export {
  canonicalPayload, catalogIntegrity, catalogPayload, catalogSource, referencedKeys,
  resolveShared, shared, sharedKeys, SUPPORTED_CATALOG_VERSION,
} from './catalog'

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
  primary?: PageAction
  secondary?: PageAction
}

export interface PageDoc {
  matter: PageMatter
  body: string
}

export type Sku = {
  id: string
  item: string
  membersOnly?: boolean
  keywords?: string[]
  name: string
  blurb: string
  period: string
  category: SkuCategory
  includes: string[]
  stateFee: boolean
  related?: string[]
} & ({ flatFee: 'form' | 'trademark'; amount?: never } | { flatFee?: never; amount: string })

export interface SubscriptionPlan {
  id: 'fractional-gc' | 'personal-plan'
  audience: string
  name: string
  image: { src: string; alt: string }
  amount: string
  period: string
  summary: string
  keywords: string[]
  highlights: string[]
  features: string[]
}

export interface EnCopy {
  brand: string
  email: string
  phone: { label: string; href: string }
  office: { label: string; address: string }
  footer_cta: string
  legal: string[]
  specimen: string
  nav: { id: NeonPageId; label: string }[]
  categories: { value: SkuCategory | 'all'; label: string }[]
  skus: Sku[]
  plans: SubscriptionPlan[]
  subscriptions: {
    title: string
    intro: string
    forms: string
    reviews: string
    cta: string
    join: string
    member_cta: string
    member_title: string
    member_intro: string
    interest: string
  }
  litigation: { title: string; body: string; cta: string; note: string; keywords: string[] }
  catalog: {
    title: string
    note: string
    category_label: string
    fee_label: string
    form_fee_label: string
    flat_fee: string
    form_fee_note: string
    member_fee_label: string
    members: string
    start: string
    choose_plan: string
    empty: string
    empty_help: string
    clear: string
    related_header: string
    related_note: string
  }
  process: { title: string; steps: { id: string; title: string; detail: string }[] }
  faq: { id: string; trigger: string; body: string }[]
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
    notes: string
    notes_help: string
    continue: string
    back: string
    sku_header: string
    state_fee_badge: string
  }
  fallback_sku: string
  find: {
    prompt: string
    lede: string
    placeholder: string
    submit: string
    examples: { label: string; query: string }[]
    help: string
    help_cta: string
  }
}

/*
 * Shared copy resolves before either file is parsed, exactly as Navigator
 * resolves the same token in its own catalogs. Doing it on the raw text means
 * a `{shared:<key>}` works in any field — front matter, a list item, a
 * Markdown paragraph — without this schema knowing the token exists, and it
 * keeps every consumer below reading plain strings.
 */
function splitNotation(raw: string): PageDoc {
  const match = resolveShared(raw).match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match?.[1]) throw new Error('neon content: missing YAML front matter')
  return { matter: parse(match[1]) as PageMatter, body: (match[2] ?? '').trim() }
}

export const en = parse(resolveShared(enRaw)) as EnCopy

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
    .filter((item): item is Sku => item !== undefined)
}
