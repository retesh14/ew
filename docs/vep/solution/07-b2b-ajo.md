# 07 · B2B Journey Optimizer

Status: draft · Last updated: 2026-10-29

## Requirement
Drive account- and buying-group journeys from event engagement: registration, attendance, no-show
and content engagement on event pages.

## Native capability
Edge Delivery and Experience Workspace provide none of this; they host the pages that create the
signals. Adobe Journey Optimizer B2B edition (AJO B2B) is the journey engine:

| Aspect | What Adobe documents |
|---|---|
| Platform | "built on Adobe Experience Platform, including Real-Time CDP B2B"; AEP is "the primary data store and authoritative source for accounts, people, and opportunities" |
| Journey types | Account journeys — "move accounts through the journey, not people"; person journeys use AEP audiences for lead-based marketing |
| Buying groups | Solution interest (what we sell) + account audience (to whom) + role templates from person attributes, e.g. job title; completeness and engagement scores |
| Entry | Every journey starts with an account or person audience; "Qualifying accounts enter a published journey within 24 hours" |
| Triggers | *Listen for an event*: account events (interesting moment, buying-group stage / status, score changes) and people events, including AEP Experience Events |
| Experience Events | Admin selects "up to 50 events and up to 100 fields per event"; streaming only ("Web SDK or HTTP API"); basic field types only |
| Actions | Email, SMS, WhatsApp, assign to buying group, update profile, interesting moment, LinkedIn activation, Marketo list / request campaign, web experience (beta) |
| Timing | AEP → AJO B2B up to 30 min; audience membership daily; activity events up to 4 h; AJO B2B → AEP up to 4 h |
| Landing pages and forms | Landing pages on an Adobe-delegated subdomain; forms "submit data to Experience Platform" |
| Web channel | Limited availability; needs Web SDK 2.16+ on the site and a browser extension for authors |

**Marketo Engage relationship (what Adobe says).** "Journey Optimizer B2B Edition and Marketo Engage
run on separate systems, each with its own data store." Each subscription has a dedicated Marketo
instance that "does not store your account journeys, audiences, or buying groups" but provides
entitlements and email delivery. Existing Marketo instances, including production, can be connected
"to coordinate account-based journeys … with lead-based campaigns in Marketo Engage". Adobe documents
coexistence; we found no documented migration path off Marketo (unverified — ask Adobe).

**Account matching.** Real-Time CDP B2B lead-to-account matching runs daily, using deterministic and
probabilistic factors on `b2b.companyName`, `b2b.companyWebsite` or `workEmail`; it requires
`b2b.personKey.sourceKey`. Matches are kept "only if the match score is over an internal confidence
threshold". Accounts without an Account Name are excluded from account journeys.

## Options
| Option | How it works | Pros | Cons |
|---|---|---|---|
| A. Marketo Engage only (today) | Munchkin web activity (observed) and Marketo programs (SAP's use of event programs unverified) drive person-based nurture | Exists, team knows it, no new licences | Person-level; buying groups and account journeys live in AJO B2B; web signals limited to Munchkin |
| B. AJO B2B account journeys + Marketo coexisting | AEP events (06) trigger account journeys; journeys call Marketo request campaigns / lists for existing event emails | Account and buying-group view; Adobe-documented coexistence; reuses Marketo assets | Needs RTCDP B2B data model and account data; daily audience cycle; two tools to operate |
| C. AJO B2B landing pages and forms for registration | Registration pages and forms built in AJO B2B, submitting to AEP | One tool for page + journey | Bypasses the SAP forms service and CRM; second page stack beside Edge Delivery; loses EDS speed and authoring |
| D. Full move of event nurture to AJO B2B | Person journeys replace Marketo programs | One journey tool | No documented migration path (unverified); AJO B2B still relies on Marketo for email delivery; high change cost |

## Recommended solution
**B, phased.** Edge Delivery stays the event front end, the SAP forms service stays the registration
system of record, AEP is the data hub (06), AJO B2B orchestrates accounts, Marketo keeps existing
event programs and emails.

| Signal | Origin | Reaches AJO B2B as | Typical journey use |
|---|---|---|---|
| Registered | App Builder after Form.io submit (08) | Experience Event `sapEvent.registered` (proposed name, see 06) | Advance account; assign registrant to buying group; confirmation via Marketo request campaign |
| Attended | ON24 / onsite check-in via App Builder (09) | Experience Event `sapEvent.attended` | Raise buying-group stage; sales follow-up |
| No-show | Registered and not attended after event end | *Wait* node to event end, then split on event history (or a batch audience) | Send on-demand recording |
| Content engagement | Web SDK session-interest and page views (06) | Experience Event history filter; engagement-score weighting with AEP events | Pick next-best content per solution interest |
| Account fit | CRM / Marketo account data | Account audience (daily) | Journey entry: target accounts for this event |

**Account matching from registration**, in order of preference:
1. CRM link — if the forms service / SAP CRM returns contact and account IDs, ingest them as
   `b2b_person`, `b2b_account` and the account-person relation. Deterministic; preferred.
2. RTCDP B2B lead-to-account matching on company name, company website or work email — daily,
   threshold-based; covers new registrants not yet in CRM.
3. Email-domain lookup in App Builder (domain → account, free-mail domains excluded) — only if 1
   and 2 leave gaps; custom code and data to maintain.

Job title from the form maps to buying-group roles; each event track maps to a solution interest.

**Where Edge Delivery fits**

| Need | Edge Delivery role | Note |
|---|---|---|
| Event landing pages | Experience Workspace-authored pages; journey emails link to them | Recommended over AJO B2B landing pages: one page stack, EDS performance |
| Personalized content | Account-aware content via the AJO B2B web channel (needs Web SDK) or Target with RTCDP people audiences | Web channel is limited availability; Target does not take account audiences; mobile LCP up to +1.2 s with page modifications |
| Form capture | Registration block posts to the SAP forms service (08); App Builder emits the AEP event | Keeps CRM consent and `YY_FORM_SUBMIT` interaction intact |
| Signal capture | Web SDK on pages, after TrustArc consent (04, 06) | Experience Events must be streaming to trigger journeys |

## Gaps and custom work
| Work | Where | Effort |
|---|---|---|
| B2B namespaces and schemas via Adobe's Postman utility; XDM field selection in AJO B2B | AEP / AJO B2B admin | S–M |
| Ingest SAP CRM accounts, contacts and relations (and/or Marketo source) into AEP | AEP sources / ETL | L |
| Experience Event configuration for registered / attended / session interest | AJO B2B admin | S |
| Attendance and no-show feed from ON24 / onsite | App Builder (shared with 06, 09) | M–L |
| Account matching fallback (domain lookup), if needed | App Builder | M |
| Solution interests, role templates, buying-group stages for the event portfolio | AJO B2B, with SAP marketing | M |
| First account journey (registration → attendance / no-show → follow-up) with Marketo request campaign | AJO B2B + Marketo | M |
| Marketo connection (custom service, Munchkin ID, client ID / secret) for journey actions | Marketo + AJO B2B admin | S |

## Risks and open questions
| Item | Owner |
|---|---|
| Licences and entitlements: AJO B2B, RTCDP B2B or B2P, Prime vs Ultimate — confirm, not assumed | Client / Adobe |
| Does SAP already run AJO B2B or RTCDP B2B for sap.com? Reuse that sandbox and data model | Client |
| Adobe's roadmap for Marketo Engage vs AJO B2B for event programs (no migration path found) | Adobe |
| Can the forms service / CRM return account IDs for registrants? Decides matching approach | Client |
| Daily audience cycle: accounts enter journeys within 24 h; same-day follow-up must use event triggers | Us |
| Experience Event history: "no delete mechanism for accumulated event history" — privacy review | Client |
| Event history is not backfilled for new people; journeys only see events after the person exists | Us |
| Marketo source connector availability note (AWS-hosted AEP) — check SAP's AEP infrastructure | Adobe |
| Consent and communication channels from registration (08) must gate journey emails and SMS | Client |
| Web channel (limited availability) readiness and its page-performance cost | Adobe / us |

## Proof
| # | Test | Pass condition |
|---|---|---|
| 1 | Registration trigger | A test registration's Experience Event advances its account in a published journey within 30 minutes |
| 2 | Account match | A registrant with a known company email is linked to the right CRM account (or matched with a score) and appears in the account audience |
| 3 | Buying group | Registrant with a job title matching a role template is assigned to the buying group for the event's solution interest |
| 4 | No-show path | A registered, non-attending test contact receives the recording email after the event end wait |
| 5 | Marketo coexistence | Journey action adds the person to the Marketo request campaign and the existing event email is sent |
| 6 | Consent | A registrant without marketing consent enters no email path |
| 7 | Page speed | Event pages keep their PageSpeed score with Web SDK present and no web-channel modifications |

## Sources
All read 2026-10-29. Experience League paths are under `https://experienceleague.adobe.com/en/docs/`.
- AJO B2B: `journey-optimizer-b2b/user/guide-overview`, `…/user/get-started/about-journey-optimizer-b2b-edition`,
  `…/user/get-started/admin-setup/setup-ultimate`, `…/user/get-started/admin-setup/configure-aep-events`,
  `…/user/get-started/admin-setup/namespaces-schemas`, `…/user/get-started/admin-setup/marketo-actions-connect`
- AJO B2B journeys: `…/user/journeys/journeys-overview`, `…/user/journeys/journey-nodes/listen-for-event-nodes`,
  `…/user/journeys/journey-nodes/action-nodes`, `…/user/accounts/buying-groups/buying-groups-overview`,
  `…/user/audiences/account-audience-overview`, `…/user/data/data-availability-timing`, `…/user/release-notes`
- AJO B2B pages: `…/user/admin/channels/configure-channels-landing-pages`,
  `…/user/content-management/landing-pages/landing-pages-create-publish`, `…/user/journey-content/web-channel/web-experiences`
- RTCDP B2B: `experience-platform/rtcdp/intro/rtcdpb2b-intro/b2b-overview`,
  `experience-platform/rtcdp/b2b-cdp-ai-ml/lead-to-account-matching`,
  `experience-platform/sources/connectors/adobe-applications/marketo/marketo`
- Destinations: `experience-platform/destinations/catalog/adobe/marketo-engage`,
  `experience-platform/destinations/catalog/personalization/adobe-target-connection`
- Marketo event programs: `marketo/using/product-docs/demand-generation/events/understanding-events/understanding-event-programs`
- aem.live: https://www.aem.live/developer/martech-integration (performance figures)
