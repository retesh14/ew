/* eslint-disable */
/* global WebImporter */
/**
 * Parser for `hero` (variant: promo).
 * Base block: hero. Variant class: promo.
 * Source: https://events.sap.com/us-2026-sap-connect-days-data-it-houston/en_us/home.html
 * Instance selector: .container.cmp-container--topLarge
 *
 * Authored convention (content/events/connect.plain.html — "hero promo"):
 *   1-column hero, two content rows:
 *     row 1 = the picture (contained right-side brand graphic / photo)
 *     row 2 = text block: date/location <p>, <h1> title, intro <p>, optional CTA <p><a>
 *   hero.js decorateForeground treats the element directly before the <h1> as
 *   `.hero-detail`, so the date/location line must sit BEFORE the heading.
 *
 * Source structure (migration-work/block-context/hero/source.html):
 *   left grid column  (aem-GridColumn--default--6): <h1> + two .cmp-text <p>
 *     (subtitle "From vision to reality…" and date/location line)
 *   right grid column (aem-GridColumn--default--5): the image ("Lady with bag")
 */
export default function parse(element, { document }) {
  const heading = element.querySelector('h1, h2');
  const paragraphs = Array.from(element.querySelectorAll('.cmp-text p, .text p'))
    .filter((p) => p.textContent.trim());
  // Date/location line: contains a year or the "date | venue" separator.
  const detail = paragraphs.find((p) => /\d{4}|\|/.test(p.textContent));
  const rest = paragraphs.filter((p) => p !== detail);
  const image = element.querySelector('img');

  if (!heading && !paragraphs.length && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const textCell = [];
  if (detail) textCell.push(detail);        // detail line first → becomes .hero-detail
  if (heading) textCell.push(heading);      // title
  textCell.push(...rest);                   // intro / subtitle + any CTA

  const cells = [];
  if (image) cells.push([image]);           // row 1: picture (background/graphic)
  cells.push([textCell]);                   // row 2: single cell holding the text block

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero (promo)', cells });
  element.replaceWith(block);
}
