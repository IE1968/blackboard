/* ---------- Mini-Vorschau der Boards in der Board-Liste und in „Boards verwalten“ ----------
   Die Vorschau ist ein stark verkleinertes SVG des Boards (ohne Texte und Bilder), wird im Leerlauf erzeugt
   und auf diesem Gerät zwischengespeichert (skizix-vorschau), bis sich das Board ändert. */
var TH={mem:null,q:[],busy:false};
function thStore(){ if(!TH.mem){ try{ TH.mem=JSON.parse(lsGet('skizix-vorschau')||'{}')||{}; }catch(e){ TH.mem={}; } } return TH.mem; }
function thSave(){
  const m=thStore(), ids=new Set(boards.list.map(b=>b.id)); for(const k in m) if(!ids.has(k)) delete m[k];
  let j=JSON.stringify(m); if(j.length>400000){ for(const k in m) if(k!==boards.cur){ delete m[k]; j=JSON.stringify(m); if(j.length<=300000) break; } }
  lsSet('skizix-vorschau',j);
}
function thKey(b){ return String(b.updated||0)+'/'+String(b.rev||0); }
function thBuild(b){
  const d=b.id===boards.cur?doc:storedDoc(b.id); if(!d) return '';
  const S=SURF[(d.bg&&SURF[d.bg.s])?d.bg.s:bgDefault().s]||SURF.white, items=d.items.filter(i=>i.kind!=='image').slice(0,400);
  if(!items.length) return `<svg viewBox="0 0 48 32" aria-hidden="true"><rect width="48" height="32" fill="${S.bg}"/></svg>`;
  const saveDoc=doc, saveDark=darkBoard, ed=editing; let body='', bx=null;
  try{
    doc=d; darkBoard=S.dark; editing=null;
    for(const it of items){ let q; try{ q=bbox(it); }catch(e){ continue; }
      if(!bx) bx={x1:q.x,y1:q.y,x2:q.x+q.w,y2:q.y+q.h}; else { bx.x1=Math.min(bx.x1,q.x); bx.y1=Math.min(bx.y1,q.y); bx.x2=Math.max(bx.x2,q.x+q.w); bx.y2=Math.max(bx.y2,q.y+q.h); } }
    body=items.map(it=>{ try{ return itemSVG(it); }catch(e){ return ''; } }).join('');
  } finally{ doc=saveDoc; darkBoard=saveDark; editing=ed; }
  body=body.replace(/<text[\s\S]*?<\/text>/g,'').replace(/<foreignObject[\s\S]*?<\/foreignObject>/g,'').replace(/<image[^>]*>/g,'').replace(/ (class|data-id|pointer-events)="[^"]*"/g,'');
  if(!bx) return '';
  let w=Math.max(bx.x2-bx.x1,40), h=Math.max(bx.y2-bx.y1,30); const p=Math.max(w,h)*0.06;
  if(w/h<1.5){ const nw=h*1.5; bx.x1-=(nw-w)/2; w=nw; } else { const nh=w/1.5; bx.y1-=(nh-h)/2; h=nh; }
  const vb=`${r(bx.x1-p)} ${r(bx.y1-p)} ${r(w+2*p)} ${r(h+2*p)}`;
  if(body.length>60000) body=items.slice(0,200).map(it=>{ try{ const q=bbox(it); return `<rect x="${r(q.x)}" y="${r(q.y)}" width="${r(q.w)}" height="${r(q.h)}" rx="4" fill="${it.fill&&it.fill!=='none'?it.fill:'none'}" stroke="${it.stroke||'#888'}" stroke-width="${Math.max(2,it.sw||2)}"/>`; }catch(e){ return ''; } }).join('');
  return `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect x="${r(bx.x1-p)}" y="${r(bx.y1-p)}" width="${r(w+2*p)}" height="${r(h+2*p)}" fill="${S.bg}"/>${body}</svg>`;
}
function thHTML(b){ const c=thStore()[b.id]; return `<span class="bth" data-th="${b.id}">${c&&c.k===thKey(b)?c.s:''}</span>`; }
/* fehlende oder veraltete Vorschauen nacheinander im Leerlauf erzeugen */
function thFill(){
  const m=thStore(); TH.q=boards.list.filter(b=>!m[b.id]||m[b.id].k!==thKey(b)).map(b=>b.id);
  if(TH.q.length&&!TH.busy){ TH.busy=true; thStep(); }
}
function thStep(){
  const go=()=>{
    const id=TH.q.shift(), b=id&&boards.list.find(x=>x.id===id);
    if(b){ let s=''; try{ s=thBuild(b); }catch(e){ s=''; }
      if(s){ thStore()[b.id]={k:thKey(b),s}; document.querySelectorAll(`.bth[data-th="${b.id}"]`).forEach(el=>{ el.innerHTML=s; }); } }
    if(TH.q.length) thStep(); else { TH.busy=false; thSave(); }
  };
  const wait=TH.q[0]===boards.cur?1500:0;   /* das offene Board erst, wenn eine Weile nicht gezeichnet wurde */
  setTimeout(()=>{ if(window.requestIdleCallback) requestIdleCallback(go,{timeout:1500}); else go(); },wait);
}
