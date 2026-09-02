/* eslint-disable */
/* global WebImporter */
/**
 * Parser for `card` — registration day tiles.
 * Base block: card. Source: https://events.sap.com/us-2026-sap-connect-days-data-it-houston/en_us/home.html
 * Instance selector: .container.cmp-container--rounded.aem-GridColumn--default--4
 *
 * Authored convention (content/events/connect.plain.html "card"):
 *   1 column, 1 content row; the single cell holds, in order:
 *     picture, <h3> heading, one or more <p> text, optional CTA <p><a>.
 *   card.js pulls the first <picture>, treats the first unclassed div as content,
 *   and the last <p> containing an <a> as the CTA.
 *
 * Source (migration-work/block-context/card/source.html): each tile has a
 * calendar pictogram <img>, a bold "Day N" line (<p><b>), a date <p>, and Day 1
 * additionally has a "Register now" redirect button. Day 2 has an extra note <p>
 * (that note is authored as default content in the section, but keeping it inside
 * the tile here is harmless and preserves all source text).
 */
export default function parse(element, { document }) {
  const img = element.querySelector('img');

  // "Day N" heading comes from the bold text line; promote it to an <h3>.
  const boldP = Array.from(element.querySelectorAll('.cmp-text p, .text p'))
    .find((p) => p.querySelector('b'));
  let heading = null;
  if (boldP) {
    heading = document.createElement('h3');
    heading.textContent = boldP.textContent.trim();
  }

  // Remaining paragraphs (date, note) — excluding the bold heading line.
  const paragraphs = Array.from(element.querySelectorAll('.cmp-text p, .text p'))
    .filter((p) => p !== boldP && p.textContent.trim());

  // CTA: the redirect/button link, if present.
  const ctaLink = element.querySelector('.redirect-button__link, .cmp-button, a');

  if (!img && !heading && !paragraphs.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const contentCell = [];
  if (img) contentCell.push(img);
  if (heading) contentCell.push(heading);
  paragraphs.forEach((p) => contentCell.push(p));
  if (ctaLink) {
    const ctaP = document.createElement('p');
    const a = document.createElement('a');
    a.href = ctaLink.getAttribute('href');
    a.textContent = ctaLink.textContent.trim();
    ctaP.append(a);
    contentCell.push(ctaP);
  }

  const cells = [[contentCell]]; // 1 column, single content cell holding all elements
  const block = WebImporter.Blocks.createBlock(document, { name: 'card', cells });
  element.replaceWith(block);
}
