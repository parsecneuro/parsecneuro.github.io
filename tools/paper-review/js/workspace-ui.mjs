/* Upgrade existing Alpha 1 HTML in place, preserving the owner's counter CSP. */
const paths = {
  hand: '<path d="M8 12V5a2 2 0 0 1 4 0v6-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v9c0 4-3 7-7 7-3 0-5-2-7-5l-3-4a2 2 0 0 1 3-2l2 2Z"/>',
  redo: '<path d="m15 5 5 5-5 5M20 10H10a6 6 0 0 0 0 12"/>'
};
function button(id, label, icon) {
  const element = document.createElement('button');
  element.id = id; element.type = 'button'; element.className = 'annotation-tool';
  element.title = label; element.setAttribute('aria-label', label); element.disabled = true;
  if (icon) element.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[icon]}</svg>`;
  return element;
}
export function upgradeWorkspaceUI() {
  const $ = id => document.getElementById(id);
  for (const side of ['left', 'right']) {
    const name = side === 'left' ? 'Main text' : 'Companion';
    const zoom = $(`${side}-zoom`);
    if (!$(`${side}-zoom-in`)) {
      const label = zoom.parentElement;
      const group = document.createElement('div'); group.className = 'zoom-controls';
      label.parentElement.insertBefore(group, label);
      const minus = button(`${side}-zoom-out`, `${name}: zoom out`); minus.textContent = '−';
      const plus = button(`${side}-zoom-in`, `${name}: zoom in`); plus.textContent = '+';
      group.append(minus, label, plus);
    }
    if (!$(`${side}-hand`)) {
      const hand = button(`${side}-hand`, `${name}: hand / drag to pan`, 'hand');
      hand.dataset.annotationTool = 'hand'; hand.dataset.side = side; hand.setAttribute('aria-pressed', 'false');
      $(`${side}-annotations`).insertBefore(hand, $(`${side}-annotations`).children[1]);
    }
    if (!$(`${side}-redo`)) {
      const redo = button(`${side}-redo`, `${name}: redo annotation change`, 'redo');
      const undo = $(`${side}-undo`); undo.parentElement.insertBefore(redo, undo.nextSibling);
    }
  }
  $('export-marked-pdf').textContent = 'Save PDF';
  $('export-marked-pdf').title = 'Save PDF annotations to the selected file, or choose a save location';
  $('clear-review').textContent = 'Close PDF';
  $('clear-review').title = 'Close the PDF and clear this workspace after confirmation';
  document.querySelector('.version').textContent = 'ALPHA 2';
  document.querySelector('.help-content').innerHTML = `
    <h3>Read and navigate</h3><p>Open a PDF. Each view has its own zoom buttons and zoom menu. Select the hand tool and drag to move around the page. Drag the dividers to resize the views and notebook.</p>
    <h3>Comments and annotations</h3><p>Start a comment to link the current left-hand page. Add it to the notebook, then use View all comments to edit the review. TXT includes saved comments and an unfinished draft, without automatic page markers.</p><p>Use the annotation tools to highlight, write PDF notes, and draw circles or rectangles. Undo and Redo work across both views. A new annotation change clears the redo list.</p>
    <h3>Save your PDF</h3><p>Save PDF writes your annotations into the selected file when the browser supports file access and you grant permission. PDFs opened through drag and drop may need a save-location prompt. Other browsers download a saved copy. The status message tells you which happened. Notebook comments are separate: keep them using Export .txt.</p><p>PDF notes saved by Alpha 2 can be edited again when you reopen the saved PDF. Saving password-protected PDFs is not supported. If another program changes the selected file, reopen it before saving here.</p>
    <h3>Before leaving a review</h3><p>Opening another PDF, closing the PDF, or returning to Tools asks for confirmation before clearing the current workspace's comments, annotations, and extracted references. Save PDF and export your comments first. Cancelling keeps your review open. A PDF that fails to open does not clear the current review.</p><p>Closing or reloading the tab uses the browser's standard leave warning. Browsers choose its wording and may suppress it, especially on mobile. Clearing runs when a normal page exit is reported. Switching tabs does not clear the review.</p>
    <h3>What stays local</h3><p>PDF reading, annotation, and English OCR run locally with bundled files. PDFs, filenames, notes, and references are not uploaded. Browser saving protects work while the review is open; confirmed exits clear this review's stored workspace data. Exported TXT files and saved PDFs remain on your computer.</p>
    <h3>App opening counter</h3><p>When enabled, opening this app sends only its app identifier and a random request ID to the counter service. It does not send your PDF or review content.</p>
    <h3>References</h3><p>The local parser keeps wrapped bibliography lines together using citation patterns and page layout. Complex references may still need correction. Choose the style/layout, use the Original method if helpful, or use Merge with previous to repair a split entry. Extracting again rebuilds the list. Google links are optional and send the selected citation only when you open one.</p>`;
  document.querySelector('#privacy-dialog .eyebrow').textContent = 'PAPER REVIEW / ALPHA 2';
}
