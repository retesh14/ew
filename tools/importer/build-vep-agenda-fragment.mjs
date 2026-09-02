/* eslint-disable */
/**
 * Fix the advanced-tabs "swallows the whole page" bug by isolating the agenda
 * (tabs block + its two day-track panels) inside a fragment, exactly as the
 * repo's own finder page does with /fragments/events/finder-tabs.
 *
 * - Reads the imported event page, splits it into top-level sections.
 * - Sections 3,4,5 (Agenda heading+tabs, Track-1 panel, Track-2 panel) become
 *   the agenda fragment at content/vep-fragment/agenda.plain.html.
 * - In the event page, those three sections are replaced by ONE section holding
 *   a fragment link to /vep-fragment/agenda.
 *
 * Run: node tools/importer/build-vep-agenda-fragment.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../content');
const PAGE = path.join(ROOT, 'vep/us-2026-sap-connect-days-data-it-houston.plain.html');

// Split into top-level <div>…</div> sections (each is an EDS section).
function splitSections(html) {
  const sections = [];
  let depth = 0;
  let start = -1;
  const re = /<(\/?)div\b[^>]*>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const closing = m[1] === '/';
    if (!closing) {
      if (depth === 0) start = m.index;
      depth += 1;
    } else {
      depth -= 1;
      if (depth === 0) sections.push(html.slice(start, re.lastIndex));
    }
  }
  return sections;
}

const raw = fs.readFileSync(PAGE, 'utf8').trim();
const sections = splitSections(raw);
// Expected order: 0 hero, 1 intro, 2 agenda(tabs), 3 track1 panel, 4 track2 panel,
// 5 registration, 6 partners, 7 metadata.
if (sections.length < 8) {
  console.error(`Expected >=8 sections, got ${sections.length}. Aborting.`);
  process.exit(1);
}

// Agenda fragment = the tabs section + the two panel sections.
const agendaSections = sections.slice(2, 5);
const agendaFragment = agendaSections.join('\n') + '\n';
fs.mkdirSync(path.join(ROOT, 'vep-fragment'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'vep-fragment/agenda.plain.html'), agendaFragment);

// Event page: hero, intro, [agenda fragment link], registration, partners, metadata.
const agendaRef = '<div><p><a href="/vep-fragment/agenda">/vep-fragment/agenda</a></p></div>';
const rebuilt = [
  sections[0], // hero
  sections[1], // intro
  agendaRef,   // agenda fragment reference (isolates advanced-tabs)
  ...sections.slice(5), // registration, partners, metadata
].join('\n') + '\n';
fs.writeFileSync(PAGE, rebuilt);

console.log('✅ Wrote content/vep-fragment/agenda.plain.html (tabs + 2 panels)');
console.log('✅ Rewrote event page to reference /vep-fragment/agenda');
console.log(`   event page sections: ${splitSections(rebuilt).length}`);
