/** Annotation coordinates are fractions of the displayed PDF page, independent of zoom. */
export const ANNOTATION_TOOLS = new Set(['select', 'hand', 'highlight', 'note', 'ellipse', 'rectangle', 'erase']);
export const ANNOTATION_TYPES = new Set(['highlight', 'note', 'ellipse', 'rectangle']);

export function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

/** Return a clipped normalized rectangle, or null for an empty/invalid intersection. */
export function normalizeClientRect(rect, bounds) {
  const values = [rect.left, rect.top, rect.width, rect.height, bounds.left, bounds.top, bounds.width, bounds.height];
  if (!values.every(Number.isFinite) || bounds.width <= 0 || bounds.height <= 0 || rect.width <= 0 || rect.height <= 0) return null;
  const left = Math.max(rect.left, bounds.left);
  const top = Math.max(rect.top, bounds.top);
  const right = Math.min(rect.left + rect.width, bounds.left + bounds.width);
  const bottom = Math.min(rect.top + rect.height, bounds.top + bounds.height);
  if (right <= left || bottom <= top) return null;
  return { x: clamp((left - bounds.left) / bounds.width), y: clamp((top - bounds.top) / bounds.height),
    width: clamp((right - left) / bounds.width), height: clamp((bottom - top) / bounds.height) };
}

export function dragRect(start, end, bounds, minimumPixels = 3) {
  const left = Math.max(bounds.left, Math.min(start.x, end.x));
  const top = Math.max(bounds.top, Math.min(start.y, end.y));
  const right = Math.min(bounds.left + bounds.width, Math.max(start.x, end.x));
  const bottom = Math.min(bounds.top + bounds.height, Math.max(start.y, end.y));
  if (right - left < minimumPixels || bottom - top < minimumPixels) return null;
  return normalizeClientRect({ left, top, width: right - left, height: bottom - top }, bounds);
}

export function noteRect(point, bounds, sizePixels = 22) {
  if (!(bounds.width > 0 && bounds.height > 0)) return null;
  const width = Math.min(1, sizePixels / bounds.width);
  const height = Math.min(1, sizePixels / bounds.height);
  return { x: clamp((point.x - bounds.left) / bounds.width, 0, 1 - width),
    y: clamp((point.y - bounds.top) / bounds.height, 0, 1 - height), width, height };
}

/** Merge overlapping pieces of the same selected text line, retaining separate lines. */
export function textRectsForPage(clientRects, bounds) {
  const rects = clientRects.map(rect => normalizeClientRect(rect, bounds)).filter(Boolean)
    .filter(rect => rect.width * bounds.width >= 0.5 && rect.height * bounds.height >= 0.5)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const merged = [];
  for (const rect of rects) {
    const previous = merged.at(-1);
    const sameLine = previous && Math.abs(previous.y - rect.y) * bounds.height <= 2
      && Math.abs(previous.height - rect.height) * bounds.height <= 2
      && rect.x <= previous.x + previous.width + 3 / bounds.width
      && rect.x + rect.width >= previous.x - 3 / bounds.width;
    if (sameLine) {
      const right = Math.max(previous.x + previous.width, rect.x + rect.width);
      const bottom = Math.max(previous.y + previous.height, rect.y + rect.height);
      previous.x = Math.min(previous.x, rect.x);
      previous.y = Math.min(previous.y, rect.y);
      previous.width = right - previous.x;
      previous.height = bottom - previous.y;
    } else merged.push({ ...rect });
  }
  return merged;
}

/** Defensive copy: malformed saved values can never create off-page SVG elements. */
export function cleanAnnotation(record) {
  if (!record || !ANNOTATION_TYPES.has(record.type) || !Number.isInteger(record.page) || record.page < 1 || !Array.isArray(record.rects)) return null;
  const rects = record.rects.map(rect => rect && normalizeClientRect(
    { left: rect.x, top: rect.y, width: rect.width, height: rect.height },
    { left: 0, top: 0, width: 1, height: 1 })).filter(Boolean);
  if (!rects.length) return null;
  return { ...record, rects, color: /^#[0-9a-f]{6}$/i.test(record.color) ? record.color : '#f4d75e',
    text: typeof record.text === 'string' ? record.text : '' };
}
