import * as pdfjs from '../vendor/pdfjs/pdf.mjs';
import {ReviewPane} from './viewer.mjs';
import {exportAnnotatedPDF} from './annotation-export.mjs';
import {extractReferences,parseReferences} from './references.mjs';
import {extractReferences as extractOriginalReferences,parseReferences as parseOriginalReferences} from './references-original.mjs';
import {newReview,normalizeReview,normalizeAnnotations,exportReviewText,updateDraft,commitDraft} from './review-state.mjs';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.mjs',import.meta.url).href;
const $ = id => document.getElementById(id);
let pdf=null, review=newReview(), storageKey=null, fileName='', loading=false;
let saveTimer=0, noticeTimer=0, abortRefs=null, documentVersion=0, persistenceFailed=false;
const sessionReviews=new Map(), unsavedKeys=new Set();
const sides={};
const activeTool={left:'select',right:'select'}, markColor={left:'#f4d75e',right:'#f4d75e'};
let annotationHistory=[],pendingAnnotation=null;
for (const side of ['left','right']) sides[side]=new ReviewPane({container:$(`${side}-pdf`),onPageChange:page=>updatePage(side,page),onError:error=>{if(pdf)notice(`A PDF page could not be displayed: ${error.message}`,'error',false);},onAnnotationCreate:record=>createAnnotation(record),onAnnotationSelect:record=>editAnnotation(record),onAnnotationDelete:id=>deleteAnnotation(id)});

function notice(message,kind='',temporary=true) {
  clearTimeout(noticeTimer); $('status').hidden=!message; $('status').textContent=message; $('status').classList.toggle('error',kind==='error');
  if(temporary && message) noticeTimer=setTimeout(()=>$('status').hidden=true,7000);
}
function updatePage(side,page) {
  $(`${side}-page`).value=page||1;
  if(!pdf)return;
  document.querySelector(`[data-prev="${side}"]`).disabled=page<=1;
  document.querySelector(`[data-next="${side}"]`).disabled=page>=pdf.numPages;
}
function savingLabel(message,error=false) {
  $('save-state').textContent=message;$('save-state').classList.toggle('error',error);
  $('comments-save-state').textContent=error?'Could not save here. Export a TXT copy.':'Changes save on this device.';
}
function persist() {
  clearTimeout(saveTimer);
  if(!storageKey)return;
  sessionReviews.set(storageKey,normalizeReview(review,pdf.numPages));
  try { localStorage.setItem(storageKey,JSON.stringify(review));unsavedKeys.delete(storageKey);persistenceFailed=false;savingLabel('Saved on this device'); }
  catch {unsavedKeys.add(storageKey);persistenceFailed=true;savingLabel('Not saved · export a copy',true);notice('This browser could not save the review. Your notes are still here; use Export .txt before closing.','error',false);}
}
function scheduleSave() {savingLabel('Saving…');clearTimeout(saveTimer);saveTimer=setTimeout(persist,250);}
function loadReview(key,pages) {
  if(sessionReviews.has(key))return normalizeReview(sessionReviews.get(key),pages);
  try { const raw=localStorage.getItem(key);return raw?normalizeReview(JSON.parse(raw),pages):newReview(); }
  catch {notice('The saved review could not be read in this browser. You can continue and export your comments.','error',false);return newReview();}
}
function renderNotebook() {
  $('draft').value=review.draft.text;updateNotebookSummary();
}
function updateNotebookSummary() {
  const hasText=Boolean(exportReviewText(review));
  $('note-count').textContent=review.notes.length;
  $('draft-page').textContent=review.draft.page?`Left PDF · page ${review.draft.page}`:'Page linked when you type';
  $('add-note').disabled=!pdf||!review.draft.text.trim();
  $('all-notes').disabled=!pdf; $('export-notes').disabled=!hasText; $('modal-export').disabled=!hasText;
  $('export-marked-pdf').disabled=!pdf||loading; $('clear-review').disabled=!pdf||loading;

}
function renderComments() {
  const list=$('comment-list');list.replaceChildren();
  if(!review.notes.length&&!review.draft.text.trim()){const p=document.createElement('p');p.className='empty-message';p.textContent='Write your first comment in the notebook.';list.append(p);return;}
  const entries=review.notes.map((note,i)=>({note,index:i,draft:false}));
  if(review.draft.text.trim())entries.push({note:review.draft,index:review.notes.length,draft:true});
  for(const {note,index,draft} of entries) {
    const card=document.createElement('article');card.className='comment-card';
    const top=document.createElement('div');top.className='comment-top';
    const label=document.createElement('span');label.className='comment-label';label.textContent=draft?'Unfinished comment':`Comment ${index+1}`;
    const actions=document.createElement('div');actions.className='comment-tools';
    const page=document.createElement('button');page.className='page-badge';page.textContent=`Left PDF · page ${note.page||1}`;page.title='Return to this page in the main text';
    page.addEventListener('click',()=>{$('comments-dialog').close();sides.left.goToPage(note.page||1);});actions.append(page);
    if(!draft) {const remove=document.createElement('button');remove.className='quiet';remove.textContent='Delete';remove.setAttribute('aria-label',`Delete comment ${index+1}`);remove.addEventListener('click',()=>{if(!confirm(`Delete comment ${index+1}?`))return;review.notes=review.notes.filter(n=>n.id!==note.id);persist();updateNotebookSummary();renderComments();});actions.append(remove);}
    top.append(label,actions);
    const field=document.createElement('textarea');field.value=note.text;field.setAttribute('aria-label',draft?'Edit unfinished comment':`Edit comment ${index+1}`);
    field.addEventListener('input',()=>{if(draft){updateDraft(review,field.value,sides.left.currentPage);$('draft').value=field.value;}else{note.text=field.value;}scheduleSave();updateNotebookSummary();});
    card.append(top,field);list.append(card);
  }
}
function exportNotes() {
  persist();const text=exportReviewText(review);if(!text)return;
  const blob=new Blob([text+'\n'],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');
  anchor.href=url;anchor.download=(fileName.replace(/\.pdf$/i,'').replace(/[^a-z0-9._-]/gi,'-')||'paper')+'-review.txt';
  document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  notice('Review exported. Automatic page markers are excluded.');
}
async function fingerprint(bytes) {
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
}
function setLoading(value) {
  loading=value;for(const id of ['open-btn','welcome-open','references-btn'])$(id).disabled=value||(id==='references-btn'&&!pdf);
  $('clear-review').disabled=value||!pdf;$('export-marked-pdf').disabled=value||!pdf;
}
async function openPDF(bytes,name) {
  if(loading)return;setLoading(true);persist();notice('Opening the PDF on this device…','',false);
  let task, next;
  try {
    const key='parsec-paper-review:v1:'+await fingerprint(bytes);
    task=pdfjs.getDocument({data:new Uint8Array(bytes),cMapUrl:new URL('../vendor/pdfjs/cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('../vendor/pdfjs/standard_fonts/',import.meta.url).href,wasmUrl:new URL('../vendor/pdfjs/wasm/',import.meta.url).href,isEvalSupported:false,enableXfa:false});
    task.onPassword=(updatePassword,reason)=>{const password=prompt(reason===pdfjs.PasswordResponses.INCORRECT_PASSWORD?'Incorrect password. Enter the PDF password again:':'This PDF is password protected. Enter its password:');if(password===null){task.destroy();}else updatePassword(password);};
    next=await task.promise;
    const firstPage=await next.getPage(1);firstPage.getViewport({scale:1});
    persist(); // Save any edits made to the old document while this PDF was loading.
    abortRefs?.abort();abortRefs=null;documentVersion++;const old=pdf;
    sides.left.clear();sides.right.clear();pdf=next;storageKey=key;fileName=name;review=loadReview(key,pdf.numPages);annotationHistory=[];pendingAnnotation=null;
    for(const side of ['left','right']) {
      $(`${side}-pdf`).hidden=false;$(`${side}-total`).textContent=`/ ${pdf.numPages}`;$(`${side}-page`).max=pdf.numPages;
      document.querySelectorAll(`#${side}-toolbar button,#${side}-toolbar input,#${side}-toolbar select`).forEach(el=>el.disabled=false);
      sides[side].setZoom('fit');$(`${side}-zoom`).value='fit';
    }
    $('welcome').hidden=true;$('companion-empty').hidden=true;
    await Promise.all([sides.left.setDocument(pdf),sides.right.setDocument(pdf)]);
    for(const side of ['left','right'])setAnnotationTool(side,'select');
    syncAnnotations();
    if(old)await old.destroy();
    $('file-name').textContent=name;$('file-detail').textContent=`${pdf.numPages} pages · Local PDF · Scroll each view independently`;
    $('footer-state').textContent='Notes stay in this browser. Export a copy when finished.';
    $('draft').disabled=false;$('match-page').disabled=false;$('clear-review').disabled=false;
    $('ref-start').value=1;$('ref-end').value=pdf.numPages;$('ref-start').max=pdf.numPages;$('ref-end').max=pdf.numPages;$('use-ocr').checked=false;
    $('raw-references').value=review.rawText;$('google-opt-in').checked=false;$('ref-search').value='';
    renderNotebook();renderReferences();setReferenceBusy(false);savingLabel('Saved on this device');persist();
    if(unsavedKeys.size)notice('Some reviews could not be saved in this browser. They remain in this tab; reopen each affected PDF and export its comments before closing.','error',false);
    else notice(review.notes.length||review.draft.text||review.annotations.length?'Your saved review has been restored for this PDF.':'PDF opened locally. Start a comment to link the current left-hand page.');
  } catch(error) {
    if(next&&next!==pdf)await next.destroy().catch(()=>{});
    if(task&&next!==pdf)await task.destroy().catch(()=>{});
    notice(`Could not open this PDF. ${error?.name==='PasswordException'?'Check its password.':error?.message||'Try another PDF file.'}`,'error',false);
  } finally {setLoading(false);$('file-input').value='';}
}
async function loadFile(file) {
  if(!file||loading)return;
  if(!/\.pdf$/i.test(file.name)&&file.type!=='application/pdf'){notice('Choose a PDF file.','error');return;}
  try{await openPDF(await file.arrayBuffer(),file.name);}catch(error){notice(`Could not read the selected file: ${error.message}`,'error',false);}
}
function renderReferences() {
  const list=$('reference-list');list.replaceChildren();const query=$('ref-search').value.trim().toLowerCase().replace(/^#/,'');
  const rows=review.references.filter(ref=>!query||`${ref.label} ${ref.text}`.toLowerCase().includes(query));
  $('ref-count').textContent=review.references.length;$('ref-results').textContent=`${rows.length} reference${rows.length===1?'':'s'}`;
  if(!rows.length){const p=document.createElement('p');p.className='empty-message';p.textContent=query?'No references match your search.':review.rawText?'No reliable reference boundaries found. Check or edit the bibliography below.':'Extract the bibliography to browse it here.';list.append(p);return;}
  for(const ref of rows) {
    const card=document.createElement('article');card.className='reference-item';const body=document.createElement('div');
    const label=document.createElement('div');label.className='reference-label';label.textContent=ref.label;
    const text=document.createElement('p');text.textContent=ref.text;body.append(label,text);
    const actions=document.createElement('div');actions.className='reference-actions';const show=document.createElement('button');show.textContent=`PDF page ${ref.page}`;show.addEventListener('click',()=>{$('references-dialog').close();sides.right.goToPage(ref.page);});actions.append(show);
    if($('google-opt-in').checked){const link=document.createElement('a');link.textContent='Google ↗';link.href='https://www.google.com/search?q='+encodeURIComponent(ref.text);link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';actions.append(link);}
    card.append(body,actions);list.append(card);
  }
}
function setReferenceBusy(busy){
  for(const id of ['extract-refs','rebuild-refs','raw-references','ref-start','ref-end','use-ocr','strip-line-numbers','ref-method','ref-style','ref-layout'])$(id).disabled=busy||!pdf;
  if($('ref-method').value==='original')for(const id of ['ref-style','ref-layout','strip-line-numbers'])$(id).disabled=true;
  $('cancel-refs').hidden=!busy;
}
async function runExtraction() {
  if(!pdf||abortRefs)return;
  const start=Number($('ref-start').value),end=Number($('ref-end').value);
  if(!Number.isInteger(start)||!Number.isInteger(end)||start<1||end<start||end>pdf.numPages){$('reference-status').textContent=`Choose whole page numbers from 1 to ${pdf.numPages}, with the last page at or after the first.`;return;}
  const controller=new AbortController();abortRefs=controller;const version=documentVersion;
  setReferenceBusy(true);
  try {
    const original=$('ref-method').value==='original';
    const extract=original?extractOriginalReferences:extractReferences;
    const result=await extract(pdf,{startPage:start,endPage:end,ocr:$('use-ocr').checked,style:$('ref-style').value,layout:$('ref-layout').value,stripLineNumbers:$('strip-line-numbers').checked,signal:controller.signal,onProgress:p=>{if(version!==documentVersion||abortRefs!==controller||controller.signal.aborted)return;$('reference-status').textContent=`${p.phase==='ocr'?'Recognizing scanned text locally':'Reading PDF text locally'} · page ${p.page} · ${Math.round((p.progress||0)*100)}%`;}});
    if(version!==documentVersion||controller.signal.aborted||abortRefs!==controller)return;
    review.references=result.references;review.rawText=result.rawText;review.refBasePage=result.rawStartPage||result.references[0]?.page||start;
    $('raw-references').value=result.rawText;persist();renderReferences();
    const styleLabel={'author-year':'author–year','numbered':'numbered'}[result.detectedStyle];
    const layoutLabel={'single':'one column','double':'two columns','mixed':'mixed layout'}[result.detectedLayout];
    const details=[original?'Original (v0.1)':styleLabel,original?'':layoutLabel,result.ocrUsed?'local OCR':''].filter(Boolean).join(' · ');
    const diagnostic=Array.isArray(result.diagnostics)?result.diagnostics.filter(item=>typeof item==='string').join(' '):'';
    $('reference-status').textContent=result.references.length?`${result.references.length} references found${details?' · '+details:''}. Check the entries against the PDF.${diagnostic?' '+diagnostic:''}`:result.rawText?'Text extracted, but reference boundaries need correction. Try another style or layout, or open the bibliography editor below.':'No text found. For a scanned PDF, select the bibliography pages and enable local OCR.';
    if(!result.references.length)$('reference-editor').open=true;
  } catch(error) {if(version===documentVersion&&abortRefs===controller)$('reference-status').textContent=error.name==='AbortError'?'Extraction cancelled. Your previous reference list is unchanged.':`Extraction could not finish: ${error.message}. You can paste bibliography text below.`;}
  finally {if(abortRefs===controller){abortRefs=null;setReferenceBusy(false);}}
}

const toolHints={select:'Select text or a mark',highlight:'Select text; drag over scanned text',note:'Click a page to place a note',ellipse:'Drag a circle or ellipse',rectangle:'Drag a rectangle',erase:'Click a mark to remove it'};
function setAnnotationTool(side,tool) {
  activeTool[side]=tool;sides[side].setTool(tool,markColor[side]);
  for(const button of document.querySelectorAll(`[data-side="${side}"][data-annotation-tool]`))button.setAttribute('aria-pressed',String(button.dataset.annotationTool===tool));
  $(`${side}-tool-hint`).textContent=toolHints[tool];
}
function syncAnnotations() {
  for(const side of ['left','right']) {
    sides[side].setAnnotations(review.annotations);
    document.querySelectorAll(`#${side}-annotations button,#${side}-annotations input`).forEach(el=>el.disabled=!pdf);
    $(`${side}-undo`).disabled=!pdf||!annotationHistory.length;
  }
}
function changeAnnotations(next) {
  if(!pdf)return;
  annotationHistory.push(normalizeAnnotations(review.annotations,pdf.numPages));
  if(annotationHistory.length>50)annotationHistory.shift();
  review.annotations=normalizeAnnotations(next,pdf.numPages);persist();syncAnnotations();
}
function createAnnotation(record) {
  if(!pdf||!record)return;
  const mark={...record,id:crypto.randomUUID(),text:record.text||''};
  if(mark.type==='note')editAnnotation(mark,true);
  else changeAnnotations([...review.annotations,mark]);
}
function editAnnotation(record,isNew=false) {
  if(!pdf||!record)return;
  pendingAnnotation={record:{...record,rects:record.rects.map(r=>({...r}))},isNew,version:documentVersion};
  $('annotation-title').textContent={highlight:'Highlight',note:'PDF note',ellipse:'Circle / ellipse',rectangle:'Rectangle'}[record.type]||'PDF annotation';
  $('annotation-page').textContent=`PDF page ${record.page}`;
  $('annotation-text').value=record.text||'';$('annotation-edit-color').value=record.color||'#f4d75e';
  $('annotation-delete').hidden=isNew;$('annotation-dialog').showModal();$('annotation-text').focus();
}
function deleteAnnotation(id) {
  if(pdf&&review.annotations.some(mark=>mark.id===id))changeAnnotations(review.annotations.filter(mark=>mark.id!==id));
}
function undoAnnotation() {
  if(!pdf||!annotationHistory.length)return;
  review.annotations=annotationHistory.pop();persist();syncAnnotations();
}
async function downloadMarkedPDF() {
  if(!pdf||loading)return;persist();setLoading(true);
  const current=pdf,marks=normalizeAnnotations(review.annotations,pdf.numPages);
  notice('Preparing the marked PDF on this device…','',false);
  try {
    const output=await exportAnnotatedPDF(await current.getData(),current,marks);
    const url=URL.createObjectURL(new Blob([output],{type:'application/pdf'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download=(fileName.replace(/\.pdf$/i,'').replace(/[^a-z0-9._-]/gi,'-')||'paper')+'-marked.pdf';
    document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
    notice('Marked PDF exported. Your original file is unchanged.');
  } catch(error){notice(`Could not export the marked PDF: ${error.message}`,'error',false);}
  finally{setLoading(false);}
}
async function removePDFAndNotes() {
  if(!pdf||!storageKey||loading)return;
  if(!confirm('Remove this PDF from the workspace and delete its saved comments, annotations, and references? Export copies first if you want to keep them. Your original PDF file will stay on your computer.'))return;
  clearTimeout(saveTimer);
  try{localStorage.removeItem(storageKey);}catch{notice('The browser would not clear the saved review. Clear this site’s data in browser settings to remove it.','error',false);$('privacy-dialog').close();return;}
  const old=pdf;documentVersion++;abortRefs?.abort();abortRefs=null;sessionReviews.delete(storageKey);unsavedKeys.delete(storageKey);
  pdf=null;storageKey=null;fileName='';review=newReview();annotationHistory=[];pendingAnnotation=null;persistenceFailed=false;
  for(const side of ['left','right']) {
    sides[side].clear();sides[side].setAnnotations([]);setAnnotationTool(side,'select');$(`${side}-pdf`).hidden=true;
    $(`${side}-total`).textContent='/ —';$(`${side}-page`).value=1;
    document.querySelectorAll(`#${side}-toolbar button,#${side}-toolbar input,#${side}-toolbar select`).forEach(el=>el.disabled=true);
  }
  $('welcome').hidden=false;$('companion-empty').hidden=false;$('draft').disabled=true;$('match-page').disabled=true;
  $('file-name').textContent='Keep the paper in view.';$('file-detail').textContent='Read, cross-check, and write your review in one place.';
  $('footer-state').textContent='Your PDF stays on this device.';$('raw-references').value='';$('annotation-text').value='';$('comment-list').replaceChildren();
  $('ref-search').value='';$('google-opt-in').checked=false;$('file-input').value='';
  renderNotebook();renderReferences();syncAnnotations();setReferenceBusy(false);setLoading(false);savingLabel('Open a paper to begin');$('privacy-dialog').close();
  await old.destroy().catch(()=>{});
  notice('PDF removed. Its saved comments, annotations, and references have been deleted from this app.');
}

for(const id of ['open-btn','welcome-open'])$(id).addEventListener('click',()=>$('file-input').click());
$('file-input').addEventListener('change',event=>loadFile(event.target.files[0]));
document.addEventListener('dragover',event=>{if(event.dataTransfer.types.includes('Files'))event.preventDefault();});
document.addEventListener('drop',event=>{if(!event.dataTransfer.files.length)return;event.preventDefault();if(!document.querySelector('dialog[open]'))loadFile(event.dataTransfer.files[0]);});
for(const side of ['left','right']) {
  document.querySelector(`[data-prev="${side}"]`).addEventListener('click',()=>sides[side].goToPage(sides[side].currentPage-1));
  document.querySelector(`[data-next="${side}"]`).addEventListener('click',()=>sides[side].goToPage(sides[side].currentPage+1));
  $(`${side}-page`).addEventListener('change',event=>{sides[side].goToPage(event.target.value);event.target.value=sides[side].currentPage;});
  $(`${side}-zoom`).addEventListener('change',event=>sides[side].setZoom(event.target.value));
}
$('match-page').addEventListener('click',()=>sides.right.goToPage(sides.left.currentPage));
$('draft').addEventListener('input',()=>{updateDraft(review,$('draft').value,sides.left.currentPage);scheduleSave();updateNotebookSummary();});
$('add-note').addEventListener('click',()=>{if(commitDraft(review,crypto.randomUUID())){persist();renderNotebook();$('draft').focus();}});
$('draft').addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();$('add-note').click();}});
$('all-notes').addEventListener('click',()=>{persist();renderComments();$('comments-dialog').showModal();});
for(const id of ['export-notes','modal-export'])$(id).addEventListener('click',exportNotes);
$('references-btn').addEventListener('click',()=>{$('references-dialog').showModal();renderReferences();});
$('privacy-btn').addEventListener('click',()=>$('privacy-dialog').showModal());
for(const button of document.querySelectorAll('[data-close]'))button.addEventListener('click',()=>$(button.dataset.close).close());
$('comments-dialog').addEventListener('close',()=>{persist();renderNotebook();});
$('references-dialog').addEventListener('close',()=>{abortRefs?.abort();});
$('ref-method').addEventListener('change',()=>{setReferenceBusy(Boolean(abortRefs));$('reference-status').textContent=$('ref-method').value==='original'?'Original v0.1 extraction selected. Click Extract references to rebuild the list.':'Improved extraction selected. Choose the citation style and layout, or leave them on automatic.';});
$('extract-refs').addEventListener('click',runExtraction);$('cancel-refs').addEventListener('click',()=>abortRefs?.abort());
$('ref-search').addEventListener('input',renderReferences);$('google-opt-in').addEventListener('change',renderReferences);
$('raw-references').addEventListener('input',()=>{review.rawText=$('raw-references').value;scheduleSave();});
$('rebuild-refs').addEventListener('click',()=>{review.rawText=$('raw-references').value;const parse=$('ref-method').value==='original'?parseOriginalReferences:parseReferences;review.references=parse(review.rawText,review.refBasePage||Number($('ref-start').value),{style:$('ref-style').value,stripLineNumbers:$('strip-line-numbers').checked});persist();renderReferences();$('reference-status').textContent=`${review.references.length} references in the updated list. Page markers for edited text follow the extracted page breaks.`;});
for(const button of document.querySelectorAll('button[data-annotation-tool][data-side]'))button.addEventListener('click',()=>setAnnotationTool(button.dataset.side,button.dataset.annotationTool));
for(const side of ['left','right']) {
  $(`${side}-mark-color`).addEventListener('input',event=>{markColor[side]=event.target.value;sides[side].setTool(activeTool[side],markColor[side]);});
  $(`${side}-undo`).addEventListener('click',undoAnnotation);
}
$('annotation-save').addEventListener('click',()=>{
  if(!pendingAnnotation||!pdf||pendingAnnotation.version!==documentVersion)return;
  const {record,isNew}=pendingAnnotation;
  const next={...record,text:$('annotation-text').value,color:$('annotation-edit-color').value};
  changeAnnotations(isNew?[...review.annotations,next]:review.annotations.map(mark=>mark.id===record.id?next:mark));
  $('annotation-dialog').close();
});
$('annotation-delete').addEventListener('click',()=>{if(pendingAnnotation?.version===documentVersion)deleteAnnotation(pendingAnnotation.record.id);$('annotation-dialog').close();});
$('annotation-dialog').addEventListener('close',()=>{pendingAnnotation=null;$('annotation-text').value='';});
$('export-marked-pdf').addEventListener('click',downloadMarkedPDF);
$('clear-review').addEventListener('click',removePDFAndNotes);
document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();});
window.addEventListener('pagehide',()=>{persist();abortRefs?.abort();});
window.addEventListener('beforeunload',event=>{persist();if([...unsavedKeys].some(key=>exportReviewText(sessionReviews.get(key)||newReview())||(sessionReviews.get(key)?.annotations.length||0))){event.preventDefault();event.returnValue='';}});

function divider(id,container,axis,initial,min,max) {
  const handle=$(id);let value=initial;
  const apply=n=>{value=Math.min(max,Math.max(min,n));handle.setAttribute('aria-valuenow',Math.round(value));container.style[axis==='x'?'gridTemplateColumns':'gridTemplateRows']=`minmax(0,${value}fr) 12px minmax(${axis==='x'?'0':'230px'},${100-value}fr)`;};
  handle.addEventListener('pointerdown',event=>{event.preventDefault();handle.setPointerCapture(event.pointerId);document.body.classList.add('dragging');const move=e=>{const r=container.getBoundingClientRect();apply(100*(axis==='x'?e.clientX-r.left:e.clientY-r.top)/(axis==='x'?r.width:r.height));};const stop=()=>{handle.removeEventListener('pointermove',move);document.body.classList.remove('dragging');};handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',stop,{once:true});handle.addEventListener('pointercancel',stop,{once:true});});
  handle.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key)){event.preventDefault();apply(event.key==='Home'?initial:value+(['ArrowRight','ArrowDown'].includes(event.key)?2:-2));}});
}
divider('column-resizer',$('workspace'),'x',52,30,70);divider('notebook-resizer',document.querySelector('.companion-column'),'y',57,30,75);
if(location.hostname==='127.0.0.1' && /^\/(?:index\.html)?$/.test(location.pathname)){document.querySelector('.back-link').hidden=true;const brand=document.querySelector('.brand-icon');brand.href='#workspace';brand.setAttribute('aria-label','Paper Review workspace');}
setReferenceBusy(false);
window.paperReviewReady=true;
