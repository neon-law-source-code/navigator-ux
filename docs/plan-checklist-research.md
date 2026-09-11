# Plan checklist review

Reviewed September 11, 2026. Scope: the Business and Personal plan checklists and how their prices
appear on the public pages. This is a copy and source review; it does not verify service delivery.
The current customer wording lives in [the plan catalog](../gallery/content/en.yaml).

## Council decision

The Client and Legal Councils use the [repository's review lenses](./agent-decision-councils.md).

- **Libra, prospective client:** Put the yearly commitment first. The daily equivalent helps me
  understand the price, but the full amount tells me whether I can buy it.
- **Pisces, overwhelmed visitor:** Tell me what help I receive and what costs extra. A small photo is
  enough; urgency, scarcity, and claims that the price is “just” anything add pressure.
- **Capricorn, managing partner:** The firm's offer establishes what is included. Official sources
  explain why the work matters; they cannot establish the firm's capacity or response times.
- **Scorpio, ethics counsel:** Keep optional monitoring separate from automatic enrollment, and do
  not turn help with taxes or privacy requests into a promise covering every return or every company.

**Consensus:** Keep the bill photos small and only on the individual plan pages. Lead with the yearly
price, then “about $10 a day” or “about $1 a day.” Use specific benefits and nearby extra-cost terms.
Remove the limited-places line from the checklist. This presents the price plainly without claiming
that everyone can afford it or that it beats another service's price; no comparison study was done.
The emphasis on clear, nearby price qualifications also follows the
[FTC's advertising guidance](https://www.ftc.gov/business-guidance/resources/advertising-faqs-guide-small-business).

**Copy applied:** The business tax benefit now says “Help with business taxes and state paperwork.”
The Personal plan says “Optional credit monitoring,” following the owner's confirmation that members
can opt in. Annual prices remain primary on all plan cards.

## What supports each benefit

The original offers were read at Navigator commit
`3d8eebbc5ddf0cef666710768c66eb3f4e8345b9`:
[Business plan](https://github.com/neon-law-source-code/navigator/blob/3d8eebbc5ddf0cef666710768c66eb3f4e8345b9/neon/locales/en/neon/fractional-gc.yaml)
and [Personal plan](https://github.com/neon-law-source-code/navigator/blob/3d8eebbc5ddf0cef666710768c66eb3f4e8345b9/neon/locales/en/neon/personal-plan.yaml).
They support the offered categories below, but their older pricing and beta wording do not override
the owner's current instructions. Legal sources establish the relevance and limits of the work,
not whether a particular service is included in a subscription.

### Business plan

| Checklist benefit | Research and implication | Firm detail still to define |
| --- | --- | --- |
| Company records | Nevada LLCs must maintain specified company records, including organizational documents and member/manager information. Corporations also have recordkeeping duties. This supports practical recordkeeping assistance. [NRS 86.241](https://www.leg.state.nv.us/nrs/nrs-086.html), [NRS 78.105](https://www.leg.state.nv.us/division/legal/lawlibrary/nrs/NRS-078.html). | Covered entity types, records, and update frequency. |
| Employee and contractor forms | The IRS evaluates control and independence when determining worker status for federal employment taxes. A contract's label alone does not settle classification. Describe the forms offered without promising that one form fits every working relationship. [IRS worker classification](https://www.irs.gov/businesses/small-businesses-self-employed/independent-contractor-self-employed-or-employee). | Included templates, supported states, and when individual advice costs extra. |
| Lawyer answers within three business days | This comes from the original Business plan offer above. It is a firm service commitment, not a deadline established by law. No response-time records were audited. | When the clock starts, who covers absences, and how urgent requests are handled. |
| Ownership records | Nevada corporate stock ledgers record stockholders and shares; LLC records identify members. This supports keeping ownership information current. It does not establish that financing, valuation, or securities advice is included. [NRS 78.105](https://www.leg.state.nv.us/division/legal/lawlibrary/nrs/NRS-078.html), [NRS 86.241](https://www.leg.state.nv.us/nrs/nrs-086.html). | Which ownership records and changes the plan covers. |
| Confidentiality and customer forms | Trade-secret protection depends in part on reasonable efforts to preserve secrecy. Confidentiality forms can support that work; this is an inference, not a guarantee that a document protects every disclosure. The firm's offer supplies the separate basis for offering customer forms. [USPTO trade-secret policy](https://www.uspto.gov/ip-policy/trade-secret-policy). | Available forms, permitted customization, and review fees for documents brought by a member. |
| Business taxes and state paperwork | Business tax obligations depend on the business's structure. Nevada LLC annual lists are a separate recurring filing. The inspected catalog does not define a complete package of covered returns. [IRS business taxes](https://www.irs.gov/businesses/business-taxes), [NRS 86.263](https://www.leg.state.nv.us/nrs/nrs-086.html). | Covered returns, states, entities, filing periods, amendments, and work charged separately. See the intake finding below. |

### Personal plan

| Checklist benefit | Research and implication | Firm detail still to define |
| --- | --- | --- |
| Tax preparation and filing | Paid federal return preparation generally requires a current preparer tax identification number. Being an attorney does not by itself demonstrate current preparer registration or define the returns included in this plan. [IRS preparer requirements](https://www.irs.gov/tax-professionals/ptin-requirements-for-tax-return-preparers), [IRS preparer qualifications](https://www.irs.gov/tax-professionals/understanding-tax-return-preparer-credentials-and-qualifications). | Federal/state returns, schedules, tax years, household coverage, amendments, and assigned preparer. Do not infer that audits or appeals are included. |
| Requests to remove personal information | California's privacy law provides deletion rights for eligible residents at covered businesses, with exceptions, and allows authorized agents. This supports offering help with requests; it does not support promising universal or complete deletion. [California Attorney General's CCPA guidance](https://oag.ca.gov/privacy/ccpa). | Supported jurisdictions and companies, member authorization, request limits, and follow-up. |
| Optional credit monitoring | The owner confirmed that members can opt in. This supersedes the older offer's beta label. Monitoring can flag changes in covered credit reports; coverage varies and does not catch every kind of identity theft. [FTC monitoring guidance](https://consumer.ftc.gov/articles/what-know-about-identity-theft). | Covered bureaus, checking frequency, alerts, consent/setup, and whether any additional charge applies. Enrollment was not exercised in this gallery review. |

## Tax scope and intake follow-up

The owner has not yet specified which tax returns and state filings each subscription covers.
Changing “basic” to “help with” removes an undefined adjective; the service scope still needs an
explicit list before the page can name particular included filings.

Navigator contains an
[annual-report workflow](https://github.com/neon-law-source-code/navigator/blob/3d8eebbc5ddf0cef666710768c66eb3f4e8345b9/workflows/specs/nv__annual_report.yaml)
and a
[Modified Business Tax workflow](https://github.com/neon-law-source-code/navigator/blob/3d8eebbc5ddf0cef666710768c66eb3f4e8345b9/workflows/specs/nv__modified_business_tax.yaml).
Their presence is evidence of planned filing paths, not proof that every plan includes or delivers them.

The inspected Modified Business Tax questionnaire asks only for the tax year and gross revenue.
Nevada describes this as a quarterly payroll tax based on gross wages, with deductions for
employer-paid employee health benefits. Those inputs are not collected in this questionnaire
definition. Review whether they are obtained elsewhere, then correct or complete the intake before
relying on it to prepare that return. This finding concerns the inspected definition, not an audit of
the entire filing process. [Nevada Department of Taxation](https://tax.nv.gov/tax-types/modified-business-tax/).

No changes were made to the separate Navigator application as part of this public-page update.
