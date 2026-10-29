# 04 · Consent management (TrustArc)

Status: draft · Last updated: 2026-10-29

## Requirement
Respect visitor consent across all tracking and martech on event pages, using the same TrustArc
consent experience as sap.com, without slowing pages down.

## What sap.com and events.sap.com run today (observed 2026-10-29, US visitor)

| Item | Observed |
|---|---|
| Consent manager | TrustArc Cookie Consent Manager, `truste` global; notice script `consent.trustarc.com/notice?domain=sap.com&c=teconsent&noticeType=bb…` |
| How it loads on www.sap.com | SAP wrapper script (`/etc.clientlibs/…/truste/truste.<hash>.js`) loaded **synchronously in `<head>`**, then the async TrustArc notice script |
| Banner (US) | Bottom bar: "Understood" / "Manage Settings"; TrustArc config `behavior: implied`, `consentModel: opt-in` |
| Stored state | Cookies `notice_behavior`, `notice_gdpr_prefs`, `notice_preferences`, `cmapi_cookie_privacy` |
| JS API seen in page | `truste.cma.callApi('getGDPRConsentDecision', 'sap.com')` → `{consentDecision:[1,2,3], source:'asserted'}`; events `trustarc-ccm-ready`, `trustarc-consent-updated` (names read from `truste.eu.events`) |
| Adobe-side gating | Adobe Opt-in service (`adobe.optIn`, categories `aa`, `target`, `ecid` …); Web SDK `set-consent` call on www.sap.com |
| Footer | "Cookie preferences" button (TrustArc container `#teconsent`) and "Do not share/sell my personal information" → `www.sap.com/registration/dnss.html` |
| Tags under consent | Launch, Analytics, Target, Marketo Munchkin, Microsoft Clarity, Meta pixels — plus LinkedIn, Google Ads/Floodlight, Bing UET, Reddit, Taboola, 6sense, Qualtrics, StackAdapt and others seen in network requests |

## Native capability
- **No built-in consent manager** in Experience Workspace or Edge Delivery; consent is project code.
- Adobe's guide for adding a CMP keeps it out of the critical path: load the CMP "by injecting a
  `<script>` tag … rather than adding it to `head.html`, to keep it out of the critical rendering
  path", and gate tracking code behind it. It warns the banner "will typically render a few seconds
  after the page has loaded … If your legal or compliance requirements mandate that the banner render
  immediately, load the CMP's banner script earlier … while still keeping the actual consent-gated
  tracking code" separate ([CMP integration](https://www.aem.live/developer/cmp-integration)).
- Adobe's performance guide lists "consent management" with third-party tags in the **delayed**
  phase, "at least three seconds after the LCP event", and says connecting to a second origin before
  LCP "is strongly discouraged" ([Keeping it 100](https://www.aem.live/developer/keeping-it-100)).
- **Edge Delivery RUM (now "Operational Telemetry")** is built to need no cookies:
  - "AEM Operational Telemetry does not use any client-side state or ID, such as cookies or
    localStorage, sessionStorage or similar, to collect usage metrics."
  - "There is no 'fingerprinting' of devices or individuals via their IP address, User Agent string…"
  - Sampled ("one out of one hundred page views"); "no concept of visits, visitors, or sessions".
  - Adobe classes it as "strictly necessary", but also says: "As a site operator, review the data
    items collected below to understand if they require consent."
    ([Operational Telemetry](https://www.aem.live/docs/operational-telemetry))
- In this repo `scripts/ak.js` loads RUM (`deps/rum.js`) after the first section with no consent
  check; `scripts/lazy.js` (ours) runs after all sections and is the natural hook for TrustArc.
- The page CSP (`head.html`) is nonce + `strict-dynamic`: scripts injected by our code are trusted,
  parser-inserted ones (`document.write`) are blocked ([CSP](https://www.aem.live/docs/csp)).

## Options
| Option | How it works | Pros | Cons |
|---|---|---|---|
| A. Copy sap.com: TrustArc in `head.html` | SAP wrapper + notice script in head, before page content | Banner appears instantly; identical to sap.com | Second origin and blocking script before LCP; breaks the Lighthouse 100 PR check; against Adobe guidance |
| B. TrustArc right after first paint; tags after consent | `lazy.js` injects TrustArc once page content is shown; Launch loads only after TrustArc reports a decision | Banner within ~1 s of content (to be measured); nothing third-party before LCP; one gate for all tags | Banner not instant; small custom loader to build and test |
| C. Fully delayed (Adobe CMP guide default) | TrustArc and tags 3 s+ after LCP | Best lab scores | Banner several seconds late; more early bounces leave no consent record or analytics |
| D. Server-side / edge consent | Akamai reads TrustArc cookies and drops tags | No client cost for repeat visitors | First visit still needs the banner; complex; no Adobe pattern (unverified) |

## Recommended solution
**Option B**, with the same TrustArc domain, categories and texts as sap.com.

```
first section painted ─► lazy.js ─► consent.js injects TrustArc (async)
                                     │  trustarc-ccm-ready
                                     ▼
            decision allows tags? ── no ─► wait for trustarc-consent-updated
                    │ yes
                    ▼
            load Launch (sap.com/events property) ─► Launch rules gate each vendor
```

1. **One small module** (`scripts/utils/consent.js`, imported from `lazy.js`) injects the TrustArc
   notice script with `loadScript` (allowed under `strict-dynamic`). No change to `ak.js`.
2. **Launch is never loaded before a TrustArc decision.** After `trustarc-ccm-ready` the module reads
   `getGDPRConsentDecision`; if any non-required category is allowed (implied regions or explicit
   opt-in) it loads Launch; otherwise it waits for `trustarc-consent-updated`.
3. **Per-vendor gating stays in Launch**, reusing the conditions sap.com already uses (Opt-in service
   and TrustArc categories), so legal sign-off covers one rule set. Vendor mapping to confirm:

| Vendor | Gate on TrustArc category (to confirm with SAP privacy) | Mechanism |
|---|---|---|
| Adobe Analytics (AppMeasurement) | Functional / analytics | Launch Opt-in service `aa` / rule condition |
| Adobe Target | Functional / personalization | Opt-in `target`; not loaded eagerly (see 05) |
| Marketo Munchkin | Advertising / marketing | Launch rule condition — Munchkin not loaded until allowed |
| Microsoft Clarity | Functional / analytics | Load after consent, or call `clarity('consentv2', {ad_Storage, analytics_Storage})` |
| Meta and other ad pixels | Advertising | Launch rule condition — pixel not loaded until allowed |
| Edge Delivery RUM | None (strictly necessary, cookieless) — **privacy sign-off needed** | Loaded by `ak.js` |

4. **If Web SDK is adopted (see 05/06):** configure `defaultConsent: 'pending'` — "Data is stored
   locally until the user opts in using the `setConsent` command" — and call `setConsent` (Adobe 2.0
   standard: `collect`, `personalize`, `share`…) on every TrustArc decision. Web SDK keeps the choice
   in the `kndctr_<orgId>_consent` cookie and "only makes a server call when consent changes"
   ([setConsent](https://experienceleague.adobe.com/en/docs/experience-platform/web-sdk/commands/setconsent),
   [defaultConsent](https://experienceleague.adobe.com/en/docs/experience-platform/web-sdk/commands/configure/defaultconsent)).
   Adobe's Edge Delivery plugin defaults to `pending` and warns that setting `in` "without explicit
   user agreement may have significant legal implications" ([Martech integration](https://www.aem.live/developer/martech-integration)).
5. **Regions (high level, legal to confirm):** EU/EEA, UK, Switzerland and similar are opt-in —
   nothing non-essential before an explicit choice. The US is notice + opt-out — tags may run on
   implied consent, but "Do not share/sell" (and possibly Global Privacy Control) must be honoured.
   TrustArc decides behaviour per visitor location; we do not hard-code regions.
6. **Footer:** the footer fragment carries the "Cookie preferences" container (`#teconsent`) and the
   existing "Do not share/sell my personal information" link to the sap.com page, authored as
   content so every market inherits it.

## Gaps and custom work
| Work | Where | Effort |
|---|---|---|
| Consent loader: inject TrustArc, read decision, listen for updates, load Launch once | `scripts/utils/consent.js` + one line in `lazy.js` | S |
| Pass country/language to TrustArc as the SAP wrapper does (or reuse the wrapper) | consent module | S |
| "Cookie preferences" container and DNSS link in the footer | footer fragment + footer block CSS | S |
| Launch: confirm consent conditions cover every vendor on event pages; remove rules that load pixels unconditionally | Launch property (client team) | M |
| Web SDK `setConsent` mapping (only if Web SDK adopted) | consent module | S |
| Debug override (`?consent=accept/decline` on non-prod only) for testing | consent module | S |

## Risks and open questions
| Item | Owner |
|---|---|
| Is a banner ~1 s after content acceptable to SAP legal, or must it be instant (Option A)? | Client (legal) |
| Same TrustArc domain (`sap.com`) and category IDs for event sites? Meaning of categories 1/2/3 in `consentDecision` | Client (privacy) |
| Does SAP privacy accept Edge Delivery RUM as strictly necessary? Gating it would need an `ak.js` change (shared engine) | Client (privacy) / us |
| Exact TrustArc API and event contract — vendor docs are behind a login; we used what the live page exposes | Client (TrustArc admin) |
| Launch rules or TrustArc scripts that use `document.write` are blocked by the CSP | Us + client tag team |
| The banner text block could become the LCP element on small screens if it appears before first input | Us (measure in RUM) |
| GPC handling and the DNSS flow for US states | Client (legal) |
| Full vendor inventory: far more pixels run today than the brief lists | Client (marketing ops) |

## Proof
| # | Test | Pass condition |
|---|---|---|
| 1 | Network before consent (EU geo, fresh profile) | Only Edge Delivery origin, TrustArc and RUM requests; no Launch, Analytics, Target, Marketo, Clarity or pixel calls |
| 2 | Accept all (EU) | Launch loads once; vendors fire per category; `notice_gdpr_prefs` set |
| 3 | Accept functional only (EU) | Analytics fires; Munchkin and ad pixels do not |
| 4 | Change preferences mid-session via footer "Cookie preferences" | `trustarc-consent-updated` handled; newly declined vendors stop on next page |
| 5 | US visitor (implied) | Banner shown; tags load without a click; DNSS link reachable in footer |
| 6 | Performance | Lighthouse mobile 100 on the PR check; RUM LCP p75 unchanged vs. no-consent baseline (±100 ms) |
| 7 | Web SDK (if adopted) | `set-consent` call only after a choice; no `/ee/v1/collect` while `pending` |

## Sources
- aem.live: [Adding your own CMP](https://www.aem.live/developer/cmp-integration), [Keeping it 100](https://www.aem.live/developer/keeping-it-100), [Operational Telemetry](https://www.aem.live/docs/operational-telemetry), [Martech integration](https://www.aem.live/developer/martech-integration), [CSP](https://www.aem.live/docs/csp) — read 2026-10-29.
- Experience League: [setConsent](https://experienceleague.adobe.com/en/docs/experience-platform/web-sdk/commands/setconsent), [defaultConsent](https://experienceleague.adobe.com/en/docs/experience-platform/web-sdk/commands/configure/defaultconsent), [Opt-in service](https://experienceleague.adobe.com/en/docs/id-service/using/implementation/opt-in-service/optin-overview) — read 2026-10-29.
- [adobe-rnd/aem-martech README](https://github.com/adobe-rnd/aem-martech) (consent mapping examples) — read 2026-10-29.
- Microsoft: [Clarity Consent API v2](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2) — read 2026-10-29.
- Browser observation of www.sap.com/events.html and events.sap.com/gartner-it/en_us/home.html from a US location, 2026-10-29. TrustArc product docs were not reachable without login (unverified beyond the live page).
