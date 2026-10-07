/* eslint-disable no-console */
/**
 * Assign market image variants after an Experience Workspace rollout.
 *
 * For every page under /vep-global/<lang>/<market>/, swap images listed in the
 * mapping sheet /vep-global/asset-variants (columns: source | en/us | en/gb | …)
 * for that market's variant, write the page back to DA, and preview it.
 * Images with no variant for the market stay global and are reported.
 * Pages whose metadata has `rollout | off` are skipped. Safe to re-run: once a
 * page holds the variant there is nothing left to swap.
 *
 * Run: node tools/rollout/assign-variants.mjs [--dry-run] [--market en/gb]
 * Credentials for admin.da.live / admin.hlx.page are injected by the environment.
 */
const ORG = 'retesh14';
const SITE = 'ew';
const ROOT = '/vep-global';
const DA = 'https://admin.da.live';
const PREVIEW = `https://admin.hlx.page/preview/${ORG}/${SITE}/main`;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const onlyMarket = args.includes('--market') ? args[args.indexOf('--market') + 1] : null;

// Dynamic Media OpenAPI URLs are keyed by asset ID; anything else by URL sans query.
const keyOf = (url) => url.match(/\/adobe\/assets\/([^/]+)\//)?.[1] ?? url.split('?')[0];

async function da(path, init) {
  const res = await fetch(`${DA}${path}`, init);
  if (!res.ok) throw new Error(`${init?.method || 'GET'} ${path} → ${res.status}`);
  return res;
}

async function listPages(folder) {
  const entries = await (await da(`/list/${ORG}/${SITE}${folder}`)).json();
  const pages = [];
  for (const entry of entries) {
    const path = entry.path.replace(`/${ORG}/${SITE}`, '');
    if (!entry.ext) pages.push(...await listPages(path)); // eslint-disable-line no-await-in-loop
    else if (entry.ext === 'html') pages.push(path);
  }
  return pages;
}

function swapImages(html, variants, globalLeft) {
  let swapped = 0;
  const out = html.replace(/\b(src|srcset)="([^"]+)"/g, (attr, name, value) => {
    const next = value.split(',').map((part) => {
      const [url, ...descriptor] = part.trim().split(/\s+/);
      const variant = variants.get(keyOf(url));
      if (variant === undefined) return part;
      if (!variant) {
        globalLeft.add(url);
        return part;
      }
      swapped += 1;
      return [variant, ...descriptor].join(' ');
    }).join(', ');
    return `${name}="${next}"`;
  });
  return { out, swapped };
}

const sheet = await (await da(`/source/${ORG}/${SITE}${ROOT}/asset-variants.json`)).json();
const rows = sheet.data || [];
const markets = Object.keys(rows[0] || {}).filter((col) => col !== 'source')
  .filter((m) => !onlyMarket || m === onlyMarket);

for (const market of markets) {
  const variants = new Map(rows.map((row) => [keyOf(row.source), (row[market] || '').trim()]));
  // Markets that haven't been rolled out yet have no folder: nothing to do.
  const pages = await listPages(`${ROOT}/${market}`).catch(() => []); // eslint-disable-line no-await-in-loop
  console.log(`\n${market}: ${pages.length} page(s)`);

  for (const page of pages) {
    const html = await (await da(`/source/${ORG}/${SITE}${page}`)).text(); // eslint-disable-line no-await-in-loop
    if (/<div><p>rollout<\/p><\/div>\s*<div><p>off<\/p><\/div>/i.test(html)) {
      console.log(`  skip     ${page} (rollout: off)`);
      continue; // eslint-disable-line no-continue
    }
    const globalLeft = new Set();
    const { out, swapped } = swapImages(html, variants, globalLeft);
    const left = globalLeft.size ? `, ${globalLeft.size} without a variant (left global)` : '';
    if (!swapped) {
      console.log(`  ok       ${page} (nothing to swap${left})`);
      continue; // eslint-disable-line no-continue
    }
    if (!dryRun) {
      const body = new FormData();
      body.append('data', new Blob([out], { type: 'text/html' }), 'page.html');
      await da(`/source/${ORG}/${SITE}${page}`, { method: 'POST', body }); // eslint-disable-line no-await-in-loop
      await fetch(`${PREVIEW}${page.replace(/\.html$/, '')}`, { method: 'POST' }); // eslint-disable-line no-await-in-loop
    }
    console.log(`  ${dryRun ? 'would set' : 'set'}  ${page}: ${swapped} image reference(s) → variant${left}`);
  }
}
