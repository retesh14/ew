/*
 * Reference Adobe App Builder action — RainFocus -> events feed.
 *
 * PURPOSE (training reference, not production): shows backend devs the shape of an
 * I/O Runtime action that turns a RainFocus API response into the EXACT JSON feed
 * contract the EDS event-cards block consumes (see docs/rainfocus-integration.md §2).
 *
 * In production this action would:
 *   1. read the RainFocus API key from params (App Builder env / Developer Console),
 *   2. call the RainFocus events endpoint (server-to-server, with pagination),
 *   3. transform each RainFocus record -> our feed row (mapRainFocusEvent below),
 *   4. cache the result (aio-lib-state) and/or write it into DA on a cron schedule,
 *   5. return the feed JSON with correct CORS headers.
 *
 * This file mocks step 2 so it runs with no credentials — swap fetchRainFocus() for
 * a real API call when wiring it up.
 *
 * Deploy shape (App Builder):  aio app init  ->  aio app deploy
 * Invoke locally:              node index.js   (runs the __main demo at the bottom)
 */

/* eslint-disable no-console */

// --- 1. RainFocus source (MOCK) -------------------------------------------------
// Replace this with a real authenticated fetch to the RainFocus events API.
// e.g. await fetch(`${params.RAINFOCUS_BASE}/api/search`, { headers: { 'rfApiProfileId': params.RAINFOCUS_KEY }, ... })
async function fetchRainFocus(/* params */) {
  // Shape here is a *stand-in* for RainFocus's real response (field names differ in
  // reality — that's exactly why the transform in step 3 exists).
  return {
    items: [
      { name: 'WeAreDevelopers World Congress NA', startDate: '2026-09-23', endDate: '2026-09-25', city: 'San Jose', country: 'USA', mode: 'in-person', abstract: '', detailUrl: '', heroImage: '' },
      { name: 'SAP NOW Virtual', startDate: '2026-10-06', endDate: '2026-10-07', city: '', country: '', mode: 'online-live', abstract: 'Live-streamed keynotes and sessions.', detailUrl: '/events/sapnow', heroImage: '' },
      { name: 'TechEd On-Demand', startDate: '2026-10-27', endDate: '2026-10-29', city: '', country: '', mode: 'online-on-demand', abstract: 'Watch sessions anytime.', detailUrl: '/events/teched/virtual', heroImage: '' },
    ],
  };
}

// --- 2. Format helpers ----------------------------------------------------------
function formatDateRange(start, end) {
  // Produce the already-formatted display string the block renders verbatim.
  const opts = { month: 'long', day: 'numeric' };
  try {
    const s = new Date(start);
    const e = new Date(end);
    const sStr = s.toLocaleDateString('en-US', opts);
    const eStr = e.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
    return start === end ? eStr : `${sStr}–${eStr}`;
  } catch {
    return start || '';
  }
}

// Map RainFocus "mode" -> the location string the block filters on (docs §2).
function toLocation(evt) {
  switch ((evt.mode || '').toLowerCase()) {
    case 'online-live': return 'Online - Live';
    case 'online-on-demand': return 'Online - On-demand';
    default: {
      const city = [evt.city, evt.country].filter(Boolean).join(', ');
      return city || 'In person';
    }
  }
}

// --- 3. Transform: RainFocus record -> feed row (the FROZEN contract, docs §2) ---
function mapRainFocusEvent(evt) {
  return {
    title: evt.name || '',
    date: formatDateRange(evt.startDate, evt.endDate),
    location: toLocation(evt),
    description: evt.abstract || '',
    image: evt.heroImage || '',
    link: evt.detailUrl || '',
    linktext: evt.detailUrl ? 'Event details' : '',
  };
}

function toFeed(rows) {
  return { total: rows.length, offset: 0, limit: rows.length, data: rows };
}

// --- 4. Action entrypoint (App Builder invokes this) ----------------------------
async function main(params = {}) {
  try {
    // const key = params.RAINFOCUS_KEY;  // <- from App Builder env / Developer Console
    const raw = await fetchRainFocus(params);
    const rows = (raw.items || []).map(mapRainFocusEvent);
    const feed = toFeed(rows);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // CORS (option A delivery). Omit if writing into DA instead (option B).
        'Access-Control-Allow-Origin': '*',
        // Let the CDN cache the feed; pair with a cron refresh (docs §5.4).
        'Cache-Control': 'public, max-age=900',
      },
      body: feed,
    };
  } catch (e) {
    return { statusCode: 502, body: { error: 'RainFocus fetch/transform failed', detail: String(e) } };
  }
}

// App Builder expects a named `main` export.
exports.main = main;

// --- Local demo: `node index.js` prints the feed so devs can eyeball the contract.
if (require.main === module) {
  main({}).then((r) => console.log(JSON.stringify(r.body, null, 2)));
}
