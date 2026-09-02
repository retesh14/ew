/* eslint-disable */
/* global WebImporter */
/**
 * Parser for `columns` (two variants share the same block base):
 *   - intro two-up  → block name "columns"                  (text column | image column)
 *   - sponsor tiers → block name "columns (sponsors-logos)"  (one row of logo images per tier)
 *
 * Source: https://events.sap.com/us-2026-sap-connect-days-data-it-houston/en_us/home.html
 * Instance selectors (page-templates.json):
 *   .container…aem-GridColumn--default--6   → intro TEXT column (prose + nested list)
 *   .container…aem-GridColumn--default--5   → intro IMAGE column (photo)
 *   .container…aem-GridColumn--default--4:not(.cmp-container--rounded) → 12 sponsor logo tiles
 *
 * Authored convention (content/events/connect.plain.html):
 *   sponsor grids are authored as `columns sponsors-logos` — a single row whose
 *   cells are the logo <picture>s; tier headings (<h3> Platinum/Gold/Silver) stay
 *   as default content between the logo rows.
 *
 * ⚠️ The validator invokes this parser once PER matched element (14 total: 1 intro
 * text, 1 intro image, 12 logos). Module-level `consumed` de-dupes: the first
 * element of each group builds the whole block and marks/removes its partners so
 * their later invocations bail. querySelectorAll returns document order, so the
 * first element of a group is always parsed first.
 */

const LOGO_SEL =
  '.container.responsivegrid.aem-GridColumn.aem-GridColumn--default--4:not(.cmp-container--rounded)';

const consumed = new WeakSet();

/** Nearest heading (h1–h6) that precedes `el` in document order — the tier label. */
function nearestHeading(el, document) {
  const walker = document.createTreeWalker(document.body, 1 /* SHOW_ELEMENT */);
  let last = null;
  let n = walker.nextNode();
  while (n) {
    if (n === el) break;
    if (/^H[1-6]$/.test(n.tagName)) last = n;
    n = walker.nextNode();
  }
  return last;
}

export default function parse(element, { document }) {
  if (consumed.has(element)) {
    element.remove();
    return;
  }

  const isSponsor = !!element.querySelector('.cmp-image--sponsor');

  // ---- Sponsor logo tier: group all logos sharing the same tier heading ----
  if (isSponsor) {
    const heading = nearestHeading(element, document);
    const allLogos = Array.from(document.querySelectorAll(LOGO_SEL))
      .filter((c) => c.querySelector('.cmp-image--sponsor') && !consumed.has(c));
    const tier = allLogos.filter((c) => nearestHeading(c, document) === heading);

    const imgs = tier
      .map((c) => c.querySelector('picture') || c.querySelector('img'))
      .filter(Boolean);
    if (!imgs.length) {
      element.replaceWith(...element.childNodes);
      return;
    }

    // Consume the rest of the tier so their own invocations bail.
    tier.forEach((c) => {
      if (c !== element) {
        consumed.add(c);
        c.remove();
      }
    });

    const cells = [[...imgs]]; // single row, one cell per logo
    const block = WebImporter.Blocks.createBlock(document, {
      name: 'columns (sponsors-logos)',
      cells,
    });
    element.replaceWith(block);
    return;
  }

  // ---- Intro two-up: TEXT column paired with the following IMAGE column ----
  const hasImage = !!element.querySelector('img, picture');
  if (!hasImage) {
    // This is the text column. Its sibling image column follows it.
    const imageCol = element.nextElementSibling;
    const textNodes = Array.from(element.querySelectorAll(':scope .cmp-text > *, :scope .text > *'));
    const textCell = textNodes.length ? textNodes : [element];

    const cells = [];
    if (imageCol && imageCol.querySelector('img, picture')) {
      const media = imageCol.querySelector('picture') || imageCol.querySelector('img');
      consumed.add(imageCol);
      imageCol.remove();
      cells.push([textCell, [media]]); // one row, two columns: text | image
    } else {
      cells.push([textCell]); // no partner image — single column fallback
    }

    const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
    element.replaceWith(block);
    return;
  }

  // Standalone image column that wasn't consumed by a text column — emit as a
  // single-column row so no content is silently dropped.
  const media = element.querySelector('picture') || element.querySelector('img');
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns',
    cells: [[[media]]],
  });
  element.replaceWith(block);
}
