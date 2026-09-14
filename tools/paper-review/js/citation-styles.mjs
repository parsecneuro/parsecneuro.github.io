/* Small local pattern dictionary, not an external reference database.
 * APA/Harvard: surname + initials or a group author, followed by a date.
 * IEEE/Vancouver: numbered entries; the publication date may occur much later.
 * Rules describe common boundaries, not validation against published records.
 * Sources (documentation only; no runtime requests):
 * https://apastyle.apa.org/style-grammar-guidelines/references/examples
 * https://journals.ieeeauthorcenter.ieee.org/wp-content/uploads/IEEE-Reference-Guide.pdf
 * https://www.nlm.nih.gov/bsd/uniform_requirements.html
 */
export const CITATION_STYLES = Object.freeze({
  'author-year': { name: 'Author–year (APA / Harvard)', dateNearAuthor: true },
  numbered: { name: 'Numbered (IEEE / Vancouver)', dateNearAuthor: false }
});

export const BIBLIOGRAPHY_HEADING = /^(?:(?:\d+(?:\.\d+)*|[IVXLCDM]+)[.)]?\s+)?(?:references(?:\s+and\s+notes)?|bibliography|literature\s+cited|works\s+cited|reference\s+list)\s*:?\s*$/i;
export const BIBLIOGRAPHY_END = /^(?:(?:\d+(?:\.\d+)*|[IVXLCDM]+)[.)]?\s+)?(?:appendix(?:\s+[A-Z\d]+)?|appendices|supplementary\s+(?:material|information)|supporting\s+information|acknowledg(?:e)?ments?|author\s+contributions?|funding|conflicts?\s+of\s+interest)\s*:?\s*$/i;
export const PUBLICATION_DATE = /\b(?:18|19|20)\d{2}[a-z]?\b|\bn\s*\.\s*d\s*\.|\bin\s+press\b/i;
export const GROUP_AUTHOR = /\b(?:organization|organisation|association|society|institute|institutes|department|committee|commission|agency|council|consortium|collaboration|bureau|office|university|universities|ministry|centers?|centres?|foundation|administration|observatory|bank|nations|group)\b/i;
export const JOURNAL_PREFIX = /^(?:journal\b|international\s+journal\b|american\s+journal\b|european\s+journal\b|proceedings\b|transactions\b|nature\b|science\b|scientific\s+reports\b|plos\b|frontiers\b|annual\s+review\b|neuroimage\b|cerebral\s+cortex\b|biological\s+psychiatry\b|brain\s+research\b)/i;
export const FAMILY_PARTICLES = '(?:(?:van|von|de|del|della|da|dos|du|la|le|der)\\s+)*';
export function normalizeStyle(style) { return Object.hasOwn(CITATION_STYLES, style) ? style : 'auto'; }
export function normalizeLayout(layout) { return ['single', 'double'].includes(layout) ? layout : 'auto'; }
