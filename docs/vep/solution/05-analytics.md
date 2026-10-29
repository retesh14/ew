# 05 · Analytics

Status: draft · Last updated: 2026-10-29

## Requirement
Measure event pages the way sap.com does today — same tools, comparable reports — and add
performance monitoring, without hurting page speed or bypassing consent (see 04).

## What runs today (observed 2026-10-29, US visitor)

| Item | www.sap.com/events.html | events.sap.com (current event sites) |
|---|---|---|
| Tag manager | Adobe Launch, self-hosted under `www.sap.com/tmgr/…` | Launch, same company, **different library** (`…/360e5baeb92b/launch-….min.js`) |
| Analytics library | AppMeasurement (`/b/ss/` beacons to `smetrics.sap.com`, multi-suite incl. a rollup suite) **and** Web SDK (`alloy`, `smetrics.sap.com/ee/…/interact`) | AppMeasurement (+ Activity Map); no `alloy` |
| Data layer | `adobeDataLayer`: `globalDL` (site, user), `pageView` (page name, section, language, country, template, title) | Same shape plus `conference: {name, location, type, year}`; page name = path (`/gartner-it/en_us/home.html`) |
| Other | Target (`tt.omtrdc.net/rest/v1/delivery`), Akamai mPulse, many ad pixels | Clarity, Munchkin, Meta and other pixels |

Note: the brief says Web SDK is not present on sap.com. That holds for events.sap.com; on
www.sap.com/events.html we saw Web SDK running alongside AppMeasurement. Relevant to 06.

## Native capability
- **RUM / Operational Telemetry** is built in: Core Web Vitals (LCP, INP, CLS) and TTFB, plus
  checkpoints such as `click`, `viewblock`, `fill`, `formsubmit`, `404`, `error`. Cookieless and
  sampled ("one out of one hundred page views"); "site operators can decide to increase or decrease
  this number" ([Operational Telemetry](https://www.aem.live/docs/operational-telemetry),
  [developer guide](https://www.aem.live/developer/operational-telemetry)). Here `ak.js` loads it
  after the first section.
- **Native experimentation** (A/B pages authored as content, measured in RUM)
  ([Experimentation](https://www.aem.live/docs/experimentation)).
- **No built-in Adobe Analytics.** Adobe's page on integrating Adobe Experience Cloud recommends the
  `aem-martech` plugin: Web SDK and Adobe Client Data Layer loaded in phases, and Launch "in a
  delayed manner to limit the performance impact". Reason given: an all-in-Launch setup "typically
  either has a performance [impact] on the initial page load, or ends up introducing content flicker"
  ([Martech integration](https://www.aem.live/developer/martech-integration)).
- Adobe's measured cost of that plugin: LCP +0.2 s without page changes, +1.2 s (mobile) with
  Target changes. Target via at.js or Web SDK adds +0.5 to 1.3 s LCP on the first call and is
  advised "only on selected pages" ([Target integration](https://www.aem.live/developer/target-integration)).
- Performance rule: third-party tags belong in the delayed phase, "at least three seconds after
  the LCP event" ([Keeping it 100](https://www.aem.live/developer/keeping-it-100)).

## Options
| Option | How it works | Pros | Cons |
|---|---|---|---|
| **Delivery** A. Launch in `<head>` (as sap.com) | Sync Launch embed before content | Zero change to rules | Blocks LCP; fails the Lighthouse PR check; against Adobe guidance |
| **Delivery** B. Launch after consent (AppMeasurement inside Launch) | Our code pushes the data layer; Launch loads after the TrustArc decision (04) | Reuses SAP rules, report suites, extensions; no LCP impact | Early bounces may be missed; TBT from the Launch bundle |
| **Delivery** C. `aem-martech` plugin (Web SDK self-hosted) | Web SDK + ACDL from our repo, Launch delayed for extra tags | Adobe-recommended for Edge Delivery; feeds AEP/CJA directly | Needs a datastream and AppMeasurement→Web SDK mapping; plugin is written for the boilerplate's eager/lazy/delayed hooks, not Author Kit |
| **Property** D. Reuse events.sap.com Launch property and suites | VEP pages become another environment of today's event property | Continuity of event reports; `conference` data already modelled | Old rules may rely on AEM markup selectors |
| **Property** E. Reuse www.sap.com property | Event pages tracked like corporate pages | One property to govern | Event dimensions missing; noisier corporate rule set |
| **Property** F. New VEP property / suite | Clean property, rolls up to global suite | Clean rules, built for Edge Delivery | Breaks year-on-year comparison; new governance |

## Recommended solution
**B + D now; keep C open as the target for 06.**

1. **Delivery:** `lazy.js` → consent module (04) → Launch (environment chosen from
   `scripts/utils/env.js`: dev/stage/prod). AppMeasurement stays inside Launch, so SAP's analytics
   team keeps ownership of rules and report suites. Nothing third-party before LCP.
2. **Property:** reuse the events.sap.com Launch property and report suites. Rules move to
   **data-layer events only** — no CSS selectors on page markup, which changes with Edge Delivery.
3. **Data layer:** a small first-party module builds `adobeDataLayer` pushes from page metadata
   authored in Experience Workspace. Pushes are local array writes, queued until Launch loads. Draft:

| Field / event | Source | Example |
|---|---|---|
| `page.name` | page path, mapped to the events.sap.com format for report continuity (mapping to agree) | today: `/gartner-it/en_us/home.html` |
| `page.section`, `page.template` | event folder; `template` metadata | `sapphire-orlando`, `agenda` |
| `page.language`, `page.country` | locale from `scripts.js` / market folder | `en`, `us` |
| `event.id` | new page metadata `event-id` (CRM / event system ID) | `EV-12345` (format to agree) |
| `event.tier` | new metadata `event-tier` | `2` or `3` |
| `conference.name/location/type/year` | metadata, as today | `sapphire`, `orlando`, `inperson`, `2027` |
| `pageView` | on load | one per page view |
| `registrationView` → `registrationStart` → `registrationStep` (n) → `registrationSubmit` → `registrationComplete` / `registrationError` | registration block / Form.io events (08) | funnel steps |
| `ctaClick`, `videoPlay`, `sessionView`, `download` | blocks | engagement |

4. **AppMeasurement vs Web SDK:** stay on AppMeasurement for launch (phase 1); move to Web SDK in
   phase 2, as set out in 06. The data-layer contract above is the same in both phases.

| | AppMeasurement (today) | Web SDK |
|---|---|---|
| Reports | Unchanged | Same suites via datastream; `data.__adobe.analytics` keeps variable names |
| AEP / CJA | Via Analytics source connector | Direct to Edge Network |
| Edge Delivery fit | Launch delayed only | Adobe's recommended plugin |
| Consent | Opt-in service in Launch | `defaultConsent` / `setConsent` (04) |

   Adobe documents the path: "Migrate from AppMeasurement to the Web SDK" — create a datastream,
   replace `s.t()` with `sendEvent`, keep the data layer
   ([Experience League](https://experienceleague.adobe.com/en/docs/analytics/implementation/aep-edge/web-sdk/appmeasurement-to-web-sdk)).
   The same data layer serves both, so a later switch does not touch blocks.
5. **RUM:** keep it on for Core Web Vitals and form funnels (`fill`, `formsubmit`). Raise sampling
   (`window.SAMPLE_PAGEVIEWS_AT_RATE = 'high'` set in `scripts.js` before RUM loads; `deps/rum.js` then samples 1 in 10) for low-traffic Tier 3 pages if
   privacy agrees. RUM is the performance source of truth; Analytics is the business source.
6. **Target:** not on event pages at launch. If needed later, use it only on flagged pages
   (`Target: on` metadata), as Adobe advises.

## Gaps and custom work
| Work | Where | Effort |
|---|---|---|
| Data layer builder (metadata → `adobeDataLayer`) + unit tests | `scripts/utils/datalayer.js`, called from `lazy.js` | S |
| New metadata fields (`event-id`, `event-tier`, `conference-*`) in the page template | Experience Workspace template / authoring guide | S |
| Registration funnel events from Form.io (iframe vs embed decides postMessage work) | registration block (08) | M |
| Launch: new environment, rules rewritten to data-layer events, page name continuity | Launch property (client analytics team) | M |
| Launch embed URL: load `www.sap.com/tmgr/…` cross-origin or route via Akamai | config + CDN (01) | S |
| Web SDK migration (only if 06 decides) | `aem-martech` adapted to Author Kit, datastream | L |

## Risks and open questions
| Item | Owner |
|---|---|
| Reuse events.sap.com property and suites, or a new VEP suite rolling up? | Client (analytics) |
| Loading Launch after consent loses some early bounces ("can lead to missed analytics events from users who bounce early" — aem-martech FAQ); size it before go-live | Us + client |
| Existing Launch rules using markup selectors or `document.write` break on Edge Delivery / CSP | Client tag team |
| Source and format of `event.id`; which system owns it | Client |
| Launch bundle TBT may cost Lighthouse points; may need rule clean-up | Us + client |
| Web SDK already runs on www.sap.com — is a migration programme underway? Decides C timing | Client (06) |
| RUM sampling at 1 in 100 gives thin data on small events | Us / Adobe |

## Proof
| # | Test | Pass condition |
|---|---|---|
| 1 | Data layer schema | Unit test: every event page yields the agreed fields; no personal data in the layer |
| 2 | Page view beacon (Experience Platform Debugger / network) | One `/b/ss/` call per page with the agreed page name, event ID, tier, language, country |
| 3 | Registration funnel | Each step emits its event once; complete/error tracked |
| 4 | Consent | No beacon before consent in EU test (see 04 proof 1) |
| 5 | Performance | Lighthouse mobile 100 on PR; RUM LCP p75 ≤ 2.5 s and INP p75 ≤ 200 ms on live pages |
| 6 | Reconciliation | Analytics page views within an agreed band of RUM estimates for the same pages and week |
| 7 | Continuity | A migrated event's reports match the old events.sap.com page names and dimensions |

## Sources
- aem.live: [Martech integration](https://www.aem.live/developer/martech-integration), [Target integration](https://www.aem.live/developer/target-integration), [Keeping it 100](https://www.aem.live/developer/keeping-it-100), [Operational Telemetry](https://www.aem.live/docs/operational-telemetry), [Operational Telemetry for developers](https://www.aem.live/developer/operational-telemetry), [Experimentation](https://www.aem.live/docs/experimentation) — read 2026-10-29 (found via aem.live sitemap).
- [adobe-rnd/aem-martech README](https://github.com/adobe-rnd/aem-martech) — read 2026-10-29.
- Experience League: [Migrate from AppMeasurement to the Web SDK](https://experienceleague.adobe.com/en/docs/analytics/implementation/aep-edge/web-sdk/appmeasurement-to-web-sdk) — read 2026-10-29.
- Browser observation of www.sap.com/events.html and events.sap.com/gartner-it/en_us/home.html, 2026-10-29. No Analytics beacon was captured on events.sap.com within 6 s (unverified whether it fires later or waits on consent).
