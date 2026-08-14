# Enabling Experience Workspace (EW)

Accurate, verified steps for turning on Experience Workspace on this project
(`retesh14/ew`). The official early-access doc
(https://docs.da.live/about/early-access/experience-workspace) is stale in a few
places — the notes below reflect what actually worked on 2026-08-14.

## TL;DR — two settings live in TWO different stores

| Setting | Store | Where you edit it |
| --- | --- | --- |
| `ew.enabled = true` | **DA** flags sheet | DA config UI: `https://da.live/config#/retesh14/ew` |
| `editUrlPattern` (+ `project`) | **AEM** site config → `sidekick` object | Admin API (POST); NOT a file, NOT the flags sheet |

Neither is created automatically. A new DA content root + Code Sync only
generates the base site config (`code`, `content`, `access`) — the `sidekick`
block is **not** a default and must be added explicitly.

## Prerequisite (code)
The repo must ship `tools/quick-edit/quick-edit.js` and wire it in
`scripts/scripts.js` (author-kit already includes this). ✅ present here.

## Step A — DA flag (`ew.enabled`)
1. Open `https://da.live/config#/retesh14/ew`.
2. In the `flags` sheet add a single row:

   | key | value |
   | --- | --- |
   | `ew.enabled` | `true` |

3. Save. Verify (authenticated):
   `GET https://admin.da.live/config/retesh14/ew` → `data: [{key: ew.enabled, value: true}]`

## Step B — AEM sidekick config (`editUrlPattern`)
`editUrlPattern` is a **property inside the site config**, at
`https://admin.hlx.page/config/retesh14/sites/ew.json`, under the key `sidekick`.
There is **no** standalone `.../sites/ew/sidekick.json` — trying to create one
fails with `create not supported on substructures`.

Gotcha: on this admin API, **PUT = create** (returns `409 config already exists`
because the site config already exists from Code Sync) and **POST = update**.
So you must GET the whole site config, add the `sidekick` block, and POST it back.

Block to add:
```json
"sidekick": {
  "project": "EW Sandbox",
  "editUrlPattern": "https://da.live/canvas#/{{org}}/{{site}}{{pathname}}"
}
```
The `{{org}}/{{site}}/{{pathname}}` tokens are literal — the Sidekick fills them
in per page. A value missing `{{pathname}}` (e.g. `.../canvas#/retesh14/ew`) will
NOT work: Canvas won't know which page to open.

Verify (authenticated) — the resolved config the extension reads:
`GET https://admin.hlx.page/sidekick/retesh14/ew/main/config.json`
→ should list `project` and `editUrlPattern`.

## Step C — use it (edit vs canvas)
`editUrlPattern` only changes where the **Sidekick Edit button** goes. It does
NOT change what `https://da.live/edit#/...` shows — `/edit` is always the classic
doc editor. Experience Workspace is a different route: `/canvas`.

- Direct: `https://da.live/canvas#/retesh14/ew/support-home`
- Via Sidekick: on `https://main--ew--retesh14.aem.page/support-home` click **Edit**
  → it now routes to `/canvas` (EW) instead of `/edit`.

## Why "I only see ew.enabled"
The DA config UI only shows the DA flags sheet. `editUrlPattern` lives in the
AEM config (a separate system), so it will never appear on the DA screen. Two
systems, two screens — that's expected, not a missing setting.

## Early access
`ew.enabled` + `editUrlPattern` are the config prerequisites, but EW is early
access — the org may also need to be allow-listed by Adobe for `/canvas` to
render. Config being correct does not override an access gate.
