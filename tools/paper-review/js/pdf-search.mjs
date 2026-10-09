// Local text search. Offsets refer to PDF.js TextLayer's concatenated strings,
// so matches can be drawn without changing the PDF or its text selection.
const WORD = /[\p{L}\p{N}\p{M}_]/u;
export const MAX_MATCHES = 10000;

function normalizeCharacters(raw, offsets, caseSensitive) {
  const parts = [], starts = [], ends = [];
  for (let i = 0; i < raw.length;) {
    const character = String.fromCodePoint(raw.codePointAt(i));
    const length = character.length;
    // Join words split by a typesetting hyphen at the end of a line.
    const lineBreak = (character === '-' || character === '\u2010') && /^[\-\u2010]\s*\n\s*(?=\p{L})/u.exec(raw.slice(i));
    if (lineBreak && i > 0 && WORD.test(raw[i - 1])) { i += lineBreak[0].length; continue; }
    if (character === '\u00ad' || character === '\u200b') { i += length; continue; }
    let normalized = character.normalize('NFKC');
    if (!caseSensitive) normalized = normalized.toLowerCase();
    if (/\s/u.test(normalized)) normalized = ' ';
    if (normalized === ' ' && parts.at(-1) === ' ') {
      ends[ends.length - 1] = offsets[i + length - 1].end;
    } else {
      parts.push(normalized);
      for (let k = 0; k < normalized.length; k++) {
        starts.push(offsets[i].start); ends.push(offsets[i + length - 1].end);
      }
    }
    i += length;
  }
  return { text: parts.join(''), starts, ends };
}

export function buildPageIndex(items, caseSensitive = false) {
  let raw = '', offset = 0;
  const offsets = [];
  const strings = items.filter(item => typeof item.str === 'string');
  for (let n = 0; n < strings.length; n++) {
    const item = strings[n], next = strings[n + 1];
    raw += item.str;
    for (let i = 0; i < item.str.length; i++) offsets.push({ start: offset + i, end: offset + i + 1 });
    offset += item.str.length;
    let separator = item.hasEOL ? '\n' : '';
    // Some PDFs omit a literal space between separately positioned words.
    if (!separator && item.str && next?.str && !/\s$/.test(item.str) && !/^\s/.test(next.str)
      && item.dir !== 'rtl' && item.transform && next.transform) {
      const [a, b, , , x, y] = item.transform;
      const size = Math.hypot(a, b) || item.height || 10;
      const dx = next.transform[4] - x, dy = next.transform[5] - y;
      const along = (dx * a + dy * b) / size;
      const across = Math.abs((-dx * b + dy * a) / size);
      if (across > size * .6) separator = '\n';
      else if (along - (item.width || 0) > size * .15) separator = ' ';
    }
    if (separator) { raw += separator; offsets.push({ start: offset, end: offset }); }
  }
  return normalizeCharacters(raw, offsets, caseSensitive);
}

export function findPageMatches(index, query, { caseSensitive = false, wholeWord = false, limit = MAX_MATCHES } = {}) {
  const needle = buildPageIndex([{ str: String(query).trim() }], caseSensitive).text.trim();
  if (!needle) return [];
  const results = [];
  let from = 0;
  while (results.length < limit) {
    const start = index.text.indexOf(needle, from);
    if (start < 0) break;
    const end = start + needle.length;
    const before = Array.from(index.text.slice(Math.max(0, start - 2), start)).at(-1) || '';
    const after = Array.from(index.text.slice(end, end + 2))[0] || '';
    if (!wholeWord || (!WORD.test(before) && !WORD.test(after))) {
      results.push({ begin: index.starts[start], end: index.ends[end - 1] });
    }
    from = end;
  }
  return results;
}

export class PDFSearch {
  constructor({ pane, input, status, previous, next, matchCase, wholeWord }) {
    Object.assign(this, { pane, input, status, previous, next, matchCase, wholeWord });
    this.pdf = null; this.generation = 0; this.matches = []; this.active = -1;
    this.cache = new Map(); this.busy = false; this.timer = 0;
    input.addEventListener('input', () => {
      this.cancel(); this.pane.setSearchResults([]); this.matches = []; this.active = -1;
      this.update('Searching…');
      if (!input.value.trim()) { this.update('Type a word or phrase'); return; }
      this.timer = setTimeout(() => this.search(), 220);
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); this.timer ? this.search() : this.move(event.shiftKey ? -1 : 1); }
      if (event.key === 'Escape') { event.preventDefault(); document.getElementById('left-search-close').click(); }
    });
    for (const control of [matchCase, wholeWord]) control.addEventListener('change', () => this.search());
    previous.addEventListener('click', () => this.move(-1));
    next.addEventListener('click', () => this.move(1));
  }
  cancel() { clearTimeout(this.timer); this.timer = 0; this.generation++; this.busy = false; }
  setDocument(pdf) {
    this.cancel(); this.pdf = pdf; this.cache.clear(); this.matches = []; this.active = -1;
    this.input.value = ''; this.pane.setSearchResults([]);
    for (const el of [this.input, this.matchCase, this.wholeWord]) el.disabled = !pdf;
    this.update(pdf ? 'Type a word or phrase' : 'Open a PDF to search');
  }
  clear() {
    this.cancel(); this.input.value = ''; this.matches = []; this.active = -1;
    this.pane.setSearchResults([]); this.update('Type a word or phrase');
  }
  update(message) {
    this.status.textContent = message;
    this.previous.disabled = this.next.disabled = this.busy || !this.matches.length;
  }
  async search() {
    this.cancel(); const generation = this.generation, pdf = this.pdf;
    const query = this.input.value.trim();
    this.matches = []; this.active = -1; this.pane.setSearchResults([]);
    if (!pdf || !query) { this.update(pdf ? 'Type a word or phrase' : 'Open a PDF to search'); return; }
    const options = { caseSensitive: this.matchCase.checked, wholeWord: this.wholeWord.checked };
    this.busy = true; this.update('Searching the PDF…');
    const matches = []; let textPages = 0, failed = 0, truncated = false;
    for (let page = 1; page <= pdf.numPages; page++) {
      if (this.generation !== generation) return;
      try {
        let items = this.cache.get(page);
        if (!items) {
          const proxy = await pdf.getPage(page);
          if (this.generation !== generation) return;
          const content = await proxy.getTextContent();
          if (this.generation !== generation) return;
          items = content.items; this.cache.set(page, items);
        }
        const index = buildPageIndex(items, options.caseSensitive);
        if (index.text.trim()) textPages++;
        const remaining = MAX_MATCHES - matches.length;
        const found = findPageMatches(index, query, { ...options, limit: remaining + 1 });
        for (const range of found.slice(0, remaining)) matches.push({ ...range, page });
        if (found.length > remaining) { truncated = true; break; }
      } catch { if (this.generation !== generation) return; failed++; }
      this.update(`Searching · page ${page} of ${pdf.numPages}`);
      // Yield for typing/cancellation even when all text is already cached.
      if (page % 3 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (this.generation !== generation) return;
    this.busy = false; this.matches = matches; this.truncated = truncated;
    this.suffix = failed ? ` · ${failed} page(s) could not be searched`
      : textPages < pdf.numPages ? ' · pages without text are skipped' : '';
    if (matches.length) {
      this.active = matches.findIndex(match => match.page >= this.pane.currentPage);
      if (this.active < 0) this.active = 0;
      this.show();
    } else this.update((textPages ? 'No matches' : failed ? 'Could not search this PDF' : 'No searchable text — this PDF may be scanned') + this.suffix);
  }
  move(direction) {
    if (this.busy || !this.matches.length) return;
    this.active = (this.active + direction + this.matches.length) % this.matches.length; this.show();
  }
  show() {
    this.pane.setSearchResults(this.matches, this.active);
    this.update(`${this.active + 1} of ${this.matches.length}${this.truncated ? '+ · refine your search' : ''} · page ${this.matches[this.active].page}${this.suffix || ''}`);
  }
}
