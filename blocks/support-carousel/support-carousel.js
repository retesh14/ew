/*
 * Support Carousel block — SAP Support Portal (POC)
 *
 * Horizontal, accessible card carousel used for "Features" and "Additional
 * resources" (mirrors the real support.sap.com carousels with Prev/Next).
 * Scroll-snap track + Prev/Next buttons + dot indicators + keyboard support.
 *
 * Each authored row = one card in a cell with (any of):
 *   - an image (<picture>/<img> or a bare image URL)
 *   - a heading (title)
 *   - paragraph(s) (description)
 *   - a link (CTA)
 *
 * Lighthouse-friendly: images carry explicit width/height + lazy loading;
 * the track reserves its height so there is no layout shift.
 */

const IMG_W = 600;
const IMG_H = 338;

function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null) {
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value);
    }
  }
  for (const child of children) if (child) node.append(child);
  return node;
}

function decorateImage(inner) {
  let img = inner.querySelector('img');
  if (!img) {
    const imgLink = [...inner.querySelectorAll('a')].find((a) => /\.(jpe?g|png|webp|svg|gif)(\?|$)/i.test(a.getAttribute('href') || ''));
    if (imgLink) {
      img = document.createElement('img');
      img.src = imgLink.getAttribute('href');
      img.alt = imgLink.textContent.trim() || '';
      const p = document.createElement('p');
      p.append(img);
      imgLink.remove();
      inner.insertAdjacentElement('afterbegin', p);
    }
  }
  const pic = inner.querySelector('picture');
  img = inner.querySelector('img');
  if (img) {
    if (!img.getAttribute('width')) img.setAttribute('width', IMG_W);
    if (!img.getAttribute('height')) img.setAttribute('height', IMG_H);
    if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
    if (!img.hasAttribute('alt')) img.setAttribute('alt', '');
    const holder = pic || img;
    const box = h('div', { class: 'support-carousel-image' });
    holder.replaceWith(box);
    box.append(holder);
  }
}

function decorateSlide(row, index, wide) {
  row.classList.add('support-carousel-slide');
  row.setAttribute('role', 'group');
  row.setAttribute('aria-roledescription', 'slide');
  row.setAttribute('aria-label', `${index + 1}`);
  const inner = row.querySelector(':scope > div') || row;
  inner.classList.add('support-carousel-card');
  decorateImage(inner);
  const heading = inner.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) heading.classList.add('support-carousel-title');
  const cta = inner.querySelector('a');
  if (cta) {
    cta.classList.add('support-carousel-cta');
    inner.append(cta);
    cta.append(h('span', { class: 'support-carousel-arrow', 'aria-hidden': 'true', text: '→' }));
  }
  inner.querySelectorAll(':scope > p').forEach((p) => {
    if (p.querySelector('img')) return;
    if (!p.classList.contains('support-carousel-cta')) p.classList.add('support-carousel-desc');
  });

  // Wide/editorial slide (like the source "Features" carousel): text on the
  // left, image on the right. Group all non-image nodes into a body wrapper so
  // the card can lay them out as [text | image] via flex, deterministically.
  if (wide) {
    const imageDiv = inner.querySelector('.support-carousel-image');
    const body = h('div', { class: 'support-carousel-body' });
    [...inner.children].forEach((c) => { if (c !== imageDiv) body.append(c); });
    inner.append(body);
    if (imageDiv) inner.append(imageDiv);
  }
}

export default async function init(el) {
  // The first support-carousel on the page is the "Features" spotlight: a wide
  // editorial layout (text left, image right, one slide per view). Any later
  // instance (e.g. "Additional resources") keeps the default multi-card grid.
  const wide = document.querySelector('.support-carousel') === el;
  if (wide) el.classList.add('support-carousel-wide');

  const slides = [...el.querySelectorAll(':scope > div')];
  slides.forEach((row, i) => decorateSlide(row, i, wide));

  const track = h('div', { class: 'support-carousel-track', role: 'list' });
  slides.forEach((s) => track.append(s));

  const prev = h('button', { class: 'support-carousel-btn support-carousel-prev', type: 'button', 'aria-label': 'Previous' }, h('span', { 'aria-hidden': 'true', text: '‹' }));
  const next = h('button', { class: 'support-carousel-btn support-carousel-next', type: 'button', 'aria-label': 'Next' }, h('span', { 'aria-hidden': 'true', text: '›' }));
  const dots = h('div', { class: 'support-carousel-dots', role: 'tablist', 'aria-label': 'Choose slide' });

  el.textContent = '';
  const viewport = h('div', { class: 'support-carousel-viewport' }, track);
  el.append(prev, viewport, next, dots);

  // Dots — one per slide.
  slides.forEach((s, i) => {
    const dot = h('button', { class: 'support-carousel-dot', type: 'button', role: 'tab', 'aria-label': `Slide ${i + 1}` });
    dot.addEventListener('click', () => {
      s.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    });
    dots.append(dot);
  });

  const page = () => {
    const cardW = slides[0]?.offsetWidth || viewport.clientWidth;
    return Math.max(1, Math.round(viewport.clientWidth / cardW));
  };
  const scrollByCards = (dir) => {
    const step = (slides[0]?.offsetWidth || 300) * page();
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };
  prev.addEventListener('click', () => scrollByCards(-1));
  next.addEventListener('click', () => scrollByCards(1));

  // Update dot/button state on scroll.
  const update = () => {
    const { scrollLeft, scrollWidth, clientWidth } = track;
    prev.disabled = scrollLeft <= 2;
    next.disabled = scrollLeft + clientWidth >= scrollWidth - 2;
    const active = Math.round(scrollLeft / (slides[0]?.offsetWidth || 1));
    [...dots.children].forEach((d, i) => {
      d.classList.toggle('is-active', i === active);
      d.setAttribute('aria-selected', i === active ? 'true' : 'false');
    });
  };
  track.addEventListener('scroll', () => window.requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', update);
  update();
  // Re-evaluate once layout has settled (flex widths, images) so the Next
  // button isn't left disabled when the track actually overflows.
  window.requestAnimationFrame(update);
  window.addEventListener('load', update);
}
