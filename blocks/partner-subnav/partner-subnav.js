/*
 * Partner Subnav block — SAP Partner Portal Login (POC)
 *
 * The secondary navigation bar under the global header (Overview / Find a
 * partner / Find partner solutions / Become a partner) plus a primary
 * "Log in" button. Pure front-end: every item is a hyperlink (for the POC,
 * pointing at the live sap.com pages). A "current" item can be marked with a
 * leading strong/em or a `data-current` cell.
 *
 * Authored structure:
 *   row 1 (title): the portal name (e.g. "SAP Partner Portal Login")
 *   following rows: one link each = a nav item; the LAST link, if it points to
 *     partneredge, is treated as the primary "Log in" button.
 */

function decorate(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  el.textContent = '';

  const bar = document.createElement('div');
  bar.className = 'partner-subnav-inner';

  // First row = title (heading or text)
  const titleRow = rows.shift();
  if (titleRow) {
    const cell = titleRow.querySelector(':scope > div') || titleRow;
    const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
    const title = document.createElement('span');
    title.className = 'partner-subnav-title';
    title.textContent = (heading || cell).textContent.trim();
    bar.append(title);
  }

  const list = document.createElement('ul');
  list.className = 'partner-subnav-list';
  let loginLink = null;

  rows.forEach((row) => {
    const link = row.querySelector('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    // A partneredge link is the primary "Log in" CTA, not a nav tab.
    if (/partneredge\.sap\.com/.test(href)) {
      link.classList.add('partner-subnav-login');
      loginLink = link;
      return;
    }
    // An authored-emphasised item marks the current tab. Note: the global
    // button decorator runs first and turns a <strong> link into a
    // `btn btn-primary` (a dark filled button) while unwrapping the <strong>,
    // so detect either the raw emphasis OR the resulting button classes, then
    // strip the button styling so it renders as a nav tab, not a black box.
    const wasButton = link.classList.contains('btn');
    const isCurrent = wasButton || link.closest('strong, em') || row.textContent.includes('*');
    link.classList.remove('btn', 'btn-primary', 'btn-secondary', 'btn-accent', 'btn-negative', 'btn-outline');
    link.classList.add('partner-subnav-link');
    if (isCurrent) {
      link.classList.add('is-current');
      link.setAttribute('aria-current', 'page');
    }
    const li = document.createElement('li');
    li.append(link);
    list.append(li);
  });

  const navEl = document.createElement('nav');
  navEl.className = 'partner-subnav-nav';
  navEl.setAttribute('aria-label', 'Partner portal sections');
  navEl.append(list);
  bar.append(navEl);
  if (loginLink) bar.append(loginLink);

  el.append(bar);
}

export default async function init(el) {
  decorate(el);
}
