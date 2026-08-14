/*
 * Support Top Tasks block — SAP Support Portal (POC)
 *
 * "Log into SAP for Me…" intro + a grid of quick-link task tiles (Get Support,
 * View Cases, Software Downloads, Manage Users, etc.).
 *
 * DYNAMIC NOTE: on the live site these tiles are PERSONALIZED per logged-in user
 * (fetched via personalizedtoptasks.nocache.html / bin/fiji/es/user.support).
 * Here they are MOCKED as static authored links — no per-user fetch. In
 * production this block would hydrate from the personalization endpoint.
 *
 * Authored structure:
 *   row 1: heading (intro text) + optional primary link (Access SAP for Me)
 *   remaining rows: one link each = a task tile
 */

function decorate(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  el.textContent = '';

  const inner = document.createElement('div');
  inner.className = 'support-top-tasks-inner';

  // First row = intro (heading + optional primary CTA)
  const introRow = rows.shift();
  if (introRow) {
    const intro = document.createElement('div');
    intro.className = 'support-top-tasks-intro';
    const cell = introRow.querySelector(':scope > div') || introRow;
    const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      heading.classList.add('support-top-tasks-heading');
      intro.append(heading);
    }
    const primary = cell.querySelector('a');
    if (primary) {
      primary.classList.add('support-top-tasks-primary');
      intro.append(primary);
    }
    inner.append(intro);
  }

  // Remaining rows = task tiles (one link each)
  const grid = document.createElement('div');
  grid.className = 'support-top-tasks-grid';
  rows.forEach((row) => {
    const link = row.querySelector('a');
    if (!link) return;
    link.classList.add('support-top-tasks-tile');
    grid.append(link);
  });
  if (grid.children.length) inner.append(grid);

  el.append(inner);
}

export default async function init(el) {
  decorate(el);
}
