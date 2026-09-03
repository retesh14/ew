/* eslint-disable */
/**
 * Generates VEP authoring scaffolds from the verified imported event page:
 *   1. content/vep-templates/connect-event.plain.html
 *        — the blank reusable "connect event" template: same block structure,
 *          real event copy replaced with [PLACEHOLDER] prompts.
 *   2. content/vep-fragment/registration-note.plain.html
 *        — the shared "Day 2 requires Day 1" registration note, so recurring
 *          boilerplate is edited once and referenced by every event.
 *   3. content/vep-fragment/{header,footer}.plain.html
 *        — VEP's own copy of the site chrome, copied from the repo's nav
 *          fragments. Pages point Header:/Footer: metadata at these so the
 *          standard header/footer blocks load the VEP copies (which the team
 *          can customize without touching other pages).
 *
 * Run: node tools/importer/build-vep-template.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../content');

// ---------------------------------------------------------------------------
// 1. Blank connect-event template
// ---------------------------------------------------------------------------
// Hand-shaped block tables mirroring the finished Houston event, with real copy
// swapped for [PLACEHOLDER] prompts. IMPORTANT: this template carries the SAME
// section-metadata as the live event page, so a page rolled out from it renders
// correctly on day one — no re-discovering the layout fixes:
//   - intro:        style "light, container" + gap/spacing (else text clips edge)
//   - registration: style "light, center, container" + grid 2 (else cards stack)
//   - partners:     style "light, center, container" + gap/spacing (centred tiers)
//   - Template: connect-event  → the light SAP theme, 72 font, navy hero, etc.
// Agenda is a per-event fragment (sessions differ); header/footer come from
// vep-fragment via the connect-event template's path-based chrome.
const template = `<div><div class="hero promo"><div><div><picture><img src="/vep-media/PLACEHOLDER-hero.png" alt="[Hero image alt]"></picture></div></div><div><div><p>[Month D–D, YYYY | Venue, Street, City, ST]</p><h1>[Event title]</h1><p>[One-line event subtitle / theme]</p></div></div></div></div>
<div><div class="section-metadata"><div><div>style</div><div>light, container</div></div><div><div>gap</div><div>xl</div></div><div><div>spacing</div><div>xxl</div></div></div><h2>[Intro heading — what the event is about]</h2><div class="columns"><div><div><p>[Intro paragraph. Describe who should attend and what they will get.]</p><p>This program will include:</p><ul><li>[Program highlight 1]</li><li>[Program highlight 2]</li><li>[Program highlight 3]</li></ul><p>[Closing call-to-action sentence.]</p></div><div><picture><img src="/vep-media/PLACEHOLDER-intro.png" alt="[Intro image alt]"></picture></div></div></div></div>
<div><p><a href="/vep-fragment/[event-slug]-agenda">/vep-fragment/[event-slug]-agenda</a></p></div>
<div><div class="section-metadata"><div><div>style</div><div>light, center, container</div></div><div><div>grid</div><div>2</div></div><div><div>gap</div><div>l</div></div><div><div>spacing</div><div>xxl</div></div></div><h2>Registration</h2><div class="card"><div><div><p><picture><img src="/vep-media/PLACEHOLDER-calendar.png" alt="Calendar"></picture></p><h3>Day 1</h3><p>[Weekday, Month D, YYYY]</p><p><a href="[registration-url]">Register now</a></p></div></div></div><div class="card"><div><div><p><picture><img src="/vep-media/PLACEHOLDER-calendar.png" alt="Calendar"></picture></p><h3>Day 2</h3><p>[Weekday, Month D, YYYY]</p></div></div></div></div>
<div><div class="fragment"><div><div><p><a href="/vep-fragment/registration-note">/vep-fragment/registration-note</a></p></div></div></div></div>
<div><div class="section-metadata"><div><div>style</div><div>light, center, container</div></div><div><div>gap</div><div>l</div></div><div><div>spacing</div><div>xxl</div></div></div><h2>In partnership with:</h2><h3>Platinum</h3><div class="columns sponsors-logos"><div><div><picture><img src="/vep-media/PLACEHOLDER-sponsor.png" alt="[Sponsor]"></picture></div></div></div><h3>Gold</h3><div class="columns sponsors-logos"><div><div><picture><img src="/vep-media/PLACEHOLDER-sponsor.png" alt="[Sponsor]"></picture></div></div></div><h3>Silver</h3><div class="columns sponsors-logos"><div><div><picture><img src="/vep-media/PLACEHOLDER-sponsor.png" alt="[Sponsor]"></picture></div></div></div></div>
<div><div class="metadata"><div><div>Title</div><div>[Event title]</div></div><div><div>Description</div><div>[SEO description — event, date, city.]</div></div><div><div>Template</div><div>connect-event</div></div></div></div>`;

// ---------------------------------------------------------------------------
// 2. Shared registration-note fragment
// ---------------------------------------------------------------------------
const fragment = `<div><p>Note: Registration for Day 2 is only available to attendees who registered for Day 1.</p></div>`;

fs.mkdirSync(path.join(ROOT, 'vep-templates'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'vep-fragment'), { recursive: true });

fs.writeFileSync(path.join(ROOT, 'vep-templates', 'connect-event.plain.html'), template + '\n');
fs.writeFileSync(path.join(ROOT, 'vep-fragment', 'registration-note.plain.html'), fragment + '\n');

// VEP header — minimal event chrome matching the source: just the SAP logo
// (brand section) and a "Register now" primary CTA (actions section), with
// empty nav sections in between. Bold link → primary button per the repo's
// markdown-emphasis button convention.
// Three sections only — the header block maps them to brand / nav / actions.
// Extra empty sections would push the CTA out of the actions slot.
const headerFragment = `<div><p><a href="https://www.sap.com/index.html"><img src="/vep-media/sap-logo.svg" alt="SAP"></a></p></div>
<div></div>
<div>
  <p><a href="[registration-url]"><strong>Register now</strong></a></p>
</div>`;

// VEP footer — the source event page uses the standard sap.com footer, so copy
// the repo's nav footer as the editable VEP starting point.
const chrome = [
  { content: headerFragment, dst: 'vep-fragment/header.plain.html' },
  { src: 'fragments/nav/footer.plain.html', dst: 'vep-fragment/footer.plain.html' },
];
for (const { src, content, dst } of chrome) {
  const dstPath = path.join(ROOT, dst);
  if (fs.existsSync(dstPath)) {
    console.log(`↷ content/${dst} exists — left as-is (customizable)`);
    continue;
  }
  if (content) {
    fs.writeFileSync(dstPath, content + '\n');
    console.log(`✅ Wrote content/${dst} (minimal event header)`);
  } else if (src && fs.existsSync(path.join(ROOT, src))) {
    fs.copyFileSync(path.join(ROOT, src), dstPath);
    console.log(`✅ Wrote content/${dst} (copied from ${src})`);
  }
}

console.log('✅ Wrote content/vep-templates/connect-event.plain.html');
console.log('✅ Wrote content/vep-fragment/registration-note.plain.html');
