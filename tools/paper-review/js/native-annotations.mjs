/* Read existing PDF comments locally. Original annotation dictionaries remain
 * in the PDF; this layer never edits, copies, or flattens them. */
const MARKUP_TYPES = new Set(['Text', 'FreeText', 'Highlight', 'Underline', 'Squiggly',
  'StrikeOut', 'Square', 'Circle', 'Line', 'Polygon', 'PolyLine', 'Ink', 'Stamp', 'Caret', 'Redact']);
const textOf = value => typeof value === 'string' ? value : '';
const commentText = annotation => textOf(annotation.contentsObj?.str) || textOf(annotation.richText?.str) || textOf(annotation.contents);
const authorText = annotation => textOf(annotation.titleObj?.str) || textOf(annotation.title);
const shown = annotation => !(annotation.annotationFlags & (1 | 2 | 32)); // Invisible / Hidden / NoView
let dialogSerial = 0;

/** Coordinates in the displayed, rotated/cropped page, independent of zoom. */
export function nativeCommentAnchor(annotation, viewport) {
  let rect = annotation.subtype === 'Popup' ? annotation.parentRect || annotation.rect : annotation.rect;
  // Anchor a multiline highlight to its first line, not its entire bounding box.
  const points = annotation.quadPoints;
  if (points?.length >= 8 && Array.from(points).slice(0, 8).every(Number.isFinite)) {
    rect = [Math.min(points[0], points[2], points[4], points[6]), Math.min(points[1], points[3], points[5], points[7]),
      Math.max(points[0], points[2], points[4], points[6]), Math.max(points[1], points[3], points[5], points[7])];
  }
  if (!rect || rect.length !== 4 || !Array.from(rect).every(Number.isFinite) || !(viewport.width > 0 && viewport.height > 0)) return null;
  const corners = [[rect[0], rect[1]], [rect[0], rect[3]], [rect[2], rect[1]], [rect[2], rect[3]]]
    .map(([x, y]) => viewport.convertToViewportPoint(x, y));
  const left = Math.min(...corners.map(p => p[0])), right = Math.max(...corners.map(p => p[0]));
  const top = Math.min(...corners.map(p => p[1])), bottom = Math.max(...corners.map(p => p[1]));
  if (![left, right, top, bottom].every(Number.isFinite) || right <= 0 || bottom <= 0 || left >= viewport.width || top >= viewport.height || right <= left || bottom <= top) return null;
  // Keep badges beside highlighted/free-text content, instead of covering its
  // first words. A sticky-note icon uses the note's own rectangle.
  const x = annotation.subtype === 'Text' ? left : right;
  return { x: Math.max(0, Math.min(1, x / viewport.width)), y: Math.max(0, Math.min(1, top / viewport.height)) };
}

/** One badge per note/thread. A PDF Popup is usually a second representation
 * of its parent's comment; showing it again would duplicate the same text. */
export function nativeCommentThreads(annotations, viewport) {
  const visible = (Array.isArray(annotations) ? annotations : []).filter(a => a && shown(a));
  const popupParents = new Set(visible.filter(a => MARKUP_TYPES.has(a.subtype)).map(a => a.popupRef).filter(Boolean));
  const entries = visible.filter(a => MARKUP_TYPES.has(a.subtype) || a.subtype === 'Popup' && !popupParents.has(a.id));
  const indexed = new Map(entries.map(a => [a.id, a]));
  const grouped = new Map();
  for (const annotation of entries) {
    if (!commentText(annotation).trim() && annotation.subtype !== 'Text') continue;
    let root = annotation;
    const visited = new Set([root.id]);
    while (root.inReplyTo && indexed.has(root.inReplyTo) && !visited.has(root.inReplyTo)) {
      root = indexed.get(root.inReplyTo); visited.add(root.id);
    }
    const key = root.id || `comment-${entries.indexOf(root)}`;
    if (!grouped.has(key)) grouped.set(key, { id: key, source: root, entries: [] });
    const thread = grouped.get(key);
    const text = commentText(annotation), author = authorText(annotation);
    if (annotation.replyType === 'Group' && annotation !== root && text === commentText(root) && author === authorText(root)) continue;
    thread.entries.push({ id: annotation.id, author, text, reply: annotation !== root });
  }
  return Array.from(grouped.values()).map(thread => ({
    id: thread.id, type: thread.source.subtype,
    anchor: nativeCommentAnchor(thread.source, viewport),
    entries: thread.entries.sort((a, b) => Number(a.reply) - Number(b.reply))
  }));
}

export function createNativeCommentsLayer(threads, pageNumber, onOpen) {
  const layer = document.createElement('div');
  layer.className = 'review-native-comments';
  layer.setAttribute('aria-label', `Existing PDF comments on page ${pageNumber}`);
  let unplaced = 0;
  for (const thread of threads) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'review-native-comment';
    button.dataset.nativeComment = thread.id;
    button.setAttribute('aria-haspopup', 'dialog');
    const first = thread.entries[0];
    const label = `Existing PDF ${thread.type === 'Text' ? 'note' : 'comment'} on page ${pageNumber}${first?.author ? ' by ' + first.author : ''}`;
    button.setAttribute('aria-label', label);
    button.title = `${label}${first?.text ? ': ' + first.text.slice(0, 180) : ''}. Select to read.`;
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M4 4h16v12H9l-5 4V4ZM8 8h8M8 12h6');
    icon.append(path); button.append(icon);
    if (thread.anchor) {
      button.style.left = `clamp(0px, ${thread.anchor.x * 100}%, calc(100% - 22px))`;
      button.style.top = `clamp(0px, ${thread.anchor.y * 100}%, calc(100% - 22px))`;
    } else {
      // Notes outside the crop box or with no rectangle remain readable.
      button.classList.add('is-unplaced'); button.style.right = '4px'; button.style.top = `${4 + unplaced++ * 25}px`;
    }
    button.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); onOpen(thread, button); });
    layer.append(button);
  }
  return layer;
}

/** Plain text only: PDF rich-text HTML, actions, links and scripts are not run. */
export function openNativeCommentDialog(thread, pageNumber) {
  const dialog = document.createElement('dialog'); dialog.className = 'review-native-dialog';
  const heading = document.createElement('div'); heading.className = 'review-native-heading';
  const title = document.createElement('h2'); title.id = `native-pdf-comment-title-${++dialogSerial}`;
  title.textContent = `Existing PDF comment · page ${pageNumber}`; dialog.setAttribute('aria-labelledby', title.id);
  const close = document.createElement('button'); close.type = 'button'; close.textContent = '×';
  close.setAttribute('aria-label', 'Close PDF comment'); close.addEventListener('click', () => dialog.close());
  heading.append(title, close);
  const content = document.createElement('div'); content.className = 'review-native-comment-body';
  for (const entry of thread.entries) {
    const card = document.createElement('article');
    const author = document.createElement('p'); author.className = 'review-native-author'; author.dir = 'auto';
    author.textContent = `${entry.reply ? 'Reply' : 'Comment'}${entry.author ? ' · ' + entry.author : ''}`;
    const text = document.createElement('p'); text.className = 'review-native-comment-text'; text.dir = 'auto';
    text.textContent = entry.text || 'This annotation has no comment text.';
    card.append(author, text); content.append(card);
  }
  const help = document.createElement('p'); help.className = 'review-native-help';
  help.textContent = 'This comment is embedded in the PDF. It is read-only here and stays in the saved PDF. Your review notebook is separate.';
  dialog.append(heading, content, help);
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  document.body.append(dialog); dialog.showModal();
  return dialog;
}
