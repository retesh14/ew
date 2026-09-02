/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: SAP Events (events.sap.com) site-wide cleanup.
 * Removes non-authorable global chrome (cookie consent, header experience
 * fragment, footer) and tracking/analytics elements.
 *
 * All selectors verified against migration-work/cleaned.html:
 *   - #consent_blackbar                 (line 2)   TrustArc consent black bar
 *   - #teconsent                        (line 4)   Cookie Preferences link
 *   - .truste_cursor_pointer            (line 5)   Cookie Preferences anchor
 *   - .experiencefragmentheader         (line 8)   header experience fragment wrapper
 *   - header.header-component           (line 14)  sticky site header
 *   - .footer                           (line 1446) footer wrapper (contains
 *                                                   #sapdx-footer + trailing
 *                                                   tracking iframes/pixels)
 *   - #sapdx-footer                     (line 1447) SAP global footer
 *   - iframe / link / noscript          (lines 1800, 1805, 1822) tracking + clientlib refs
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Cookie / consent widgets — remove before block parsing so they never
    // interfere with block matching.
    WebImporter.DOMUtils.remove(element, [
      '#consent_blackbar',
      '#teconsent',
      '.truste_cursor_pointer',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable global chrome + tracking. The .footer wrapper also
    // contains the trailing analytics iframes/pixels, but iframe/link/noscript
    // are listed explicitly as a safety net.
    WebImporter.DOMUtils.remove(element, [
      '.experiencefragmentheader',
      'header.header-component',
      '.footer',
      '#sapdx-footer',
      'iframe',
      'link',
      'noscript',
    ]);
  }
}
