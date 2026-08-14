/*
 * Support Cards block — SAP Support Portal (POC)
 *
 * Self-contained responsive card grid (no external block dependency), used for
 * the Features promo, "Additional resources", and Community sections. Each card
 * may have an optional image, a title, description, and a CTA link.
 *
 * Lighthouse-friendly: images get explicit width/height (no CLS) and lazy
 * loading below the fold; the grid reserves its own space.
 *
 * Each authored row = one card, in a cell containing (any of):
 *   - an image (a <picture>/<img>, or a bare image URL in a link/paragraph)
 *   - a heading (card title)
 *   - paragraph(s) (description)
 *   - a link (the CTA)
 */

const IMG_W = 600;
const IMG_H = 338; // 16:9 default to reserve space and avoid layout shift

function decorateImage(inner) {
  // Case 1: authored <picture>/<img> already present.
  let pic = inner.querySelector('picture');
  let img = inner.querySelector('img');

  // Case 2: a bare image URL (link or text) — build a picture from it.
  if (!pic && !img) {
    const imgLink = [...inner.querySelectorAll('a')].find((a) => /\.(jpe?g|png|webp|svg|gif)(\?|$)/i.test(a.getAttribute('href') || ''));
    if (imgLink) {
      const src = imgLink.getAttribute('href');
      img = document.createElement('img');
      img.src = src;
      img.alt = imgLink.textContent.trim() || '';
      imgLink.remove();
      const wrap = document.createElement('p');
      wrap.append(img);
      inner.insertAdjacentElement('afterbegin', wrap);
    }
  }

  img = inner.querySelector('img');
  pic = inner.querySelector('picture');
  if (img) {
    // Explicit dimensions prevent CLS; lazy since cards are typically below fold.
    if (!img.getAttribute('width')) img.setAttribute('width', IMG_W);
    if (!img.getAttribute('height')) img.setAttribute('height', IMG_H);
    if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
    if (!img.hasAttribute('alt')) img.setAttribute('alt', '');
    const holder = pic || img;
    const container = document.createElement('div');
    container.className = 'support-card-image';
    holder.replaceWith(container);
    container.append(holder);
  }
}

function decorateCard(row) {
  row.classList.add('support-card');
  const inner = row.querySelector(':scope > div') || row;
  inner.classList.add('support-card-inner');

  decorateImage(inner);

  const heading = inner.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) heading.classList.add('support-card-title');

  const cta = inner.querySelector('a');
  if (cta) {
    cta.classList.add('support-card-cta');
    inner.append(cta);
    const arrow = document.createElement('span');
    arrow.className = 'support-card-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    cta.append(arrow);
  }

  inner.querySelectorAll(':scope > p').forEach((p) => {
    if (p.querySelector('img')) return;
    if (!p.classList.contains('support-card-cta')) p.classList.add('support-card-desc');
  });
}

// Banner layout is [image | text]. Group everything except the image into a
// single text column so the title/desc/CTA stack on the right (rather than
// each becoming its own flex column). Mirrors the source alignment container.
function groupBannerBody(row) {
  const inner = row.querySelector(':scope > .support-card-inner') || row;
  const imageEl = inner.querySelector('.support-card-image');
  // The image may be wrapped (e.g. in a <p>); find its top-level ancestor
  // inside inner so we keep the whole image column out of the text body.
  let imageCol = imageEl;
  while (imageCol && imageCol.parentElement !== inner) imageCol = imageCol.parentElement;
  const body = document.createElement('div');
  body.className = 'support-card-body';
  [...inner.children].forEach((c) => { if (c !== imageCol) body.append(c); });
  if (imageCol) inner.prepend(imageCol);
  inner.append(body);
}

export default async function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  // A single card reads best as a full-width horizontal banner (e.g. the
  // Community award), unless the author already chose a variant.
  if (rows.length === 1 && !el.classList.contains('banner')) el.classList.add('banner');
  rows.forEach(decorateCard);
  if (el.classList.contains('banner')) rows.forEach(groupBannerBody);
}
