/* Counts app-page openings only. Never reads manuscripts, notes, storage, or URL queries. */
(() => {
  'use strict';
  if (window.__toolCounterStarted) return;
  window.__toolCounterStarted = true;

  const apps = ['nestapp', 'eeg-cap-viewer', 'paper-review'];
  const script = document.currentScript;
  const counters = Array.from(document.querySelectorAll('[data-tool-count]'))
    .filter(node => apps.includes(node.dataset.toolCount));
  let endpoint;
  let app = null;
  let opened = false;
  let reading = false;

  function unavailable(message) {
    for (const node of counters) {
      const value = node.querySelector('[data-count-value]');
      if (value) value.textContent = '—';
      node.dataset.counterState = 'unavailable';
      node.title = message;
      node.setAttribute('aria-label', message);
    }
  }

  try {
    const config = window.TOOL_COUNTER_CONFIG;
    if (!config || !config.endpoint) {
      unavailable('Counter is not connected yet.');
      return;
    }
    const origin = new URL(config.siteOrigin);
    const service = new URL(config.endpoint);
    const source = new URL(script.src);
    const rootSuffix = '/assets/js/tool-counter.js';
    if (origin.protocol !== 'https:' || service.protocol !== 'https:' ||
        origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password ||
        service.pathname !== '/' || service.search || service.hash || service.username || service.password ||
        window.location.origin !== origin.origin || source.origin !== origin.origin ||
        !source.pathname.endsWith(rootSuffix)) throw new Error('Counter configuration is invalid.');
    endpoint = service.origin;
    const root = source.pathname.slice(0, -rootSuffix.length);
    app = apps.find(name => window.location.pathname === `${root}/tools/${name}/` ||
      window.location.pathname === `${root}/tools/${name}/index.html`) || null;
  } catch (_) {
    unavailable('Counter is unavailable on this preview or is not configured.');
    return;
  }

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(endpoint + path, {
        ...options,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
        redirect: 'error',
        signal: controller.signal
      });
      if (!response.ok) {
        const error = new Error('Counter request failed.');
        error.retryable = response.status === 429 || response.status >= 500;
        throw error;
      }
      return await response.json();
    } finally {
      window.clearTimeout(timer);
    }
  }

  function showCounts(data) {
    const counts = data && data.counts;
    if (!counts || !apps.every(name => Number.isSafeInteger(counts[name]) && counts[name] >= 0)) {
      throw new Error('Counter response is invalid.');
    }
    const numberFormat = new Intl.NumberFormat();
    for (const node of counters) {
      const name = node.dataset.toolCount;
      const value = node.querySelector('[data-count-value]');
      const formatted = numberFormat.format(counts[name]);
      if (value) value.textContent = formatted;
      node.dataset.counterState = 'ready';
      const measure = name === 'nestapp' ? 'page visits' : 'app openings';
      node.title = `${measure[0].toUpperCase() + measure.slice(1)} since the latest reset. Reloads count as new openings.`;
      node.setAttribute('aria-label', `${formatted} ${measure} since the latest reset.`);
    }
  }

  async function refresh() {
    if (!counters.length || reading) return;
    reading = true;
    try {
      showCounts(await request('/counts'));
    } catch (_) {
      unavailable('Counter is temporarily unavailable.');
    } finally {
      reading = false;
    }
  }

  function eventId() {
    if (typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  async function visit(body, attempt = 0) {
    try {
      const data = await request('/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      });
      if (counters.length) showCounts(data);
    } catch (error) {
      if (error.retryable !== false && attempt < 2) {
        window.setTimeout(() => { void visit(body, attempt + 1); }, attempt ? 4000 : 1000);
      }
    }
  }

  function visible() {
    if (document.visibilityState === 'hidden' || document.prerendering) return;
    if (app && !opened) {
      opened = true;
      try {
        // The same random request ID is reused if an interrupted request is retried.
        void visit(JSON.stringify({ app, eventId: eventId() }));
      } catch (_) { /* A disabled crypto API must not interrupt the tool. */ }
    }
    void refresh();
  }

  document.addEventListener('visibilitychange', visible);
  document.addEventListener('prerenderingchange', visible);
  window.addEventListener('pageshow', visible);
  visible();
})();
