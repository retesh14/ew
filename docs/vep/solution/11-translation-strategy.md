# 11 · Translation strategy

Status: draft · Last updated: 2026-10-29

## Requirement
Localize event pages across languages and markets: one master per language, market pages that can
differ where they must (images, legal, local agenda), and correct SEO signals for every locale.

## Native capability
| Capability | What Experience Workspace / Edge Delivery provide | Source |
|---|---|---|
| Structure | "The first level focuses on language and the second level focuses on market/region." Locale-based masters "create undesired duplication of content that can be unfriendly for SEO." | translation-and-localization, translation-strategy |
| Translate app | Project of URLs → Sync → Translate → Rollout. Validation adds referenced fragments automatically. "Every save is stored as a version of the page." | translation-projects |
| Config | `{org}/{site}/.da/translate` tabs: `config`, `languages`, `custom-doc-rules`, `dnt-content-rules`, `dnt-sheet-rules`, `dnt` | translation-config |
| Conflict behaviour | `sync` / `translate` / `copy` / `rollout.conflict.behavior`; first value is the default. "Merge is the way to keep regional edits through repeated rollouts." | translation-config, translation-projects |
| Merge limits | "Spreadsheets, JSON, and other non-HTML files are always overwritten, never merged. If a page has nothing to merge against, or a merge can't be completed, the page is overwritten." | translation-projects |
| Auto preview / publish | `complete.aem.preview`, `complete.aem.publish` — "unless merge conflicts exist" | translation-config |
| Do not translate | Block rules (`translate col 2 if col 1 is "title"…`), exact strings, sheet patterns, whole sheets/columns | translation-config |
| Connectors | Google (default, no credentials), Lionbridge, Smartling, Trados — the three vendors offer "AI, human, and machine translation" | translation, translation-config-samples |
| Credentials | Separate `.da/translate-keys.json` via `translation.service.key.path`; restrict access with path ACLs | translation-config, access-control |
| Chained languages | `source language` column: e.g. `fr-CA` translated from `fr-FR` after it completes | translation-config |
| hreflang | Sitemap config with `languages`, `hreflang`, `alternate: /fr/{path}`, `default` (x-default); `hreflang:{lang}` page metadata also possible | developer/sitemap, special-metadata-properties |
| Multi-site | MSM: base and satellite **sites**, each its own aem.live site, three-way merge sync | multi-site-manager |

### Observed in the PoC
| Item | Result |
|---|---|
| Structure | `/vep-global/en` → `en/us`, `en/gb`; `/vep-global/de` → `de/de`, `de/ch`; `/vep-global/fr` → `fr/fr`, `fr/ch` |
| Config | [`tools/rollout/da-translate.json`](../../../tools/rollout/da-translate.json): source English, merge-first for all four conflict keys, Google, `complete.aem.preview = true`, metadata translates only title/description, `section-metadata` DNT, "SAP" DNT, URLs DNT in sheets |
| Rollout | Market pages created; not previewed until `complete.aem.preview` was set |
| Image variants | `tools/rollout/assign-variants.mjs` swapped the UK hero from DA sheet `/vep-global/asset-variants` ([spec 004](../../specs/004-asset-variant-rollout/spec.md)) |
| Chrome | Header/footer resolve market copy first, then language copy (`scripts/utils/localized-chrome.js`) |
| Pending | Merge rollout: does `en/gb` keep its image and local edits when `en` is rolled out again? |

## Options
| Option | How it works | Pros | Cons |
|---|---|---|---|
| A. Language-first + rollout in one site (PoC) | Translate into language masters, roll out to market folders under each language | Adobe's recommended model; one site, one index; native app | Market pages are copies — need hreflang/canonical discipline; merge is structural |
| B. Locale-based masters (`/en-us`, `/de-ch`) | Translate straight into each locale | Simple mental model | Adobe: duplication, SEO harm; N× translation cost |
| C. Language-only, no market folders | Markets differ only via code (geo, placeholders) | Least content | No market-specific images or legal copy without code |
| D. MSM base + satellite sites | Each market is its own site inheriting from a base | Own domain, own team, inherit-until-detached | Separate aem.live site and content source per market; more setup; translation still per site |

## Recommended solution
**Option A**, with MSM (D) held back for markets that need their own domain or team.

```
/vep-global/en (master, source.language) ──translate──► /vep-global/de, /vep-global/fr
      │ rollout (merge)                                      │ rollout (merge)
      ▼                                                      ▼
/en/us  /en/gb                                         /de/de /de/ch   /fr/fr /fr/ch
      └── assign-variants (market images) ── preview ── market approval ── publish
```

| Area | Decision |
|---|---|
| Masters | Only language masters are authored for shared content; markets hold copies plus local edits |
| Conflict | `merge` first for rollout and translate return (regional edits survive); `overwrite` available for resets |
| Completion | `complete.aem.preview = true`; keep `complete.aem.publish` **off** so a market approves before go-live |
| DNT | Keep PoC rules; add event codes, product names, speaker names, tag IDs (topic 13), form/registration IDs, Dynamic Media asset IDs |
| Blocks | Add `custom-doc-rules` for blocks carrying data, not copy (e.g. registration, schedule IDs) — list per block in build |
| Connector by tier | Tier 3: Google machine translation + in-market review. Tier 2: vendor connector (human or MT + post-edit). Tier mapping to confirm with client |
| Credentials | Vendor secrets in `.da/translate-keys.json`, readable only by the localization admin group |
| Chrome | Localized `nav`/`footer` per language, overridden per market (PoC pattern); fragments are added to projects automatically |
| Images | Market variants assigned after rollout from a mapping (spec 004); production lookup in App Builder |
| SEO | Sitemap with one entry per language/market folder, `hreflang` per locale (`en-GB`, `de-CH`…), `x-default` to the English master; `html-lang` via bulk metadata or locale config |
| Governance | Global team owns masters; vendor reviewers sign off translations in the TMS; market owners approve and publish their folder (Request Publish); path ACLs enforce who writes where |

## Gaps and custom work
| Item | Where | Effort |
|---|---|---|
| Add `/vep-global/*` prefixes to `locales` in `scripts/scripts.js` — today only `/de`, `/fr`… exist, so German pages get `lang="en"` and links do not localize | Code | S |
| Market link handling: links in rolled-out pages still point at the language master unless rewritten; decide rewrite-on-rollout vs runtime check against the index | Code or App Builder | S–M |
| Sitemap + hreflang config for 9 folders; index definitions per folder | Config service | S |
| Production asset-variant lookup (AEM Assets metadata / derived relation) as App Builder action | App Builder | M |
| Vendor connector setup, credential sheet, ACLs | Config | S (+ vendor onboarding) |
| DNT and block rules for VEP blocks | `.da/translate` | S |
| Market approval flow (Request Publish onboarding, email provider) | Config + Adobe onboarding | S–M |
| Translation-memory / glossary alignment with SAP terminology | Vendor | M (client) |

## Risks and open questions
| Item | Owner |
|---|---|
| Merge rollout keeps the market image and local edits — **not yet tested** | Us (PoC) |
| Failed merge silently overwrites ("the page is overwritten"); recovery via version history and re-running assign-variants | Us |
| Sheets (placeholders, `asset-variants`) are always overwritten on rollout — market-specific sheets must stay out of rollout projects | Us |
| Translation vendor and connector; must be public HTTPS with non-interactive auth (no VPN or IP allow-list) | Client |
| Google default sends content to Google through `translate.da.live` — data-processing approval (unverified where processed) | Client legal / Adobe |
| Which languages and markets per tier; does Tier 2 need human translation? | Client |
| Are language masters public (with `x-default`) or authoring-only? Affects duplicate content | Client SEO |
| `translate type` column in the PoC config is not in Adobe's documented `languages` columns — confirm or drop | Adobe / us |
| Does translation rewrite internal links into the target folder? (unverified) | Us (PoC) |
| Query index only lists **published** pages — previewed market pages are not in search or sitemap until approved | Us (note) |
| When to switch a market to MSM (own domain, own team) | Client / us |

## Proof
| # | Test | Pass condition |
|---|---|---|
| 1 | Rollout (done) | `en/us`, `en/gb` created and previewed by the Translate app with `complete.aem.preview` |
| 2 | Variant assignment (done) | `en/gb` `.plain.html` references the UK hero variant; no client-side swap |
| 3 | Merge rollout (pending) | Edit `en` text, roll out with `merge`: `en/gb` gets new text, keeps its image and a local paragraph |
| 4 | Translation | `en` → `de`, `fr`: title/description translated; "SAP", URLs, section metadata, tag IDs unchanged |
| 5 | Locale | `/vep-global/de/ch/…` renders `<html lang="de">` and the `de/ch` header/footer |
| 6 | hreflang | Sitemap entry for an event lists `en`, `en-US`, `en-GB`, `de`, `de-DE`, `de-CH`, `fr`, `fr-FR`, `fr-CH`, `x-default` |
| 7 | Vendor | One page round-trips through the chosen connector with a human review step |
| 8 | Governance | A market author cannot write to `/vep-global/en`; market publish needs approval |

## Sources
Read 2026-10-29:
- https://www.aem.live/docs/translation-and-localization
- https://www.aem.live/docs/ew/administering/translation-strategy
- https://www.aem.live/docs/ew/administering/translation-config
- https://www.aem.live/docs/ew/administering/translation-config-samples
- https://www.aem.live/docs/ew/administering/translation-service-connection
- https://www.aem.live/docs/ew/administering/translation
- https://www.aem.live/docs/ew/authoring/translation-projects
- https://www.aem.live/docs/ew/administering/multi-site-manager
- https://www.aem.live/docs/ew/administering/access-control
- https://www.aem.live/docs/ew/administering/request-publish
- https://www.aem.live/developer/sitemap · https://www.aem.live/developer/indexing
- https://www.aem.live/docs/special-metadata-properties

Repo: `tools/rollout/da-translate.json`, `tools/rollout/assign-variants.mjs`,
`scripts/utils/localized-chrome.js`, `scripts/scripts.js`, `scripts/ak.js` (`localizeUrl`),
`docs/specs/004-asset-variant-rollout/spec.md`. Related: 10 (assets), 13 (tag IDs), 14 (RTL).
