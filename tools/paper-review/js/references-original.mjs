/* Private, local bibliography extraction. No manuscript text leaves the browser.
 * Parsing and column detection are heuristics: the editable raw text is authoritative.
 * OCR uses the bundled, version-pinned Tesseract.js 7 worker protocol so the worker
 * is owned directly and can be terminated even during language initialization.
 */
const OCR_ROOT = new URL('../vendor/ocr/', import.meta.url);
const HEADING = /^(?:\d+[.\s]+)?(?:references(?:\s+and\s+notes)?|bibliography|literature\s+cited|works\s+cited)\s*:?\s*$/i;
const END_HEADING = /^(?:appendix(?:\s+[A-Z\d]+)?|appendices|supplementary\s+(?:material|information)|supporting\s+information|acknowledg(?:e)?ments?|author\s+contributions?)\s*:?\s*$/i;
const NUMBERED = /^\s*(\[\s*\d{1,4}\s*\]|\d{1,4}[.)](?!\d)|\d{1,4}(?=\s+[\p{Lu}]))\s*(\S.*)$/u;
const YEAR = /\b(?:18|19|20)\d{2}[a-z]?\b/;
const abortError = () => new DOMException('Reference extraction cancelled.', 'AbortError');
const checkAbort = signal => { if (signal?.aborted) throw abortError(); };

function linesFromRaw(rawText, page = 1) {
  return String(rawText || '').replace(/\r\n?/g, '\n').split('\f').flatMap((part, i) =>
    part.split('\n').map(text => ({ text: text.trim(), page: page + i })));
}

function authorStart(text, following = '') {
  // For wrapped author lists, only consult the next lines if this line begins
  // with the stronger surname-and-initial pattern. Capitalized titles alone
  // must not steal the date belonging to the following reference.
  const strongAuthor = /^[\p{Lu}][\p{L}'’\-]+,?\s+[\p{Lu}]\./u.test(text);
  const year = (text + (strongAuthor ? ` ${following}` : '')).slice(0, 300).match(YEAR)?.[0];
  if (!year) return null;
  // Initials or capitalized given names must follow a plausible family name.
  const author = text.match(/^([\p{Lu}][\p{L}'’\-]+(?:\s+(?:van|von|de|del|da|[\p{Lu}][\p{L}'’\-]+)){0,2}),?\s+[\p{Lu}]/u);
  if (!author) return null;
  return `${author[1]}, ${year}`;
}

function joinLines(parts) {
  return parts.join(' ').replace(/\s+/g, ' ').replace(/([\p{L}])-\s+([\p{Ll}])/gu, '$1$2').trim();
}

function bibliographyLines(lines) {
  const heading = lines.findIndex(line => HEADING.test(line.text));
  let candidates = heading >= 0 ? lines.slice(heading + 1) : lines;
  if (heading >= 0) {
    const end = candidates.findIndex(line => END_HEADING.test(line.text));
    if (end >= 0) candidates = candidates.slice(0, end);
  }
  return candidates.filter(line => !HEADING.test(line.text) && !/^\d{1,4}$/.test(line.text));
}

function parseLines(input) {
  const lines = bibliographyLines(input);
  const numbered = lines.filter(line => NUMBERED.test(line.text));
  const numberStyle = numbered.length >= 2 || (numbered.length === 1 && (YEAR.test(numbered[0].text) || /doi|https?:/i.test(numbered[0].text)));
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
    const match = numberStyle ? line.text.match(NUMBERED) : null;
    const author = numberStyle ? null : authorStart(line.text, lines.slice(index + 1, index + 3).map(row => row.text).join(' '));
    if (match || author) {
      finish();
      current = { label: match ? match[1].replace(/\s/g, '') : author, page: line.page, parts: [match ? match[2] : line.text] };
    } else if (current) current.parts.push(line.text);
  }
  finish();
  // Without detectable boundaries, return no invented entries; callers can show
  // and edit rawText. The parser deliberately does not treat every paragraph as a reference.
  const hasHeading = input.some(line => HEADING.test(line.text));
  if (!hasHeading && numberStyle && !references.some(ref => YEAR.test(ref.text) || /doi|https?:|\bn\.d\./i.test(ref.text))) return [];
  return references;
}

/** Parse an edited bibliography into reference cards. Page is a one-based PDF page.
 * Numbered labels are preserved. Author-year labels are first-author lookup hints.
 */
export function parseReferences(rawText, page = 1) {
  return parseLines(linesFromRaw(rawText, page));
}

function textLines(content, pageWidth, pageHeight, pageNumber) {
  const items = content.items.filter(item => typeof item.str === 'string' && item.str.trim())
    .map(item => ({ text: item.str, x: item.transform[4], y: item.transform[5], width: Math.abs(item.width || 0), height: Math.abs(item.height || item.transform[3] || 10) }));
  if (!items.length) return [];
  const rows = [];
  for (const item of items.sort((a, b) => b.y - a.y || a.x - b.x)) {
    let row = rows.find(r => Math.abs(r.y - item.y) < Math.max(2, Math.min(r.height, item.height) * 0.35));
    if (!row) { row = { y: item.y, height: item.height, items: [] }; rows.push(row); }
    row.items.push(item);
  }
  // A recurring central whitespace gap indicates two columns. Split by position
  // instead of interleaving the left and right lines at the same vertical baseline.
  const gaps = [];
  for (const row of rows) {
    const sorted = row.items.sort((a, b) => a.x - b.x);
    for (let i = 1; i < sorted.length; i++) {
      const leftEnd = sorted[i - 1].x + sorted[i - 1].width;
      const rightStart = sorted[i].x;
      const mid = (leftEnd + rightStart) / 2;
      if (rightStart - leftEnd > Math.max(18, pageWidth * 0.025) && mid > pageWidth * 0.35 && mid < pageWidth * 0.65) gaps.push(mid);
    }
  }
  gaps.sort((a, b) => a - b);
  const split = gaps.length >= Math.min(5, Math.max(3, rows.length * 0.15)) ? gaps[Math.floor(gaps.length / 2)] : null;
  const columns = [[], []];
  for (const row of rows.sort((a, b) => b.y - a.y)) {
    for (let col = 0; col < (split ? 2 : 1); col++) {
      const pieces = row.items.filter(item => !split || (col === 0 ? item.x < split : item.x >= split));
      if (!pieces.length) continue;
      const text = pieces.map((piece, i) => {
        const previous = pieces[i - 1];
        const space = previous && piece.x - (previous.x + previous.width) > 1 && !/\s$/.test(previous.text) ? ' ' : '';
        return space + piece.text;
      }).join('').trim();
      if (/^\d{1,4}$/.test(text) && (row.y < pageHeight * 0.08 || row.y > pageHeight * 0.93)) continue;
      columns[col].push({ text, page: pageNumber, edge: row.y < pageHeight * 0.07 || row.y > pageHeight * 0.94 });
    }
  }
  return columns.flat();
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

/** Extract local PDF text, with optional English OCR for pages lacking usable text.
 * onProgress receives {page,total,phase,progress,status}; total is pages in the range.
 * rawText preserves page boundaries as form feeds for manual inspection/correction.
 */
export async function extractReferences(pdf, { startPage = 1, endPage = pdf.numPages, ocr = false, onProgress = () => {}, signal } = {}) {
  if (!pdf?.numPages || typeof pdf.getPage !== 'function') throw new Error('Open a PDF before extracting references.');
  startPage = Math.max(1, Math.min(pdf.numPages, Math.floor(Number(startPage) || 1)));
  endPage = Math.max(startPage, Math.min(pdf.numPages, Math.floor(Number(endPage) || pdf.numPages)));
  checkAbort(signal);
  const allLines = [];
  let ocrEngine = null;
  let renderTask = null;
  let canvas = null;
  let ocrUsed = false;
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
      let lines = textLines(content, view.width, view.height, activePage);
      if (ocr && lines.reduce((sum, line) => sum + line.text.replace(/\s/g, '').length, 0) < 40) {
        if (!ocrEngine) {
          ocrEngine = new LocalOCR(progress => notify('ocr', progress.progress || 0, progress.status || 'Reading scanned page'));
          await ocrEngine.initialize();
        }
        checkAbort(signal);
        notify('ocr', 0, `Recognizing page ${activePage} locally`);
        canvas = document.createElement('canvas');
        // Bound memory on very large or unusual page sizes while keeping normal
        // journal pages at approximately 144 dpi for the local OCR pass.
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
        canvas.width = canvas.height = 0;
        canvas = null;
        lines = linesFromRaw(text, activePage);
        ocrUsed = true;
      }
      allLines.push(...lines);
    }
    checkAbort(signal);
    const edgeCounts = new Map();
    for (const line of allLines) if (line.edge && line.text.length < 120 && !HEADING.test(line.text) && !NUMBERED.test(line.text)) {
      if (!edgeCounts.has(line.text)) edgeCounts.set(line.text, new Set());
      edgeCounts.get(line.text).add(line.page);
    }
    const cleanedLines = allLines.filter(line => !line.edge || (edgeCounts.get(line.text)?.size || 0) < 2);
    const selected = bibliographyLines(cleanedLines);
    let previousPage = null;
    const raw = [];
    for (const line of selected) {
      if (previousPage !== null && previousPage !== line.page) raw.push('\f');
      raw.push(line.text);
      previousPage = line.page;
    }
    activePage = endPage;
    notify('done', 1, 'Reference extraction complete');
    return { references: parseLines(cleanedLines), rawText: raw.join('\n').trim(), ocrUsed };
  } catch (error) {
    if (signal?.aborted) throw abortError();
    throw error;
  } finally {
    signal?.removeEventListener('abort', onAbort);
    renderTask?.cancel();
    ocrEngine?.close();
    if (canvas) canvas.width = canvas.height = 0;
  }
}
