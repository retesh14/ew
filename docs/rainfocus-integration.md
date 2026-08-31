# RainFocus → Events Feed Integration (EDS + App Builder)

Training + design reference for the backend team taking the SAP events demo from a
**static mock feed** to a **live RainFocus-backed feed**.

---

## 1. How the events pages consume data today

The events blocks (`blocks/event-cards/event-cards.js`, `blocks/global-events/…`) do
**one** thing for data:

```js
const resp = await fetch(sheet);      // sheet = a same-origin URL, e.g. /events/third-party.json
const json = await resp.json();
const rows = json.data || [];         // render one card per row; filter client-side
```

- The block is authored with the **feed URL in a content row** (Row 1). Row 2 = a tab
  location filter (`explore-all | in-person | virtual-live | virtual-on-demand`),
  Row 3 = comma-separated facet columns to expose as dropdowns.
- **The block never calls RainFocus.** It only knows a URL that returns a specific
  JSON shape. This decoupling is the whole design — keep it.

Today those URLs (`/events/third-party.json`, `/events/all-events.json`) are **static
mock sheets** hosted in Document Authoring (`:type: sheet`). Production swaps the mock
for a live feed **at the same URL, in the same shape**.

## 2. The feed contract (FROZEN interface)

This is the contract between front-end (EDS block) and back-end (App Builder). It must
not drift — the block renders exactly these fields.

```jsonc
{
  "total":  6,          // number of rows
  "offset": 0,
  "limit":  6,
  "data": [
    {
      "title":       "WeAreDevelopers World Congress North America",  // REQUIRED
      "date":        "September 23–25, 2026",   // display string (already formatted)
      "location":    "San Jose, USA",           // also drives filtering (see below)
      "description": "",
      "image":       "",   // absolute/managed URL or empty
      "link":        "",   // detail URL or empty
      "linktext":    ""    // CTA label or empty
      // extra facet columns (e.g. region, product-category, event-category, language)
      // are allowed and can be exposed as dropdown filters via the block's Row 3
    }
  ]
}
```

**Location semantics the block relies on for the virtual/in-person tabs:**
- `"Online - Live"`      -> `virtual-live`
- `"Online - On-demand"` -> `virtual-on-demand`
- anything NOT starting `"Online -"` -> `in-person`

If RainFocus expresses this differently, **map it to these strings in the action** —
do not change the block.

## 3. Target architecture (production)

RainFocus's API is authenticated, rate-limited, and not CORS-friendly, so it **cannot
be called from the browser**. An **Adobe App Builder** action sits in the middle:

```
RainFocus API  ->  App Builder action (Node; holds API key, transforms, caches)
               ->  events feed JSON (same shape as the mock)
               ->  EDS block fetch()
```

Two ways to deliver the JSON same-origin to the block (pick one):

- **A. Action serves it directly** — the block fetches the App Builder action URL.
  Requires correct **CORS headers** on the action response.
- **B. Action writes the JSON into DA/EDS** (same path the mock uses today) on a
  schedule. The block keeps fetching a same-origin `/events/*.json`. **Recommended** —
  it matches today's setup, is fastest at the edge, and needs no CORS.

## 4. Why an action, not a direct call (teach this)

| Concern | Why the block can't do it | Where it lives instead |
|---|---|---|
| RainFocus API key | Would be exposed in browser JS | App Builder env / Developer Console secrets |
| CORS | RainFocus won't allow browser origins | Action (server-to-server) |
| Rate limits | Every page view would hit RainFocus | Action **caches**; cron refreshes |
| Response shape | RainFocus != our feed contract | Action **transforms** to section 2 |

## 5. Backend dev learning path (priority order)

1. **Adobe App Builder / I/O Runtime** — serverless Node actions, `aio` CLI
   (`aio app init`, `aio app deploy`), Adobe Developer Console projects & credentials.
   *The core new skill.* -> developer.adobe.com/app-builder
2. **RainFocus API** — auth (API key/token), events/sessions endpoints, pagination,
   rate limits. (Vendor docs / account team.)
3. **Data transformation** — map RainFocus response -> the section 2 contract. The
   contract is the interface; keep it stable even if RainFocus changes.
4. **Caching & scheduling** — `@adobe/aio-lib-state` / `-files` for caching; a
   **cron-triggered action** to refresh the feed (e.g. every 15 min). Replaces the
   on-prem scheduled workflow.
5. **Secrets management** — RainFocus key in App Builder env + Developer Console,
   never in the EDS repo or a block.
6. **Delivery** — CORS headers (option A) or write-to-DA (option B, recommended).
7. **Node.js fundamentals** (for Java/on-prem devs) — `async/await`, `fetch`, npm, JSON.

## 6. What the lead (you) should own

- **The feed contract (section 2)** — treat it as a frozen API. Main design lever.
- **Freshness policy** — how stale can event data be? Drives cron interval + cache TTL.
- **Same-origin vs cross-origin delivery** (section 3 A vs B) — recommend B.
- **Secrets boundary** — where the RainFocus key may live.

## 7. Migration note (on-prem -> EDS)

The on-prem AEM custom workflow that fetched/synced event data becomes an **App Builder
action + cron trigger**. Nothing about this logic runs inside the CMS anymore — EDS only
renders the resulting JSON. See the reference action at
`tools/app-builder-poc/actions/events-feed/` (index.cjs).
