# 14 · Right-to-left languages

Status: draft · Last updated: 2026-10-29

## Requirement
Pages and templates must render correctly for right-to-left languages (e.g. Arabic, Hebrew).

## Native capability
- The page engine sets direction from the locale: `scripts/ak.js` →
  `if (locale.dir) document.documentElement.dir = locale.dir;`
- Grid and flex layouts reverse automatically under `dir="rtl"`.
- Experience Workspace Translate + Rollout handles new languages through `.da/translate`.

## Recommended solution
1. Declare RTL locales in `scripts/scripts.js`, keyed by the real folder prefix, e.g.
   `'/vep-global/ar': { lang: 'ar', dir: 'rtl' }` (the prefix also localizes internal links).
2. Replace physical CSS with logical properties (`margin-inline-start`, `inset-inline-start`,
   `text-align: start`).
3. Mirror directional icons (CTA `›`, accordion chevrons); keep phone, email and numbers LTR.
4. Add Arabic / Hebrew rows to `.da/translate`; confirm font coverage (SAP 72) with a fallback.

## Gaps and custom work
Physical left/right rules found on 2026-10-28 in the code VEP uses — about 25:

| File | Rules |
|---|---|
| `blocks/header/header.css` | 12 |
| `templates/connect-event/connect-event.css` | 6 |
| `blocks/form/form.css` | 6 |
| `blocks/hero/hero.css` | 1 |

Effort: about 1–2 days plus translation and visual QA.

## Risks and open questions
| Item | Owner |
|---|---|
| SAP 72 font coverage for Arabic / Hebrew | Client brand |
| RTL typing in the Experience Workspace editor — not yet verified | Us (PoC) |

## Proof
| # | Test | Pass condition |
|---|---|---|
| 1 | RTL page | Arabic event page has `<html lang="ar" dir="rtl">`; header, hero, agenda, cards, form mirror |
| 2 | Inputs | Phone and email stay LTR inside RTL pages |
| 3 | No regression | English pages visually unchanged |
| 4 | Authoring | An author edits Arabic text in Experience Workspace |

## Sources
Repo: `scripts/ak.js`, CSS scan (2026-10-28).
