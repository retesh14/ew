# VEP on AEM Experience Workspace — solution design

Started: 2026-10-29 · Scope: SAP event sites (Tiers 2 and 3) on AEM Experience Workspace + Edge Delivery

One file per topic, in the recommended working order — foundations first, because later topics
depend on them. Each file follows [`_template.md`](_template.md) and moves through
`not started → draft → under review → agreed`.

## What sap.com runs today (observed 2026-10-29)

| Area | Observed | Evidence |
|---|---|---|
| CDN | Akamai | `server: AkamaiGHost` on www.sap.com and events.sap.com |
| Search | SAP Intelligent Search (`search.sap.com`, UI5 web components on SAP BTP) backed by Coveo | requests to `*.org.coveo.com` |
| Tags | Adobe Launch (`_satellite`), `adobeDataLayer` | page globals |
| Analytics | Adobe Analytics via AppMeasurement (`s`), `smetrics.sap.com`; Web SDK (`alloy`) not present | page globals, requests |
| Other martech | Adobe Target, Marketo (Munchkin), Microsoft Clarity, Meta pixels | requests |
| Consent | TrustArc | `consent.trustarc.com`, `truste` global |
| Registration | Shared Form.io form on `forms.services.sap.com` → CRM | registration page requests |

## Topics

| # | Topic | Group | Native in EW / EDS? | Depends on | Status |
|---|---|---|---|---|---|
| [01](01-cdn-configuration.md) | CDN configuration (Akamai) | Platform | Partly — Adobe documents Akamai setup | — | not started |
| [02](02-authentication-session.md) | Authentication / session propagation | Identity | Partly — IMS for authors; visitors via CUG + edge | 01 | draft |
| [03](03-user-management-groups.md) | User management / groups provisioning | Identity | Partly — path ACLs native; lifecycle needs scripting | 02 | draft |
| [04](04-consent-management.md) | Consent management (TrustArc) | Data & privacy | No — client tag integration | — | not started |
| [05](05-analytics.md) | Analytics (Adobe Analytics, RUM) | Data & privacy | Partly — RUM built in; Launch is ours | 04 | not started |
| [06](06-aep-cja-cdp.md) | AEP, CJA, Real-Time CDP | Data & privacy | No — data collection design | 04, 05 | not started |
| [07](07-b2b-ajo.md) | B2B Journey Optimizer | Marketing | No — integration | 06, 08 | not started |
| [08](08-registration.md) | Registration | Experience | No — SAP Forms (Form.io) integration | 02, 04 | not started |
| [09](09-integrations.md) | Integrations (IDS, CTT, SAC, ON24, Plan2Meet, onsite, Form.io, CSC) | Integrations | No — App Builder pattern | 02, 08 | not started |
| [10](10-assets-dynamic-media.md) | AEM Assets with Dynamic Media | Content | Yes — EW supports AEM Assets | — | not started |
| [11](11-translation-strategy.md) | Translation strategy | Content | Yes — EW Translate + Rollout (PoC done) | 10 | not started |
| [12](12-search.md) | Search integration (Coveo / SAP Intelligent Search) | Experience | Partly — query index native; Coveo is ours | 01 | not started |
| [13](13-semaphore.md) | Semaphore (taxonomy / tagging) | Content | No — integration | 10, 12 | not started |
| [14](14-right-to-left.md) | Right-to-left languages | Experience | Yes — engine sets `dir`; CSS work needed | 11 | draft |

## Cross-cutting principles (apply to every topic)

1. **Native first.** Use what Experience Workspace and Edge Delivery provide before building.
2. **Server-side for secrets.** Anything that needs credentials runs in App Builder or at the edge, never in the browser.
3. **Fast pages.** Third-party scripts load after the page is usable; nothing new on the critical path.
4. **Consent gates data.** No tracking or profile tool fires before TrustArc consent allows it.
5. **Prove before investing.** Each topic ends with a PoC test the board can see pass or fail.
