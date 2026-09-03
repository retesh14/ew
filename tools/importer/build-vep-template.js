/* eslint-disable */
/**
 * Generates VEP authoring scaffolds from the verified imported event page:
 *   1. content/vep-templates/connect-event.plain.html
 *        — the blank reusable "connect event" template: same block structure,
 *          real event copy replaced with [PLACEHOLDER] prompts. The Day 2
 *          "registration requires Day 1" note is inlined in the Day 2 card
 *          (matching the live event page), so there is no fragment to resolve.
 *   2. content/vep-fragment/{header,footer}.plain.html
 *        — VEP's own copy of the site chrome. Pages under /vep load these via
 *          the connect-event template's path-based chrome (header/footer blocks),
 *          so the team can customize them without touching other pages.
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
const template = `<div><div class="hero promo"><div><div><p>[Add hero image — a wide event banner/photo]</p></div></div><div><div><p>[Month D–D, YYYY | Venue, Street, City, ST]</p><h1>[Event title]</h1><p>[One-line event subtitle / theme]</p></div></div></div></div>
<div><div class="section-metadata"><div><div>style</div><div>light, container</div></div><div><div>gap</div><div>xl</div></div><div><div>spacing</div><div>xxl</div></div></div><h2>[Intro heading — what the event is about]</h2><div class="columns"><div><div><p>[Intro paragraph. Describe who should attend and what they will get.]</p><p>This program will include:</p><ul><li>[Program highlight 1]</li><li>[Program highlight 2]</li><li>[Program highlight 3]</li></ul><p>[Closing call-to-action sentence.]</p></div><div><p>[Add intro image — a supporting photo/graphic]</p></div></div></div></div>
<div><h2>Agenda</h2><p>[Agenda goes here. Create a fragment at /vep-fragment/&lt;event-slug&gt;-agenda holding an advanced-tabs block with the day/track sessions, then replace this line with a link to it: /vep-fragment/&lt;event-slug&gt;-agenda]</p></div>
<div><div class="section-metadata"><div><div>style</div><div>light, center, container</div></div><div><div>grid</div><div>2</div></div><div><div>gap</div><div>l</div></div><div><div>spacing</div><div>xxl</div></div></div><h2>Registration</h2><div class="card"><div><div><p>[Add calendar image for Day 1]</p><h3>Day 1</h3><p>[Weekday, Month D, YYYY]</p><p><a href="[registration-url]">Register now</a></p></div></div></div><div class="card"><div><div><p>[Add calendar image for Day 2]</p><h3>Day 2</h3><p>[Weekday, Month D, YYYY]</p><p>Note: Registration for Day 2 is only available to attendees who registered for Day 1.</p></div></div></div></div>
<div><div class="section-metadata"><div><div>style</div><div>light, center, container</div></div><div><div>gap</div><div>l</div></div><div><div>spacing</div><div>xxl</div></div></div><h2>In partnership with:</h2><h3>Platinum</h3><div class="columns sponsors-logos"><div><div><p>[Add Platinum sponsor logo(s)]</p></div></div></div><h3>Gold</h3><div class="columns sponsors-logos"><div><div><p>[Add Gold sponsor logos]</p></div></div></div><h3>Silver</h3><div class="columns sponsors-logos"><div><div><p>[Add Silver sponsor logos]</p></div></div></div></div>
<div><div class="metadata"><div><div>Title</div><div>[Event title]</div></div><div><div>Description</div><div>[SEO description — event, date, city.]</div></div><div><div>Template</div><div>connect-event</div></div></div></div>`;

fs.mkdirSync(path.join(ROOT, 'vep-templates'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'vep-fragment'), { recursive: true });

fs.writeFileSync(path.join(ROOT, 'vep-templates', 'connect-event.plain.html'), template + '\n');

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
