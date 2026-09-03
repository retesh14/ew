# VEP Connect Event — Authoring Guide

How to roll out a new event page using the **connect-event** template. Written for
content authors; no code changes are needed to publish a new event.

## What this template is

A reusable event-detail page type, modelled on the SAP Connect Day pages. Every event
built from it has the same five sections in the same order, on the light **connect-event**
theme (white page, navy hero). You only change the copy, images, dates, and sponsors —
the layout and styling are fixed.

Reference example (fully filled in):
`/vep/us-2026-sap-connect-days-data-it-houston`

Blank starting point:
`/vep-templates/connect-event`

## Folder layout

| Folder | Holds |
|--------|-------|
| `/vep/<event-slug>` | One published event page per event |
| `/vep-templates/connect-event` | The blank template — **copy this**, don't edit it |
| `/vep-fragment/` | Shared + per-event fragments: header, footer, and each event's `<slug>-agenda` and `<slug>-header` |
| `/vep-media/` | Images: event photos, brand graphics, calendar icons, sponsor logos |

## Roll out a new event — step by step

1. **Copy the template.** Duplicate `/vep-templates/connect-event` to `/vep/<your-event-slug>`
   (e.g. `/vep/us-2026-sap-connect-days-chicago`). Use a short, hyphenated slug.
2. **Upload images** to `/vep-media/` (hero photo, intro photo, sponsor logos). Reuse
   existing logos/icons already there when the same sponsor or calendar icon applies.
3. **Fill in each section** — replace every `[bracketed placeholder]`:

   | Section | What to edit |
   |---------|--------------|
   | **Hero** | Event title, the date + venue line, the one-line subtitle, and the hero image. Keep the date/venue line **above** the title — the theme styles the line before the H1 as the detail line. |
   | **Intro** | Heading, intro paragraph, the "This program will include" bullets, closing line, and the intro image. |
   | **Agenda** | Create a per-event agenda fragment at `/vep-fragment/<event-slug>-agenda` (an `advanced-tabs` block: the tab-label list, then one panel section per tab with the Day 1 / Day 2 sessions). Replace the agenda line on the page with a link to that fragment. Session rows render as a click-to-expand accordion automatically. |
   | **Registration** | The two day tiles: dates and the "Register now" link (point it at your event's registration page). The Day 2 "requires Day 1" note is inlined in the Day 2 card — edit or remove it as needed. |
   | **Partners** | Sponsor logos under Platinum / Gold / Silver headings. Add/remove logo cells per tier. |
   | **Header** | Create a per-event header at `/vep-fragment/<event-slug>-header` (SAP logo + a "Register now" CTA pointing at this event's registration page). The header block loads it automatically for pages under `/vep/<event-slug>`, falling back to the shared `/vep-fragment/header` if absent. |
   | **Metadata** | Page Title, Description, and keep **Template: connect-event** (this applies the light SAP theme, 72 font, navy hero, agenda accordion, minimal header, light footer). |

4. **Preview** the page, check each section renders, then publish.

## Live sample events (reference)

Two events have been rolled out from this template — compare them to see the
"one template → many events" pattern in action:

- `/vep/us-2026-sap-connect-days-data-it-houston` — Houston, Sep 2–3, 2026
- `/vep/us-2026-sap-connect-days-data-it-chicago` — Chicago, Oct 14–15, 2026

Both share the same template, theme, chrome and media; only the event copy,
dates, agenda fragment, sponsor set and registration URLs differ. This is
exactly the flow EW's agentic authoring mode automates to roll out events at
scale: point it at the base template plus a new event's details, and it fills
the placeholders and writes the page + its per-event agenda/header fragments.

## Rules that keep the layout working

- **Keep `Template: connect-event`** in the page metadata — it applies the light SAP theme
  (72 font, navy hero, agenda accordion, minimal header, light footer).
- **Section styling**: keep each content section's `Section Metadata` as generated —
  intro `light, container`; registration `light, center, container` + `grid: 2`; partners
  `light, center, container`. These drive the containment, the two-up card grid, and the
  centred tiers. Removing them reintroduces the layout bugs (clipped intro text, stacked
  cards, left-packed logos).
- **Hero order**: date/venue line first, then the H1 title, then the subtitle.
- **Agenda tabs**: the number of tab labels must match the number of panel sections that
  follow, in the same order.
- **Images** live in `/vep-media/` and are referenced as `/vep-media/<file>`. Don't hot-link
  external URLs — keep the page self-contained.

## Fragments

Per-event fragments live in `/vep-fragment/` and are loaded automatically for pages under
`/vep/<event-slug>`:

- `/vep-fragment/<event-slug>-agenda` — the tabbed agenda (sessions differ per event).
- `/vep-fragment/<event-slug>-header` — the event header (SAP logo + Register CTA to that
  event's registration page). Falls back to the shared `/vep-fragment/header` if absent.

Shared chrome that's the same for every event:

- `/vep-fragment/header` — default VEP header (used when an event has no `<slug>-header`).
- `/vep-fragment/footer` — the VEP footer (the standard **light** sap.com footer).

Editing a shared fragment updates every event that uses it; editing a per-event fragment
affects only that event.

## Building blocks used (for reference)

| Section | Block | Notes |
|---------|-------|-------|
| Hero | `hero (promo)` | Navy banner, text left, contained graphic right |
| Intro | `columns` | Two-up: prose left, image right |
| Agenda | `advanced-tabs` | Tab labels in the block; each following section = a panel |
| Registration | `card` | One card per day tile |
| Partners | `columns (sponsors-logos)` | One logo row per tier |

These blocks already exist in the project — no development is needed to author a new event.

## Design system (connect-event template)

The SAP event look is applied by the **`connect-event` page template**
(`Template: connect-event` in page metadata) and is scoped entirely to
`body.connect-event-template`, so it never affects other pages. It provides:

- **Light theme:** white page, near-black text, matching the source. (A single
  dark navy hero is the only dark region.) This is a distinct template from the
  older dark `connect` template used by the SAP Connect Vegas page.
- **Font:** SAP's **"72"** brand font, self-hosted at `styles/fonts/72-{regular,semibold,bold}.woff2`
  (from `@sap-theming`, open-licensed), with an Arial/Helvetica fallback. `@font-face` lives in
  `templates/connect-event/connect-event.css` so it stays off the global critical path.
- **Type scale:** h1 44px, h2 40px, weight 500 — matched to the source.
- **Colors:** navy hero (`#00144a`), SAP blue (`#0057d2`) primary CTA + links.
- **Agenda accordion:** session rows collapse/expand on click (lavender panel,
  SAP-blue active row), matching the source. Handled by the `advanced-tabs` block
  when the page uses the connect-event template.
- **Footer:** the standard **light** sap.com footer (the source event page is not a dark footer).

All of this comes for free with `Template: connect-event` — authors don't set fonts, colors, or
theme per event.
