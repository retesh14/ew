import { getConfig, getMetadata } from '../../scripts/ak.js';
import { loadFragment } from '../fragment/fragment.js';

const FOOTER_PATH = '/fragments/nav/footer';

/**
 * loads and decorates the footer
 * @param {Element} el The footer element
 */
export default async function init(el) {
  const { locale } = getConfig();
  const footerMeta = getMetadata('footer');
  const pagePath = window.location.pathname.replace(locale.prefix, '');

  // Path-based chrome: /vep event pages load VEP's own (editable) footer copy
  // from vep-fragment; everything else uses the default nav footer.
  const vepFooter = pagePath === '/vep' || pagePath.startsWith('/vep/');
  const path = footerMeta || (vepFooter ? '/vep-fragment/footer' : FOOTER_PATH);

  // Per-section footer theme: pages under /events and /vep use the dark (black)
  // footer to match sap.com/events; everything else (support, partner, home)
  // keeps the default light-grey footer. Path-based so no per-page authoring.
  if (pagePath === '/events' || pagePath.startsWith('/events/') || vepFooter) {
    el.classList.add('footer-events');
  }

  try {
    const fragment = await loadFragment(`${locale.prefix}${path}`);
    fragment.classList.add('footer-content');

    const sections = [...fragment.querySelectorAll('.section')];

    const copyright = sections.pop();
    copyright.classList.add('section-copyright');

    const legal = sections.pop();
    legal.classList.add('section-legal');

    el.append(fragment);
  } catch (e) {
    throw Error(e);
  }
}
