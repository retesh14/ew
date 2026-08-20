/*
 * Secondary (contextual) nav — an optional, standalone block.
 * Author drops it on a page when a section-level nav is wanted (SAP-style):
 * a title on the left + contextual links on the right. Absent = nothing renders.
 *
 * Authored structure (single cell):
 *   | Secondary Nav |
 *   | ## Events            |
 *   | - [Overview](/)      |
 *   | - [Event Finder](/…) |
 */
export default function init(el) {
  const inner = el.querySelector(':scope > div > div') || el.querySelector(':scope > div');
  if (!inner) return;

  const wrap = document.createElement('div');
  wrap.className = 'secondary-nav-inner';

  // Title = first heading, if present.
  const title = inner.querySelector('h1, h2, h3, h4, h5, h6');
  if (title) {
    title.classList.add('secondary-nav-title');
    wrap.append(title);
  }

  // Links = the list.
  const list = inner.querySelector('ul');
  if (list) {
    list.classList.add('secondary-nav-list');
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', title ? title.textContent.trim() : 'Secondary navigation');
    // mark current page
    for (const a of list.querySelectorAll('a')) {
      if (a.pathname === window.location.pathname) a.setAttribute('aria-current', 'page');
    }
    nav.append(list);
    wrap.append(nav);
  }

  el.textContent = '';
  if (wrap.children.length) el.append(wrap);
}
