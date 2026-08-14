/*
 * Support News block — SAP Support Portal "Spotlight news" (POC)
 *
 * Renders a list of news articles (title, date, summary, link) beside a small
 * "Resources" link list.
 *
 * DYNAMIC NOTE: on the live site this is fed dynamically (newsfeed_copy.nocache
 * .html pulls the feed from AEM). Here it can render EITHER authored rows OR be
 * pointed at a same-origin data endpoint via the 'feed' config (a sheet), which
 * is the mock stand-in for the real feed — no external call.
 *
 * Authored structure:
 *   optional config rows: heading, feed (endpoint), resourcesheading
 *   article rows: each = heading (title, wraps a link) + date + summary
 *   a trailing row whose cells are links → the Resources list
 */

const DEFAULTS = {
  heading: 'Spotlight news',
  feed: '',
  resourcesheading: 'Resources',
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

function articleEl(item) {
  return h(
    'article',
    { class: 'support-news-item' },
    h('h3', { class: 'support-news-title' }, h('a', { href: item.href || '#', text: item.title })),
    item.date ? h('time', { class: 'support-news-date', text: item.date }) : null,
    item.summary ? h('p', { class: 'support-news-summary', text: item.summary }) : null,
  );
}

/** Fetch mock feed from a same-origin sheet endpoint; tolerate failure. */
async function loadFeed(endpoint) {
  try {
    const resp = await fetch(endpoint, { headers: { accept: 'application/json' } });
    if (!resp.ok) return null;
    const json = await resp.json();
    const raw = Array.isArray(json.data) ? json.data : json.items;
    if (!Array.isArray(raw)) return null;
    return raw.map((r) => ({
      title: r.title, date: r.date, summary: r.summary, href: r.href,
    }));
  } catch {
    return null;
  }
}

export default async function init(el) {
  const config = { ...DEFAULTS };
  const authored = [];
  const resourceLinks = [];

  // Parse authored rows.
  const rows = [...el.querySelectorAll(':scope > div')];
  rows.forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    const key = cells[0]?.textContent.trim().toLowerCase();
    if (cells.length >= 2 && ['heading', 'feed', 'resourcesheading'].includes(key)) {
      config[key] = cells[1].textContent.trim();
      return;
    }
    const cell = cells[0] || row;
    const links = [...cell.querySelectorAll('a')];
    const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading && links.length) {
      // article row: title link + date + summary paragraphs
      const paras = [...cell.querySelectorAll('p')].map((p) => p.textContent.trim()).filter(Boolean);
      authored.push({
        title: heading.textContent.trim(),
        href: links[0].getAttribute('href'),
        date: paras[0] || '',
        summary: paras[1] || paras[0] || '',
      });
    } else if (links.length > 1) {
      // resources row: a list of links
      links.forEach((a) => resourceLinks.push({ text: a.textContent.trim(), href: a.getAttribute('href') }));
    }
  });

  el.textContent = '';

  const feed = h('div', { class: 'support-news-feed' });
  feed.append(h('h2', { class: 'support-news-heading', text: config.heading }));

  let items = authored;
  if (config.feed) {
    const fetched = await loadFeed(config.feed);
    if (fetched && fetched.length) items = fetched;
  }
  items.forEach((item) => feed.append(articleEl(item)));

  const aside = h('aside', { class: 'support-news-resources' });
  if (resourceLinks.length) {
    aside.append(h('h3', { class: 'support-news-resources-heading', text: config.resourcesheading }));
    const ul = h('ul');
    resourceLinks.forEach((r) => ul.append(h('li', {}, h('a', { href: r.href, text: r.text }))));
    aside.append(ul);
  }

  el.append(h('div', { class: 'support-news-inner' }, feed, aside));
}
