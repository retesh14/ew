/*
 * Partner Cards block — "Tools and resources designed to drive partner success"
 *
 * A responsive grid of resource cards (SAP Partner Portal, SAP for Me, Pinnacle
 * Awards, SAP Learning Rooms). Each card = heading + description + one or more
 * CTA links. Self-contained, pure front-end.
 *
 * Each authored row = one card, in a cell containing:
 *   - a heading (card title)
 *   - paragraph(s) (description)
 *   - one or more links (CTAs)
 */

function decorateCard(row) {
  row.classList.add('partner-card');
  const inner = row.querySelector(':scope > div') || row;
  inner.classList.add('partner-card-inner');

  const heading = inner.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) heading.classList.add('partner-card-title');

  inner.querySelectorAll(':scope > p').forEach((p) => {
    if (p.querySelector('a')) {
      p.classList.add('partner-card-cta-wrap');
      p.querySelectorAll('a').forEach((a) => a.classList.add('partner-card-cta'));
    } else {
      p.classList.add('partner-card-desc');
    }
  });

  // Bare links not wrapped in <p>
  inner.querySelectorAll(':scope > a').forEach((a) => a.classList.add('partner-card-cta'));
}

export default async function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  rows.forEach(decorateCard);
}
