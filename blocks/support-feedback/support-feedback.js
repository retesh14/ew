/*
 * Support Feedback block — "How is your experience with this page?" (POC)
 *
 * Like / Dislike bar.
 *
 * DYNAMIC NOTE: on the live site this PUSHES to SAP (bin/support/content-feedback)
 * and a Qualtrics intercept survey may fire. Here the push is MOCKED — clicking
 * records the choice client-side and shows a thank-you, with NO network POST.
 * To go live, replace recordFeedback() with a POST to the feedback endpoint
 * (ideally via a same-origin proxy so no third-party key sits in the browser).
 *
 * Authored config rows (optional): heading, thanks.
 */

const DEFAULTS = {
  heading: 'How is your experience with this page?',
  thanks: 'Thanks for your feedback!',
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
      if (key) config[key] = cells[1].textContent.trim();
    }
  });
  return config;
}

// MOCK push. Live: POST { page, rating } to the feedback endpoint / proxy.
function recordFeedback(rating) {
  try {
    sessionStorage.setItem('support-feedback', JSON.stringify({ page: window.location.pathname, rating }));
  } catch {
    // no-op — sessionStorage may be unavailable
  }
}

export default async function init(el) {
  const config = { ...DEFAULTS, ...readConfig(el) };
  el.textContent = '';

  // A prompt, not a document section — use a <p> (styled as a heading) to avoid
  // introducing a non-sequential heading level on the page (Lighthouse a11y).
  const heading = h('p', { class: 'support-feedback-heading', text: config.heading });
  const actions = h('div', { class: 'support-feedback-actions' });

  const done = () => {
    actions.textContent = '';
    actions.append(h('p', { class: 'support-feedback-thanks', role: 'status', text: config.thanks }));
  };

  const like = h('button', { class: 'support-feedback-btn', type: 'button', 'aria-label': 'Like' }, h('span', { 'aria-hidden': 'true', text: '👍' }), h('span', { text: 'Yes' }));
  const dislike = h('button', { class: 'support-feedback-btn', type: 'button', 'aria-label': 'Dislike' }, h('span', { 'aria-hidden': 'true', text: '👎' }), h('span', { text: 'No' }));
  like.addEventListener('click', () => {
    recordFeedback('like');
    done();
  });
  dislike.addEventListener('click', () => {
    recordFeedback('dislike');
    done();
  });

  actions.append(like, dislike);
  el.append(h('div', { class: 'support-feedback-inner' }, heading, actions));
}
