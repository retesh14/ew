/* eslint-disable */
/**
 * Roll out a VEP connect-event page from the base template by filling in one
 * event's details. Demonstrates the "copy template → fill placeholders" flow:
 * the SAME structure + section-metadata + Template: connect-event as the base
 * template, with this event's copy, dates, agenda and sponsors.
 *
 * Content (page + per-event agenda fragment) is written under content/vep and
 * content/vep-fragment; all imagery reuses the shared /vep-media assets.
 *
 * Run: node tools/importer/build-vep-event.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../content');

// --- Event definition (the only thing an author/agent changes per event) ----
const event = {
  slug: 'us-2026-sap-connect-days-data-it-chicago',
  title: 'SAP Connect Day for AI & Data Leaders',
  subtitle: 'From vision to reality with the SAP Business AI Platform',
  dateVenue: 'October 14–15, 2026 | Marriott Marquis Chicago, 2121 S Prairie Ave, Chicago, IL',
  registrationUrl: 'https://events.sap.com/us-2026-sap-connect-days-data-it-chicago/en_us/registration.html',
  day1: 'Wednesday, October 14, 2026',
  day2: 'Thursday, October 15, 2026',
  intro: {
    heading: 'Join us in Chicago and help your business to think, adapt, and act like never before',
    lead: 'This is the beginning of better.',
    body: 'Spend the day with SAP experts, ecosystem partners, and peers to see how the SAP Business AI Platform turns an AI-ready data foundation into real outcomes — and how to prepare your organization for the Autonomous Enterprise.',
    bullets: [
      'Keynotes that challenge your assumptions and look ahead',
      'Two customer-led tracks: Data and Context for AI / Build and Govern Agentic AI',
      'Live AI demonstrations of purpose-built use cases',
      'Peer-to-peer conversations on what’s working and what’s next',
      'Networking with SAP, ecosystem partners, and peer customers',
    ],
    close: 'Speak with SAP to learn more and secure your spot today!',
  },
  sponsors: {
    platinum: [{ src: '/vep-media/google-cloud.png', alt: 'Google Cloud' }],
    gold: [
      { src: '/vep-media/applexus-logo-2025-1-1-1.png', alt: 'Applexus' },
      { src: '/vep-media/vasss-logo-2.png', alt: 'Vass' },
      { src: '/vep-media/sierra-digital.png', alt: 'Sierra Digital' },
      { src: '/vep-media/incture-logo.png', alt: 'Incture' },
    ],
    silver: [
      { src: '/vep-media/collibra-logo.png', alt: 'Collibra' },
      { src: '/vep-media/tricentis-logo-freelogovectors-net.png', alt: 'Tricentis' },
      { src: '/vep-media/ot-opentext-logo-color-2x.png', alt: 'Opentext' },
    ],
  },
};

// --- Agenda fragment (per event — sessions differ) --------------------------
// advanced-tabs: the block holds the tab-label <ul>; each following section is
// a tab panel. Session rows become the accordion via the connect-event template.
const agenda = `<div><div class="section-metadata"><div><div>style</div><div>light, container</div></div><div><div>spacing</div><div>xxl</div></div></div><h2>Agenda</h2><div class="advanced-tabs"><div><div><ul><li>Data and Context for AI</li><li>Build and Govern Agentic AI</li></ul></div></div></div></div>
<div><p><strong>Day 1 Agenda</strong></p><h3>8:30 a.m.–9:30 a.m. | Breakfast and Registration</h3><h3>9:30 a.m.–9:45 a.m. | Welcome and SAP Keynote</h3><h3>9:45 a.m.–10:30 a.m. | Keynote: Powering AI to Move Your Business Forward</h3><h3>10:30 a.m.–11:00 a.m. | Break</h3><h3>11:00 a.m.–12:15 p.m. | Customer-Led Sessions</h3><h3>12:30 p.m.–1:30 p.m. | Lunch and Networking</h3><h3>1:30 p.m.–3:00 p.m. | Customer-Led Sessions</h3><h3>3:15 p.m.–4:00 p.m. | Afternoon Keynote: SAP and Google Cloud</h3><h3>4:30 p.m.–6:00 p.m. | Networking Reception</h3></div>
<div><p><strong>Day 1 Agenda</strong></p><h3>8:30 a.m.–9:30 a.m. | Breakfast and Registration</h3><h3>9:30 a.m.–9:45 a.m. | Welcome and SAP Keynote</h3><h3>9:45 a.m.–10:30 a.m. | Keynote: Building the Autonomous Enterprise</h3><h3>10:30 a.m.–11:00 a.m. | Break</h3><h3>11:00 a.m.–12:15 p.m. | Customer-Led Sessions</h3><h3>12:30 p.m.–1:30 p.m. | Lunch and Networking</h3><h3>1:30 p.m.–3:00 p.m. | Customer-Led Sessions</h3><h3>3:15 p.m.–4:00 p.m. | Afternoon Keynote: SAP and Google Cloud</h3><h3>4:30 p.m.–6:00 p.m. | Networking Reception</h3></div>`;

// --- Build the event page (same shape as the connect-event template) --------
const li = event.intro.bullets.map((b) => `<li>${b}</li>`).join('');
const logoRow = (logos) => `<div class="columns sponsors-logos"><div>${logos.map((l) => `<div><picture><img src="${l.src}" alt="${l.alt}"></picture></div>`).join('')}</div></div>`;

const page = `<div><div class="hero promo"><div><div><picture><img src="/vep-media/lp-banner-connect-day.png" alt="${event.title}"></picture></div></div><div><div><p>${event.dateVenue}</p><h1>${event.title}</h1><p>${event.subtitle}</p></div></div></div></div>
<div><div class="section-metadata"><div><div>style</div><div>light, container</div></div><div><div>gap</div><div>xl</div></div><div><div>spacing</div><div>xxl</div></div></div><h2>${event.intro.heading}</h2><div class="columns"><div><div><p>${event.intro.lead}<br> <br> ${event.intro.body}<br> <br> This program will include:</p><ul>${li}</ul><p>${event.intro.close}</p></div><div><picture><img src="/vep-media/lady-in-blue-blouse.png" alt="Attendee"></picture></div></div></div></div>
<div><p><a href="/vep-fragment/${event.slug}-agenda">/vep-fragment/${event.slug}-agenda</a></p></div>
<div><div class="section-metadata"><div><div>style</div><div>light, center, container</div></div><div><div>grid</div><div>2</div></div><div><div>gap</div><div>l</div></div><div><div>spacing</div><div>xxl</div></div></div><h2>Registration</h2><div class="card"><div><div><p><picture><img src="/vep-media/sap-calendar-icon-template-2024-2.png" alt="Calendar pictogram"></picture></p><h3>Day 1</h3><p>${event.day1}</p><p><a href="${event.registrationUrl}">Register now</a></p></div></div></div><div class="card"><div><div><p><picture><img src="/vep-media/sap-calendar-icon-template-2024-03.png" alt="Calendar pictogram"></picture></p><h3>Day 2</h3><p>${event.day2}</p><p>Note: Registration for Day 2 is only available to attendees who registered for Day 1.</p></div></div></div></div>
<div><div class="section-metadata"><div><div>style</div><div>light, center, container</div></div><div><div>gap</div><div>l</div></div><div><div>spacing</div><div>xxl</div></div></div><h2>In partnership with:</h2><h3>Platinum</h3>${logoRow(event.sponsors.platinum)}<h3>Gold</h3>${logoRow(event.sponsors.gold)}<h3>Silver</h3>${logoRow(event.sponsors.silver)}</div>
<div><div class="metadata"><div><div>Title</div><div>${event.title} — Chicago</div></div><div><div>Description</div><div>${event.title}, ${event.dateVenue.split('|')[0].trim()}, Chicago.</div></div><div><div>Template</div><div>connect-event</div></div></div></div>`;

// Per-event header — same minimal chrome as the shared VEP header, but the
// Register CTA points at THIS event's registration page. The header block
// loads /vep-fragment/<slug>-header for pages under /vep/<slug>.
const header = `<div><p><a href="https://www.sap.com/index.html"><img src="/vep-media/sap-logo.svg" alt="SAP"></a></p></div>
<div></div>
<div>
  <p><a href="${event.registrationUrl}"><strong>Register now</strong></a></p>
</div>`;

fs.writeFileSync(path.join(ROOT, `vep/${event.slug}.plain.html`), page + '\n');
fs.writeFileSync(path.join(ROOT, `vep-fragment/${event.slug}-agenda.plain.html`), agenda + '\n');
fs.writeFileSync(path.join(ROOT, `vep-fragment/${event.slug}-header.plain.html`), header + '\n');

console.log(`✅ Wrote content/vep/${event.slug}.plain.html`);
console.log(`✅ Wrote content/vep-fragment/${event.slug}-agenda.plain.html`);
console.log(`✅ Wrote content/vep-fragment/${event.slug}-header.plain.html`);
