export const APPEARANCE_KEY = 'parsec-paper-review:appearance:v1';
export const PALETTES = {
  teal: { day: '#176c60', night: '#95dece' },
  blue: { day: '#255bb0', night: '#9fc5ff' },
  violet: { day: '#7541a3', night: '#d2b4f3' },
  amber: { day: '#885917', night: '#e6c18b' },
};
const validColor = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
export function cleanAppearance(value = {}) {
  if (!value || typeof value !== 'object') value = {};
  const settings = {
    mode: ['system', 'day', 'night'].includes(value.mode) ? value.mode : 'system',
    palette: Object.hasOwn(PALETTES, value.palette) ? value.palette : 'teal',
    fontSize: Math.max(14, Math.min(24, Number(value.fontSize) || 16)),
    backgrounds: {}, accents: {},
  };
  for (const mode of ['day', 'night']) for (const key of ['backgrounds', 'accents'])
    settings[key][mode] = validColor(value[key]?.[mode]) ? value[key][mode] : null;
  return settings;
}
function channels(color) { return [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16)); }
function mix(a, b, weight) {
  const ca = channels(a), cb = channels(b);
  return '#' + ca.map((v, i) => Math.round(v * (1 - weight) + cb[i] * weight).toString(16).padStart(2, '0')).join('');
}
function luminance(color) {
  const c = channels(color).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
}
export function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
function readable(color, background, target = 4.5) {
  const ink = contrast('#ffffff', background) > contrast('#000000', background) ? '#ffffff' : '#000000';
  let result = color;
  for (let n = 0; n < 20 && contrast(result, background) < target; n++) result = mix(result, ink, .16);
  return result;
}
export function appearanceTokens(settings, mode) {
  const bg = settings.backgrounds[mode] || (mode === 'day' ? '#edf2f3' : '#0d171d');
  // Adapt text contrast even if a custom background differs from its preset.
  const dark = contrast('#ffffff', bg) > contrast('#000000', bg);
  const mediumDark = dark && luminance(bg) > .08;
  const surface = mix(bg, mediumDark ? '#000000' : '#ffffff', dark ? (mediumDark ? .12 : .045) : .65);
  const surface2 = mix(bg, mediumDark ? '#000000' : '#ffffff', dark ? (mediumDark ? .2 : .085) : .3);
  const text = readable(dark ? '#f1f5f5' : '#17242b', bg);
  const muted = readable(mix(text, surface, .28), surface);
  const accent = readable(settings.accents[mode] || PALETTES[settings.palette][mode], surface);
  const accentSoft = mix(surface, accent, .16);
  const danger = dark ? '#ffbbb0' : '#a22626';
  return {
    bg, surface, 'surface-2': surface2, text, muted, accent,
    'accent-dark': accentSoft, 'accent-soft': accentSoft,
    'accent-ink': contrast('#ffffff', accent) > contrast('#000000', accent) ? '#ffffff' : '#000000',
    'accent-hover': mix(accent, dark ? '#ffffff' : '#000000', .10),
    line: mix(surface, text, .25), 'control-line': mix(surface, text, .4),
    button: surface2, 'button-hover': mix(surface, accent, .22),
    field: mix(bg, dark ? '#000000' : '#ffffff', .22),
    'pdf-background': mix(bg, text, .13),
    'danger-text': danger, 'danger-bg': mix(surface, dark ? '#c65448' : '#f3b9ac', .16),
    'danger-hover': mix(surface, dark ? '#c65448' : '#f3b9ac', .27),
    'danger-line': mix(surface, danger, .6),
    'warm-accent': readable(dark ? '#e6c18b' : '#885917', surface),
    'effective-scheme': dark ? 'dark' : 'light',
  };
}

export function setupAppearance() {
  const $ = id => document.getElementById(id), root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let settings;
  try { settings = cleanAppearance(JSON.parse(localStorage.getItem(APPEARANCE_KEY))); }
  catch { settings = cleanAppearance(); }
  const mode = () => settings.mode === 'system' ? (media.matches ? 'night' : 'day') : settings.mode;
  function apply(save = false) {
    const active = mode(), tokens = appearanceTokens(settings, active);
    root.dataset.theme = active;
    root.style.fontSize = `${settings.fontSize}px`;
    for (const [key, value] of Object.entries(tokens)) root.style.setProperty(`--${key}`, value);
    root.style.colorScheme = tokens['effective-scheme'];
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tokens.bg);
    $('theme-mode').value = settings.mode;
    $('theme-palette').value = settings.palette;
    $('app-background').value = settings.backgrounds[active] || tokens.bg;
    $('app-accent').value = settings.accents[active] || PALETTES[settings.palette][active];
    $('app-font-size').value = settings.fontSize;
    $('app-font-value').textContent = `${settings.fontSize} px`;
    $('theme-toggle').textContent = active === 'day' ? '☾ Night' : '☀ Day';
    $('theme-toggle').title = `Switch to ${active === 'day' ? 'night' : 'day'} mode`;
    $('theme-toggle').setAttribute('aria-label', $('theme-toggle').title);
    $('appearance-preview').textContent = 'Your comments, menus, and buttons use this text size.';
    if (save) {
      try { localStorage.setItem(APPEARANCE_KEY, JSON.stringify(settings)); $('appearance-status').textContent = 'Appearance saved on this device.'; }
      catch { $('appearance-status').textContent = 'Applied for this session. Your browser could not save these settings.'; }
    }
  }
  $('settings-btn').addEventListener('click', () => $('settings-dialog').showModal());
  $('theme-toggle').addEventListener('click', () => { settings.mode = mode() === 'day' ? 'night' : 'day'; apply(true); });
  $('theme-mode').addEventListener('change', event => { settings.mode = event.target.value; apply(true); });
  $('theme-palette').addEventListener('change', event => { settings.palette = event.target.value; settings.accents = { day: null, night: null }; apply(true); });
  $('app-background').addEventListener('input', event => { settings.backgrounds[mode()] = event.target.value; apply(true); });
  $('app-accent').addEventListener('input', event => { settings.accents[mode()] = event.target.value; apply(true); });
  $('app-font-size').addEventListener('input', event => { settings.fontSize = Number(event.target.value); apply(true); });
  $('reset-appearance').addEventListener('click', () => { settings = cleanAppearance(); apply(true); });
  media.addEventListener('change', () => { if (settings.mode === 'system') apply(); });
  apply();
}
