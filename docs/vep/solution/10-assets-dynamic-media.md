# 10 · AEM Assets with Dynamic Media

Status: draft · Last updated: 2026-10-29

## Requirement
Event pages use governed, approved assets from AEM Assets, delivered through Dynamic Media. Market
variants and AI-generated images follow the same approval path. Images must not slow the page.

### POC state (2026-10-29)
- Images sit in Experience Workspace media folders (e.g. `/vep-media/…`). No AEM Assets is connected.
- 48 image URLs on the Houston page are absolute to the POC host, so they break or leak once content
  moves to the client org.
- The rollout PoC maps market image variants in a DA sheet `/vep-global/asset-variants`
  (`source | en/us | en/gb …`), applied by `tools/rollout/assign-variants.mjs`. That script already
  keys Dynamic Media URLs by asset ID. One lesson: the variant swap kept the master's alt text.

## Native capability
**Experience Workspace ↔ AEM Assets** ([Set up AEM Assets](https://www.aem.live/docs/ew/administering/set-up-aem-assets)):
- Prerequisites: "AEMaaCS with either a publish instance or Dynamic Media", plus config rights in
  Cloud Manager and Experience Workspace. Set Cloud Manager variable `ADOBE_PROVIDED_CLIENT_ID=darkalley`
  (expect a 10–20 min restart), then add keys to the site config:

| Key | Effect |
|---|---|
| `aem.repositoryId` | `author-…` or `delivery-…` host; the prefix sets the mode |
| `aem.asset.dm.delivery: on` | "Use author for browsing, but construct DM delivery URLs when inserting" (Author + DM mode) |
| `aem.asset.smartcrop.select: on` | Shows a Smart Crop picker when an image is selected |
| `aem.assets.image.type: link` | Inserts images as links, so they bypass Media Bus |
| `aem.assets.prod.origin` / `.basepath` | Override the origin and path of inserted asset URLs |
| `aem.asset.mime.renditions` | Rendition per type; default "images → avif" |

- **Picker:** an AEM Assets icon in the editor toolbar opens the asset picker in a modal
  ([Adding media](https://www.aem.live/docs/ew/authoring/adding-media)). "The asset must be published
  in AEM. If using Dynamic Media delivery, the asset must be approved, and its activation target (if
  present) must be set to delivery." A Dynamic Media-only repository shows no folders, so use the
  author host with `aem.asset.dm.delivery`.
- **How references land:** the document stores the asset's delivery URL as an image. On preview
  "the image is requested from the DAM and is added to the Media Bus", and is then served from the
  site's own origin ([Media](https://www.aem.live/docs/media), Approach A). In link mode it stays a
  link and is turned into `<picture>` in the browser (Approach B, `aem-assets-plugin`).
- **Adobe's recommendation:** "use Dynamic Media URLs during authoring and allowing Media Bus to
  optimize the images for final delivery."
- **Asset swap:** replace and re-publish in AEM, find the pages that use it with Experience Workspace
  search, then bulk preview, QA and publish. The [Media Library](https://www.aem.live/docs/ew/administering/media-library)
  shows where each image is used.

**Dynamic Media with OpenAPI** ([overview](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/dynamic-media-open-apis/dynamic-media-open-apis-overview)):
- Needs AEM Assets as a Cloud Service and Dynamic Media licences, and is enabled by Adobe Support ticket.
- "Only brand-approved assets are exposed to downstream applications." To approve, set Review Status
  to **Approved** (`dam:status`) and Approval Target to **Delivery** (`dam:activationTarget`). This
  needs permission to edit Review Status. A metadata profile can auto-approve a whole folder
  ([approve assets](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/dynamic-media-open-apis/approve-assets)).
- URL: `https://delivery-pXXXX-eYYYY.adobeaemcloud.com/adobe/assets/{assetId}/as/{seoName}.{format}`.
  Supported modifiers include `width`, `height`, `quality`, `crop`, `rotate`, `flip`, and
  `smartcrop=<profile>`. A crop profile that was never applied returns an error. Width defaults to
  "a maximum of 2048 pixels". Smart Imaging converts output to AVIF or WebP automatically.
- Changes reach delivery URLs in "under 10 minutes" (10-minute CDN TTL). Expired assets "are no longer
  available to downstream applications". With DM Prime, only basic modifiers are available, and
  "Smart Imaging does not support AVIF for DM Prime customers".

**Media Bus:** delivers a `<picture>` at 750 px and 2000 px in WebP with a fallback. Assets are
content-addressed (`media_<hash>`), immutable and same-origin, and get `width`/`height` attributes
to prevent layout shift. Images can be up to 20 MB ([limits](https://www.aem.live/docs/limits)).

## Options
| Option | How it works | Pros | Cons |
|---|---|---|---|
| A. AEM Assets + DM URLs, delivered by Media Bus | Author + DM mode with the smart crop picker. Images are inserted as DM URLs; on preview Media Bus copies them and serves them from the site origin. | Adobe's recommended setup; same origin, so best for LCP; no CDN work; approval enforced at pick time; every change goes through preview/publish QA | A DAM change needs re-preview of the pages that use it (search + bulk preview); whether an expired asset's Media Bus copy stays live until re-preview is (unverified) |
| B. AEM Assets, DM delivered directly | Link mode; `aem-assets-plugin` turns links into `<picture>`; a CDN route serves `/adobe/assets/…` from the site domain | Updates in under 10 min with no republish; expiry takes effect; modifiers per request | A second origin for the LCP image unless routed. Adobe documents the route only for the Adobe Managed CDN (`cdn.yaml`), so SAP's Akamai would need custom work. Needs an alt text convention and a plugin. |
| C. Experience Workspace uploads only (today) | Images uploaded into a dot-folder beside each document | No setup | No approval, rights or reuse; duplicated per page; no smart crop; fails the governance requirement |

## Recommended solution
**Option A** for all authored images. **B** only for a named case where an asset must change or
expire without republishing (none identified yet).

```
Firefly / agency ──> AEM Assets "pending" folder ──(brand approves: Approved + Delivery)──> picker
Author in Experience Workspace ──picks asset + smart crop──> document holds DM URL
Preview ──> Media Bus copies image ──> site origin <picture> (WebP, 750/2000) ──> Akamai
```

| Concern | Design |
|---|---|
| Setup | One production AEM Assets program in the client's IMS org. `aem.repositoryId=author-…`, `aem.asset.dm.delivery=on`, `aem.asset.smartcrop.select=on`. Set at org level, before any authoring. |
| Governance | The brand / DAM team holds Review Status rights. Folders per tier and brand theme. Auto-approval only on curated brand folders, never on generated or agency drop folders. Rights and expiry go in asset metadata. |
| Performance | First image eager with `fetchpriority=high` (already in `scripts.js` `decorateArea`). LCP image from the same origin. One hero image, not separate desktop and mobile copies. Smart crop picked at authoring rather than per request. Logo SVGs ≤ 40 KB. |
| Alt text | Kept with the reference in the document — Adobe: "more sensible to store the value with the reference". The variant mapping carries alt text for each market. |
| Market variants | Each variant is a separate approved asset. The `asset-variants` sheet maps source to market by **asset ID**. `assign-variants.mjs` runs after rollout, then pages are previewed (see 11). |
| Firefly | Generated images are saved to AEM Assets in a pending folder (e.g. Content Hub / Adobe Express "Save as new asset"), approved there, then picked. They are never uploaded straight into documents. |
| Absolute URLs | Experience Workspace media is referenced by relative path. DM URLs point only at the production delivery host, never a sandbox. A pre-publish scan flags image hosts that are not on the allow-list. |

## Gaps and custom work
| Work | Where | Effort |
|---|---|---|
| Enable DM with OpenAPI, set Cloud Manager variable and site config keys | Adobe Support, Cloud Manager, Experience Workspace config | S |
| Approval model: folders, metadata profiles, approver group, rights and expiry fields | AEM Assets | M |
| Smart crop profiles for VEP ratios (hero, card, logo) | AEM Assets | S |
| Move the POC images into Assets and re-pick them; rewrite the 48 absolute URLs | Content migration | M |
| Absolute or foreign image-host scan as a publish checklist step or script | `tools/` script | S |
| Variant mapping by asset ID, including alt text; test merge rollout | `tools/rollout`, DA sheet | S |
| Firefly-to-Assets path and reviewer checklist | Process + AEM Assets | S |
| Option B only: Akamai route to DM delivery, cache rules, plugin | Akamai, `scripts.js` | M–L |

## Risks and open questions
| Item | Owner |
|---|---|
| Which AEM Assets program, and is DM with OpenAPI licensed (Prime or Ultimate)? | Client + Adobe |
| Is the Assets program in the same IMS org as Experience Workspace? (The picker fails otherwise.) | Client |
| Who approves event assets, and how fast (deadline risk for Tier 3 events)? | Client brand |
| Do expired or unapproved assets disappear from live pages served by Media Bus without re-preview? | Adobe (test 7) |
| Does the picker list unapproved assets, and what happens if one is picked? | Us (test 2) |
| Firefly or Content Hub entitlement, and usage rights for generated imagery | Client + Adobe |
| Merge rollout may not keep market variants (see 11) | Us |
| Akamai route to DM delivery if Option B is ever needed (Adobe documents only its own CDN) | Client + Adobe |

## Proof
| # | Test | Pass condition |
|---|---|---|
| 1 | Picker | AEM Assets icon in Experience Workspace opens the picker with folders (author + DM mode) |
| 2 | Approval gate | An unapproved asset cannot be used on a page; an approved one inserts an `/adobe/assets/{assetId}/as/…` URL |
| 3 | Smart crop | Author picks a crop; the published page shows that crop |
| 4 | Delivery | Live page serves the image as a `media_<hash>` URL from the site origin, as `<picture>` with WebP; LCP image eager with high priority |
| 5 | Performance | Lighthouse mobile on an event page records LCP with the DM-sourced hero against the 100 target |
| 6 | Asset swap | Asset replaced in AEM → Experience Workspace search lists the pages → bulk preview shows the new image |
| 7 | Expiry | Asset expired in AEM → actual behaviour on the live page is recorded and becomes a process rule |
| 8 | Market variant | Rollout to `en/gb` swaps in the UK variant by asset ID, with UK alt text |
| 9 | Firefly | A generated image lands in the pending folder and becomes pickable only after approval |
| 10 | No absolute URLs | Host scan of migrated pages finds 0 POC-host image URLs |

## Sources
- aem.live (read 2026-10-29): [Set up AEM Assets](https://www.aem.live/docs/ew/administering/set-up-aem-assets),
  [Adding media](https://www.aem.live/docs/ew/authoring/adding-media), [Media Library](https://www.aem.live/docs/ew/administering/media-library),
  [Media assets](https://www.aem.live/docs/media), [Limits](https://www.aem.live/docs/limits), [Keeping it 100](https://www.aem.live/developer/keeping-it-100).
- Experience League (read 2026-10-29): DM with OpenAPI [overview](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/dynamic-media-open-apis/dynamic-media-open-apis-overview),
  [approve assets](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/dynamic-media-open-apis/approve-assets),
  [FAQ](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/dynamic-media-open-apis/dynamic-media-open-apis-faqs),
  [Edit images in Content Hub using Adobe Express](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/content-hub/edit-images-content-hub).
- Adobe Developer: [Assets delivery API](https://developer.adobe.com/experience-cloud/experience-manager-apis/api/stable/assets/delivery/) (OpenAPI spec, read 2026-10-29).
- Repo: `scripts/scripts.js` (`decorateArea`), `tools/rollout/assign-variants.mjs`, `docs/vep/architecture/README.md`.
