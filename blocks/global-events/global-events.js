/*
 * global-events — an intro column that adopts the NEXT section (a card grid)
 * and lays them side by side so the intro can stay sticky while the cards
 * scroll. Follows the advanced-tabs pattern of reaching into sibling sections,
 * but only ever consumes the single next section (no counting required).
 *
 * Authoring (two consecutive sections):
 *   Section 1:  | Global Events |
 *               | ## Title      |
 *               | intro text…   |
 *               | - [Link](/…)  |
 *   Section 2:  a normal grid of `card` blocks + section-metadata (grid 2, …)
 *
 * If there is no following section, the intro renders on its own — no error.
 */
export default function init(el) {
  // Parent that holds all sibling sections (main, or a fragment).
  const parent = el.closest('.fragment-content, main');
  // Hide while we rewire — the next section may still be hydrating.
  if (parent) parent.style = 'display: none;';

  const section = el.closest('.section');

  // The single next sibling section holds the cards.
  let cardsSection = section?.nextElementSibling;
  while (cardsSection && !cardsSection.classList.contains('section')) {
    cardsSection = cardsSection.nextElementSibling;
  }

  // Intro column = this block's authored content.
  const intro = document.createElement('div');
  intro.className = 'global-events-intro';
  const content = el.querySelector(':scope > div > div') || el.querySelector(':scope > div');
  if (content) intro.append(...content.childNodes);
  const links = intro.querySelector('ul');
  if (links) links.classList.add('global-events-links');

  const layout = document.createElement('div');
  layout.className = 'global-events-layout';
  layout.append(intro);

  // Adopt the whole next section (kept intact so its card blocks +
  // section-metadata grid still load via the normal loadArea loop).
  if (cardsSection) {
    cardsSection.classList.add('global-events-cards');
    layout.append(cardsSection);
  }

  el.textContent = '';
  el.append(layout);

  if (parent) parent.removeAttribute('style');
}
