/* eslint-disable */
/**
 * Publish the VEP content to Document Authoring (da.live).
 * - Wraps each *.plain.html (section divs) into an EDS document body.
 * - POSTs pages/fragments/template to the DA source API.
 * - Uploads /vep-media images.
 * No Authorization header — credentials are injected by the harness.
 *
 * Usage: node tools/importer/publish-vep-to-da.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../content');
const ORG = 'retesh14';
const REPO = 'ew';
const BASE = `https://admin.da.live/source/${ORG}/${REPO}`;
const ORIGIN = `https://main--${REPO}--${ORG}.aem.page`;

// DA rewrites root-relative <img src="/vep-media/..."> to about:error on save
// (it can't internalize a bare path). Point images at their live origin URL so
// DA fetches and internalizes them.
function absolutizeMedia(html) {
  return html.replace(/(src|srcset)="\/vep-media\//g, `$1="${ORIGIN}/vep-media/`);
}

const pages = [
  { file: 'vep/us-2026-sap-connect-days-data-it-houston.plain.html', daPath: 'vep/us-2026-sap-connect-days-data-it-houston' },
  { file: 'vep-templates/connect-event.plain.html', daPath: 'vep-templates/connect-event' },
  { file: 'vep-fragment/registration-note.plain.html', daPath: 'vep-fragment/registration-note' },
  { file: 'vep-fragment/agenda.plain.html', daPath: 'vep-fragment/agenda' },
  { file: 'vep-fragment/header.plain.html', daPath: 'vep-fragment/header' },
  { file: 'vep-fragment/footer.plain.html', daPath: 'vep-fragment/footer' },
];

function wrapDoc(inner) {
  return `<body>\n  <header></header>\n  <main>${inner}</main>\n  <footer></footer>\n</body>\n`;
}

async function postHtml(daPath, html) {
  const url = `${BASE}/${daPath}.html`;
  const form = new FormData();
  form.append('data', new Blob([html], { type: 'text/html' }), `${path.basename(daPath)}.html`);
  const res = await fetch(url, { method: 'POST', body: form });
  return { url, status: res.status, ok: res.ok, text: res.ok ? '' : await res.text().catch(() => '') };
}

async function postImage(daPath, buf, contentType) {
  const url = `${BASE}/${daPath}`;
  const form = new FormData();
  form.append('data', new Blob([buf], { type: contentType }), path.basename(daPath));
  const res = await fetch(url, { method: 'POST', body: form });
  return { url, status: res.status, ok: res.ok, text: res.ok ? '' : await res.text().catch(() => '') };
}

const results = [];

for (const p of pages) {
  const inner = absolutizeMedia(fs.readFileSync(path.join(ROOT, p.file), 'utf8').trim());
  const r = await postHtml(p.daPath, wrapDoc(inner));
  results.push([`page ${p.daPath}`, r.status, r.ok ? 'OK' : r.text.slice(0, 200)]);
}

const mediaDir = path.join(ROOT, 'vep-media');
for (const name of fs.readdirSync(mediaDir).sort()) {
  const buf = fs.readFileSync(path.join(mediaDir, name));
  const r = await postImage(`vep-media/${name}`, buf, 'image/png');
  results.push([`media ${name}`, r.status, r.ok ? 'OK' : r.text.slice(0, 200)]);
}

console.log(JSON.stringify(results, null, 2));
const fails = results.filter((r) => r[2] !== 'OK');
console.log(`\n${results.length - fails.length}/${results.length} uploaded. Failures: ${fails.length}`);
if (fails.length) process.exitCode = 1;
