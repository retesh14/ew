# 06 · AEP, CJA and Real-Time CDP integration

Status: draft · Last updated: 2026-10-29

## Requirement
Feed event engagement (page views, registration, session interest, attendance) into Adobe Experience
Platform (AEP), analyse it in Customer Journey Analytics (CJA), and build Real-Time CDP audiences that
can be activated to Target, Marketo and Journey Optimizer B2B (topic 07).

## Native capability
Neither Experience Workspace nor Edge Delivery collects data into AEP by itself; data collection is a
client integration. What exists:

| Piece | What it gives us | Source |
|---|---|---|
| aem-martech plugin (aem.live) | Web SDK + Adobe Client Data Layer + Launch, split across the page lifecycle; "defaults user consent to pending" | aem.live Martech integration |
| Measured cost of that plugin | Mobile LCP +0.2s without page modifications, +1.2s with; desktop +0.2s / +0.6s | same |
| Target on Edge Delivery | "The recommended future-proof approach is via the Adobe Experience Platform WebSDK"; at.js still supported | aem.live Target integration |
| Analytics source connector | Streams report-suite data into AEP as XDM; Profile < 2 min, data lake < 2.25 h, CJA 3.75–7 h | Experience League |
| Web SDK + datastream | One request to the Edge Network; the datastream forwards to Analytics, AEP, Target and others | Experience League |
| Edge Network API | Server-side, "both authenticated and non-authenticated methods to send data to Adobe" | developer.adobe.com |

sap.com today (Launch + AppMeasurement, no Web SDK) can reach AEP/CJA only through the Analytics source connector.

Adobe's position on the connector: it is "not a recommended long-term method for using Customer
Journey Analytics", citing "high latency, cluttered and complex schemas, reliance on Adobe Analytics
nomenclature". Adobe's recommended path is a new Web SDK implementation, keeping the connector "to
retain historical Adobe Analytics data and to perform side-by-side data comparison".

## Options
| Option | How it works | Pros | Cons |
|---|---|---|---|
| A. AppMeasurement + Analytics source connector | VEP pages reuse the sap.com Launch property; the connector copies report-suite data into AEP | No new page code; same as sap.com; 13-month backfill | Adobe calls it not a long-term option; Analytics (prop/eVar) schema; CJA latency 3.75–7 h; Target stays on at.js, so RTCDP audiences reach it only next session |
| B. Web SDK via aem-martech plugin | Self-hosted Web SDK sends XDM + `data` to a datastream → Analytics (same report suite), AEP, Target | Adobe-recommended; custom lean schema; streaming to Profile; same-page/next-page Target with edge audiences; Launch keeps rules | New datastream, schema and Launch changes; VEP pages diverge from sap.com tagging |
| C. Both, during migration | VEP pages on B; sap.com stays on A until its own migration; the connector keeps sap.com history and allows side-by-side checks | Moves VEP to the target state without waiting for sap.com; Adobe documents this transition | Two pipelines to reconcile; ECID continuity across domains needs checking |
| D. Server-side events (adds to B or C) | App Builder sends authoritative events (registration completed, attended, no-show) to the Edge Network API or AEP streaming | Not lost to ad blockers or consent timing; carries CRM ID; no page cost | Needs source systems (Form.io response, ON24, onsite) to expose the data — see 08, 09 |

## Recommended solution
**C + D, as phase 2.** Web SDK on VEP pages, AppMeasurement left alone on sap.com, server-side events for facts
the browser cannot be trusted with.

**Phasing (aligned with topic 05):**
- **Phase 1 — launch:** AppMeasurement inside the events.sap.com Launch property, loaded after consent
  (topic 05). AEP / CJA receive VEP data through the Analytics source connector, with its latency.
- **Phase 2 — when the AEP / CJA programme is funded:** switch VEP pages to Web SDK as below. The
  data-layer contract from 05 stays the same, so only the Launch delivery changes, not the pages.
  Do not run AppMeasurement / Visitor ID Service and Web SDK side by side on the same VEP page.

```
VEP page (Edge Delivery) --Web SDK, after TrustArc consent--> Datastream --> Adobe Analytics (report suite, topic 05)
                                                                        --> AEP datasets --> Profile / RTCDP --> Target, Marketo, AJO B2B
App Builder (registration, attendance) --Edge Network API / streaming--------^          \--> CJA connection
sap.com (AppMeasurement) --> report suite --> Analytics source connector --> AEP (history, side-by-side)
```

**Page loading.** Personalization off by default, so nothing is added to the critical path: the
page-view event goes in the lazy phase after consent, Launch in the delayed phase. Pages that need
Target turn it on with `target` metadata and accept the measured LCP cost. In this repo the hooks are
`lazy.js` and dynamic `import()`, not `scripts.js` static imports.

**XDM schema** — a custom ExperienceEvent schema, not the Analytics template (Adobe: the Analytics
schema "contains more than a thousand fields"). `eventType` is "an extensible enum", so custom values
are allowed. Custom names below are proposals.

| Event | `eventType` | Sent from | Key fields |
|---|---|---|---|
| Page view | `web.webpagedetails.pageViews` | Web SDK | page, event ID, tier, locale |
| Registration started | `sapEvent.registrationStarted` (custom) | Web SDK | event ID, form ID |
| Registration completed | `web.formFilledOut` (client) + `sapEvent.registered` (server) | Web SDK + App Builder | event ID, interaction type (`YY_FORM_SUBMIT`), contact profile level (`ICP`), campaign code |
| Session interest | `sapEvent.sessionInterest` (custom) | Web SDK | session ID, track, action (view, add to agenda) |
| Attended / no-show | `sapEvent.attended`, `sapEvent.noShow` (custom) | App Builder from ON24 / onsite | event ID, session ID, minutes |

A custom field group (`_sap.event`: event ID, tier, track, session, campaign) is shared by all
events. Consent fields go on the profile schema (Adobe's privacy / consent field groups).

**Identity**

| ID | Namespace | Where it comes from | Use |
|---|---|---|---|
| ECID | `ECID` (standard) | Web SDK first-party cookie; `idMigrationEnabled` (default `true`) reads an existing AMCV cookie | Anonymous behaviour; CJA persistent ID |
| Hashed email | `Email_LC_SHA256` (standard) | Registration, hashed by us — lowercase, trim, SHA-256 | Known person; stitching |
| SAP CRM contact ID | Custom namespace (not standard) | Forms service / CRM response, if exposed (unverified) | Best person ID for CJA and B2B |
| B2B person / account | `b2b_person`, `b2b_account` | CRM or Marketo ingestion (topic 07) | Account audiences |

**What CJA needs.** All data in AEP datasets; a connection with "at least one event or summary
dataset"; a person ID per dataset; a data view; stitching (field-based on Select, graph-based on
Prime and Ultimate) so ECID-only page views are rekeyed to the CRM ID or hashed email. Stitching
"applies to one dataset only".

**Real-Time CDP audiences**

| Audience | Rule | Expected evaluation (confirm in Segment Builder) |
|---|---|---|
| Registered for event X | `sapEvent.registered` with event ID X | Streaming; edge only if limited to the last 24 h ("single event within a time window of less than 24 hours") |
| Started, not completed | `registrationStarted` without `registered` within N days | Batch (absence of an event) (unverified) |
| No-show | Registered for X, no `attended`, event end date passed | Batch, daily (unverified) |
| Interested in track X | ≥ N `sessionInterest` events on track X in 30 days | Streaming or batch (unverified) |

**Activation**

| Destination | What reaches it | Limits (Adobe docs) |
|---|---|---|
| Adobe Target | People audiences; same-page and next-page with Web SDK + datastream | "Account audiences" not supported; at.js gives next-session only |
| Marketo Engage | People audiences as static lists, matched on email / ECID | Account audiences not supported |
| Journey Optimizer B2B | Account and person audiences, Experience Events | See topic 07 |

**Consent (topic 04).** TrustArc decides; a small bridge calls `setConsent` on every page load
("The Web SDK does not offer a way to retrieve consent"). With `defaultConsent: pending`, "Data is
stored locally until the user opts in". Server-side events must carry the consent captured on the
registration form. Nothing fires before consent (README principle 4).

## Gaps and custom work
| Work | Where | Effort |
|---|---|---|
| AEP sandbox, custom schemas, field group, datasets, custom CRM namespace | AEP config | M |
| Datastream (Analytics, AEP, Target); Launch Web SDK extension in self-hosted mode (v2.34.0+); remove AppMeasurement from VEP pages | Data Collection / Launch | S |
| Adapt aem-martech to this repo's load pipeline (`lazy.js`, `postlcp.js`) plus a TrustArc → `setConsent` bridge | Project code | M |
| Data-layer contract: page, event ID, registration steps, session interest (shared with 05) | Blocks + ACDL | S |
| Registration-completed event with hashed email / CRM ID | App Builder (shares the 08 action) | M |
| Attendance and no-show ingestion from ON24 / onsite | App Builder or batch (09) | M–L |
| CJA connection, data view, stitching; side-by-side with the source connector | CJA | M |
| RTCDP audiences and the three destinations | RTCDP | S–M |

## Risks and open questions
| Item | Owner |
|---|---|
| Licences: AEP, RTCDP edition (B2C/B2B/B2P, Prime/Ultimate), CJA package, Target — to confirm, not assumed | Client / Adobe |
| Does SAP plan a sap.com Web SDK migration? Decides how long option C runs | Client |
| Same report suite as sap.com or a VEP one (topic 05) | Client |
| VEP pages on sap.com or another domain? ECID / AMCV continuity, and Adobe warns not to load Visitor ID Service and Web SDK on the same page | Client / us |
| Does the forms service return a CRM contact ID to App Builder? | Client |
| Meaning of `contactProfileLevel: ICP` and which values are allowed in AEP | Client |
| Privacy review: hashed email in identity graph; EU data residency of the AEP sandbox | Client |
| Source connector latency (CJA 3.75–7 h) for any report built on sap.com history | Adobe |
| Target page modifications cost up to +1.2 s mobile LCP — which pages really need it | Client / us |

## Proof
| # | Test | Pass condition |
|---|---|---|
| 1 | Consent gate | Before TrustArc opt-in, no request to `edge.adobedc.net/ee/v1/collect`; after opt-in a `set-consent` call and the queued page view are sent |
| 2 | Page performance | RUM / PageSpeed on a VEP page with Web SDK (personalization off) within 0.2 s LCP of the page without it |
| 3 | Analytics continuity | The VEP page view appears in the agreed report suite with the same page name and event variables as before |
| 4 | AEP ingestion | Page view and registration events land in the AEP dataset with the custom field group filled and ECID + hashed email in `identityMap` |
| 5 | Stitching | In CJA, a visitor's anonymous page views before registering are attributed to the same person after registration |
| 6 | Audience | A test registration qualifies for "Registered for event X" and shows as a Marketo static list member |
| 7 | Server event | Registration completed via App Builder appears once even with an ad blocker active |

## Sources
All read 2026-10-29. Experience League paths are under `https://experienceleague.adobe.com/en/docs/`.
- aem.live: https://www.aem.live/developer/martech-integration , https://www.aem.live/developer/target-integration ,
  https://www.aem.live/developer/keeping-it-100 ; plugin README https://github.com/adobe-rnd/aem-martech
- Analytics → AEP / CJA: `experience-platform/sources/connectors/adobe-applications/analytics`,
  `analytics-platform/using/compare-aa-cja/upgrade-to-cja/cja-upgrade-recommendations`,
  `analytics/implementation/aep-edge/web-sdk/appmeasurement-to-web-sdk`
- Web SDK: `experience-platform/datastreams/overview`, `experience-platform/web-sdk/identity/overview`,
  `experience-platform/web-sdk/commands/setconsent`, `…/commands/configure/defaultconsent`,
  `…/commands/configure/idmigrationenabled`, `experience-platform/web-sdk/consent/supporting-consent`
- Identity and XDM: `experience-platform/identity/features/namespaces`, `experience-platform/xdm/classes/experienceevent`
- CJA: `analytics-platform/using/cja-connections/overview`, `analytics-platform/using/stitching/overview`
- Audiences and destinations: `experience-platform/segmentation/methods/edge-segmentation`,
  `experience-platform/destinations/catalog/personalization/adobe-target-connection`,
  `experience-platform/destinations/catalog/adobe/marketo-engage`
- Edge Network API: https://developer.adobe.com/data-collection-apis/docs/
- sap.com tagging observed 2026-10-29 (see README).
