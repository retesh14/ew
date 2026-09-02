# VEP Connect Event — Authoring Guide

How to roll out a new event page using the **connect-event** template. Written for
content authors; no code changes are needed to publish a new event.

## What this template is

A reusable event-detail page type, modelled on the SAP Connect Day pages. Every event
built from it has the same five sections in the same order, on the dark **connect** theme.
You only change the copy, images, dates, and sponsors — the layout and styling are fixed.

Reference example (fully filled in):
`/vep/us-2026-sap-connect-days-data-it-houston`

Blank starting point:
`/vep-templates/connect-event`

## Folder layout

| Folder | Holds |
|--------|-------|
| `/vep/<event-slug>` | One published event page per event |
| `/vep-templates/connect-event` | The blank template — **copy this**, don't edit it |
| `/vep-fragment/` | Shared content referenced by many events (e.g. the registration note) |
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
   | **Agenda** | The two track names in the tab list, then the Day 1 / Day 2 sessions inside each of the two tab panels. Each `advanced-tabs` tab pulls in the section that follows it as its panel — keep one panel section per tab, in order. |
   | **Registration** | The two day tiles: dates and the "Register now" link (point it at your registration page). The shared note below is a fragment — leave it unless the rule changes. |
   | **Partners** | Sponsor logos under Platinum / Gold / Silver headings. Add/remove logo cells per tier. |
   | **Metadata** | Page Title, Description, and keep **Template: connect** (this applies the dark theme). |

4. **Preview** the page, check each section renders, then publish.

## Rules that keep the layout working

- **Keep `Template: connect`** in the page metadata — remove it and the page loses the dark
  event theme.
- **Section styling**: each content section carries `Section Metadata → style: light`. That
  paints a light panel on the dark page. Leave it in place.
- **Hero order**: date/venue line first, then the H1 title, then the subtitle.
- **Agenda tabs**: the number of tab labels must match the number of panel sections that
  follow, in the same order.
- **Images** live in `/vep-media/` and are referenced as `/vep-media/<file>.png`. Don't hot-link
  external URLs — keep the page self-contained.

## Shared fragments

Boilerplate that repeats across events lives in `/vep-fragment/` and is referenced by link.
Editing the fragment updates every event that references it.

- `/vep-fragment/registration-note` — the "Day 2 requires Day 1" note under the registration tiles.
- `/vep-fragment/<event-slug>-agenda` — the tabbed agenda (per event, since sessions differ).
- `/vep-fragment/header` — the VEP site header. Loaded automatically on every `/vep` page.
- `/vep-fragment/footer` — the VEP site footer (dark theme). Loaded automatically on every `/vep` page.

When you find copy that will be identical across events (a standard disclaimer, a recurring
sponsor set), add it as a fragment here and reference it from the template.

## Header & footer

Every `/vep` page automatically uses the VEP header and footer from `/vep-fragment/header`
and `/vep-fragment/footer` — no per-page authoring needed. These are VEP's **own copies** of
the site chrome, so the team can edit them (nav links, contact info, footer columns) without
affecting other parts of the site. Editing either fragment updates all VEP event pages at once.

## Building blocks used (for reference)

| Section | Block | Notes |
|---------|-------|-------|
| Hero | `hero (promo)` | Navy banner, text left, contained graphic right |
| Intro | `columns` | Two-up: prose left, image right |
| Agenda | `advanced-tabs` | Tab labels in the block; each following section = a panel |
| Registration | `card` | One card per day tile |
| Partners | `columns (sponsors-logos)` | One logo row per tier |

These blocks already exist in the project — no development is needed to author a new event.
