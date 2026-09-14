(() => {
  'use strict';
  const apps = ['nestapp', 'eeg-cap-viewer', 'paper-review'];
  const names = { nestapp: 'NESTApp page visits', 'eeg-cap-viewer': 'EEG Cap Viewer', 'paper-review': 'Paper Review', all: 'all tools' };
  const form = document.getElementById('reset-form');
  const select = document.getElementById('app');
  const tokenInput = document.getElementById('admin-token');
  const resetButton = document.getElementById('reset');
  const refreshButton = document.getElementById('refresh');
  const status = document.getElementById('status');
  const outputs = Array.from(document.querySelectorAll('[data-app]'));
  let endpoint;
  let busy = false;

  function message(text, error = false) {
    status.textContent = text;
    status.dataset.state = error ? 'error' : 'ready';
  }
  function setBusy(value) {
    busy = value;
    for (const control of [select, tokenInput, resetButton, refreshButton]) control.disabled = value;
    form.setAttribute('aria-busy', String(value));
  }
  function showCounts(data) {
    if (!data || !data.counts || !apps.every(app => Number.isSafeInteger(data.counts[app]) && data.counts[app] >= 0)) {
      throw new Error('The counter service returned an unexpected response.');
    }
    const format = new Intl.NumberFormat();
    for (const output of outputs) output.textContent = format.format(data.counts[output.dataset.app]);
  }
  async function request(path, options = {}) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10000);
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
        if (response.status === 401 || response.status === 403) throw new Error('Access was refused. Check your administrator key and the allowed website origin.');
        if (response.status === 429) throw new Error('Too many requests. Please wait before trying again.');
        throw new Error('The counter service is unavailable. Please try again later.');
      }
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('The request timed out. Refresh the counts before trying a reset again.');
      if (error instanceof TypeError) throw new Error('Could not reach the counter service. Check the connection and service configuration.');
      throw error;
    } finally {
      window.clearTimeout(timer);
    }
  }
  async function refresh() {
    if (busy) return;
    setBusy(true);
    message('Loading counts…');
    try {
      showCounts(await request('/counts'));
      message('Counts are up to date.');
    } catch (error) {
      for (const output of outputs) output.textContent = '—';
      message(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  try {
    const config = window.TOOL_COUNTER_CONFIG;
    if (!config || !config.endpoint) throw new Error('The counter is not connected yet. Configure the counter service before using owner controls.');
    const service = new URL(config.endpoint);
    const origin = new URL(config.siteOrigin);
    if (service.protocol !== 'https:' || service.pathname !== '/' || service.username || service.password || service.search || service.hash ||
        origin.protocol !== 'https:' || origin.pathname !== '/' || origin.username || origin.password || origin.search || origin.hash ||
        window.location.origin !== origin.origin) throw new Error('Owner controls are available only on the configured website with an HTTPS counter service.');
    endpoint = service.origin;
  } catch (error) {
    message(error.message || 'The counter configuration is invalid.', true);
    return;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const app = select.value;
    if (!Object.hasOwn(names, app)) return;
    let token = tokenInput.value.trim();
    if (token.length < 32 || /\s/.test(token)) {
      message('Enter the administrator key configured on your counter service.', true);
      tokenInput.focus();
      return;
    }
    if (!window.confirm(`Reset ${names[app]} to zero? This cannot be undone.`)) return;
    tokenInput.value = '';
    setBusy(true);
    message('Resetting counter…');
    try {
      const pending = request('/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ app })
      });
      token = '';
      showCounts(await pending);
      message(`${app === 'all' ? 'All counters have' : names[app] + ' has'} been reset.`);
    } catch (error) {
      message(error.message, true);
    } finally {
      token = '';
      tokenInput.value = '';
      setBusy(false);
    }
  });
  refreshButton.addEventListener('click', () => { void refresh(); });
  setBusy(false);
  void refresh();
})();
