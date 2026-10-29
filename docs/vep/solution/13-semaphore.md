# 13 · Semaphore (taxonomy and auto-tagging, translation-related)

Status: draft · Last updated: 2026-10-29

## Requirement
Tag event pages with SAP's Semaphore taxonomy, automatically where possible, so every language and
market version of an event carries the same tags, and those tags drive search facets (12) and
analytics (05). Client confirmed Semaphore is translation-related: taxonomy and auto-tagging.
Assumed product: Progress Semaphore (to confirm version, modules and hosting).

## Native capability
**Progress Semaphore** (verified on progress.com and docs.progress.com):

| Capability | What it does | Evidence |
|---|---|---|
| Knowledge models | "Build, create, and govern knowledge models (i.e. taxonomies, ontologies, controlled vocabularies, thesauri, etc.)" | Semantic knowledge modeling page |
| Multilingual concepts | "When you create a new model, two languages are added automatically: Language Neutral and English." "Labels for a concept will show in all languages for which they exist." | KMM how-to: set model languages |
| Classification | Classification Server takes `title`, `body` or a URL, a `language` and a `threshold` over HTTP POST; returns `<META name value id score>` per concept | Calling Classification Server |
| Labels by language | Semantic Enhancement Server: "The data for the model will be returned in the selected language." | SES API: language |
| Publishing | Publisher turns the model into SES indexes and Classification Server rulebases; can also output to files, Git, HTTP notifications | Publisher overview |
| Integration pattern | Tag lists "should contain the concept IDs rather than the concept name"; modes: automatic, manual, assisted ("allows the user to adjust these tags … before they are attached") | Generic integration guide |
| Deployment | On-premises, SaaS, on-demand or hybrid; modules licensed separately | Platform page |
| CMS connectors | Guides exist for SharePoint Online, Sitecore, OpenText, MarkLogic, NiFi, Solr, generic — **none for AEM / Experience Workspace** | Docs portal index |

**Experience Workspace / Edge Delivery:**

| Capability | What it does | Source |
|---|---|---|
| `tags` metadata | "list of tags, separated by commas or as a bullet list" → `<meta property="article:tag">` per tag | special-metadata-properties |
| Custom metadata | Other metadata rows render as `<meta name>` ("Property names will be lower-cased in the HTML"); bulk metadata sheet applies per path; page metadata wins | metadata, bulk-metadata |
| Query index | Built-in `tags` property "as an array"; custom properties by selector; **published pages only** | developer/indexing |
| Author plugins | Plugins get page `context` and `token` via the DA SDK; Adobe's tutorial builds "A GenAI tag / keyword generating author plugin" that writes a `tags` row | micro-frontends tutorial |
| Translate DNT | `custom-doc-rules` per block; the PoC already translates only metadata `title`/`description`, so `tags` passes through untouched | translation-config, `tools/rollout/da-translate.json` |

## Options
| Option | How it works | Pros | Cons |
|---|---|---|---|
| A. Assisted tagging plugin | Author opens a plugin; App Builder sends title + body to Classification Server; author accepts suggestions; plugin writes concept IDs to metadata | Author stays in control; one call per edit; Semaphore's recommended assisted mode | Relies on authors running it |
| B. Batch tagging (App Builder) | Scheduled job lists pages via DA source API, classifies, writes metadata, previews (pattern of `assign-variants.mjs`) | Backfills old content; re-tags after model changes | No human review unless a report is checked |
| C. Tag on preview/publish | Hook on publish events classifies and writes back | Fully automatic | Publish-event hook availability (unverified); write-back changes the page after approval; loop risk |
| D. Manual picker only | Plugin shows the taxonomy tree from SES; author picks | Simple, no classification licence | No auto-tagging — misses the requirement |
| E. Tag at render (browser) | Page calls Semaphore at view time | None worth having | Not in index or SEO; slow; exposes the endpoint |

## Recommended solution
**A + B**: assisted tagging on language masters, batch for backfill and re-classification. Tags are
language-neutral concept IDs; labels come from Semaphore per language.

```
Author (en master) ─► Tag plugin ─► App Builder ─► Classification Server ─► suggestions + scores
        ▲ accept / edit                                             │
        └────────── metadata "tags: <concept IDs>" ◄────────────────┘
Translate + rollout (tags DNT) ─► de, fr, en/gb … carry the same IDs
Publisher / SES ─► App Builder sync ─► DA sheet /vep-global/taxonomy (tab per language: id | label | parent)
Query index (tags[]) ─► search facets (12)        Data layer page.tags (IDs) ─► analytics (05)
```

| Area | Decision |
|---|---|
| Storage | Metadata row `tags` = concept IDs (not labels); indexed by the built-in `tags` property |
| Labels | Generated, published taxonomy sheet with one tab per language; English label as fallback when a label is missing |
| When | Assisted on author save of the master; batch nightly / after model publish; no tagging at render |
| Which pages | Classify the English master; translations and markets inherit IDs. Market-only pages classified with `language` = page language (needs rulebases for that language — unverified) |
| Translation | Keep `tags` out of translation (current metadata rule); add the taxonomy sheet to the `dnt` tab or keep it out of projects; URI-style IDs in sheets are also caught by the existing `beginsWith(http:// \|\| https://)` rule |
| Market edits | A market may add local tags; merge rollout should keep them (verify with 11, proof 3) |
| Search (12) | Facet on ID, display localized label; Coveo reads `article:tag` or the query index |
| Analytics (05) | Send IDs in the data layer so reports aggregate across languages; map to labels in reporting |
| Ownership | SAP taxonomy team owns the model; authors own final tags on their pages |

## Gaps and custom work
| Item | Where | Effort |
|---|---|---|
| Semaphore proxy (credentials, threshold, model choice) | App Builder | S–M |
| Assisted tagging plugin (suggest, accept, write `tags`) | EW plugin (`tools/`) | M |
| Taxonomy sync: SES / Publisher output → DA sheet per language, preview + publish | App Builder | S–M |
| Batch classify + backfill with report of low-score pages | App Builder | M |
| Index definition (`tags`, `lang`, event fields) and facet label lookup | Config + code | S |
| Translate config: explicit DNT for `tags` and taxonomy sheet | `.da/translate` | S |
| Data layer `page.tags` | Code (with 05) | S |

## Risks and open questions
| Item | Owner |
|---|---|
| Confirm product, version, modules licensed (Classification Server / SES) and SAP use today | Client |
| Hosting and reachability: App Builder must reach Semaphore over HTTPS (no private network path assumed) | Client IT |
| Which model(s) and concept schemes apply to events; who governs changes | Client taxonomy team |
| Concept ID format and stability; handling of deprecated or merged concepts | Client / us |
| Label coverage per language (de, fr, later RTL languages from 14) | Client taxonomy team |
| Classification quality on short event pages; threshold per scheme | Us (PoC) |
| Do SAP pages elsewhere (sap.com, Coveo) already carry Semaphore IDs we must match? | Client |
| Publish-event hooks for option C (unverified) | Adobe |
| Tags only reach search and sitemap after publish (index is published-only) | Us (note) |

## Proof
| # | Test | Pass condition |
|---|---|---|
| 1 | Classify | One English event page returns concept IDs with scores from Classification Server via App Builder |
| 2 | Assisted plugin | Author accepts 3 suggestions; page metadata holds 3 IDs; `<meta property="article:tag">` ×3 on preview |
| 3 | Translation | After translate + rollout, `de/ch` and `fr/fr` pages carry identical IDs |
| 4 | Labels | Taxonomy sheet returns German and French labels for those IDs; missing label falls back to English |
| 5 | Index | Query index row for the published page has `tags` as an array of IDs |
| 6 | Facet | Search (12) filters events by one concept across all languages |
| 7 | Analytics | Data layer on the page exposes the same IDs in every language |
| 8 | Batch | Backfill tags 20 untagged pages and reports any below threshold |

## Sources
Read 2026-10-29:
- https://www.progress.com/semaphore · https://www.progress.com/semaphore/platform
- https://www.progress.com/semaphore/platform/semantic-knowledge-modeling
- https://www.progress.com/semaphore/platform/semantic-knowledge-classification
- https://www.progress.com/semaphore/platform/semantic-knowledge-integration
- https://docs.progress.com/category/semaphore-documentation?labelkey=product_semaphore
- https://docs.progress.com/bundle/semaphore-5-classification-and-language-service/page/topics/classification-and-language-service/calling_classification_server.html
- https://docs.progress.com/bundle/semaphore-5-knowledge-model-management-how-to/page/topics/kmm-how-to/how-to-create-a-model/set-model-languages.html
- https://docs.progress.com/bundle/semaphore-5-semantic-enhancement-server-api/page/topics/ses-api/language.html
- https://docs.progress.com/bundle/semaphore-5-publisher/page/topics/publisher/welcome.html
- https://docs.progress.com/bundle/semaphore-for-generic-integration/page/topics/semaphore_generic_integration_guide/integration_implementation_details.html
- https://www.aem.live/docs/special-metadata-properties · https://www.aem.live/docs/metadata · https://www.aem.live/docs/bulk-metadata
- https://www.aem.live/developer/indexing · https://www.aem.live/docs/indexing-reference
- https://www.aem.live/docs/ew/developing/micro-frontends (and parts 2–4)
- https://www.aem.live/docs/ew/administering/translation-config

Repo: `tools/rollout/da-translate.json`, `tools/rollout/assign-variants.mjs`. Related: 05, 11, 12, 14.
