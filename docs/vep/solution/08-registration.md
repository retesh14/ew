# 08 · Registration

Status: draft · Last updated: 2026-10-29

## Requirement
Visitors register for an event from its event page. Registrations must reach SAP's systems of record
with the same consents SAP collects today; each event can add its own questions and campaign code;
Day 2 is open only to Day 1 registrants. No personal data is stored in the site.

### Today on events.sap.com (observed 2026-10-29 — page loaded, nothing submitted)
| Item | Observed |
|---|---|
| Renderer | SAP's own Form.io build `forms.services.sap.com/static/js/formio.bundle.js` — ~490 KB compressed (2.6 MB raw) plus `formio-styles.css` ~30 KB compressed |
| Form | `GET forms.services.sap.com/vep/vep-event-registration-form`: `defaultInteractionType: YY_FORM_SUBMIT`, `contactProfileLevel: ICP`, `campaignCode: ""`, `businessEntity: sap`; anonymous `create_own` submission access |
| Components | SAP custom Form.io types (`swfFirstName`, `swfOfficeLocation`, `consent`, `communicationChannels` …) — they render only with SAP's bundle, not stock Form.io |
| Lookups | `/api/ddls/{department,relationship-to-sap,industry,function}/en_us/asc`, `/api/officeLocation/en_us?businessEntity=sap`, `/api/gdpr/en_us?name=…`, `/api/mandatoryPhoneFieldPatterns?formId=…`, `/api/i18n/dictionary/en-us`, `/api/locales/reverseNameOrder`, `/api/marketingMetadata?SOURCE_SYSTEM_FIRST=events.sap.com&REFERRAL_URL=…` |
| List values | Codes, not labels — e.g. `{"code":"03","title":"Banking"}` |
| Fields on the Houston page | 10 shared fields + event fields `jobtitle`, `dietrestrictions`, `partnerdatasharing` + 4 consents + `communicationChannels`. A ~2 KB page script (`clientlib-formio`) is present; how it adds the event fields is (unverified) |
| Locales | i18n, consent texts and lists also answer for `de_de`, `ar_sa`, `he_il` |
| Cross-origin | API echoes the caller's Origin (tested with an `*.aem.page` origin) for GET and for the POST preflight on `/submission` — no POST sent |
| Bots | No CAPTCHA on the page; Akamai refuses non-browser requests to events.sap.com |
| Day 2 | Event page: "Registration for Day 2 is only available to attendees who registered for Day 1." |

**POC state:** `blocks/form` is Adobe's AEM Forms block reading the DA sheet
`content/vep/us-2026-sap-connect-days-data-it-houston/registration-form.json`. It mirrors the visible
fields, but submit is stubbed. It lacks `SapComGeneralMarketing` and `communicationChannels`, and its
dropdowns hold placeholder labels, not SAP codes.

## Native capability
- **Edge Delivery Services for AEM Forms** renders forms from a sheet. Adobe: "a valid AEM Forms
  license is required". Document-based forms submit to a spreadsheet or email. Submit to a REST
  endpoint, Marketo and reCAPTCHA are listed only for WYSIWYG (Universal Editor) authoring, which this
  project does not use ([Forms](https://www.aem.live/developer/forms)).
- Neither Experience Workspace nor Edge Delivery connects to SAP Forms or CRM. That is integration
  work. The architecture rule is "integrate, don't replace": SAP Forms stays the system of record.
- Performance rule: "Loading from or connecting to a second origin before the `LCP` occurred is
  strongly discouraged" ([Keeping it 100](https://www.aem.live/developer/keeping-it-100)).

## Options
| Option | How it works | Pros | Cons |
|---|---|---|---|
| A. Embed SAP's Form.io form in an EDS block | A `registration` block holds the form path, campaign code and a link to the event-questions sheet. After LCP it loads SAP's bundle + CSS and calls `Formio.createForm(el, formUrl, { language })`. The browser posts to SAP. | Same consents, texts, codes, phone rules and CRM mapping as today; the SAP Forms team keeps ownership; no PII passes through Adobe; smallest build | ~520 KB of third-party code on the registration page; styling means overriding SAP's CSS; accessibility and RTL depend on SAP's bundle; how event questions attach is still open |
| B. Authorable EDS form → App Builder → SAP API | Our form block renders from the DA sheet, with lists and consent texts from SAP APIs (cached by App Builder). Submit goes to an App Builder action, which validates the data, adds campaign and interaction metadata, and calls SAP's submission API server-side. | Lightest page; fully authorable; our own markup for accessibility and RTL; validation and bot checks run server-side | Rebuilds SAP's consent logic, phone patterns, code lists and name order; needs a supported SAP submission API with credentials; PII passes through App Builder in transit; AEM Forms licence question; drifts whenever SAP changes the shared form |
| C. Link out to the existing page | The Register CTA goes to `events.sap.com/<event>/en_us/registration.html` | No build; SAP flow unchanged | The old platform stays live for every event; blocks decommissioning; two domains with different headers; each event's registration page is still authored in AEM |

## Recommended solution
**Option A**, as a thin `registration` block. Move to **B** only if SAP's forms team offers a
supported server-side submission API and wants it. Use **C** as a stop-gap for any event that goes
live before A passes proof.

```
Event page ──Register──> /<event>/registration   (Edge Delivery, block config from Experience Workspace)
                           │ after LCP: SAP bundle + form JSON + lookups (one extra origin)
Browser ──POST submission──> forms.services.sap.com ──> SAP CRM (inferred, not tested)
                           │ submitDone ──> /<event>/registration/thank-you (no PII in URL)
```

| Concern | Design |
|---|---|
| Performance | Block used only on the registration page. Script injected in the lazy phase, or when the block scrolls into view. No SAP requests or preconnects on event pages. Fixed min-height placeholder to avoid layout shift. |
| Consents | Render SAP's four consents and `communicationChannels` exactly as `/api/gdpr` serves them. Consent text is never authored in Experience Workspace. Cookie consent (TrustArc) is topic 04. |
| Event questions | Per-event DA sheet (the POC format) turned into Form.io components before render, **or** a per-event Form.io form owned by SAP. Decide with SAP once we know how `clientlib-formio` does it today. |
| Campaign code | Authored as event metadata (`campaign-code`) and passed the way SAP expects (field or submission metadata — unverified) |
| Confirmation and emails | On `submitDone`, redirect to an authored thank-you page per event. Confirmation emails stay with SAP's back end, as today (sender unverified). |
| Day 2 eligibility | Not decided in the browser. Either SAP emails Day 2 links to Day 1 registrants (simplest), or an App Builder action checks the registration server-side and returns only yes/no. |
| PII | Data goes from the browser straight to SAP. Edge Delivery is static and stores nothing. No form values go to RUM, the data layer or analytics. Marketo loads only after consent. |
| Spam and bots | SAP's form service handles this today (no CAPTCHA seen) — confirm with SAP. Akamai Bot Manager on our domain protects pages, not the POST to SAP's domain. |
| Accessibility | Audit Form.io output against WCAG 2.2 AA (labels, error messages, focus order, required state); fix with CSS or raise with SAP |
| RTL | `dir` comes from the locale (`ak.js`); pass `language`; SAP i18n has `ar-sa` / `he-il`; check SAP CSS under `dir="rtl"`; phone and email stay LTR (see 14) |

## Gaps and custom work
| Work | Where | Effort |
|---|---|---|
| `registration` block: on-demand loading, config table, `submitDone` redirect, error state | `blocks/registration` | S |
| Restyle SAP Form.io output to the VEP design, including RTL | block CSS | S–M |
| Event questions and campaign code passed through, agreed with SAP | block + SAP forms team | M |
| Day 2 eligibility check (only if SAP does not handle it) | App Builder action + SAP API | M (API unknown) |
| Event kit: registration and thank-you pages in the template | Experience Workspace template | S |
| Option B only: SAP lists and consents in the form block, App Builder submit proxy, validation, bot check | `blocks/form`, App Builder | L |
| Decide whether to retire the POC form block | — | S |

## Risks and open questions
| Item | Owner |
|---|---|
| Will SAP allow the shared form to be embedded on the new domain? (Cross-origin requests worked in test; production allow-list and referrer checks unknown) | Client (SAP forms team) |
| How does each event add its questions and campaign code today? | Client |
| Is there a supported server-side submission API with auth (needed for B)? | Client |
| Who sends confirmations and calendar invites? Does a registration create the event-platform record that Day 2 checks need? | Client |
| Spam and bot protection on SAP's submission endpoint | Client |
| ~490 KB bundle against the Lighthouse 100 target; could SAP serve a lighter build? | Us + client |
| Accessibility and RTL quality of Form.io output | Us (audit) + client |
| AEM Forms licence if the Adobe form block is kept (B) | Adobe |
| Routing of submissions to CRM is inferred; test only against a test form or campaign SAP provides | Client + us |

## Proof
| # | Test | Pass condition |
|---|---|---|
| 1 | Embed | Registration page on an Edge Delivery host shows SAP's form: 10 fields, 4 consents, channels; lists send codes; consent text matches events.sap.com |
| 2 | Performance | Event pages make no request to `forms.services.sap.com`; on the registration page LCP happens before the first SAP request; Lighthouse result recorded against the 100 target |
| 3 | Test submission | Using SAP's test form or campaign: the record reaches CRM with the right campaign code, interaction type and consents |
| 4 | Event questions | Job title and dietary answers from the DA sheet arrive in the submission |
| 5 | Confirmation | Redirect to the thank-you page with no PII in the URL; the confirmation email arrives (if SAP sends one) |
| 6 | PII | Network capture shows form values sent only to `forms.services.sap.com`, and none in RUM or analytics calls |
| 7 | Day 2 | A Day 1 registrant can register for Day 2; anyone else is refused |
| 8 | Accessibility | Form completed with keyboard only and with a screen reader; axe reports no critical issues |
| 9 | RTL | Arabic page: form mirrored, labels and consents in Arabic, phone and email LTR |

## Sources
- aem.live: [Forms](https://www.aem.live/developer/forms), [Keeping it 100](https://www.aem.live/developer/keeping-it-100) (read 2026-10-29).
- Form.io: [JavaScript renderer](https://help.form.io/developers/form-development/form-renderer) — `Formio.createForm`, `submitDone` event (read 2026-10-29).
- Observed 2026-10-29: Houston registration page loaded in a browser; read-only GETs to the form JSON and lookup APIs; CORS preflight only. No form submitted.
- Repo: `blocks/form/submit.js`, `blocks/form/constant.js`, POC sheet `registration-form.json`, `docs/vep/architecture/README.md`.
