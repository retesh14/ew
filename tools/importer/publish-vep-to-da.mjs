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

// Auto-discover every VEP document across the three content folders, so newly
// rolled-out events (and their agenda fragments) publish without editing a list.
const pages = ['vep', 'vep-templates', 'vep-fragment'].flatMap((dir) => {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs)
    .filter((f) => f.endsWith('.plain.html'))
    .map((f) => ({
      file: `${dir}/${f}`,
      daPath: `${dir}/${f.replace(/\.plain\.html$/, '')}`,
    }));
});

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

const CONTENT_TYPES = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif',
};
const mediaDir = path.join(ROOT, 'vep-media');
for (const name of fs.readdirSync(mediaDir).sort()) {
  const buf = fs.readFileSync(path.join(mediaDir, name));
  const type = CONTENT_TYPES[path.extname(name).toLowerCase()] || 'application/octet-stream';
  const r = await postImage(`vep-media/${name}`, buf, type);
  results.push([`media ${name}`, r.status, r.ok ? 'OK' : r.text.slice(0, 200)]);
}

console.log(JSON.stringify(results, null, 2));
const fails = results.filter((r) => r[2] !== 'OK');
console.log(`\n${results.length - fails.length}/${results.length} uploaded. Failures: ${fails.length}`);
if (fails.length) process.exitCode = 1;
