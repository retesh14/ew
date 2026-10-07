# Asset variants on rollout (PoC)

Date: 2026-10-07
Status: draft

## Problem

A master page is rolled out to market pages. Some images must differ per market — same subject,
different binary (text in the image, dark vs light background). On-prem AEM did the swap in custom
Java: a live action or image Sling Model that followed the asset's **Derived** relation to the
market copy. Edge Delivery never runs that code, so the market page keeps the global image.

The PoC proves two things on Experience Workspace:

1. A market's image change **survives later rollouts** using only built-in behaviour.
2. The variant can be **assigned automatically on the first rollout**, with no author edit and no
   swap in the browser.

## Constraints

1. **Follow Experience Workspace's own tooling** — the Translate app and its rollout, configured in
   `{org}/{site}/.da/translate` ([config options](https://www.aem.live/docs/ew/administering/translation-config)).
   No parallel rollout mechanism.
2. **Language first, market second**, per
   [aem.live](https://www.aem.live/docs/translation-and-localization): "The first level focuses on
   language and the second level focuses on market/region." Locale-based masters duplicate content
   and hurt SEO ([strategy](https://www.aem.live/docs/ew/administering/translation-strategy)).
3. **Existing VEP stays as-is.** `/vep/`, `/vep-fragment/`, `/vep-media/` are not moved or edited;
   new work goes on a branch cut from `vep-connect-event`.
4. **Swap at rollout, not at render.** A client-side swap paints the global image first — an LCP and
   CLS regression — and authors see the wrong image in the editor.
5. **Dynamic Media OpenAPI addresses assets by ID**, not path, so no URL pattern derives a variant;
   any automatic assignment needs a mapping.

## Decisions

**Mechanism: Translation + Rollout inside the `ew` site**, not MSM. MSM works across separate DA
sites (base and satellites), each needing its own aem.live site and a dedicated content source
([MSM](https://www.aem.live/docs/ew/administering/multi-site-manager)). That is the production
option when markets need their own domain or team; it is more setup than the PoC needs.

**Structure** — folders are the public URL in DA, so they carry no `language-sites`/`country-sites`
labels, and codes are lowercase and nested rather than underscored:

```
/events/en/<page>      English master (source.language)
/events/de/<page>      German master, translated from en
/events/fr/<page>      French master, translated from en
/events/en/us/  /events/en/gb/     rolled out from /events/en/
/events/de/de/  /events/de/ch/     rolled out from /events/de/
/events/fr/fr/  /events/fr/ch/     rolled out from /events/fr/
```

**`.da/translate` sheet** — `config`: `source.language = English`,
`rollout.conflict.behavior = merge` first, then `overwrite`. `languages`: one row per language with
`location` (`/events/en`, `/events/de`, `/events/fr`), `actions`, and `locales` (`/events/en/us`,
`/events/en/gb`, …).

**Variant persistence (built-in).** A market page is its own document after rollout. The market
image is changed once; later rollouts with `merge` preserve it while bringing in master changes.

**Variant assignment (custom, small).** `tools/rollout/assign-variants.mjs` runs after a rollout:
reads each market page through the DA source API, swaps `<img>`/`<source>` per a mapping sheet
`/events/asset-variants` (`source | en/us | en/gb | de/ch | …`, cells are image URLs or Dynamic
Media asset IDs), writes back, previews. Pages already holding a variant are left alone, so it is
safe to re-run. It reports images left global. In production this becomes an App Builder action
reading the mapping from AEM Assets metadata or the existing Derived relations; the sheet stands in
for that lookup.

**Chrome.** Header and footer are chosen by the `/vep/` prefix today. `/events/` pages resolve them
from the nearest market or language folder (`/events/de/ch/nav` → `/events/de/nav`), the localized
navigation pattern aem.live describes.

## Success criteria

1. Rollout `/events/en/` → `/en/us/`, `/en/gb/` with the Translate app; both previews render.
2. Change the image in `/events/en/gb/` once, edit master text, roll out again with `merge`: the
   market keeps its image and gets the new text.
3. On a fresh rollout, `assign-variants` sets the mapped variant in each market; unmapped images
   stay global and are reported.
4. The previewed `.plain.html` references the variant; no client-side swap.
5. Existing `/vep/` pages render unchanged.

## Open questions

- Dynamic Media OpenAPI in a sandbox Org? Without it, media URLs stand in for asset IDs.
- Variant image for the demo: designer asset, or an existing image as stand-in.
- Merge relies on structural matching ("significant structural differences … can produce unexpected
  results"); how it treats a swapped image inside a block is what criterion 2 tests.
