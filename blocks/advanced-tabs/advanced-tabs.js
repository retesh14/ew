import { getConfig } from '../../scripts/ak.js';

const { log } = getConfig();

const slugify = (s) => s.toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/* Read the desired tab slug from ?tab= (preferred) or the #hash. */
function slugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromParam = params.get('tab');
  if (fromParam) return fromParam;
  const hash = window.location.hash.replace('#', '');
  return hash || null;
}

/* Reflect the active tab into the URL as ?tab=<slug>#<slug> without a reload. */
function writeUrl(slug) {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', slug);
  url.hash = slug;
  window.history.replaceState(null, '', url);
}

function getTabList(tabs, tabPanels) {
  const tabItems = tabs.querySelectorAll('li');
  const tabList = document.createElement('div');
  tabList.className = 'tab-list';
  tabList.role = 'tablist';

  const buttons = [];
  const slugs = [];

  const activate = (idx, updateUrl = true) => {
    buttons.forEach((b) => b.classList.remove('is-active'));
    tabPanels.forEach((sec) => sec.classList.remove('is-visible'));
    buttons[idx].classList.add('is-active');
    tabPanels[idx]?.classList.add('is-visible');
    if (updateUrl) writeUrl(slugs[idx]);
  };

  for (const [idx, tab] of tabItems.entries()) {
    const slug = slugify(tab.textContent);
    slugs.push(slug);

    const btn = document.createElement('button');
    btn.role = 'tab';
    btn.id = `tab-${slug}`;
    btn.dataset.slug = slug;
    btn.textContent = tab.textContent;
    if (tabPanels[idx]) {
      tabPanels[idx].id = `tabpanel-${slug}`;
      tabPanels[idx].setAttribute('aria-labelledby', btn.id);
    }
    tabList.append(btn);
    buttons.push(btn);

    btn.addEventListener('click', () => activate(idx));
  }

  // Initial tab: from URL if it matches a slug, else the first tab.
  const wanted = slugFromUrl();
  const startIdx = Math.max(0, slugs.indexOf(wanted));
  activate(startIdx, false);

  return tabList;
}

export default function init(el) {
  // Find the top most parent where all tab sections live
  const parent = el.closest('.fragment-content, main');

  // Forcefully hide parent because sections may not be loaded yet
  parent.style = 'display: none;';

  // Find the section that contains the actual block
  const currSection = el.closest('.section');

  // Find the tab items
  const tabs = el.querySelector('ul');
  if (!tabs) {
    log('Please add an unordered list to the advanced tabs block.');
    return;
  }

  // Filter and format all sections that do not hold the tabs block
  const tabPanels = [...parent.querySelectorAll(':scope > .section')]
    .reduce((acc, section) => {
      if (section !== currSection) {
        section.role = 'tabpanel';
        acc.push(section);
      }
      return acc;
    }, []);

  const tabList = getTabList(tabs, tabPanels);

  tabs.remove();
  el.append(tabList, ...tabPanels);
  parent.removeAttribute('style');
}
