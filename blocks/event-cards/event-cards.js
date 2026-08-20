import { createPicture } from '../../scripts/utils/picture.js';

/*
 * event-cards — renders a grid (or full-width `list`) of cards from a DA
 * spreadsheet (one row = one card). Add/remove rows in the sheet to add/remove
 * cards — no HTML editing.
 *
 * Sheet columns (all optional except title):
 *   title | date | location | description | image | link | linktext
 *
 * Optional authored `filter` row narrows rows by location:
 *   | filter | virtual-live |      -> location === "Online - Live"
 *   | filter | virtual-on-demand | -> location === "Online - On-demand"
 *   | filter | in-person |         -> everything that is NOT "Online - ..."
 *   (no filter / explore-all)      -> all rows
 */
function applyFilter(rows, filter) {
  const isOnline = (r) => /^online\s*-/i.test((r.location || '').trim());
  switch (filter) {
    case 'virtual-live':
      return rows.filter((r) => /^online\s*-\s*live$/i.test((r.location || '').trim()));
    case 'virtual-on-demand':
      return rows.filter((r) => /^online\s*-\s*on[\s-]?demand$/i.test((r.location || '').trim()));
    case 'in-person':
      return rows.filter((r) => !isOnline(r));
    default:
      return rows;
  }
}
const ICONS = {
  date: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 2v2H5.5A2.5 2.5 0 0 0 3 6.5v12A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5v-12A2.5 2.5 0 0 0 18.5 4H17V2h-2v2H9V2H7Zm11.5 6H5.5V6.5h13V8Zm0 2v8.5h-13V10h13Z"/></svg>',
  location: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2a7 7 0 0 0-7 7c0 4.4 5.4 10.5 6.3 11.5a1 1 0 0 0 1.5 0C13.6 19.5 19 13.4 19 9a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>',
};

function metaItem(kind, text) {
  const span = document.createElement('span');
  span.className = `event-meta-item event-meta-${kind}`;
  const icon = document.createElement('span');
  icon.className = 'event-meta-icon';
  icon.innerHTML = ICONS[kind];
  const label = document.createElement('span');
  label.textContent = text;
  span.append(icon, label);
  return span;
}

function buildCard(row) {
  const card = document.createElement('div');
  card.className = 'card';

  const inner = document.createElement('div');
  inner.className = 'card-inner';
  card.append(inner);

  if (row.image) {
    const picWrap = document.createElement('div');
    picWrap.className = 'card-picture-container';
    picWrap.append(createPicture({ src: row.image, alt: row.title || '' }));
    inner.append(picWrap);
  }

  const content = document.createElement('div');
  content.className = 'card-content-container';

  if (row.title) {
    const h = document.createElement('h3');
    h.textContent = row.title;
    content.append(h);
  }

  if (row.description) {
    const p = document.createElement('p');
    p.className = 'event-desc';
    p.textContent = row.description;
    content.append(p);
  }

  // meta row: date + location with icons
  if (row.date || row.location) {
    const meta = document.createElement('p');
    meta.className = 'event-meta';
    if (row.date) meta.append(metaItem('date', row.date));
    if (row.location) meta.append(metaItem('location', row.location));
    content.append(meta);
  }

  if (row.link) {
    const cta = document.createElement('p');
    cta.className = 'card-cta-container';
    const a = document.createElement('a');
    a.href = row.link;
    a.textContent = row.linktext || 'Learn more';
    cta.append(a);
    content.append(cta);
  }

  inner.append(content);

  return card;
}

/* Read active tag selections from the URL: ?tag=field:value (repeatable). */
function readTags() {
  const map = {};
  const params = new URLSearchParams(window.location.search);
  for (const v of params.getAll('tag')) {
    const [field, ...rest] = v.split(':');
    const val = rest.join(':');
    if (!field || !val) continue;
    (map[field] ||= new Set()).add(val);
  }
  return map;
}

/* Write active selections back to the URL as repeatable ?tag=field:value. */
function writeTags(map) {
  const url = new URL(window.location.href);
  url.searchParams.delete('tag');
  for (const [field, set] of Object.entries(map)) {
    for (const val of set) url.searchParams.append('tag', `${field}:${val}`);
  }
  window.history.replaceState(null, '', url);
}

/* Rows that satisfy every active facet (AND across fields, OR within a field). */
function matchTags(rows, map) {
  const fields = Object.keys(map).filter((f) => map[f].size);
  if (!fields.length) return rows;
  return rows.filter((r) => fields.every((f) => map[f].has((r[f] || '').trim())));
}

/* Build the dropdown filter bar for the given facet fields. */
function buildFilterBar(fields, rows, state, onChange) {
  const bar = document.createElement('div');
  bar.className = 'event-filter-bar';

  for (const { field, label } of fields) {
    const values = [...new Set(rows.map((r) => (r[field] || '').trim()).filter(Boolean))].sort();
    if (!values.length) continue;

    const wrap = document.createElement('label');
    wrap.className = 'event-filter-select';
    const select = document.createElement('select');
    select.dataset.field = field;

    const def = document.createElement('option');
    def.value = '';
    def.textContent = label;
    select.append(def);
    for (const v of values) {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      if (state[field]?.has(v)) opt.selected = true;
      select.append(opt);
    }

    select.addEventListener('change', () => {
      const val = select.value;
      state[field] = new Set(val ? [val] : []);
      onChange();
    });

    wrap.append(select);
    bar.append(wrap);
  }
  return bar;
}

export default async function init(el) {
  // Single-column authoring per David's Model (#10 few columns, #14 no
  // key/value pairs for author content). One value per row, read by position:
  //   Row 1 — sheet: link or path to the events .json
  //   Row 2 — filter: tab location filter (explore-all | in-person | virtual-live | virtual-on-demand)
  //   Row 3 — filters: comma-separated facet columns to expose as dropdowns
  const rowEls = [...el.querySelectorAll(':scope > div')];
  const cellText = (i) => (rowEls[i]?.textContent || '').trim();

  const link = el.querySelector('a');
  const sheet = link ? link.getAttribute('href') : cellText(0);
  if (!sheet) return;

  const filter = cellText(1).toLowerCase();
  const filterFields = cellText(2)
    ? cellText(2).split(',').map((f) => f.trim().toLowerCase()).filter(Boolean)
    : [];
  const labelFor = (f) => f.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

  el.textContent = '';


  let rows = [];
  try {
    const resp = await fetch(sheet);
    if (!resp.ok) throw new Error(resp.status);
    const json = await resp.json();
    rows = json.data || [];
  } catch (e) {
    return;
  }

  // Tab-level location filter first — facets operate within this subset.
  rows = applyFilter(rows, filter);

  const grid = document.createElement('div');
  grid.className = 'event-cards-grid';

  const render = () => {
    grid.textContent = '';
    const shown = matchTags(rows, state);
    for (const row of shown) grid.append(buildCard(row));
  };

  const state = readTags();
  // drop selections for fields we aren't showing
  if (filterFields.length) {
    for (const f of Object.keys(state)) if (!filterFields.includes(f)) delete state[f];
  }

  if (filterFields.length) {
    const fields = filterFields.map((field) => ({ field, label: labelFor(field) }));
    const bar = buildFilterBar(fields, rows, state, () => { writeTags(state); render(); });
    el.append(bar);
  }

  el.append(grid);
  render();
}
