import { TextLayer, AnnotationMode } from '../vendor/pdfjs/pdf.mjs';
import { ANNOTATION_TOOLS, cleanAnnotation, dragRect, noteRect, textRectsForPage } from './annotation-geometry.mjs';
import { nativeCommentThreads, createNativeCommentsLayer, openNativeCommentDialog } from './native-annotations.mjs';

const PAGE_GAP = 12;
const STACK_PADDING = 12;
const HORIZONTAL_PADDING = 20;
const MAX_CANVAS_PIXELS = 4_000_000;
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Independent, continuous-scroll view of a shared PDF.js document. */
export class ReviewPane {
  constructor({ container, onPageChange = () => {}, onError = () => {}, onSelection = () => {},
    onAnnotationCreate = () => {}, onAnnotationSelect = () => {}, onAnnotationDelete = () => {} }) {
    if (!(container instanceof HTMLElement)) throw new TypeError('A PDF scroll container is required.');
    this.container = container;
    this.onPageChange = onPageChange;
    this.onError = onError;
    this.onSelection = onSelection;
    this.onAnnotationCreate = onAnnotationCreate;
    this.onAnnotationSelect = onAnnotationSelect;
    this.onAnnotationDelete = onAnnotationDelete;
    this.annotations = [];
    this._annotationsByPage = new Map();
    this.tool = 'select';
    this.color = '#f4d75e';
    this._gesture = null;
    this._nativeDialog = null;
    this._nativeDialogPage = null;
    this.pdf = null;
    this.pages = [];
    this.zoom = 'fit';
    this.currentPage = 0;
    this._version = 0;
    this._running = 0;
    this._wanted = new Set();
    this._frame = 0;
    this._resizeFrame = 0;
    this._lastWidth = container.clientWidth;
    this._lastHeight = container.clientHeight;
    this._destroyed = false;
    this.stack = document.createElement('div');
    this.stack.className = 'review-pdf-stack';
    this.stack.dataset.annotationTool = this.tool;
    this.container.append(this.stack);
    this._scrollHandler = () => {
      if (this._gesture && !this._gesture.nativeSelection && this._gesture.tool !== 'hand') this._cancelGesture();
      this._schedule();
    };
    this._selectionHandler = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !this.container.contains(selection.anchorNode)) return;
      const text = selection.toString().trim();
      if (!text) return;
      const node = selection.anchorNode.nodeType === Node.ELEMENT_NODE
        ? selection.anchorNode : selection.anchorNode.parentElement;
      this.onSelection({ text, page: Number(node?.closest('[data-page-number]')?.dataset.pageNumber) || this.currentPage });
    };
    this._pointerDownHandler = event => this._pointerDown(event);
    this._pointerMoveHandler = event => this._pointerMove(event);
    this._pointerUpHandler = event => { this._pointerUp(event); this._selectionHandler(); };
    this._outsidePointerUpHandler = event => {
      if (this._gesture && !this.container.contains(event.target)) this._pointerUp(event);
    };
    this._pointerCancelHandler = () => this._cancelGesture();
    this._annotationClickHandler = event => this._annotationClick(event);
    this._keyHandler = event => {
      if (event.key === 'Escape' && this._gesture) {
        if (this._gesture.nativeSelection) window.getSelection()?.removeAllRanges();
        this._cancelGesture();
        event.preventDefault();
      }
    };
    this._annotationKeyHandler = event => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.closest?.('[data-annotation-id]')) {
        this._annotationClick(event);
        event.preventDefault();
      }
    };
    this.container.addEventListener('scroll', this._scrollHandler, { passive: true });
    this.container.addEventListener('pointerdown', this._pointerDownHandler);
    this.container.addEventListener('pointermove', this._pointerMoveHandler);
    this.container.addEventListener('pointerup', this._pointerUpHandler);
    this.container.addEventListener('pointercancel', this._pointerCancelHandler);
    this.container.addEventListener('click', this._annotationClickHandler);
    this.container.addEventListener('keydown', this._annotationKeyHandler);
    this.container.addEventListener('keyup', this._selectionHandler);
    document.addEventListener('keydown', this._keyHandler);
    document.addEventListener('pointerup', this._outsidePointerUpHandler);
    this._resizeObserver = new ResizeObserver(() => {
      if (this._destroyed || this._resizeFrame) return;
      this._resizeFrame = requestAnimationFrame(() => {
        this._resizeFrame = 0;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const widthChanged = Math.abs(width - this._lastWidth) > 1;
        const heightChanged = Math.abs(height - this._lastHeight) > 1;
        if (widthChanged || heightChanged) {
          this._lastWidth = width;
          this._lastHeight = height;
          if (width > 0 && (heightChanged || this.zoom === 'fit')) this._relayout(true);
        }
        this._schedule();
      });
    });
    this._resizeObserver.observe(container);
  }

  /** Does not take ownership of or destroy the shared PDFDocumentProxy. */
  async setDocument(pdf) {
    this.clear();
    if (!pdf || this._destroyed) return;
    this.pdf = pdf;
    const version = this._version;
    try {
      const first = await pdf.getPage(1);
      if (version !== this._version) return;
      const initial = first.getViewport({ scale: 1 });
      const fragment = document.createDocumentFragment();
      for (let index = 0; index < pdf.numPages; index++) {
        const element = document.createElement('section');
        element.className = 'review-pdf-page';
        element.dataset.pageNumber = String(index + 1);
        element.setAttribute('aria-label', `PDF page ${index + 1}`);
        const placeholder = document.createElement('div');
        placeholder.className = 'review-pdf-placeholder';
        placeholder.textContent = `Page ${index + 1}`;
        placeholder.setAttribute('aria-hidden', 'true');
        element.append(placeholder);
        fragment.append(element);
        this.pages.push({
          number: index + 1, element, placeholder,
          baseWidth: initial.width, baseHeight: initial.height,
          userUnit: first.userUnit || 1,
          top: 0, width: 0, height: 0, scale: 1,
          status: 'empty', token: 0, renderTask: null, textLayer: null, canvas: null,
          annotationLayer: null,
        });
      }
      this.stack.append(fragment);
      this._relayout(false);
      this._setCurrent(1);
      this._schedule();
      // Fetch dimensions with bounded concurrency. Page proxies stay shared; we
      // never call page.cleanup(), which could disrupt the other reader panel.
      this._measurePages(pdf, version);
    } catch (error) {
      if (version !== this._version) return;
      this.onError(error);
      throw error;
    }
  }

  goToPage(number) {
    if (!this.pages.length) return;
    const n = Math.max(1, Math.min(this.pages.length, Math.trunc(Number(number)) || 1));
    const page = this.pages[n - 1];
    this.container.scrollTop = Math.max(0, page.top - STACK_PADDING);
    this._setCurrent(n);
    this._schedule();
  }

  setZoom(value) {
    const next = value === 'fit' ? 'fit' : Math.max(0.25, Math.min(4, Number(value) || 1));
    if (next === this.zoom) return;
    this.zoom = next;
    this._relayout(true);
  }

  zoomBy(direction) {
    const current = this.zoom === 'fit' ? (this.pages[this.currentPage - 1]?.scale || 1) : this.zoom;
    const next = Math.round(Math.max(.25, Math.min(4, current * (direction > 0 ? 1.2 : 1 / 1.2))) * 100) / 100;
    this.setZoom(next);
    return next;
  }

  /** Root controller owns persistence and broadcasts the same records to both panes. */
  setAnnotations(records) {
    this.annotations = (Array.isArray(records) ? records : []).map(cleanAnnotation).filter(Boolean);
    this._annotationsByPage = new Map();
    for (const annotation of this.annotations) {
      if (!this._annotationsByPage.has(annotation.page)) this._annotationsByPage.set(annotation.page, []);
      this._annotationsByPage.get(annotation.page).push(annotation);
    }
    for (const page of this.pages) if (page.status === 'ready') this._renderAnnotations(page);
  }

  setTool(tool, color = '#f4d75e') {
    this._cancelGesture();
    this.tool = ANNOTATION_TOOLS.has(tool) ? tool : 'select';
    this.color = /^#[0-9a-f]{6}$/i.test(color) ? color : '#f4d75e';
    this.stack.dataset.annotationTool = this.tool;
    this.container.dataset.panTool = this.tool === 'hand' ? 'hand' : '';
    for (const page of this.pages) {
      page.annotationLayer?.querySelectorAll('[data-annotation-id]').forEach(mark => {
        mark.setAttribute('tabindex', this.tool === 'select' || this.tool === 'erase' ? '0' : '-1');
      });
      this._setNativeCommentInteraction(page);
    }
  }

  clear() {
    this._cancelGesture();
    this._closeNativeDialog();
    this.annotations = [];
    this._annotationsByPage.clear();
    this._version++;
    this.pdf = null;
    this._wanted.clear();
    this.pages.forEach(page => this._release(page));
    this.pages = [];
    this.stack.replaceChildren();
    this.container.scrollTop = 0;
    this.container.scrollLeft = 0;
    this._setCurrent(0);
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.clear();
    cancelAnimationFrame(this._frame);
    cancelAnimationFrame(this._resizeFrame);
    this._resizeObserver.disconnect();
    this.container.removeEventListener('scroll', this._scrollHandler);
    this.container.removeEventListener('pointerdown', this._pointerDownHandler);
    this.container.removeEventListener('pointermove', this._pointerMoveHandler);
    this.container.removeEventListener('pointerup', this._pointerUpHandler);
    this.container.removeEventListener('pointercancel', this._pointerCancelHandler);
    this.container.removeEventListener('click', this._annotationClickHandler);
    this.container.removeEventListener('keydown', this._annotationKeyHandler);
    this.container.removeEventListener('keyup', this._selectionHandler);
    document.removeEventListener('keydown', this._keyHandler);
    document.removeEventListener('pointerup', this._outsidePointerUpHandler);
    this.stack.remove();
  }

  async _measurePages(pdf, version) {
    let cursor = 1;
    const worker = async () => {
      while (version === this._version && cursor < pdf.numPages) {
        const number = ++cursor;
        try {
          const page = await pdf.getPage(number);
          if (version !== this._version) return;
          const viewport = page.getViewport({ scale: 1 });
          const record = this.pages[number - 1];
          const userUnit = page.userUnit || 1;
          if (Math.abs(viewport.width - record.baseWidth) > 0.1 || Math.abs(viewport.height - record.baseHeight) > 0.1 || record.userUnit !== userUnit) {
            record.baseWidth = viewport.width;
            record.baseHeight = viewport.height;
            record.userUnit = userUnit;
            this._relayout(true);
          }
        } catch (error) {
          if (version === this._version) this.onError(error);
          return;
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }

  _anchor() {
    const index = this._findPage(this.container.scrollTop + STACK_PADDING);
    const page = this.pages[index];
    return page ? { index, fraction: (this.container.scrollTop - page.top) / page.height } : null;
  }

  _relayout(preservePosition) {
    if (!this.pages.length) return;
    this._cancelGesture();
    const anchor = preservePosition ? this._anchor() : null;
    const availableWidth = Math.max(120, this.container.clientWidth - HORIZONTAL_PADDING);
    let top = STACK_PADDING;
    for (const page of this.pages) {
      const scale = this.zoom === 'fit' ? availableWidth / page.baseWidth : this.zoom;
      const width = page.baseWidth * scale;
      const height = page.baseHeight * scale;
      if (Math.abs(page.width - width) > 0.1 || Math.abs(page.height - height) > 0.1) this._release(page);
      Object.assign(page, { top, width, height, scale });
      page.element.style.width = `${width}px`;
      page.element.style.height = `${height}px`;
      page.element.style.setProperty('--scale-factor', String(scale));
      page.element.style.setProperty('--total-scale-factor', String(scale * page.userUnit));
      top += height + PAGE_GAP;
    }
    // A short final page can still be aligned with the top reading position.
    this.stack.style.paddingBottom = `${Math.max(STACK_PADDING,
      this.container.clientHeight - this.pages.at(-1).height - STACK_PADDING)}px`;
    if (anchor) {
      const page = this.pages[anchor.index];
      this.container.scrollTop = Math.max(0, page.top + anchor.fraction * page.height);
    }
    this._schedule();
  }

  _findPage(y) {
    let low = 0, high = this.pages.length - 1;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      const page = this.pages[middle];
      if (page.top + page.height + PAGE_GAP / 2 < y) low = middle + 1;
      else high = middle;
    }
    return low;
  }

  _setCurrent(number) {
    if (number === this.currentPage) return;
    this.currentPage = number;
    this.onPageChange(number);
  }

  _schedule() {
    if (this._destroyed || this._frame) return;
    this._frame = requestAnimationFrame(() => {
      this._frame = 0;
      this._updateVisible();
    });
  }

  _updateVisible() {
    if (!this.pdf || !this.pages.length || !this.container.clientHeight) return;
    const top = this.container.scrollTop;
    const height = this.container.clientHeight;
    const first = this._findPage(top + 1);
    const last = this._findPage(top + height - 1);
    // The page at the upper reading line is the page tagged on a new comment.
    this._setCurrent(this._findPage(top + Math.min(80, height * 0.15)) + 1);
    const start = Math.max(0, first - 1);
    const end = Math.min(this.pages.length - 1, last + 1);
    this._wanted = new Set();
    // Visible pages first, then one page on either side for smooth scrolling.
    for (let index = first; index <= last; index++) this._wanted.add(index);
    if (start < first) this._wanted.add(start);
    if (end > last) this._wanted.add(end);
    for (const page of this.pages) {
      if (!this._wanted.has(page.number - 1) && page.status !== 'empty') this._release(page);
    }
    this._pump();
  }

  _pump() {
    if (!this.pdf || this._destroyed) return;
    for (const index of this._wanted) {
      if (this._running >= 2) break;
      const page = this.pages[index];
      if (!page || page.status !== 'empty') continue;
      this._running++;
      page.status = 'rendering';
      this._render(page).finally(() => {
        this._running--;
        this._pump();
      });
    }
  }

  async _render(record) {
    const version = this._version;
    const token = ++record.token;
    const pdf = this.pdf;
    const valid = () => version === this._version && token === record.token && !this._destroyed;
    try {
      const page = await pdf.getPage(record.number);
      if (!valid()) return;
      record.userUnit = page.userUnit || 1;
      const viewport = page.getViewport({ scale: record.scale });
      const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(MAX_CANVAS_PIXELS / (viewport.width * viewport.height)));
      const canvas = document.createElement('canvas');
      canvas.className = 'review-pdf-canvas';
      canvas.width = Math.max(1, Math.floor(viewport.width * ratio));
      canvas.height = Math.max(1, Math.floor(viewport.height * ratio));
      canvas.setAttribute('aria-hidden', 'true');
      record.canvas = canvas;
      record.element.append(canvas);
      record.element.setAttribute('aria-busy', 'true');
      record.element.style.setProperty('--total-scale-factor', String(record.scale * (page.userUnit || 1)));
      record.renderTask = page.render({
        canvas,
        viewport,
        transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0],
        background: '#ffffff',
        annotationMode: AnnotationMode.ENABLE,
      });
      await record.renderTask.promise;
      if (!valid()) return;
      record.renderTask = null;
      record.placeholder.hidden = true;
      const textContent = await page.getTextContent();
      if (!valid()) return;
      const hasText = textContent.items.some(item => item.str?.trim());
      if (hasText) {
        const textContainer = document.createElement('div');
        textContainer.className = 'textLayer review-pdf-text';
        textContainer.setAttribute('aria-label', `Text of PDF page ${record.number}`);
        record.element.append(textContainer);
        const textLayer = new TextLayer({ textContentSource: textContent, container: textContainer, viewport });
        record.textLayer = textLayer;
        await textLayer.render();
        if (!valid()) return;
      } else {
        canvas.removeAttribute('aria-hidden');
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', `PDF page ${record.number}. This page has no selectable text; it may contain scanned content or a figure.`);
      }
      try {
        const embedded = await page.getAnnotations({ intent: 'display' });
        if (!valid()) return;
        const threads = nativeCommentThreads(embedded, viewport);
        if (threads.length) {
          record.nativeCommentLayer = createNativeCommentsLayer(threads, record.number, thread => {
            if (this.tool !== 'select') return;
            this._closeNativeDialog();
            this._nativeDialog = openNativeCommentDialog(thread, record.number);
            this._nativeDialogPage = record.number;
          });
          record.element.append(record.nativeCommentLayer);
          this._setNativeCommentInteraction(record);
        }
      } catch (error) {
        if (!valid()) return;
        this.onError(new Error(`Existing PDF comments on page ${record.number} could not be loaded. ${error.message}`, { cause: error }));
      }
      record.status = 'ready';
      this._renderAnnotations(record);
      record.element.removeAttribute('aria-busy');
    } catch (error) {
      if (!valid() || error?.name === 'RenderingCancelledException' || error?.name === 'AbortException') return;
      this._release(record);
      record.status = 'error';
      record.element.removeAttribute('aria-busy');
      record.placeholder.hidden = false;
      record.placeholder.textContent = `Page ${record.number} could not be rendered. Try reopening the PDF.`;
      this.onError(error);
    }
  }

  _svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    return element;
  }

  _setNativeCommentInteraction(page) {
    page.nativeCommentLayer?.querySelectorAll('[data-native-comment]').forEach(button => {
      button.disabled = this.tool !== 'select';
      button.tabIndex = this.tool === 'select' ? 0 : -1;
    });
  }

  _closeNativeDialog() {
    if (this._nativeDialog?.open) this._nativeDialog.close();
    this._nativeDialog?.remove();
    this._nativeDialog = null;
    this._nativeDialogPage = null;
  }

  _renderAnnotations(page) {
    if (!page.annotationLayer) {
      page.annotationLayer = this._svgElement('svg', { viewBox: '0 0 1 1', preserveAspectRatio: 'none',
        class: 'review-annotation-layer', 'aria-label': `Annotations on PDF page ${page.number}` });
      page.element.append(page.annotationLayer);
    }
    page.annotationLayer.replaceChildren();
    for (const annotation of this._annotationsByPage.get(page.number) || []) {
      page.annotationLayer.append(this._annotationElement(annotation));
    }
    if (this._gesture?.page === page) this._updatePreview();
  }

  _annotationElement(annotation, preview = false) {
    const group = this._svgElement('g', { class: `review-annotation review-annotation-${annotation.type}${preview ? ' is-preview' : ''}` });
    if (!preview && annotation.id) {
      group.dataset.annotationId = annotation.id;
      group.setAttribute('tabindex', this.tool === 'select' || this.tool === 'erase' ? '0' : '-1');
      group.setAttribute('role', 'button');
      group.setAttribute('aria-label', `${annotation.type} on page ${annotation.page}${annotation.text ? ': ' + annotation.text : ''}. Select to edit or remove.`);
      const title = this._svgElement('title');
      title.textContent = annotation.text || `${annotation.type} — click to edit or remove`;
      group.append(title);
    } else group.setAttribute('aria-hidden', 'true');
    for (const rect of annotation.rects) {
      const common = { fill: annotation.color, stroke: annotation.color, 'stroke-width': 2,
        'vector-effect': 'non-scaling-stroke' };
      let shape;
      if (annotation.type === 'ellipse') {
        shape = this._svgElement('ellipse', { ...common, cx: rect.x + rect.width / 2, cy: rect.y + rect.height / 2,
          rx: rect.width / 2, ry: rect.height / 2, 'fill-opacity': 0.04 });
      } else if (annotation.type === 'note') {
        shape = this._svgElement('rect', { ...rect, ...common, rx: rect.width * 0.12, ry: rect.height * 0.12,
          'fill-opacity': 0.94, stroke: '#614d17', 'stroke-width': 1 });
        group.append(shape);
        for (let line = 0; line < 3; line++) {
          group.append(this._svgElement('line', { x1: rect.x + rect.width * 0.23, x2: rect.x + rect.width * 0.77,
            y1: rect.y + rect.height * (0.3 + line * 0.2), y2: rect.y + rect.height * (0.3 + line * 0.2),
            stroke: '#453811', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke', 'pointer-events': 'none' }));
        }
        continue;
      } else {
        shape = this._svgElement('rect', { ...rect, ...common, 'fill-opacity': annotation.type === 'highlight' ? 0.34 : 0.04,
          'stroke-width': annotation.type === 'highlight' ? 0 : 2 });
      }
      group.append(shape);
    }
    return group;
  }

  _pageFromTarget(target) {
    const element = target.closest?.('.review-pdf-page');
    if (!element || !this.container.contains(element)) return null;
    return this.pages[Number(element.dataset.pageNumber) - 1] || null;
  }

  _pointerDown(event) {
    if (event.button !== 0 || event.isPrimary === false || this.tool === 'select' || this.tool === 'erase') return;
    if (this.tool === 'hand' && this.pdf) {
      this._cancelGesture();
      this._gesture = { tool: 'hand', pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY },
        scrollLeft: this.container.scrollLeft, scrollTop: this.container.scrollTop };
      this.container.dataset.panning = 'true';
      window.getSelection()?.removeAllRanges();
      event.preventDefault();
      try { this.container.setPointerCapture(event.pointerId); } catch {}
      return;
    }
    const page = this._pageFromTarget(event.target);
    if (!page || page.status !== 'ready') return;
    this._cancelGesture();
    const span = event.target.closest?.('.review-pdf-text span');
    const nativeSelection = this.tool === 'highlight' && !!span?.textContent?.trim();
    const point = { x: event.clientX, y: event.clientY };
    this._gesture = { pointerId: event.pointerId, page, bounds: page.element.getBoundingClientRect(),
      start: point, end: point, tool: this.tool, color: this.color, nativeSelection, preview: null };
    if (nativeSelection) {
      // Native text selection supplies exact line rectangles, including wrapped lines.
      window.getSelection()?.removeAllRanges();
      return;
    }
    // No touch-action override: a touch pan cancels the gesture and still scrolls.
    // Mouse/pen drawing uses capture so the final rectangle clips at the page edge.
    if (event.pointerType !== 'touch') {
      event.preventDefault();
      try { page.element.setPointerCapture(event.pointerId); } catch {}
    }
    this._updatePreview();
  }

  _pointerMove(event) {
    const gesture = this._gesture;
    if (!gesture || event.pointerId !== gesture.pointerId || gesture.nativeSelection) return;
    if (gesture.tool === 'hand') {
      event.preventDefault();
      this.container.scrollLeft = gesture.scrollLeft - (event.clientX - gesture.start.x);
      this.container.scrollTop = gesture.scrollTop - (event.clientY - gesture.start.y);
      this._schedule();
      return;
    }
    gesture.end = { x: event.clientX, y: event.clientY };
    if (event.pointerType !== 'touch') event.preventDefault();
    this._updatePreview();
  }

  _updatePreview() {
    const gesture = this._gesture;
    if (!gesture || gesture.nativeSelection || !gesture.page.annotationLayer) return;
    gesture.preview?.remove();
    const rect = gesture.tool === 'note' ? noteRect(gesture.start, gesture.bounds)
      : dragRect(gesture.start, gesture.end, gesture.bounds, 1);
    if (!rect) return;
    gesture.preview = this._annotationElement({ type: gesture.tool, page: gesture.page.number,
      color: gesture.color, rects: [rect] }, true);
    gesture.page.annotationLayer.append(gesture.preview);
  }

  _pointerUp(event) {
    const gesture = this._gesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    if (gesture.tool === 'hand') { this._cancelGesture(); return; }
    gesture.end = { x: event.clientX, y: event.clientY };
    if (gesture.nativeSelection) {
      const annotations = this._textHighlights(gesture.color);
      this._cancelGesture();
      if (annotations.length) {
        window.getSelection()?.removeAllRanges();
        for (const annotation of annotations) this.onAnnotationCreate(annotation);
      }
      return;
    }
    const distance = Math.hypot(gesture.end.x - gesture.start.x, gesture.end.y - gesture.start.y);
    const rect = gesture.tool === 'note' ? (distance <= 6 ? noteRect(gesture.start, gesture.bounds) : null)
      : dragRect(gesture.start, gesture.end, gesture.bounds);
    this._cancelGesture();
    if (rect) this.onAnnotationCreate({ type: gesture.tool, page: gesture.page.number,
      rects: [rect], color: gesture.color, text: '' });
  }

  _textHighlights(color) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !this.container.contains(selection.anchorNode)) return [];
    const annotations = [];
    for (const page of this.pages) {
      const textLayer = page.element.querySelector('.review-pdf-text');
      if (!textLayer) continue;
      const clientRects = [];
      const selectedText = [];
      for (let index = 0; index < selection.rangeCount; index++) {
        const range = selection.getRangeAt(index);
        if (!range.intersectsNode(textLayer)) continue;
        // Restrict each range to actual text spans. A full-page ancestor rectangle
        // from Range.getClientRects() must not turn a text highlight into a page wash.
        for (const span of textLayer.querySelectorAll('span')) {
          if (!span.textContent.trim() || span.querySelector('span') || !range.intersectsNode(span)) continue;
          const part = document.createRange();
          part.selectNodeContents(span);
          if (span.contains(range.startContainer)) part.setStart(range.startContainer, range.startOffset);
          if (span.contains(range.endContainer)) part.setEnd(range.endContainer, range.endOffset);
          if (!part.toString().trim()) continue;
          clientRects.push(...part.getClientRects());
          selectedText.push(part.toString());
        }
      }
      const rects = textRectsForPage(clientRects, page.element.getBoundingClientRect());
      if (rects.length) annotations.push({ type: 'highlight', page: page.number, rects, color, text: selectedText.join(' ').trim() });
    }
    return annotations;
  }

  _cancelGesture() {
    const gesture = this._gesture;
    if (!gesture) return;
    this._gesture = null;
    gesture.preview?.remove();
    if (gesture.tool === 'hand') {
      delete this.container.dataset.panning;
      try { if (this.container.hasPointerCapture(gesture.pointerId)) this.container.releasePointerCapture(gesture.pointerId); } catch {}
      return;
    }
    try {
      if (gesture.page.element.hasPointerCapture(gesture.pointerId)) gesture.page.element.releasePointerCapture(gesture.pointerId);
    } catch {}
  }

  _annotationClick(event) {
    if (this.tool !== 'select' && this.tool !== 'erase') return;
    const target = event.target.closest?.('[data-annotation-id]');
    if (!target || !this.container.contains(target)) return;
    const annotation = this.annotations.find(record => String(record.id) === target.dataset.annotationId);
    if (!annotation) return;
    event.preventDefault();
    if (this.tool === 'erase') this.onAnnotationDelete(annotation.id);
    else this.onAnnotationSelect(annotation);
  }

  _release(page) {
    if (this._gesture?.page === page) this._cancelGesture();
    if (this._nativeDialogPage === page.number) this._closeNativeDialog();
    page.token++;
    page.renderTask?.cancel();
    page.renderTask = null;
    page.textLayer?.cancel();
    page.textLayer = null;
    if (page.canvas) {
      page.canvas.width = 0;
      page.canvas.height = 0;
      page.canvas.remove();
      page.canvas = null;
    }
    page.element.querySelector('.review-pdf-text')?.remove();
    page.annotationLayer?.remove();
    page.annotationLayer = null;
    page.nativeCommentLayer?.remove();
    page.nativeCommentLayer = null;
    page.element.removeAttribute('aria-busy');
    page.status = 'empty';
    page.placeholder.hidden = false;
    page.placeholder.textContent = `Page ${page.number}`;
  }
}
