/* eslint-disable */
/* global WebImporter */
/**
 * Parser for `advanced-tabs` — the two-track agenda switcher.
 * Base block: advanced-tabs. Source: https://events.sap.com/us-2026-sap-connect-days-data-it-houston/en_us/home.html
 * Instance selector: .tabs.panelcontainer
 *
 * Authored convention (content/fragments/events/finder-tabs.plain.html + blocks/advanced-tabs/advanced-tabs.js):
 *   The block table itself contains ONLY a <ul> of tab labels (1 column, 1 row).
 *   Each tab PANEL is authored as its own following sibling *section*; at runtime
 *   advanced-tabs.js collects the sibling `.section`s and wires them to the tabs.
 *   In the flat import/markdown model, sections are separated by <hr>. So this
 *   parser replaces the source element with:
 *     [advanced-tabs block]  <hr>  [panel 1 content]  <hr>  [panel 2 content] ...
 *
 * Source (migration-work/block-context/advanced-tabs/source.html):
 *   ol.cmp-tabs__tablist > li  → tab labels ("Data and Context for AI", "Build and Govern Agentic AI")
 *   .cmp-tabs__tabpanel        → one panel per tab, each an agenda of <h3> time slots + detail lists
 */
export default function parse(element, { document }) {
  // Only the tab list's own <li>s — never the nested detail lists inside panels.
  const tablist = element.querySelector('.cmp-tabs__tablist, [role="tablist"], :scope > ol, :scope > ul');
  const labelEls = tablist ? Array.from(tablist.querySelectorAll(':scope > li')) : [];
  const panels = Array.from(
    element.querySelectorAll('.cmp-tabs__tabpanel, [role="tabpanel"]'),
  );

  const labels = labelEls.map((li) => li.textContent.trim()).filter(Boolean);
  if (!labels.length || !panels.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Block cell: a <ul> of the tab labels.
  const ul = document.createElement('ul');
  labels.forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    ul.append(li);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'advanced-tabs',
    cells: [[ul]],
  });

  // Build the panel sections that follow the block. Each panel's content is
  // wrapped in a plain div and separated from the previous section by an <hr>.
  const fragment = document.createDocumentFragment();
  fragment.append(block);
  panels.forEach((panel) => {
    fragment.append(document.createElement('hr'));
    const section = document.createElement('div');
    // Move the panel's real content across (deeply-nested cmp wrappers flatten
    // to headings/lists/paragraphs during markdown conversion).
    Array.from(panel.childNodes).forEach((node) => section.append(node));
    fragment.append(section);
  });

  element.replaceWith(fragment);
}
