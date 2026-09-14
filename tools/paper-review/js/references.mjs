/* Private, local bibliography extraction. No manuscript text leaves the browser.
 * The citation-style dictionary helps locate boundaries; it does not look up,
 * verify, or invent references. Extracted raw text stays available for correction.
 */
import { BIBLIOGRAPHY_HEADING as HEADING, BIBLIOGRAPHY_END as END_HEADING,
  PUBLICATION_DATE as DATE, GROUP_AUTHOR, JOURNAL_PREFIX, FAMILY_PARTICLES,
  normalizeStyle, normalizeLayout } from './citation-styles.mjs';
const OCR_ROOT = new URL('../vendor/ocr/', import.meta.url);
const YEAR = /\b(?:18|19|20)\d{2}[a-z]?\b/;
const NUMBERED = /^\s*(\[\s*\d{1,4}\s*\]|\(\s*\d{1,4}\s*\)|\d{1,4}[.)](?!\d)|\d{1,4}(?=\s+[\p{Lu}“"‘']))\s*(\S.*)$/u;
const ONLY_LABEL = /^(?:\[\s*\d{1,4}\s*\]|\(\s*\d{1,4}\s*\)|\d{1,4}[.)]?)$/;
const BARE_NUMBER = /^[1-9]\d{0,4}$/;
const isLineNumber = text => BARE_NUMBER.test(text) && !/^(?:18|19|20)\d{2}$/.test(text);
const abortError = () => new DOMException('Reference extraction cancelled.', 'AbortError');
const checkAbort = signal => { if (signal?.aborted) throw abortError(); };
const surname = `${FAMILY_PARTICLES}[\\p{Lu}][\\p{L}\\p{M}'’\\-]+(?:\\s+[\\p{Lu}][\\p{L}\\p{M}'’\\-]+){0,2}`;
const commaPerson = new RegExp(`^(${surname}),\\s*(?:[\\p{Lu}](?:\\.|(?=[\\p{Lu}\\s,;&]))|[\\p{Lu}][\\p{Ll}]+)`, 'u');
const initialPerson = new RegExp(`^(${surname})\\s+([\\p{Lu}]{1,3}(?:\\.|(?=[\\s,;&(])))`, 'u');
const initialsFirst = /^[\p{Lu}]\.(?:\s*[\p{Lu}]\.)*\s+[\p{Lu}][\p{L}'’\-]+/u;
const normalizeText = text => String(text || '').normalize('NFC').replace(/\u00a0/g, ' ').replace(/\u00ad/g, '').trim();

function linesFromRaw(rawText, page = 1) {
  return String(rawText || '').replace(/\r\n?/g, '\n').split('\f').flatMap((part, i) =>
    part.split('\n').map(text => ({ text: normalizeText(text), page: page + i })));
}

function personPrefix(text) {
  if (JOURNAL_PREFIX.test(text)) return null;
  const match = text.match(commaPerson) || text.match(initialPerson);
  return match ? match[1] : null;
}

function publicationDate(text) {
  const match = text.match(DATE);
  if (!match) return null;
  const label = /^n\s*\./i.test(match[0]) ? 'n.d.' : match[0].toLowerCase();
  return { label, index: match.index, end: match.index + match[0].length };
}

function groupPrefix(text) {
  const date = publicationDate(text);
  const prefix = text.slice(0, date ? date.index : 200).replace(/[.\s,(]+$/, '').trim();
  if (date && !/[.,(]\s*$/.test(text.slice(0, date.index)) && prefix.split(/\s+/).some(word => !/^(?:[A-Z\p{Lu}]|of$|the$|and$|for$|in$|on$|de$|der$)/u.test(word))) return null;
  if (!prefix || JOURNAL_PREFIX.test(prefix) || /[!?;]|https?:|doi:/i.test(prefix) || prefix.split(/\s+/).length > 18) return null;
  if (GROUP_AUTHOR.test(prefix) || /^[A-Z][A-Z\d&.-]{1,20}$/.test(prefix)) return prefix;
  return null;
}

function authorDateInfo(text, following = []) {
  const person = personPrefix(text);
  let group = groupPrefix(text);
  if (!person && !group) return null;
  let combined = text;
  let date = publicationDate(combined);
  // A date belongs to the author section. Do not borrow the year from an
  // unrelated title/journal or the next complete reference.
  if (!date && (person || group)) {
    for (const next of following.slice(0, 5)) {
      const part = next.text ?? next;
      if (!part || HEADING.test(part) || END_HEADING.test(part) || numberedStart(part)) break;
      const startsWithDate = /^[\s(]*(?:(?:18|19|20)\d{2}[a-z]?|n\s*\.\s*d\s*\.|in\s+press)/i.test(part);
      const authorWrap = /[,;&]\s*$|\b(?:and|et\s+al\.?)\s*$/i.test(combined) && (personPrefix(part) || /^[&,]|^(?:and\s+)|^…|^\.\.\./i.test(part));
      if (!startsWithDate && !authorWrap) break;
      combined += ` ${part}`;
      date = publicationDate(combined);
      if (date) break;
    }
  }
  if (!date || date.index > 1000) return null;
  const authorPart = combined.slice(0, date.index).replace(/\(\s*$/, '').trim();
  // A strong person pattern can occur in a title continuation. If an obvious
  // title sentence occurs before the date, it is not an author-year boundary.
  if (person && /\.[ \t]+[\p{Lu}][\p{Ll}]{2,}(?:\s+[\p{Ll}][\p{L}'’\-]+){2,}/u.test(authorPart)) return null;
  if (group) group = authorPart.replace(/[.,\s]+$/, '');
  return { label: `${person || group}, ${date.label}`, date, complete: !!publicationDate(text) };
}

function numberedStart(text) {
  const match = text.match(NUMBERED);
  if (!match) return null;
  const label = match[1].replace(/\s/g, '');
  const value = Number(label.replace(/\D/g, ''));
  if (!value || (!label.startsWith('[') && value >= 1800 && value <= 2099)) return null;
  const body = match[2];
  // Volume/issue numbers, page spans and years are continuations, not entries.
  if (!/[\p{L}]/u.test(body) || /^(?:\d|[–—:;,])/.test(body)) return null;
  return { label, value, body, explicit: !BARE_NUMBER.test(label) };
}

function isReferenceStart(text) {
  return !!numberedStart(text) || !!personPrefix(text) || !!groupPrefix(text) || initialsFirst.test(text);
}

function supportedNumberRun(run, side, geometric = false) {
  if (run.length < 4) return false;
  const explicit = run.filter(row => numberedStart(row.text)?.explicit).length;
  const heading = run.some(row => HEADING.test(row.text) || END_HEADING.test(row.text));
  const starts = run.map(row => isReferenceStart(row.text));
  const continuations = run.filter((row, i) => !starts[i] && !HEADING.test(row.text) && !END_HEADING.test(row.text)).length;
  const transitions = starts.slice(1).filter((value, i) => value !== starts[i]).length;
  if (explicit >= 2 || (heading && continuations >= 1)) return true;
  if (starts.filter(Boolean).length >= 2 && continuations >= 2 && transitions >= 3) return true;
  return geometric && side === 'right' && starts.filter(Boolean).length >= 4;
}

function numberRuns(records) {
  const runs = [];
  let current = [];
  let step = null;
  for (const record of records) {
    const previous = current.at(-1);
    const difference = previous ? record.number - previous.number : null;
    if (previous && (![1, 5, 10].includes(difference) || (step !== null && difference !== step))) {
      runs.push(current); current = []; step = null;
    }
    if (current.length) step = difference;
    current.push(record);
  }
  if (current.length) runs.push(current);
  return runs;
}

function stripRawLineNumbers(lines) {
  let cleaned = lines;
  for (const side of ['left', 'right']) {
    const runs = [];
    let records = [];
    const flush = () => { runs.push(...numberRuns(records)); records = []; };
    for (let index = 0; index < cleaned.length; index++) {
      const text = cleaned[index].text;
      if (!text) continue;
      const match = side === 'left' ? text.match(/^(\d{1,5})[ \t]+(.+)$/) : text.match(/^(.*\S)[ \t]+(\d{1,5})$/);
      const digits = match?.[side === 'left' ? 1 : 2];
      if (!digits || !isLineNumber(digits)) { flush(); continue; }
      records.push({ index, number: Number(digits), text: match[side === 'left' ? 2 : 1] });
    }
    flush();
    const replacements = new Map(runs.filter(run => supportedNumberRun(run, side)).flat().map(row => [row.index, row.text]));
    cleaned = cleaned.map((row, i) => replacements.has(i) ? { ...row, text: replacements.get(i) } : row);
  }
  return cleaned;
}

function stripMarginalLineNumbers(items, pageWidth) {
  const lanes = [];
  const columnGap = Math.max(18, pageWidth * 0.025);
  for (const item of items) {
    const digits = item.text.trim();
    if (!isLineNumber(digits)) continue;
    const aligned = items.filter(other => other !== item && Math.abs(other.y - item.y) < Math.max(2, Math.min(other.height, item.height) * 0.35))
      .sort((a, b) => a.x - b.x);
    const left = aligned.filter(other => other.x + other.width <= item.x + 1).at(-1);
    const right = aligned.find(other => other.x >= item.x + item.width - 1);
    for (const side of ['left', 'right']) {
      const neighbor = side === 'left' ? right : left;
      const behind = side === 'left' ? left : right;
      if (!neighbor || isLineNumber(neighbor.text.trim())) continue;
      const gap = side === 'left' ? neighbor.x - item.x - item.width : item.x - neighbor.x - neighbor.width;
      // There must be actual whitespace between a margin counter and the text.
      const outerMargin = !behind && (side === 'left' ? item.x < pageWidth * 0.2 : item.x > pageWidth * 0.8);
      if (gap < Math.max(5, item.height * 0.55) || gap > pageWidth * (outerMargin ? 0.95 : 0.14)) continue;
      if (behind) {
        const backGap = side === 'left' ? item.x - behind.x - behind.width : behind.x - item.x - item.width;
        // Internal margin counters are allowed in a wide two-column gutter;
        // ordinary numbers inside a line do not meet this condition.
        if (item.x < pageWidth * 0.3 || item.x > pageWidth * 0.7 || backGap < columnGap || gap > backGap) continue;
      }
      const pieces = side === 'left' ? aligned.filter(other => other.x >= neighbor.x) : aligned.filter(other => other.x <= neighbor.x).reverse();
      const adjacent = [];
      let previous = null;
      for (const piece of pieces) {
        const distance = previous && (side === 'left' ? piece.x - previous.x - previous.width : previous.x - piece.x - piece.width);
        if (previous && distance > columnGap) break;
        adjacent.push(piece);
        previous = piece;
      }
      adjacent.sort((a, b) => a.x - b.x);
      const text = adjacent.map(piece => piece.text).join(' ').trim();
      const anchor = side === 'left' ? item.x + item.width : item.x;
      let lane = lanes.find(value => value.side === side && Math.abs(value.anchor - anchor) <= Math.max(4, item.height * 0.7));
      if (!lane) { lane = { side, anchor, records: [] }; lanes.push(lane); }
      lane.records.push({ item, number: Number(digits), text });
    }
  }
  const removed = new Set();
  for (const lane of lanes) {
    for (const run of numberRuns(lane.records.sort((a, b) => b.item.y - a.item.y))) {
      if (supportedNumberRun(run, lane.side, true)) for (const row of run) removed.add(row.item);
    }
  }
  return items.filter(item => !removed.has(item));
}

function joinLines(parts) {
  return parts.join(' ').replace(/\s+/g, ' ').replace(/([\p{L}])-\s+([\p{Ll}])/gu, '$1$2').trim();
}

function bibliographyLines(lines) {
  // Choose a heading with reference-like content after it, avoiding a table of
  // contents entry when a later real bibliography heading is available.
  const headings = lines.flatMap((line, index) => HEADING.test(line.text) ? [index] : []);
  let heading = headings.find(index => lines.slice(index + 1, index + 10).some(line => isReferenceStart(line.text) || ONLY_LABEL.test(line.text)));
  if (heading === undefined) heading = headings[0] ?? -1;
  let candidates = heading >= 0 ? lines.slice(heading + 1) : lines;
  if (heading >= 0) {
    const end = candidates.findIndex(line => END_HEADING.test(line.text));
    if (end >= 0) candidates = candidates.slice(0, end);
  }
  return candidates.filter(line => !HEADING.test(line.text));
}

function joinDetachedLabels(lines) {
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const row = lines[i];
    if (ONLY_LABEL.test(row.text) && !publicationDate(row.text)) {
      let next = i + 1;
      while (next < lines.length && !lines[next].text) next++;
      if (next < lines.length && isReferenceStart(lines[next].text) && !numberedStart(lines[next].text)) {
        result.push({ ...row, text: `${row.text} ${lines[next].text}` });
        i = next;
        continue;
      }
      // A standalone page number with no author after it is not a reference.
      if (BARE_NUMBER.test(row.text)) continue;
    }
    result.push(row);
  }
  return result;
}

function splitInlineNumbered(lines) {
  return lines.flatMap(row => {
    const cuts = [];
    const pattern = /\s+(?=(?:\[\s*\d{1,4}\s*\]|\(\s*\d{1,4}\s*\)|\d{1,4}[.)](?!\d))\s*)/g;
    for (const match of row.text.matchAll(pattern)) {
      const start = match.index + match[0].length;
      const candidate = numberedStart(row.text.slice(start));
      if (candidate && (personPrefix(candidate.body) || initialsFirst.test(candidate.body) || groupPrefix(candidate.body) || /^https?:/i.test(candidate.body))) cuts.push(start);
    }
    if (!cuts.length) return [row];
    return [0, ...cuts].map((start, i, all) => ({ ...row, text: row.text.slice(start, all[i + 1]).trim() }));
  });
}

function splitInlineAuthors(lines) {
  // Only split after a completed dated entry. Commas between coauthors before
  // their shared year therefore cannot become new references.
  return lines.flatMap(row => {
    const cuts = [];
    let previousCut = 0;
    const spaces = /\s+/g;
    for (const match of row.text.matchAll(spaces)) {
      const start = match.index + match[0].length;
      const suffix = row.text.slice(start);
      if (!personPrefix(suffix) && !groupPrefix(suffix)) continue;
      const before = row.text.slice(previousCut, match.index);
      if (!publicationDate(before) || !/[.\d)\]]$/.test(before)) continue;
      const candidate = authorDateInfo(suffix);
      if (!candidate) continue;
      cuts.push(start); previousCut = start;
    }
    return cuts.length ? [0, ...cuts].map((start, i, all) => ({ ...row, text: row.text.slice(start, all[i + 1]).trim() })) : [row];
  });
}

function referenceEvidence(text) {
  return !!publicationDate(text) || /(?:https?:\/\/|doi\s*:|\b10\.\d{4,9}\/|ISBN\b)/i.test(text);
}

function parseLines(input, style = 'auto') {
  let lines = splitInlineNumbered(joinDetachedLabels(bibliographyLines(input)));
  const starts = lines.map(line => numberedStart(line.text)).filter(Boolean);
  const explicitCount = starts.filter(start => start.explicit).length;
  const numberStyle = style === 'numbered' || (style === 'auto' && (explicitCount >= 2 || starts.length >= 2 || (starts.length === 1 && lines.some(line => referenceEvidence(line.text)))));
  if (!numberStyle) lines = splitInlineAuthors(lines);
  const references = [];
  let current = null;
  const finish = () => {
    if (!current) return;
    const text = joinLines(current.parts);
    if (text.length > 8) references.push({ id: `ref-${current.page}-${references.length + 1}`, label: current.label, text, page: current.page });
    current = null;
  };
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!line.text) continue;
    const marker = numberStyle ? numberedStart(line.text) : null;
    let author = numberStyle ? null : authorDateInfo(line.text, lines.slice(index + 1, index + 6));
    // When authors wrap, a second surname belongs to the unfinished author list.
    if (author && current && !publicationDate(joinLines(current.parts))) author = null;
    if (marker || author) {
      finish();
      current = { label: marker ? marker.label : author.label, page: line.page, parts: [marker ? marker.body : line.text] };
    } else if (current && (!ONLY_LABEL.test(line.text) || publicationDate(line.text))) current.parts.push(line.text);
  }
  finish();
  const hasHeading = input.some(line => HEADING.test(line.text));
  if (!hasHeading && numberStyle && !references.some(ref => referenceEvidence(ref.text))) return { references: [], detectedStyle: 'unknown' };
  return { references, detectedStyle: references.length ? numberStyle ? 'numbered' : 'author-year' : 'unknown' };
}

function extractionQuality(lines, parsed) {
  if (!parsed.references.length) return -100;
  let score = 0;
  for (const ref of parsed.references) {
    const evidence = referenceEvidence(ref.text);
    score += evidence ? 4 : -2;
    if (ref.text.length >= 30 && ref.text.length <= 2500) score += 1;
    if (numberedStart(ref.text)) score -= 4; // line counters before real labels
    if (JOURNAL_PREFIX.test(ref.text)) score -= 3; // a continuation split off
  }
  const coherent = parsed.references.filter(ref => referenceEvidence(ref.text)).length / parsed.references.length;
  score += coherent * 4;
  if (lines.some(line => HEADING.test(line.text))) score += 3;
  // Residual, independently supported margin-counter runs reduce coherence.
  const stripped = stripRawLineNumbers(lines);
  score -= lines.filter((line, i) => stripped[i]?.text !== line.text).length * 0.75;
  return score;
}

function selectCandidate(original, cleaned, style) {
  const preserved = parseLines(original, style);
  if (!cleaned || (original.length === cleaned.length && original.every((row, i) => row.text === cleaned[i].text))) return { ...preserved, lines: original, cleaned: false };
  const removed = parseLines(cleaned, style);
  // Never prefer a cleaned result solely because it generated more cards.
  // References need publication evidence; ties preserve the original text.
  if (extractionQuality(cleaned, removed) > extractionQuality(original, preserved)) return { ...removed, lines: cleaned, cleaned: true };
  return { ...preserved, lines: original, cleaned: false };
}

/** Parse editable local bibliography text. Citation labels and PDF pages survive.
 * style is auto, author-year, or numbered. Line cleanup can be explicitly disabled.
 */
export function parseReferences(rawText, page = 1, { stripLineNumbers = true, style = 'auto' } = {}) {
  const lines = linesFromRaw(rawText, page);
  return selectCandidate(lines, stripLineNumbers ? stripRawLineNumbers(lines) : null, normalizeStyle(style)).references;
}

function textLines(content, pageWidth, pageHeight, pageNumber, { stripLineNumbers = false, layout = 'auto' } = {}) {
  let items = content.items.filter(item => typeof item.str === 'string' && item.str.trim())
    .map(item => ({ text: String(item.str).normalize('NFC').replace(/\u00a0/g, ' ').replace(/\u00ad/g, ''), x: item.transform[4], y: item.transform[5], width: Math.abs(item.width || 0), height: Math.abs(item.height || item.transform[3] || 10) }));
  if (!items.length) return { lines: [], layout: 'single' };
  if (stripLineNumbers) items = stripMarginalLineNumbers(items, pageWidth);
  const rows = [];
  for (const item of items.sort((a, b) => b.y - a.y || a.x - b.x)) {
    let row = rows.find(r => Math.abs(r.y - item.y) < Math.max(2, Math.min(r.height, item.height) * 0.35));
    if (!row) { row = { y: item.y, height: item.height, items: [] }; rows.push(row); }
    row.items.push(item);
  }
  const gaps = [];
  for (const row of rows) {
    const sorted = row.items.sort((a, b) => a.x - b.x);
    for (let i = 1; i < sorted.length; i++) {
      const leftEnd = sorted[i - 1].x + sorted[i - 1].width;
      const rightStart = sorted[i].x;
      const mid = (leftEnd + rightStart) / 2;
      if (rightStart - leftEnd > Math.max(18, pageWidth * 0.025) && mid > pageWidth * 0.35 && mid < pageWidth * 0.65) gaps.push({ mid, leftEnd, rightStart, row });
    }
  }
  gaps.sort((a, b) => a.mid - b.mid);
  const proposed = gaps.length ? gaps[Math.floor(gaps.length / 2)].mid : pageWidth / 2;
  const support = new Set(gaps.filter(gap => gap.leftEnd < proposed && gap.rightStart > proposed).map(gap => gap.row)).size;
  const crossing = rows.filter(row => row.items.some(item => item.x < proposed - 2 && item.x + item.width > proposed + 2)).length;
  const meaningful = items.filter(item => /[\p{L}]/u.test(item.text));
  const leftText = meaningful.filter(item => item.x < proposed && item.x + item.width <= proposed + 2);
  const rightText = meaningful.filter(item => item.x >= proposed);
  const positionalColumns = leftText.length >= 3 && rightText.length >= 3 && crossing === 0;
  const autoDouble = leftText.length >= 3 && rightText.length >= 3 && (positionalColumns || (support >= Math.min(5, Math.max(3, rows.length * 0.2)) && crossing <= Math.max(1, support * 0.35)));
  const split = layout === 'double' ? proposed : layout !== 'single' && autoDouble ? proposed : null;
  const columns = [[], []];
  for (const row of rows.sort((a, b) => b.y - a.y)) {
    for (let col = 0; col < (split ? 2 : 1); col++) {
      const pieces = row.items.filter(item => !split || (col === 0 ? item.x < split : item.x >= split));
      if (!pieces.length) continue;
      const text = pieces.map((piece, i) => {
        const previous = pieces[i - 1];
        // Tokens without an actual geometric gap (DOIs, punctuation, ligatures)
        // remain joined. A gap, or a space present in PDF text, separates words.
        const space = previous && piece.x - (previous.x + previous.width) > 1 ? ' ' : '';
        return space + piece.text;
      }).join('').trim();
      if (/^\d{1,4}$/.test(text) && (row.y < pageHeight * 0.08 || row.y > pageHeight * 0.93)) continue;
      columns[col].push({ text, page: pageNumber, edge: row.y < pageHeight * 0.07 || row.y > pageHeight * 0.94, x: pieces[0].x, y: row.y, column: col });
    }
  }
  const lines = columns.flat();
  return { lines: stripLineNumbers ? stripRawLineNumbers(lines) : lines, layout: split ? 'double' : 'single' };
}

class LocalOCR {
  constructor(onProgress) {
    this.worker = new Worker(new URL('worker.min.js', OCR_ROOT));
    this.jobs = new Map();
    this.serial = 0;
    this.closed = false;
    this.worker.onmessage = ({ data }) => {
      if (data.status === 'progress') { onProgress(data.data || {}); return; }
      const job = this.jobs.get(data.jobId);
      if (!job) return;
      this.jobs.delete(data.jobId);
      clearTimeout(job.timeout);
      if (data.status === 'resolve') job.resolve(data.data);
      else job.reject(new Error(String(data.data?.message || data.data || 'Local OCR failed.')));
    };
    this.worker.onerror = event => this.close(new Error(event.message || 'The local OCR worker could not run.'));
    this.worker.onmessageerror = () => this.close(new Error('The local OCR worker returned unreadable data.'));
  }
  call(action, payload, transfer = []) {
    if (this.closed) return Promise.reject(abortError());
    const jobId = `ocr-${++this.serial}`;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => this.close(new Error('Local OCR took too long. Try a smaller page range.')), 120000);
      this.jobs.set(jobId, { resolve, reject, timeout });
      try { this.worker.postMessage({ workerId: 'private-review-ocr', jobId, action, payload }, transfer); }
      catch (error) { this.close(error); }
    });
  }
  async initialize() {
    await this.call('load', { options: { lstmOnly: true, corePath: OCR_ROOT.href, logging: false } });
    await this.call('loadLanguage', { langs: 'eng', options: { langPath: OCR_ROOT.href.replace(/\/$/, ''), gzip: false, cacheMethod: 'none', lstmOnly: true } });
    await this.call('initialize', { langs: 'eng', oem: 1, config: {} });
  }
  async recognize(canvas) {
    const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('The PDF page could not be prepared for OCR.')), 'image/png'));
    const image = new Uint8Array(await blob.arrayBuffer());
    const result = await this.call('recognize', { image, options: {}, output: { text: true } }, [image.buffer]);
    return result.text || '';
  }
  close(error = abortError()) {
    if (this.closed) return;
    this.closed = true;
    this.worker.terminate();
    for (const job of this.jobs.values()) { clearTimeout(job.timeout); job.reject(error); }
    this.jobs.clear();
  }
}

/** Extract PDF text and optionally run the bundled English OCR worker locally.
 * All extraction/style selection happens in the browser; no external lookup.
 * The selected rawText retains line and PDF page boundaries for manual correction.
 */
export async function extractReferences(pdf, { startPage = 1, endPage = pdf?.numPages, ocr = false, stripLineNumbers = true, style = 'auto', layout = 'auto', onProgress = () => {}, signal } = {}) {
  if (!pdf?.numPages || typeof pdf.getPage !== 'function') throw new Error('Open a PDF before extracting references.');
  startPage = Math.max(1, Math.min(pdf.numPages, Math.floor(Number(startPage) || 1)));
  endPage = Math.max(startPage, Math.min(pdf.numPages, Math.floor(Number(endPage) || pdf.numPages)));
  style = normalizeStyle(style); layout = normalizeLayout(layout);
  checkAbort(signal);
  const allLines = [], cleanLines = [], layouts = new Set(), cleanLayouts = new Set();
  let ocrEngine = null, renderTask = null, canvas = null, ocrUsed = false;
  let activePage = startPage;
  const total = endPage - startPage + 1;
  const notify = (phase, progress = 0, status = '') => onProgress({ page: activePage, total, phase, progress, status });
  const onAbort = () => { renderTask?.cancel(); ocrEngine?.close(); };
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    for (activePage = startPage; activePage <= endPage; activePage++) {
      checkAbort(signal);
      notify('text', (activePage - startPage) / total, `Reading page ${activePage}`);
      const page = await pdf.getPage(activePage);
      checkAbort(signal);
      const content = await page.getTextContent();
      checkAbort(signal);
      const view = page.getViewport({ scale: 1 });
      const original = textLines(content, view.width, view.height, activePage, { layout });
      let lines = original.lines;
      const cleanLayout = stripLineNumbers ? textLines(content, view.width, view.height, activePage, { layout, stripLineNumbers: true }) : original;
      let cleaned = cleanLayout.lines;
      cleanLayouts.add(cleanLayout.layout);
      layouts.add(original.layout);
      if (ocr && lines.reduce((sum, line) => sum + line.text.replace(/\s/g, '').length, 0) < 40) {
        if (!ocrEngine) {
          ocrEngine = new LocalOCR(progress => notify('ocr', progress.progress || 0, progress.status || 'Reading scanned page'));
          await ocrEngine.initialize();
        }
        checkAbort(signal);
        notify('ocr', 0, `Recognizing page ${activePage} locally`);
        canvas = document.createElement('canvas');
        const scale = Math.min(2, Math.sqrt(6500000 / Math.max(1, view.width * view.height)));
        const viewport = page.getViewport({ scale });
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        renderTask = page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport, annotationMode: 0 });
        await renderTask.promise;
        renderTask = null;
        checkAbort(signal);
        const text = await ocrEngine.recognize(canvas);
        checkAbort(signal);
        canvas.width = canvas.height = 0; canvas = null;
        lines = linesFromRaw(text, activePage);
        cleaned = stripLineNumbers ? stripRawLineNumbers(lines) : lines;
        ocrUsed = true;
      }
      allLines.push(...lines); cleanLines.push(...cleaned);
    }
    checkAbort(signal);
    const removeRunningHeaders = lines => {
      const edgeCounts = new Map();
      for (const line of lines) if (line.edge && line.text.length < 120 && !HEADING.test(line.text) && !isReferenceStart(line.text)) {
        if (!edgeCounts.has(line.text)) edgeCounts.set(line.text, new Set());
        edgeCounts.get(line.text).add(line.page);
      }
      return lines.filter(line => !line.edge || (edgeCounts.get(line.text)?.size || 0) < 2);
    };
    const result = selectCandidate(removeRunningHeaders(allLines), stripLineNumbers ? removeRunningHeaders(cleanLines) : null, style);
    const selected = bibliographyLines(result.lines);
    const chosenLayouts = result.cleaned ? cleanLayouts : layouts;
    const rawStartPage = selected[0]?.page || startPage;
    const pages = Array.from({ length: endPage - rawStartPage + 1 }, () => []);
    for (const line of selected) pages[line.page - rawStartPage]?.push(line.text);
    const diagnostics = [];
    if (stripLineNumbers) diagnostics.push(result.cleaned ? 'Removed a supported run of manuscript line numbers; retained the more coherent bibliography.' : 'Kept original numbering because removal did not improve bibliography boundaries.');
    if (!result.references.length) diagnostics.push('No reliable reference boundaries found. Choose the bibliography pages or edit the extracted text.');
    if (ocrUsed) diagnostics.push('OCR text may contain recognition errors; check the extracted text against the PDF.');
    activePage = endPage;
    notify('done', 1, 'Reference extraction complete');
    return { references: result.references, rawText: pages.map(lines => lines.join('\n')).join('\f').trim(), rawStartPage, ocrUsed, detectedStyle: result.detectedStyle, detectedLayout: chosenLayouts.size > 1 ? 'mixed' : [...chosenLayouts][0] || 'single', diagnostics };
  } catch (error) {
    if (signal?.aborted) throw abortError();
    throw error;
  } finally {
    signal?.removeEventListener('abort', onAbort);
    renderTask?.cancel(); ocrEngine?.close();
    if (canvas) canvas.width = canvas.height = 0;
  }
}
