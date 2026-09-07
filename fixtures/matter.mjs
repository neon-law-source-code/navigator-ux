/*
 * The one invented matter every specimen in this repository shares, so a reader
 * moving between the gallery, the chat transcripts, and the complaint PDF sees
 * one coherent file rather than ten unrelated fragments. Anything that needs a
 * party, an entity, or a caption takes it from here instead of inventing one.
 *
 * The names are drawn. The facts around them — a supply agreement, a thirty-day
 * cure clause, an untimely notice — are written for the components to exercise,
 * and are not from any filing.
 */

import { fakeCompany, fakeLastName, fakeMatterCode, fakePerson, fakeSlug } from './fake.mjs'

/** The individual bringing the breach claim. */
export const PLAINTIFF = fakePerson('matter/plaintiff')

/** The corporate counterparty. `Inc.` because the complaint pleads a corporation. */
export const DEFENDANT = fakeCompany('matter/defendant', 'Inc.')

/** The same company without its suffix, for a caption or a node label. */
export const DEFENDANT_SHORT = fakeCompany('matter/defendant')

/*
 * One family name behind every entity the specimens name, so an LLC, a trust,
 * and a cooperative read as one client's file rather than three strangers'.
 */
export const ENTITY_STEM = fakeLastName('matter/entity-stem')
export const SUBSIDIARY = `${ENTITY_STEM} Supply LLC`
export const FAMILY_TRUST = `${ENTITY_STEM} Family Trust`
export const COOPERATIVE = `${ENTITY_STEM} Workers Cooperative`

/** `Ruiz v. Halvorsen` — family name against company, the shape a docket takes. */
export const CAPTION = `${PLAINTIFF.lastName} v. ${DEFENDANT_SHORT}`

export const MATTER_CODE = fakeMatterCode('matter/code')
export const MATTER_SLUG = fakeSlug('matter/slug', 2)

/** The firm's own people: the lawyer of record, the client contact, and a third seat. */
export const LAWYER = fakePerson('matter/lawyer')
export const CLIENT = fakePerson('matter/client')
export const CFO = fakePerson('matter/cfo')

/**
 * Identifier-safe slugs, for the `ent_*` / `ppl_*` / `ntn_*` handles the mocked
 * tool receipts print. Derived so a handle and the name beside it agree.
 */
export const ENTITY_HANDLE = ENTITY_STEM.toLowerCase().replace(/[^a-z0-9]+/g, '')
export const CLIENT_HANDLE = CLIENT.firstName.toLowerCase().replace(/[^a-z0-9]+/g, '')

/** Opposing counsel, cited the way a fee table cites them: initial and family name. */
export const OPPOSING_COUNSEL = fakePerson('matter/opposing-counsel')
export const OPPOSING_COUNSEL_SHORT = `${OPPOSING_COUNSEL.firstName.slice(0, 1)}. ${OPPOSING_COUNSEL.lastName}`

/** The defendant's officer who sat for the deposition the motion quotes. */
export const DEPONENT = fakePerson('matter/deponent')
export const DEPONENT_SHORT = `${DEPONENT.firstName.slice(0, 1)}. ${DEPONENT.lastName}`

/** The firm whose chrome the specimen pages wear. */
export const FIRM = `${fakeLastName('matter/firm')} Legal`

/**
 * The complaint's file name, shared by the generator and the viewer that loads
 * it. It is derived from the caption, so renaming the parties renames the file
 * and nothing has to be kept in step by hand.
 */
export const COMPLAINT_PDF = `${PLAINTIFF.lastName}-v-${DEFENDANT_SHORT}-complaint`
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
