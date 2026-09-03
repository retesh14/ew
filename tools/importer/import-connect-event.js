/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import advancedTabsParser from './parsers/advanced-tabs.js';
import cardParser from './parsers/card.js';
import columnsParser from './parsers/columns.js';
import heroParser from './parsers/hero.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/sap-events-cleanup.js';
import sectionsTransformer from './transformers/sap-events-sections.js';

// VEP-MEDIA MAP — rewrite absolute SAP Dynamic Media URLs to the local
// /vep-media/ folder so event pages are self-contained (see vep-media-map.json).
const VEP_MEDIA_MAP = {
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--506b1a75-5041-4a7b-a2f2-471fdac9731b/lady-in-blue-blouse.png': '/vep-media/lady-in-blue-blouse.png',
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--b8037027-89ea-42c7-8ba5-23f9cc3fea23/lp-banner-connect-day.png': '/vep-media/lp-banner-connect-day.png',
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--1992d2a5-3372-48d9-9681-08964e2af4e7/sap-calendar-icon-template-2024-2.jpg': '/vep-media/sap-calendar-icon-template-2024-2.png',
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--2e57f3fd-3add-40e8-b8d6-79a9db0003ca/sap-calendar-icon-template-2024-03.jpg': '/vep-media/sap-calendar-icon-template-2024-03.png',
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--5be26b43-adff-43c7-9093-a0318f32d0c2/google-cloud.jpg': '/vep-media/google-cloud.png',
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--d1390095-9914-425e-9f67-805662cdf20e/applexus-logo-2025-1-1-1.png': '/vep-media/applexus-logo-2025-1-1-1.png',
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--2ab3988e-3f97-44ff-b87c-a03eac54a693/vasss-logo-2.png': '/vep-media/vasss-logo-2.png',
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--8b115c7f-f0ea-4910-97c0-f5546c7effe1/incture-logo.png': '/vep-media/incture-logo.png',
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--4b887d8b-8e83-40b9-9aa9-72b0471670c1/mindset-logo-dark-blue-2x--3---1-.png': '/vep-media/mindset-logo-dark-blue-2x-3-1.png',
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--ac589cdc-355f-4372-959d-94d13ff1111a/sierra-digital.png': '/vep-media/sierra-digital.png',
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--39059456-9ab9-4606-9f09-d3b7bd7db76a/blueboot2.png': '/vep-media/blueboot2.png',
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--30e60d4b-775d-4db2-b23e-cdc296ef1e62/crave-infotech-logo.jpg': '/vep-media/crave-infotech-logo.png',
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--60d6c2a7-bf8f-4389-99b6-26ad06283a1a/tricentis-logo-freelogovectors-net-.png': '/vep-media/tricentis-logo-freelogovectors-net.png',
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--b22d409c-9033-4c5d-93d5-a683ae4d81c3/ot-opentext-logo-color-2x.png': '/vep-media/ot-opentext-logo-color-2x.png',
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--277b71d8-14d4-4bcb-af6e-6108baaf5e2c/syniti-uae-email.png': '/vep-media/syniti-uae-email.png',
  'https://events.sap.com/adobe/dynamicmedia/deliver/dm-aid--262bbdde-a719-4bf6-a2c6-7f267eb141d0/collibra-logo.jpg': '/vep-media/collibra-logo.png',
};

// Corrected alt text for sponsor logos — the source page mislabels several
// (e.g. Google Cloud carried alt="Vass"). Keyed by the local /vep-media/ path.
const VEP_ALT_FIXES = {
  '/vep-media/google-cloud.png': 'Google Cloud',
  '/vep-media/incture-logo.png': 'Incture',
  '/vep-media/crave-infotech-logo.png': 'Crave Infotech',
  '/vep-media/collibra-logo.png': 'Collibra',
  '/vep-media/tricentis-logo-freelogovectors-net.png': 'Tricentis',
};

/**
 * Rewrite every <img>/<source> whose URL matches a Dynamic Media asset to its
 * local /vep-media/ copy. Query strings (width/quality/preferwebp) are dropped —
 * the local file is a single rendition. Also corrects known bad sponsor alts.
 */
function rewriteMediaToVepMedia(main) {
  main.querySelectorAll('img, source').forEach((el) => {
    ['src', 'srcset'].forEach((attr) => {
      const val = el.getAttribute(attr);
      if (!val) return;
      const base = val.split('?')[0];
      if (VEP_MEDIA_MAP[base]) el.setAttribute(attr, VEP_MEDIA_MAP[base]);
    });
    // Fix mislabeled sponsor alt text once the src points at /vep-media/.
    if (el.tagName === 'IMG') {
      const fix = VEP_ALT_FIXES[el.getAttribute('src')];
      if (fix) {
        el.setAttribute('alt', fix);
        el.removeAttribute('title'); // stale source title (e.g. "Crave-Logo")
      }
    }
  });
}

// PARSER REGISTRY
const parsers = {
  'advanced-tabs': advancedTabsParser,
  card: cardParser,
  columns: columnsParser,
  hero: heroParser,
};

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
  name: 'connect-event',
  description: 'SAP Connect event-detail page: hero, intro, tabbed agenda, registration tiles, tiered sponsor logos. Uses the connect (dark) page template.',
  urls: [
    'https://events.sap.com/us-2026-sap-connect-days-data-it-houston/en_us/home.html',
  ],
  blocks: [
    { name: 'hero', instances: ['.container.cmp-container--topLarge'] },
    {
      name: 'columns',
      instances: [
        '.container.cmp-container--topSmall.cmp-container--bottomSmall.aem-GridColumn--default--6',
        '.container.cmp-container--topSmall.cmp-container--bottomSmall.aem-GridColumn--default--5',
        '.container.responsivegrid.aem-GridColumn.aem-GridColumn--default--4:not(.cmp-container--rounded)',
      ],
    },
    { name: 'advanced-tabs', instances: ['.tabs.panelcontainer'] },
    { name: 'card', instances: ['.container.cmp-container--rounded.aem-GridColumn--default--4'] },
  ],
  sections: [
    { id: 'hero', name: 'Hero', selector: '.container.cmp-container--topLarge', style: null, blocks: ['hero'], defaultContent: [] },
    {
      id: 'intro',
      name: 'Intro',
      selector: '#container-b148bfe79e',
      style: 'light',
      // Contain + gap: without `container` the columns block runs edge-to-edge
      // (text clipped at the viewport edge). align-top keeps text/image top-aligned.
      meta: {
        style: 'light, container', gap: 'xl', spacing: 'xxl',
      },
      blocks: ['columns'],
      defaultContent: ['#title-b9d20c1123'],
    },
    {
      id: 'agenda',
      name: 'Agenda',
      selector: '#container-4a42ff25b9',
      style: 'light',
      meta: { style: 'light, container', spacing: 'xxl' },
      blocks: ['advanced-tabs'],
      defaultContent: ['#title-8db653ce1b'],
    },
    {
      id: 'registration',
      name: 'Registration',
      selector: '#registration',
      style: 'light',
      // Two day tiles side by side + centered heading — matches the repo's
      // connect pages (grid:2, center, container). Without grid the cards stack.
      meta: {
        style: 'light, center, container', grid: '2', gap: 'l', spacing: 'xxl',
      },
      blocks: ['card'],
      defaultContent: ['#title-1df3e4ff48', '#text-0c7e0369e2'],
    },
    {
      id: 'partners',
      name: 'Partners',
      selector: '#container-31b98399a7',
      style: 'light',
      // Centered, contained sponsor grid — matches the connect pages' sponsor row.
      meta: {
        style: 'light, center, container', gap: 'l', spacing: 'xxl',
      },
      blocks: ['columns'],
      defaultContent: ['#title-d9f941368b', '#title-673a2d8f88', '#title-a3ecb259f6'],
    },
  ],
};

// TRANSFORMER REGISTRY (section transformer runs after cleanup, in afterTransform)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a given hook.
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all block instances on the page from the embedded template.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name, selector, element, section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform cleanup (+ section breaks inserted before parsers run)
    executeTransformers('beforeTransform', main, payload);

    // 2. discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. parse each block; skip elements already replaced by an earlier parser
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform cleanup (+ section metadata anchored)
    executeTransformers('afterTransform', main, payload);

    // 5. built-in rules — metadata, background images, absolute image URLs
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // Point event imagery at the local /vep-media/ folder (self-contained page).
    rewriteMediaToVepMedia(main);

    // Apply the dark event page theme by adding a "Template: connect" row to the
    // Metadata block createMetadata appended (last table in main). The VEP
    // header/footer fragments are selected path-based inside the header/footer
    // blocks (see blocks/header + blocks/footer), not via metadata — this repo
    // uses header/footer metadata as the block class name, not a fragment path.
    const tables = main.querySelectorAll('table');
    const metaTable = tables[tables.length - 1];
    if (metaTable) {
      const row = document.createElement('tr');
      const keyCell = document.createElement('td');
      keyCell.textContent = 'Template';
      const valCell = document.createElement('td');
      valCell.textContent = 'connect';
      row.append(keyCell, valCell);
      metaTable.append(row);
    }

    // 6. path: land the event under /vep, media alongside under /vep-media.
    //    Source path: /us-2026-sap-connect-days-data-it-houston/en_us/home.html
    //    Target doc:  /vep/us-2026-sap-connect-days-data-it-houston
    const srcPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    // Collapse the source's locale/home tail to a single event page under /vep.
    const eventSlug = srcPath.replace(/^\//, '').split('/')[0];
    const rawPath = `/vep/${eventSlug}`;
    const path = WebImporter.FileUtils.sanitizePath(rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
