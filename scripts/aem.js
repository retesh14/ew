/*
 * Compatibility shim for the boilerplate `form` block.
 *
 * The Adobe boilerplate Form block (blocks/form/*) imports a few helpers from
 * `/scripts/aem.js` — the standard EDS scaffold filename. This project ships
 * `ak.js` instead, so we provide just the helpers the form block needs, backed
 * by ak.js where possible. Keeping this as a thin, self-contained file avoids
 * editing the vendored form block (so it stays upgradeable).
 */
import { loadStyle } from './ak.js';

/** loadCSS(href) → resolves once the stylesheet has loaded. */
export function loadCSS(href) {
  return loadStyle(href);
}

/**
 * Minimal createOptimizedPicture — the form block only uses it for the
 * optional image field. Returns a <picture> with a single <img>.
 */
export function createOptimizedPicture(src, alt = '', eager = false) {
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  img.setAttribute('loading', eager ? 'eager' : 'lazy');
  img.setAttribute('alt', alt);
  img.src = src;
  picture.append(img);
  return picture;
}

/**
 * decorateIcons — replace <span class="icon icon-name"> with an <img> pointing
 * at /icons/<name>.svg. Standard EDS behaviour; the form block calls it for
 * component icons.
 */
export function decorateIcons(element = document) {
  element.querySelectorAll('span.icon').forEach((span) => {
    const iconName = Array.from(span.classList)
      .find((c) => c.startsWith('icon-'))?.substring(5);
    if (!iconName) return;
    const img = document.createElement('img');
    img.dataset.iconName = iconName;
    img.src = `${window.hlx?.codeBasePath || ''}/icons/${iconName}.svg`;
    img.alt = iconName;
    img.loading = 'lazy';
    span.append(img);
  });
}
