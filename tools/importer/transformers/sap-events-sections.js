/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: SAP Events (events.sap.com) section breaks + section metadata.
 *
 * Inserts an <hr> before every non-first section and a "Section Metadata"
 * block after every section that carries a `style`, driven by
 * payload.template.sections (from page-templates.json).
 *
 * Section selectors verified against migration-work/cleaned.html:
 *   - hero:         .container.cmp-container--topLarge   (line 57)  style: null
 *   - intro:        #container-b148bfe79e                (line 102) style: light
 *   - agenda:       #container-4a42ff25b9                (line 166) style: light
 *   - registration: #registration                       (line 1093) style: light
 *   - partners:     #container-31b98399a7                (line 1190) style: light
 *
 * Breaks are inserted in beforeTransform (while every section element still
 * exists, before parsers replace them), using a marker attr on each <hr> so
 * the metadata block can be anchored in afterTransform. See
 * references/generate-import-transformer.md "Why both hooks".
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

export default function transform(hookName, element, payload) {
  const sections = (payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    // Insert breaks now, before parsers can replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no break, no metadata needed
      const sectionEl = element.querySelector(section.selector);
      if (!sectionEl) continue; // selector didn't match on this page — skip, never guess a replacement

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers have now run and may have replaced section elements. Anchor each
    // styled section's Section Metadata block to whichever still exists: the
    // marker <hr> placed above, or (first section, no marker inserted) the
    // original element itself.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || element.querySelector(section.selector);
      if (!anchor) continue; // neither survived — selector didn't match post-parse; skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // section 0 never gets a real leading break
      }
    }
  }
}
