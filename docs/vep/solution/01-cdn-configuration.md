# 01 · CDN configuration (Akamai)

Status: draft · Last updated: 2026-10-29

## Requirement
Serve VEP event pages (Tiers 2 and 3) from Edge Delivery on SAP's own domain, through Akamai, the
CDN that sap.com and events.sap.com already use. events.sap.com must move gradually, not all at
once. QA must be protected, and some paths may need visitor login.

## Native capability
Adobe documents BYO CDN setup in general and for Akamai Property Manager in particular
([BYO CDN Setup](https://www.aem.live/docs/byo-cdn-setup), [Akamai Setup](https://www.aem.live/docs/byo-cdn-akamai-setup)).
The settings that matter:

| Area | Adobe guidance |
|---|---|
| Origin | `main--<repo>--<org>.aem.live`. Forward Host Header = **Origin Hostname**, Cache Key Hostname = **Incoming Host Header**, SNI on, Trust = Akamai-managed CA sets. "Do NOT set **Trust** to **Specific Certificates (pinning)**" |
| Headers sent to origin | `X-Forwarded-Host: {{builtin.AK_HOST}}`, `X-BYO-CDN-Type: akamai`, `X-Push-Invalidation: enabled` |
| Caching | "Honor origin Cache-Control"; Enhanced RFC support, Honor private and Honor must-revalidate = No; Remove Vary Header = On. Query strings "Must be forwarded to origin" and "Must be included in cache key"; `Age` "must be either suppressed or overridden (`Age: 0`)" |
| Response clean-up | Remove `X-Robots-Tag` on every path except `*.plain.html` (the origin sends `noindex, nofollow` so `aem.live` stays out of search engines) |
| Protocol | HTTP/2 behavior; 301 rule from HTTP to HTTPS that keeps host, path and query |
| Do not enable | Akamai mPulse, Bot Manager Premier or "similar Web Application Firewall offerings" ("markedly interfere with rendering performance"), SureRoute |
| Push invalidation | Akamai Fast Purge API ("Delete by URL and Delete by cache tag"). Credentials (`endpoint`, `clientToken`, `clientSecret`, `accessToken`) and `host` go into the site's `cdn.prod` config in the Config Service. By default only the `main` origin triggers purges; `cdn.prod.branch` can name `dev`, `develop`, `stg`, `stage`, `uat` or `qa` ([Push invalidation](https://www.aem.live/docs/setup-byo-cdn-push-invalidation-for-akamai)) |
| Origin authentication | Optional `Authorization: token <site token>` request header if the `.live` origin is protected ([Site authentication](https://www.aem.live/docs/authentication-setup-site)) |
| Redirects | `redirects` sheet at the site root (`Source`, `Destination`; max 100k; no wildcards). Wildcard rules belong in the CDN ([Redirects](https://www.aem.live/docs/redirects), [Limits](https://www.aem.live/docs/limits)) |
| Response headers | `headers` object in the site config, by glob path; applied to preview and live ([Custom headers](https://www.aem.live/docs/custom-headers)). CSP with nonce + `strict-dynamic` is built in ([CSP](https://www.aem.live/docs/csp)) |
| Visitor login (CUG) | `closed-user-groups` sheet becomes `x-aem-cug-*` headers (DA: CUG plugin). "Enforcement happens at the CDN edge"; Adobe provides a sample Akamai EdgeWorker ([CUG](https://www.aem.live/developer/closed-user-groups)) |

Adobe's CDN guide says Akamai "can combine sites with multiple backends, which helps when migrating
a legacy site" ([Picking the right CDN](https://www.aem.live/docs/cdn-guide)).

Observed on 2026-10-29 (Adobe-run Edge Delivery origin, Akamai opt-in headers sent):
`edge-control: !no-store,max-age=172800s,downstream-ttl=7200s`, an `edge-cache-tag` header, and
`strict-transport-security: max-age=31536000`. So Akamai keeps pages for 2 days and relies on push
purge; browsers keep them for 2 hours. Page URLs ending in `.html` return 404, so legacy URLs such as
`/<event>/en_us/home.html` cannot be served unchanged. events.sap.com returns 403 to scripted clients,
which shows bot protection is active today.

## Options
| Option | How it works | Pros | Cons |
|---|---|---|---|
| A. Path routing on the existing events.sap.com property (strangler) | New rules send VEP paths and the shared code paths to the Edge Delivery origin; everything else stays on the legacy origin | Same domain, SEO equity and cookies; events move one at a time; standard Akamai pattern | Changes a live production property; shared root paths may collide; legacy bot/WAF policy must be split out |
| B. New hostname / property (e.g. a new events subdomain) | Separate Akamai property, Edge Delivery is the only origin | Clean, low blast radius, simple to own | New domain for SEO and brand; CUG session not shared with events.sap.com; DNS and cert work |
| C. Big bang: whole events.sap.com to Edge Delivery | Default origin switched | One origin, simplest end state | Every legacy event must be migrated or redirected first |
| D. Adobe-managed CDN | Adobe's included CDN on a subdomain | Adobe operates it, included in license | Not the sap.com vendor; Akamai CUG sample does not apply; cannot share the events.sap.com host |

## Recommended solution
**Option A**, built and tested on the Akamai staging network first, with option B as the fallback if path
collisions or change control make A impractical.

```
Browser ─► Akamai, property for events.sap.com
             ├─ VEP paths + shared code paths ─► main--<repo>--<org>.aem.live   (CUG EdgeWorker on gated paths only)
             └─ everything else ─────────────► legacy events origin (unchanged)
```

| Routed to Edge Delivery | Why |
|---|---|
| `/<vep-prefix>/**` (one common prefix, so new events need no rule change) | Event pages and their `media_*` images |
| `/scripts/`, `/styles/`, `/blocks/`, `/templates/`, `/deps/`, `/img/`, `/fragments/` | Code synced from GitHub and shared header/footer fragments |
| `/.rum/**` | RUM beacons are posted to the same host |
| `/<vep-prefix>/sitemap.xml` | Edge Delivery sitemap, referenced from the legacy `robots.txt` or sitemap index |

- **URLs:** new events launch with Edge Delivery URLs (no `.html`). Legacy events stay on the legacy origin
  until they expire. If a live event is moved, add 301s for its exact old URLs in the `redirects` sheet,
  or one Akamai wildcard rule per pattern. Do not rewrite paths in the CDN, so canonical and sitemap URLs match.
- **Config Service:** `cdn.prod.host = events.sap.com` (used for push purge and sitemap URLs), Fast Purge
  credentials, `robots.txt`, custom headers.
- **Security headers:** keep the origin's CSP and HSTS. Add `X-Content-Type-Options`, `Referrer-Policy`,
  `frame-ancestors` and `Permissions-Policy` through the site `headers` config, so preview shows the same
  headers as production. Values should match sap.com policy.
- **Protection:** preview and QA on `*.aem.page` with `access.preview` (Sidekick sign-in or site token);
  production-like QA on Akamai staging pointing at `main` (or a `stage` branch with `cdn.prod.branch`).
  `aem.page`/`aem.live` are kept out of search engines by the origin.
- **CUG:** EdgeWorker only on rules matching gated paths, so public pages stay plain cached delivery.
  The IdP is decided in [02](02-authentication-session.md). Because "an Akamai EdgeWorker's `httpRequest`
  can only reach hostnames served by the same Akamai property", the IdP token call goes through a
  Property Manager rule on the same property.

| Who owns what | SAP web ops | SAP security | Adobe | Us |
|---|---|---|---|---|
| Property rules, DNS, TLS cert, staging activation | ✔ | | | advise |
| Fast Purge API client (Akamai IAM) | ✔ | approve | | enter in Config Service |
| Bot / WAF policy on VEP paths | ✔ | decide | advise | |
| Edge Delivery origin, purge service, support | | | ✔ | |
| Config Service (`cdn`, `headers`, `robots.txt`), `redirects` sheet | | | | ✔ |
| CUG EdgeWorker code | deploy | review | sample | build |

## Gaps and custom work
| Item | Where | Effort |
|---|---|---|
| Rule set: origin, outgoing headers, caching, Vary/`X-Robots-Tag`/`Age` handling, HTTPS, path match | Akamai Property Manager | M |
| Fast Purge client, `cdn.prod` config, check with Adobe's validation tool | Akamai IAM + Config Service | S |
| Audit of root paths against legacy events.sap.com, final routing list | Akamai + legacy site | S |
| Security headers baseline | Config Service `headers` | S |
| `robots.txt` / sitemap index hand-off with the legacy site | Legacy site + Config Service | S |
| Redirects for any migrated legacy event | `redirects` sheet / Akamai | S per event |
| CUG EdgeWorker adapted from Adobe's sample to SAP's IdP, secrets, logout | Akamai EdgeWorkers | L |
| Staging test plan and go-live runbook (incl. aemgolives@adobe.com notice) | Docs | S |

## Risks and open questions
| Item | Owner |
|---|---|
| Same property as events.sap.com, or a new one? Change control and blast radius on a live property | client |
| Root code paths (`/scripts/`, `/styles/` …) may already be used by the legacy site | client / us |
| Adobe advises against Bot Manager / WAF; SAP's current bot protection must be relaxed or scoped on VEP paths | client security / Adobe |
| Fast Purge credentials are stored in Adobe's config; scope of the API client and whether purge-by-tag can touch other properties (unverified) | client / Adobe |
| EdgeWorkers licensing and resource limits on SAP's Akamai contract (unverified) | client |
| Adobe's CUG repo is "not an official reference implementation"; support model for the EdgeWorker | Adobe / us |
| CUG session cookie domain and logout when users move between legacy and VEP paths | client / us |
| Purge latency is described only as "reasonable speed"; no SLA found (unverified) | Adobe |
| Which `<vep-prefix>`; owner of `robots.txt` and the sitemap index on events.sap.com | client |

## Proof
| # | Test | Pass condition |
|---|---|---|
| 1 | Request a VEP page through Akamai staging | 200 from Edge Delivery; no `X-Robots-Tag`, no `Vary`; `Age` absent or `0` |
| 2 | Request legacy events.sap.com pages through staging | Responses unchanged from production |
| 3 | Second request with Akamai debug pragma | Cache hit on the edge |
| 4 | Same page with `?a=1` and `?a=2` | Two separate cache entries; parameters reach origin |
| 5 | Publish a text change | Visible on events.sap.com without a manual purge, within the agreed window |
| 6 | `curl -sI http://events.sap.com/<vep-path>?x=1` | `301` to `https://…?x=1` |
| 7 | Open `*.aem.page` preview without sign-in | 401 |
| 8 | Gated path, not logged in / logged in | Redirect to IdP / 200 with `Cache-Control: private`; no `x-aem-cug-*` in the response |
| 9 | Response headers on a public page | CSP with per-response nonce, HSTS, agreed security headers |
| 10 | PageSpeed Insights on production URL | Lighthouse performance 100 (no CDN-injected scripts) |
| 11 | Legacy URL of a migrated event | 301 to the new URL, no chain |
| 12 | RUM beacon to `/.rum/…` | Reaches origin (2xx) |

## Sources
Read 2026-10-29.
- Adobe: [BYO CDN Setup](https://www.aem.live/docs/byo-cdn-setup), [Akamai Setup](https://www.aem.live/docs/byo-cdn-akamai-setup),
  [Push invalidation](https://www.aem.live/docs/setup-byo-cdn-push-invalidation), [Push invalidation for Akamai](https://www.aem.live/docs/setup-byo-cdn-push-invalidation-for-akamai),
  [Picking the right CDN](https://www.aem.live/docs/cdn-guide), [Config Service](https://www.aem.live/docs/config-service-setup),
  [Site authentication](https://www.aem.live/docs/authentication-setup-site), [Redirects](https://www.aem.live/docs/redirects),
  [Custom headers](https://www.aem.live/docs/custom-headers), [CSP](https://www.aem.live/docs/csp), [Security](https://www.aem.live/docs/security),
  [Limits](https://www.aem.live/docs/limits), [Go-live checklist](https://www.aem.live/docs/go-live-checklist),
  [Closed User Groups](https://www.aem.live/developer/closed-user-groups).
- Adobe sample: [aem-edge-cug Akamai EdgeWorker](https://github.com/aemsites/aem-edge-cug/tree/main/workers/akamai/cug-akamai-worker)
  and its `docs/CUG_AKAMAI_GUIDE.md`.
- Observed: `server: AkamaiGHost` on www.sap.com and events.sap.com; 403 to scripted requests on events.sap.com;
  origin response headers on `main--aem-website--adobe.aem.live`; `.html` page URLs 404 on Edge Delivery; this
  repo's `head.html` and scripts (root code paths, `/.rum/` beacons).
