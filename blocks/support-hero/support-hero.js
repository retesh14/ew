/*
 * Support Hero block — SAP Support Portal (POC)
 *
 * The blue "Welcome to the SAP Support Portal" panel with a search box.
 *
 * DYNAMIC NOTE: on the live site the search is a udex-search web component whose
 * suggestions/results are served by Coveo, and submitting navigates to the
 * (login-gated) SAP for Me search. Here the search is a MOCKED launcher: on
 * submit it builds the SAP for Me search URL from the typed term and opens it —
 * same pattern as our support-search block. No Coveo call, no secrets.
 *
 * Authored config rows (optional): heading, message, placeholder, cta, base, tab.
 */

const DEFAULTS = {
  heading: 'Welcome to the SAP Support Portal',
  message: 'Search for SAP Notes, SAP Knowledge Base Articles, SAP Community content, documentation and more in SAP for Me (login required).',
  placeholder: 'Enter keywords or an SAP Note / KBA number',
  cta: 'Search',
  base: 'https://me.sap.com/servicessupport/search/',
  tab: 'All',
};

function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null) {
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value);
    }
  }
  for (const child of children) if (child) node.append(child);
  return node;
}

function readConfig(el) {
  const config = {};
  el.querySelectorAll(':scope > div').forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const val = cells[1].textContent.trim();
      if (key) config[key] = val;
    }
  });
  return config;
}

export default async function init(el) {
  const config = { ...DEFAULTS, ...readConfig(el) };
  el.textContent = '';

  const inner = h(
    'div',
    { class: 'support-hero-inner' },
    // The hero title is the page's main heading -> <h1> (page SEO title + a11y).
    h('h1', { class: 'support-hero-heading', text: config.heading }),
    h('p', { class: 'support-hero-message', text: config.message }),
  );

  const input = h('input', {
    class: 'support-hero-input',
    type: 'search',
    name: 'q',
    'aria-label': config.placeholder,
    placeholder: config.placeholder,
    autocomplete: 'off',
  });
  const submit = h('button', {
    class: 'support-hero-submit',
    type: 'submit',
    'aria-label': config.cta,
  }, h('span', { text: config.cta }));

  const form = h('form', { class: 'support-hero-form', role: 'search' }, input, submit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) {
      input.focus();
      return;
    }
    const url = `${config.base}${encodeURIComponent(JSON.stringify({ q, tab: config.tab }))}`;
    window.open(url, '_blank', 'noopener');
  });

  inner.append(form);
  el.append(inner);
}
