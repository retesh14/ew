# 12 · Search integration

Status: draft · Last updated: 2026-10-29

## Requirement
Event pages show up in sap.com site search (search.sap.com, SAP Intelligent Search on Coveo) with
event facets, and visitors on an event page can start a search.

## Native capability
| Capability | What Edge Delivery provides | Source |
|---|---|---|
| Query index | JSON list of **published** pages, with properties taken from the server HTML (meta tags or CSS selectors). "An index does not contains pages that have only been previewed but never published." Default path `/query-index.json`; `include`/`exclude` per index; several indexes per site | [Indexing](https://www.aem.live/developer/indexing), [Indexing reference](https://www.aem.live/docs/indexing-reference) |
| Index configuration | Index Admin tool, or Config Service `content/query.yaml`, or `helix-query.yaml` in GitHub. Once the Config Service is on, its settings "override the settings you have in configuration files in your GitHub repository" | [Config Service](https://www.aem.live/docs/config-service-setup) |
| Limits | 50k pages per index; JSON responses max 6 MB, so use `limit`/`offset` | [Limits](https://www.aem.live/docs/limits) |
| Sitemap | `sitemap.xml` generated from published pages or from an index; `lastmod`, `hreflang` per language, host from `cdn.prod.host`; pages with `robots: noindex` left out if the index has a `robots` column | [Sitemap](https://www.aem.live/developer/sitemap) |
| Bulk metadata | `metadata` sheet sets values by URL pattern (e.g. region for a whole folder); page metadata wins | [Bulk metadata](https://www.aem.live/docs/bulk-metadata) |
| Search block | Block Collection block that searches `/query-index.json` in the browser | [Search block](https://www.aem.live/developer/block-collection/search) |
| Change feed | Audit log records `live` (publish/unpublish) and `index` operations; readable through the Admin API | [Audit log](https://www.aem.live/docs/auditlog) |
| Not in DA | Spreadsheet-based index and `helix-default` filters work only for SharePoint/Google Drive. Adobe's taxonomy feature is for AEM authoring / Universal Editor, so in DA tags are plain metadata (see 13) | [Indexing](https://www.aem.live/developer/indexing), [Taxonomy](https://www.aem.live/docs/authoring-taxonomy) |

Coveo, from Coveo docs:

| Coveo source | Behaviour |
|---|---|
| Sitemap source | Indexes the URLs in a sitemap; updates an item only if its last-modified date is newer than the last run. "A rescan or rebuild operation is required to take account of deleted sitemap entries"; rescan runs daily by default. "Automatically extracts the `content` attribute from `<meta>` tags that include a `name` attribute"; ignores `robots.txt`; JavaScript rendering optional |
| Web source | Follows links from a start URL; obeys `robots.txt` by default; daily rescan "defined, but not enabled by default"; reads `<meta>` `name`, `property`, `itemprop`, `http-equiv` |
| Push source / Push API | `PUT …/sources/<id>/documents?documentId=<url>` to add or update, `DELETE` to remove; returns 202; request body max 6 MB; use batch calls for many items |

Observed 2026-10-29 in this repo and on the reference page:
- `helix-query.yaml` defines only `blog` and `authors` indexes, with no index for `/vep/`; `query-index.json` returns 404 on `.live`.
- The reference page is previewed but not published, so no index can include it yet.
- Its head has `title`, `description`, `og:*` and `template`. It has no event type, region, date or language meta.
- `<html lang>` is set in the browser by `scripts/ak.js`, so the server HTML that the indexer and crawlers read has no language.

## Options
Feeding Coveo:

| Option | How it works | Pros | Cons |
|---|---|---|---|
| A. Coveo Sitemap source | SAP's Coveo admin points a source at the Edge Delivery sitemap on events.sap.com; meta tags are mapped to Coveo fields | No code; uses native sitemap and `lastmod`; facets come from meta tags | Updates wait for the next refresh; deletions wait for rescan; crawler must get past Akamai bot rules |
| B. Coveo Web source | Crawler follows links on events.sap.com | Possibly what is set up today (unverified) | Finds pages only through links; `robots.txt`/bot rules apply; slower and less predictable |
| C. Push from Edge Delivery | Scheduled job (e.g. App Builder) reads the audit log or query index and calls the Push API | Near real-time; explicit deletes; fields come straight from the index | Custom code, Coveo API key handling, monitoring, retries |
| D. Reuse SAP's current ingestion | Plug VEP pages into however search.sap.com loads events.sap.com today | One process for SAP | Mechanism unknown (unverified) |

Search UX:

| Option | How it works | Pros | Cons |
|---|---|---|---|
| 1. Link to search.sap.com | Header search box opens search.sap.com with the query | Same experience as sap.com; almost no code | Visitor leaves the event site; event facets depend on SAP's search UI |
| 2. Embedded Coveo results | Block using Coveo Atomic ("a web component library for assembling … Coveo-powered search interfaces") against SAP's org | Results stay in the event site | Needs SAP Coveo credentials, CSP and consent review, analytics, design; extra script, so load it lazily |
| 3. Local search block | Block Collection search over the VEP query index | Native, fast, no third party | Only Edge Delivery pages; simple matching; not sap.com relevance |
| 4. Event finder listing | Filterable list built from the query index (type, region, date) | Covers "find an event" without keyword search | Listing only; still needs option 1 for full-text search |

## Recommended solution
1. **One VEP index** in the Config Service (`content/query.yaml`; retire the repo file if the Config
   Service is active). Scope it to the VEP prefix from [01](01-cdn-configuration.md) and exclude gated (CUG) paths.
2. **Event metadata as `<meta name>` tags.** Authors fill them in the page Metadata block; folder defaults
   come from the `metadata` sheet. The index and Coveo both read the same tags:

| Facet | Meta name | Value from | Note |
|---|---|---|---|
| Event type / format | `event-type`, `event-format` | Controlled list (13) | e.g. Connect Day; in person / virtual |
| Region, country, city | `region`, `country`, `city` | Bulk metadata by market folder | Align codes with sap.com |
| Start / end date | `event-start`, `event-end` | Author, ISO `YYYY-MM-DD` | Used for "upcoming" filter and expiry |
| Language | `language` | Bulk metadata by locale folder | Needed because `<html lang>` is client-side |
| Topics / tags | `article:tag` (index `tags`) | Semaphore or author (13) | Multi-value |
| Tier, robots, image, description, lastModified | `tier`, `robots`, standard | Template / author | `robots: noindex` keeps a page out of the sitemap |

3. **Coveo Sitemap source (option A)** on `events.sap.com/<vep-prefix>/sitemap.xml`, with `lastmod`
   on and one sitemap per language with `hreflang` (ties to 11). SAP's Coveo team maps the meta names to
   fields. Add Push (option C) later only if the freshness or deletion SLA needs it.
4. **UX:** a header search box that links to search.sap.com (option 1). No embedded Coveo results on
   Tier 2/3 sites. Build the event finder (option 4) only if a hub page needs one.

## Gaps and custom work
| Item | Where | Effort |
|---|---|---|
| VEP index definition (properties above, include/exclude) | Config Service `query.yaml` | S |
| Metadata fields in the event template, authoring guide, bulk `metadata` sheet | DA content + docs | S |
| Sitemap config (`lastmod`, languages, `hreflang`), referenced from the events.sap.com `robots.txt` | Config Service + legacy site | S |
| Coveo Sitemap source, field mappings, refresh/rescan schedule | SAP Coveo org | S–M |
| Search box in the VEP header that deep-links to search.sap.com | Header block | S |
| Optional: Push connector (audit log → Push API) with retries and alerts | App Builder | M–L |
| Optional: event finder block on the query index | Block | M |
| Controlled vocabularies for type, region, topics | Topic 13 | M |

## Risks and open questions
| Item | Owner |
|---|---|
| How search.sap.com ingests events.sap.com today (crawler, sitemap, push) and who runs the Coveo org | client |
| URL format for a search.sap.com deep link with a query and an events filter (unverified) | client |
| Facet names and values must match sap.com's existing Coveo fields and taxonomy | client / us (13) |
| Akamai bot protection (403 seen on events.sap.com) may block the Coveo crawler unless allow-listed | client |
| `query-index.json` is public; metadata of CUG pages leaks unless gated paths are excluded | us |
| Past events: keep in search, set `noindex`, or unpublish after `event-end`? | client |
| During migration the same event may exist on legacy and Edge Delivery URLs (duplicates) | client / us |
| Sitemap-source lag: changes wait for refresh, deletions for rescan (daily by default) | client |
| Embedded results later would need Coveo credentials, CSP and consent approval (04) | client |

## Proof
| # | Test | Pass condition |
|---|---|---|
| 1 | Publish the reference page with all facet metadata | Listed in the VEP query index with every property filled |
| 2 | `GET https://admin.hlx.page/index/<org>/<site>/main/<path>` | Record shows the expected values |
| 3 | Unpublish the page | Removed from the index and the sitemap |
| 4 | Open the VEP `sitemap.xml` | events.sap.com URLs, `lastmod`, `hreflang` alternates; `noindex` and CUG pages absent |
| 5 | Run the Coveo Sitemap source | Page indexed; type, region, dates, language, topics present as Coveo fields |
| 6 | Search on search.sap.com for the event name | Page found and can be filtered by the facets |
| 7 | Change the title and republish | Coveo shows the new title within the agreed window |
| 8 | Use the VEP header search box | Opens search.sap.com with the typed query |

## Sources
Read 2026-10-29.
- Adobe: [Indexing](https://www.aem.live/developer/indexing), [Indexing reference](https://www.aem.live/docs/indexing-reference),
  [Config Service](https://www.aem.live/docs/config-service-setup), [Sitemap](https://www.aem.live/developer/sitemap),
  [Bulk metadata](https://www.aem.live/docs/bulk-metadata), [Limits](https://www.aem.live/docs/limits),
  [Search block](https://www.aem.live/developer/block-collection/search), [Audit log](https://www.aem.live/docs/auditlog),
  [Taxonomy (AEM authoring)](https://www.aem.live/docs/authoring-taxonomy).
- Coveo: [Add a Sitemap source](https://docs.coveo.com/en/1967/), [Add a Web source](https://docs.coveo.com/en/malf0160/),
  [Create a Push source](https://docs.coveo.com/en/94/), [Add or update a single item](https://docs.coveo.com/en/133/),
  [Delete an item](https://docs.coveo.com/en/171/), [Coveo Atomic](https://docs.coveo.com/en/atomic/latest/).
- Observed: search.sap.com (SAP Intelligent Search, UI5 on SAP BTP) backed by Coveo (`*.org.coveo.com`); 403 to
  scripted requests on events.sap.com; this repo's `helix-query.yaml` and `scripts/ak.js`; reference page head on
  `vep-connect-event--ew--retesh14.aem.page`.
