/*
 * Support Video block — SAP Support Portal (POC)
 *
 * A lazy, click-to-load video. Shows a facade (title + play button) over a
 * reserved 16:9 area; clicking swaps in a youtube-nocookie iframe. Nothing
 * loads until click — good for Lighthouse (no third-party JS/network on load)
 * and for consent. Reserved aspect-ratio means zero layout shift.
 *
 * Authored config rows (optional): video (YouTube id), title.
 * Or a single authored YouTube link is accepted as the source.
 */

const DEFAULTS = {
  video: '',
  title: 'Watch the video',
  // Kaltura support (used by the real SAP Support page). Provide kaltura as
  // "partnerId/entryId" (e.g. "1921661/1_9f86h3l8"); uiconf is optional.
  kaltura: '',
  uiconf: '53208852',
  // Poster image shown on the facade before play (real thumbnail vs. gradient).
  poster: '',
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

function parseYouTubeId(url) {
  if (!url) return '';
  try {
    const u = new URL(url, window.location.href);
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    return u.pathname.split('/').pop();
  } catch {
    return url;
  }
}

function readConfig(el) {
  const config = {};
  el.querySelectorAll(':scope > div').forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      if (['video', 'title', 'kaltura', 'uiconf', 'poster'].includes(key)) config[key] = cells[1].textContent.trim();
    } else {
      const link = row.querySelector('a[href]');
      if (link) config.video = parseYouTubeId(link.getAttribute('href'));
    }
  });
  return config;
}

function buildEmbed(config) {
  const wrap = h('div', { class: 'support-video-embed' });
  const iframe = document.createElement('iframe');
  if (config.kaltura) {
    // Kaltura player (the real SAP Support video host): "partnerId/entryId".
    const [partnerId, entryId] = config.kaltura.split('/');
    iframe.src = `https://cdnapisec.kaltura.com/p/${encodeURIComponent(partnerId)}/embedPlaykitJs/uiconf_id/${encodeURIComponent(config.uiconf)}?iframeembed=true&entry_id=${encodeURIComponent(entryId)}&autoplay=true`;
  } else {
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(config.video)}?rel=0&autoplay=1`;
  }
  iframe.title = 'Video player';
  iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('loading', 'lazy');
  wrap.append(iframe);
  return wrap;
}

export default async function init(el) {
  const config = { ...DEFAULTS, ...readConfig(el) };
  el.textContent = '';

  const frame = h('div', { class: 'support-video-frame' });
  if (config.poster) {
    frame.classList.add('has-poster');
    frame.style.backgroundImage = `url("${config.poster}")`;
  }
  if (config.kaltura || config.video) {
    const btn = h(
      'button',
      { class: 'support-video-play-btn', type: 'button', 'aria-label': `Play: ${config.title}` },
      h('span', { class: 'support-video-play', 'aria-hidden': 'true', text: '▶' }),
      h('span', { class: 'support-video-note', text: config.title }),
    );
    btn.addEventListener('click', () => {
      frame.replaceWith(buildEmbed(config));
    });
    frame.append(btn);
  } else {
    frame.append(h('p', { class: 'support-video-note', text: 'Video unavailable' }));
  }

  el.append(frame);

  // Layout: pair the video (left) with the section's intro copy (right), like
  // the source "Get started with support" block. The intro paragraph lives in
  // the preceding default-content alongside the section heading; we keep the
  // heading in place and move only the paragraph(s) into a right-hand column.
  // Guarded so it only runs when a "Get started"-style intro is present.
  const section = el.closest('.section');
  const intro = section && section.querySelector(':scope > .default-content');
  const introParas = intro ? [...intro.querySelectorAll(':scope > p')].filter((p) => p.textContent.trim()) : [];
  if (introParas.length) {
    el.classList.add('support-video-split');
    const media = h('div', { class: 'support-video-media' });
    const copy = h('div', { class: 'support-video-copy' });
    // Move existing children (the frame) into the media column.
    [...el.childNodes].forEach((n) => media.append(n));
    introParas.forEach((p) => copy.append(p));
    el.append(media, copy);
  }
}
