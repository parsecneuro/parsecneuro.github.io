export const newReview = () => ({version:1, notes:[], draft:{text:'',page:null}, annotations:[],references:[],rawText:'',refBasePage:1});

export function normalizeAnnotations(records,pages) {
  if(!Array.isArray(records))return [];
  const result=[],ids=new Set();
  for(const record of records) {
    if(!record||!['highlight','note','ellipse','rectangle'].includes(record.type)||!Number.isInteger(record.page)||record.page<1||record.page>pages||!Array.isArray(record.rects))continue;
    const rects=record.rects.filter(r=>r&&['x','y','width','height'].every(k=>Number.isFinite(r[k]))).map(r=>{
      const x=Math.max(0,Math.min(1,r.x)),y=Math.max(0,Math.min(1,r.y));
      return {x,y,width:r.x>=0&&r.width>0&&r.x+r.width<=1?r.width:Math.max(0,Math.min(1,r.x+r.width)-x),height:r.y>=0&&r.height>0&&r.y+r.height<=1?r.height:Math.max(0,Math.min(1,r.y+r.height)-y)};
    }).filter(r=>r.width>0&&r.height>0);
    if(!rects.length)continue;
    const id=String(record.id||`mark-${result.length+1}`);if(ids.has(id))continue;ids.add(id);
    result.push({id,type:record.type,page:record.page,rects,color:/^#[\da-f]{6}$/i.test(record.color)?record.color:'#f4d75e',text:typeof record.text==='string'?record.text:''});
  }
  return result;
}

export function normalizeReview(value, pages) {
  const state = newReview();
  if (!value || value.version !== 1) return state;
  const page = n => Math.max(1,Math.min(pages,Number.isInteger(n)?n:1));
  if (Array.isArray(value.notes)) state.notes = value.notes.filter(n => n && typeof n.text === 'string').map((n,i)=>({id:String(n.id || `restored-${i}`),text:n.text,page:page(n.page)}));
  if (value.draft && typeof value.draft.text === 'string') state.draft={text:value.draft.text,page:value.draft.text.trim()?page(value.draft.page):null};
  state.annotations=normalizeAnnotations(value.annotations,pages);
  if (Array.isArray(value.references)) state.references=value.references.filter(r=>r && typeof r.text==='string').map((r,i)=>({id:String(r.id||`ref-${i}`),label:String(r.label||`Reference ${i+1}`),text:r.text,page:page(r.page)}));
  state.rawText=typeof value.rawText==='string'?value.rawText:'';
  state.refBasePage=page(value.refBasePage);
  return state;
}

// Export only reviewer-authored text. PDF locations and all other metadata are private.
export function exportReviewText(state) {
  return [...state.notes.map(n=>n.text),state.draft.text].map(text=>text.trim()).filter(Boolean).map((text,i)=>`${i+1}. ${text}`).join('\n\n');
}

export function updateDraft(state,text,leftPage) {
  if (text.trim() && !state.draft.page) state.draft.page=leftPage;
  if (!text.trim()) state.draft.page=null;
  state.draft.text=text;
}

export function commitDraft(state,id) {
  if (!state.draft.text.trim()) return false;
  state.notes.push({id,text:state.draft.text.trim(),page:state.draft.page||1});
  state.draft={text:'',page:null};
  return true;
}
