import { PDFDocument, PDFName, PDFHexString, PDFArray, PDFDict } from '../vendor/pdf-lib/pdf-lib.mjs';
import { normalizeAnnotations } from './review-state.mjs';

const REVIEW_KEY = PDFName.of('ParsecReviewAnnotations');
const MANAGED_KEY = PDFName.of('ParsecReviewMark');
function removeManagedMarks(document) {
  for (const page of document.getPages()) {
    const entries = page.node.lookupMaybe(PDFName.of('Annots'), PDFArray);
    if (!entries) continue;
    for (let index = entries.size() - 1; index >= 0; index--) {
      const entry = document.context.lookup(entries.get(index));
      if (entry instanceof PDFDict && entry.get(MANAGED_KEY)?.toString() === 'true') entries.remove(index);
    }
  }
}

/** Restore only our own saved marks as editable overlays; other PDF marks stay intact. */
export async function prepareSavedPDF(originalBytes) {
  try {
    const document = await PDFDocument.load(originalBytes, { updateMetadata: false });
    const data = document.catalog.get(REVIEW_KEY);
    if (!(data instanceof PDFHexString)) return { bytes: originalBytes, annotations: [] };
    const value = JSON.parse(data.decodeText());
    if (value.version !== 1 || !Array.isArray(value.annotations)) return { bytes: originalBytes, annotations: [] };
    const annotations = normalizeAnnotations(value.annotations, document.getPageCount());
    if (annotations.length !== value.annotations.length) return { bytes: originalBytes, annotations: [] };
    removeManagedMarks(document);
    document.catalog.delete(REVIEW_KEY);
    return { bytes: await document.save({ useObjectStreams: true, updateFieldAppearances: false }), annotations };
  } catch {
    // PDF.js may still read files that pdf-lib cannot, including encrypted PDFs.
    return { bytes: originalBytes, annotations: [] };
  }
}

const SUBTYPES = { highlight: 'Highlight', note: 'Text', ellipse: 'Circle', rectangle: 'Square' };
const number = value => Number(value.toFixed(5));
const command = values => values.map(value => typeof value === 'number' ? number(value) : value).join(' ');

function colorComponents(color) {
  const match = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color || '');
  if (!match) return [1, 0.8, 0];
  return match.slice(1).map(value => parseInt(value, 16) / 255);
}

/** Convert a box in the displayed, rotated crop viewport into PDF user space. */
function pdfRect(viewport, box) {
  if (!box || !['x', 'y', 'width', 'height'].every(key => Number.isFinite(box[key]))) {
    throw new Error('An annotation has invalid coordinates. Remove that mark and try again.');
  }
  const x0 = Math.max(0, Math.min(1, box.x));
  const y0 = Math.max(0, Math.min(1, box.y));
  const x1 = Math.max(0, Math.min(1, box.x + box.width));
  const y1 = Math.max(0, Math.min(1, box.y + box.height));
  if (x1 <= x0 || y1 <= y0) throw new Error('An annotation has an empty area. Remove that mark and try again.');
  const corners = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]
    .map(([x, y]) => viewport.convertToPdfPoint(x * viewport.width, y * viewport.height));
  const xs = corners.map(point => point[0]);
  const ys = corners.map(point => point[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

function appearance(context, type, bounds, rects, color, userUnit) {
  const [left, bottom, right, top] = bounds;
  const width = right - left, height = top - bottom;
  const stroke = Math.min(1.5 / userUnit, width / 3, height / 3);
  const inset = stroke / 2;
  const lines = ['q', '/GS0 gs', command([...color, 'rg']), command([...color, 'RG'])];
  if (type === 'highlight') {
    for (const rect of rects) {
      lines.push(command([rect[0] - left, rect[1] - bottom, rect[2] - rect[0], rect[3] - rect[1], 're']), 'f');
    }
  } else if (type === 'ellipse') {
    const rx = (width - stroke) / 2, ry = (height - stroke) / 2;
    const cx = width / 2, cy = height / 2, k = 0.5522847498307936;
    lines.push(command([stroke, 'w']), command([cx + rx, cy, 'm']),
      command([cx + rx, cy + ry * k, cx + rx * k, cy + ry, cx, cy + ry, 'c']),
      command([cx - rx * k, cy + ry, cx - rx, cy + ry * k, cx - rx, cy, 'c']),
      command([cx - rx, cy - ry * k, cx - rx * k, cy - ry, cx, cy - ry, 'c']),
      command([cx + rx * k, cy - ry, cx + rx, cy - ry * k, cx + rx, cy, 'c']), 'h', 'S');
  } else if (type === 'rectangle') {
    lines.push(command([stroke, 'w']), command([inset, inset, width - stroke, height - stroke, 're']), 'S');
  } else {
    // A small paper icon; /Contents holds the Unicode sticky-note text.
    lines.push(command([inset, inset, width - stroke, height - stroke, 're']), 'f',
      '0.18 0.2 0.24 RG', command([stroke, 'w']),
      command([inset, inset, width - stroke, height - stroke, 're']), 'S');
    for (const y of [0.32, 0.5, 0.68]) {
      lines.push(command([width * 0.24, height * y, 'm']), command([width * 0.76, height * y, 'l']), 'S');
    }
  }
  lines.push('Q');
  const alpha = type === 'highlight' ? 0.32 : 1;
  const state = context.obj({ Type: 'ExtGState', ca: alpha, CA: alpha, BM: type === 'highlight' ? 'Multiply' : 'Normal' });
  return context.register(context.flateStream(lines.join('\n'), {
    Type: 'XObject', Subtype: 'Form', FormType: 1,
    BBox: [0, 0, width, height], Matrix: [1, 0, 0, 1, 0, 0],
    Resources: { ExtGState: { GS0: state } },
  }));
}

/**
 * Save the original PDF with added native Highlight, Text, Circle and Square
 * annotations. PDF bytes and marks remain in this browser. Notebook comments
 * are not accepted by this API and never enter the exported PDF.
 *
 * @param {Uint8Array|ArrayBuffer} originalBytes Untouched original file bytes.
 * @param {object} pdfjsDocument The opened PDF.js PDFDocumentProxy.
 * @param {Array<object>} annotations Normalized displayed-page rectangles.
 * @returns {Promise<Uint8Array>} A separate annotated copy of the PDF.
 */
export async function exportAnnotatedPDF(originalBytes, pdfjsDocument, annotations = []) {
  if (!(originalBytes instanceof Uint8Array) && !(originalBytes instanceof ArrayBuffer)) {
    throw new TypeError('Original PDF bytes are required to export an annotated copy. Reopen the PDF and try again.');
  }
  if (!pdfjsDocument?.getPage || !Number.isInteger(pdfjsDocument.numPages)) throw new TypeError('Open a PDF before exporting annotations.');
  if (!Array.isArray(annotations)) throw new TypeError('The annotation list is invalid.');
  let document;
  try {
    document = await PDFDocument.load(originalBytes, { updateMetadata: false });
  } catch (error) {
    if (/encrypt|password/i.test(error?.message || '')) {
      throw new Error('Export is unavailable for password-protected PDFs. Open an unencrypted copy that you are allowed to use, then export its annotations.');
    }
    throw new Error('This PDF could not be prepared for export. Reopen the original file and try again.', { cause: error });
  }
  const pages = document.getPages();
  if (pages.length !== pdfjsDocument.numPages) throw new Error('The PDF has changed. Reopen it before exporting annotations.');
  const viewports = new Map();
  const { context } = document;
  removeManagedMarks(document);
  for (const mark of annotations) {
    if (!SUBTYPES[mark?.type]) throw new Error('An annotation type is not supported for PDF export.');
    if (!Number.isInteger(mark.page) || mark.page < 1 || mark.page > pages.length) throw new Error('An annotation refers to a missing PDF page.');
    if (!Array.isArray(mark.rects) || !mark.rects.length) throw new Error('An annotation has no area. Remove that mark and try again.');
    if (!viewports.has(mark.page)) {
      const pdfjsPage = await pdfjsDocument.getPage(mark.page);
      viewports.set(mark.page, { viewport: pdfjsPage.getViewport({ scale: 1 }), userUnit: pdfjsPage.userUnit || 1 });
    }
    const { viewport, userUnit } = viewports.get(mark.page);
    const rects = mark.rects.map(box => pdfRect(viewport, box));
    const bounds = [Math.min(...rects.map(r => r[0])), Math.min(...rects.map(r => r[1])), Math.max(...rects.map(r => r[2])), Math.max(...rects.map(r => r[3]))];
    const color = colorComponents(mark.color);
    const page = pages[mark.page - 1];
    const annotation = context.obj({
      Type: 'Annot', Subtype: SUBTYPES[mark.type], Rect: bounds, P: page.ref,
      F: 4, // Print flag: marks remain visible when printing the downloaded PDF.
      C: color, CA: mark.type === 'highlight' ? 0.32 : 1,
      Border: [0, 0, mark.type === 'highlight' ? 0 : 1.5 / userUnit],
      BS: { Type: 'Border', W: mark.type === 'highlight' ? 0 : 1.5 / userUnit, S: 'S' },
      AP: { N: appearance(context, mark.type, bounds, rects, color, userUnit) },
    });
    annotation.set(MANAGED_KEY, context.obj(true));
    if (mark.id) annotation.set(PDFName.of('NM'), PDFHexString.fromText(String(mark.id)));
    if (mark.text) annotation.set(PDFName.of('Contents'), PDFHexString.fromText(String(mark.text)));
    if (mark.type === 'highlight') {
      annotation.set(PDFName.of('QuadPoints'), context.obj(rects.flatMap(([x0, y0, x1, y1]) => [x0, y1, x1, y1, x0, y0, x1, y0])));
    } else if (mark.type === 'note') {
      annotation.set(PDFName.of('Name'), PDFName.of('Comment'));
      annotation.set(PDFName.of('Open'), context.obj(false));
    }
    page.node.addAnnot(context.register(annotation));
  }
  // Notebook comments/private page markers are deliberately not embedded.
  document.catalog.set(REVIEW_KEY, PDFHexString.fromText(JSON.stringify({ version: 1,
    annotations: normalizeAnnotations(annotations, pages.length) })));
  return document.save({ useObjectStreams: true, addDefaultPage: false, updateFieldAppearances: false });
}
