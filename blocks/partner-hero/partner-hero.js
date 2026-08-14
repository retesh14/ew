/*
 * Partner Hero block — SAP Partner Portal Login (POC)
 *
 * "Existing partners" hero: heading + intro + primary Log in CTA on one side,
 * a hero image on the other. Pure front-end; the CTA is a hyperlink to the
 * (gated) partner portal. Image carries explicit dims + lazy (no CLS).
 *
 * Authored structure (one row, one cell) containing:
 *   - a heading (the hero title)
 *   - paragraph(s) (intro copy)
 *   - a link (Log in CTA)
 *   - optionally an image (<picture>/<img> or a bare image URL)
 */

const IMG_W = 690;
const IMG_H = 450;

function decorateImage(el) {
  let img = el.querySelector('img');
  if (!img) {
    const imgLink = [...el.querySelectorAll('a')].find((a) => /\.(jpe?g|png|webp|svg|gif)(\?|$)/i.test(a.getAttribute('href') || ''));
    if (imgLink) {
      img = document.createElement('img');
      img.src = imgLink.getAttribute('href');
      img.alt = imgLink.textContent.trim() || '';
      const p = document.createElement('p');
      p.append(img);
      imgLink.remove();
      el.append(p);
    }
  }
  const pic = el.querySelector('picture');
  img = el.querySelector('img');
  if (img) {
    if (!img.getAttribute('width')) img.setAttribute('width', IMG_W);
    if (!img.getAttribute('height')) img.setAttribute('height', IMG_H);
    if (!img.getAttribute('loading')) img.setAttribute('loading', 'eager');
    if (!img.hasAttribute('alt')) img.setAttribute('alt', '');
    const media = document.createElement('div');
    media.className = 'partner-hero-media';
    const holder = pic || img;
    holder.replaceWith(media);
    media.append(holder);
    return media;
  }
  return null;
}

export default async function init(el) {
  const inner = el.querySelector(':scope > div > div') || el.querySelector(':scope > div') || el;
  inner.classList.add('partner-hero-inner');

  const media = decorateImage(inner);

  const content = document.createElement('div');
  content.className = 'partner-hero-content';
  // Move heading, paragraphs, and links (that aren't the image) into content.
  [...inner.children].forEach((child) => {
    if (child === media) return;
    content.append(child);
  });

  const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) heading.classList.add('partner-hero-heading');
  const cta = content.querySelector('a');
  if (cta) cta.classList.add('partner-hero-cta');
  content.querySelectorAll(':scope > p').forEach((p) => {
    if (!p.querySelector('a')) p.classList.add('partner-hero-text');
  });

  inner.textContent = '';
  inner.append(content);
  if (media) inner.append(media);
}
