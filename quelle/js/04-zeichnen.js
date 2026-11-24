/* ---------- Zeichnen der Oberfläche ---------- */
/* Große Boards: Gezeichnet wird nur, was im Bild liegt, plus ein Rand. Erst wenn die Ansicht diesen Bereich verlässt
   oder der Zoom stark wechselt, wird neu gezeichnet. Bei sehr kleinem Zoom entfällt der unlesbare Text. */
let drawn=null, noText=false, viewRaf=0;
const CULL_MIN=150;
function viewRect(){ const rc=svg.getBoundingClientRect(); return {x:-view.x/view.k,y:-view.y/view.k,w:(rc.width||1)/view.k,h:(rc.height||1)/view.k}; }
const lodNow=()=>view.k<0.28;
function visibleItems(){
  if(doc.items.length<CULL_MIN){ drawn={all:true,lod:lodNow()}; return doc.items; }
  const v=viewRect(), m=Math.max(v.w,v.h)*0.6, R={x:v.x-m,y:v.y-m,w:v.w+2*m,h:v.h+2*m};
  drawn={R,k:view.k,lod:lodNow()};
  return doc.items.filter(it=>{ if(sel.has(it.id)||it.id===editing||(it.type==='conn'&&(sel.has(it.from)||sel.has(it.to)))) return true; const b=bbox(it), p=60; return b.x-p<R.x+R.w&&b.x+b.w+p>R.x&&b.y-p<R.y+R.h&&b.y+b.h+p>R.y; });
}
function viewNeedsRender(){
  if(!drawn) return false; const lod=lodNow(); if(drawn.lod!==lod) return true; if(drawn.all) return false;
  const v=viewRect(), R=drawn.R; return v.x<R.x||v.y<R.y||v.x+v.w>R.x+R.w||v.y+v.h>R.y+R.h||view.k<drawn.k/2.5;
}
function render(){
  applyBg();
  for(const id of [...sel]) if(!byId(id)) sel.delete(id);
  const vis=visibleItems(); noText=drawn.lod&&!editing;
  itemsG.innerHTML=vis.map(itemSVG).join(''); noText=false;
  elById.clear(); for(const el of itemsG.children) if(el.dataset.id) elById.set(el.dataset.id,el);
  renderOverlay(); updateProps(); scheduleSlides(); updateStart();
  $('undo').disabled=hi<=0; $('redo').disabled=hi>=hist.length-1;
}
/* Beim Ziehen werden nur die betroffenen Elemente neu gezeichnet, nicht die ganze Tafel. */
const elById=new Map(), tmpG=document.createElementNS('http://www.w3.org/2000/svg','g');
function renderPartial(ids){
  for(const id of ids){ const it=byId(id), old=elById.get(id); if(!it||!old||!old.parentNode){ render(); return; }
    tmpG.innerHTML=itemSVG(it); const nu=tmpG.firstElementChild; old.replaceWith(nu); elById.set(id,nu); }
  renderOverlay();
}
function depsFor(ids){ const st=new Set(ids); for(const it of doc.items) if(it.type==='conn'&&(st.has(it.from)||st.has(it.to))) st.add(it.id); return [...st]; }
const LOCKP='M-4 0h8v6.500h-8zM-2.500 0v-2.200a2.500 2.500 0 015 0V0';
function unionBox(its){ let x1=Infinity,y1=Infinity,x2=-Infinity,y2=-Infinity; for(const it of its){ const b=bbox(it); x1=Math.min(x1,b.x); y1=Math.min(y1,b.y); x2=Math.max(x2,b.x+b.w); y2=Math.max(y2,b.y+b.h); } return x1===Infinity?null:{x:x1,y:y1,w:x2-x1,h:y2-y1}; }
function renderOverlay(){
  const k=view.k,u=1/k; let o='';
  const items=[...sel].map(byId).filter(Boolean), single=items.length===1?items[0]:null;
  const hs=(coarse?16:9)*u, hit=(coarse?32:18)*u;
  for(const it of items){
    if(it.type==='conn'){ const pts=route(it);
      o+=`<path d="M${pts.map(p=>r(p.x)+' '+r(p.y)).join('L')}" fill="none" stroke="${SEL}" stroke-width="${1.5*u}" stroke-dasharray="${5*u} ${4*u}" pointer-events="none"/>`;
      if(single&&!it.lock){ [['a',pts[0]],['b',pts[pts.length-1]]].forEach(([e,p])=>{
        o+=`<circle data-h="ce:${e}" cx="${r(p.x)}" cy="${r(p.y)}" r="${(coarse?20:14)*u}" fill="transparent"/><circle data-h="ce:${e}" cx="${r(p.x)}" cy="${r(p.y)}" r="${(coarse?9:6)*u}" fill="#fff" stroke="${SEL}" stroke-width="${2*u}"/>`; }); }
      continue; }
    const rotd=it.type==='shape'&&it.rot?it.rot:0, b=rotd?{x:it.x,y:it.y,w:it.w,h:it.h}:bbox(it),p=4*u;
    if(rotd) o+=`<g transform="rotate(${rotd} ${r(it.x+it.w/2)} ${r(it.y+it.h/2)})">`;   /* gedrehte Form: Rahmen und Griffe drehen mit */
    o+=`<rect x="${r(b.x-p)}" y="${r(b.y-p)}" width="${r(b.w+2*p)}" height="${r(b.h+2*p)}" fill="none" stroke="${SEL}" stroke-width="${1.5*u}" stroke-dasharray="${5*u} ${4*u}" pointer-events="none"/>`;
    if(single&&!it.lock&&canRot(it)&&editing!==it.id) o+=rotHandle(b.x+b.w+p+14*u,b.y-p-14*u,u,b.x+b.w+p,b.y-p);
    if(it.lock) o+=`<g transform="translate(${r(b.x+b.w+p)} ${r(b.y-p)}) scale(${r(u*1.5)})" pointer-events="none"><circle r="9" fill="${SEL}"/><path d="${LOCKP}" transform="translate(0 -1.500)" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></g>`;
    if(single&&it.type==='shape'&&editing!==it.id&&!it.lock){
      if(!noDock(it.kind)){ const g=(coarse?32:22)*u;
        [[b.x+b.w/2,b.y-g],[b.x+b.w+g,b.y+b.h/2],[b.x+b.w/2,b.y+b.h+g],[b.x-g,b.y+b.h/2]].forEach(([x,y])=>{
          o+=`<circle data-h="cn:0" cx="${r(x)}" cy="${r(y)}" r="${(coarse?18:13)*u}" fill="transparent"/><circle data-h="cn:0" cx="${r(x)}" cy="${r(y)}" r="${(coarse?8:5.5)*u}" fill="${SEL}" stroke="#fff" stroke-width="${1.5*u}"/>`; }); }
      [['nw',0,0],['n',.5,0],['ne',1,0],['e',1,.5],['se',1,1],['s',.5,1],['sw',0,1],['w',0,.5]].forEach(([d,fx,fy])=>{
        const x=b.x+b.w*fx,y=b.y+b.h*fy;
        o+=`<rect data-h="rs:${d}" x="${r(x-hit/2)}" y="${r(y-hit/2)}" width="${hit}" height="${hit}" fill="transparent"/><rect data-h="rs:${d}" x="${r(x-hs/2)}" y="${r(y-hs/2)}" width="${hs}" height="${hs}" rx="${2*u}" fill="#fff" stroke="${SEL}" stroke-width="${1.5*u}" style="paint-order:stroke"/>`; });
      if(it.kind==='table'){   /* Griffe über und links neben der Tabelle ändern die Breite einer Spalte oder die Höhe einer Zeile */
        const g=(coarse?26:17)*u, gw=(coarse?10:7)*u, gl=(coarse?18:13)*u, gh=(coarse?30:20)*u;
        if(lastCell&&lastCell.id===it.id){ const lc=lastCell.cell, c=cellRect(it,Math.min(lc.r,it.rowH.length-1),Math.min(lc.c,it.colW.length-1));
          o+=`<rect x="${r(it.x+c.x)}" y="${r(it.y+c.y)}" width="${r(c.w)}" height="${r(c.h)}" fill="none" stroke="${SEL}" stroke-width="${2.5*u}" pointer-events="none"/>`; }
        let x=it.x,y=it.y;
        it.colW.forEach((cw,i)=>{ x+=cw; o+=`<rect data-h="tc:${i}" x="${r(x-gh/2)}" y="${r(it.y-g-gh/2)}" width="${gh}" height="${gh}" fill="transparent"/><rect data-h="tc:${i}" x="${r(x-gw/2)}" y="${r(it.y-g-gl/2)}" width="${gw}" height="${gl}" rx="${3*u}" fill="${SEL}" stroke="#fff" stroke-width="${u}"/>`; });
        it.rowH.forEach((rh,i)=>{ y+=rh; o+=`<rect data-h="tr:${i}" x="${r(it.x-g-gh/2)}" y="${r(y-gh/2)}" width="${gh}" height="${gh}" fill="transparent"/><rect data-h="tr:${i}" x="${r(it.x-g-gl/2)}" y="${r(y-gw/2)}" width="${gl}" height="${gw}" rx="${3*u}" fill="${SEL}" stroke="#fff" stroke-width="${u}"/>`; });
      }
    }
    if(rotd) o+='</g>';
  }
  if(items.length>1){ const ub=unionBox(items), x1=ub.x-10*u, y1=ub.y-10*u, x2=ub.x+ub.w+10*u, y2=ub.y+ub.h+10*u;
    o+=`<rect x="${r(x1)}" y="${r(y1)}" width="${r(x2-x1)}" height="${r(y2-y1)}" rx="${4*u}" fill="none" stroke="${SEL}" stroke-width="${u}" pointer-events="none"/>`;
    if(!editing&&items.some(i=>!i.lock&&canRot(i))) o+=rotHandle(x2+16*u,y1-16*u,u,x2,y1);
    if(!editing&&items.some(i=>!i.lock&&!(i.type==='conn'&&(i.from||i.to)))) [['nw',x1,y1],['ne',x2,y1],['se',x2,y2],['sw',x1,y2]].forEach(([d,x,y])=>{   /* Ecken: alles Ausgewählte gemeinsam vergrößern oder verkleinern */
      o+=`<rect data-h="gs:${d}" x="${r(x-hit/2)}" y="${r(y-hit/2)}" width="${hit}" height="${hit}" fill="transparent"/><rect data-h="gs:${d}" x="${r(x-hs/2)}" y="${r(y-hs/2)}" width="${hs}" height="${hs}" rx="${2*u}" fill="${SEL}" stroke="#fff" stroke-width="${1.5*u}" style="paint-order:stroke"/>`; }); }
  { /* Einblendschritte der Folie(n), an denen gerade gearbeitet wird: kleine Nummern links oben */
    const fs=new Set(items.map(i=>i.kind==='frame'?i.id:i.fr).filter(Boolean));
    if(fs.size) for(const f of fs){ const its=doc.items.filter(i=>i.ap&&i.fr===f&&i.kind!=='frame'), st=[...new Set(its.map(i=>i.ap))].sort((a,b)=>a-b);
      for(const it of its){ const b=bbox(it); o+=`<g class="apBadge" transform="translate(${r(b.x)} ${r(b.y)}) scale(${r(u)})" pointer-events="none"><circle r="10" fill="#7b66f0" stroke="#fff" stroke-width="1.5"/><text y="4.5" text-anchor="middle" font-family="${FONT}" font-size="12" font-weight="700" fill="#fff">${st.indexOf(it.ap)+1}</text></g>`; } } }
  const hv=hoverId&&byId(hoverId);
  if(hv) o+=`<rect x="${hv.x-5*u}" y="${hv.y-5*u}" width="${hv.w+10*u}" height="${hv.h+10*u}" rx="${6*u}" fill="rgba(23,99,207,.1)" stroke="${SEL}" stroke-width="${2.5*u}" pointer-events="none"/>`;
  if(action&&action.type==='connEnd'&&action.dock){ const d=action.dock;   /* Andockpunkte der Zielform; der aktive Punkt ist gefüllt */
    for(const sd in SIDES){ const q=sidePt(d.s,sd), on=d.side===sd;
      o+=`<circle cx="${r(q.x)}" cy="${r(q.y)}" r="${(on?8:4.5)*u}" fill="${on?SEL:'#fff'}" stroke="${on?'#fff':SEL}" stroke-width="${(on?2.5:1.5)*u}" pointer-events="none"/>`; }
    if(!d.side) o+=`<circle cx="${r(d.s.x+d.s.w/2)}" cy="${r(d.s.y+d.s.h/2)}" r="${7*u}" fill="none" stroke="${SEL}" stroke-width="${2.5*u}" pointer-events="none"/>`; }
  if(action&&action.guides) for(const g of action.guides)
    o+=`<path d="${g.x!=null?`M${r(g.x)} ${r(g.a-12*u)}V${r(g.b+12*u)}`:`M${r(g.a-12*u)} ${r(g.y)}H${r(g.b+12*u)}`}" fill="none" stroke="#ff3d81" stroke-width="${1.2*u}" pointer-events="none"/>`;
  if(action&&action.type==='marquee'&&action.moved){ const a=action.w0,c=action.cur;
    o+=`<rect x="${Math.min(a.x,c.x)}" y="${Math.min(a.y,c.y)}" width="${Math.abs(c.x-a.x)}" height="${Math.abs(c.y-a.y)}" fill="rgba(23,99,207,.08)" stroke="${SEL}" stroke-width="${u}" pointer-events="none"/>`; }
  if(action&&action.type==='rotate'&&action.moved){ const t=action.c;   /* Winkel beim Drehen anzeigen */
    o+=`<g transform="translate(${r(t.x)} ${r(t.y)}) scale(${r(u)})" pointer-events="none"><rect x="-26" y="-13" width="52" height="26" rx="13" fill="${SEL}"/><text y="5" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="600" fill="#fff">${Math.round(action.shown)}°</text></g>`; }
  overlayG.innerHTML=o;
}
/* Drehen: Formen, Linien, Pfeile ohne Anschluss und Striche; Folien, Bahnen und Tabellen bleiben gerade */
function canRot(it){ return it.type==='path'||(it.type==='conn'&&!it.from&&!it.to)||(it.type==='shape'&&!['frame','pool','table','quiz'].includes(it.kind)); }
function rotHandle(x,y,u,ax,ay){ const R=(coarse?13:10)*u;
  return `<path d="M${r(ax)} ${r(ay)}L${r(x)} ${r(y)}" stroke="${SEL}" stroke-width="${u}" pointer-events="none"/><circle data-h="rot:0" cx="${r(x)}" cy="${r(y)}" r="${(coarse?22:15)*u}" fill="transparent"/>`+
    `<circle data-h="rot:0" cx="${r(x)}" cy="${r(y)}" r="${R}" fill="#fff" stroke="${SEL}" stroke-width="${1.5*u}"/><path d="M${r(x-R*0.45)} ${r(y-R*0.15)}a${r(R*0.48)} ${r(R*0.48)} 0 1 1 ${r(R*0.2)} ${r(R*0.52)}M${r(x-R*0.45)} ${r(y-R*0.15)}l${r(-R*0.05)} ${r(-R*0.38)}M${r(x-R*0.45)} ${r(y-R*0.15)}l${r(R*0.36)} ${r(-R*0.1)}" fill="none" stroke="${SEL}" stroke-width="${1.6*u}" stroke-linecap="round" pointer-events="none"/>`; }
/* Hilfslinien: Kanten und Mitten der sichtbaren Formen, an denen Verschieben und Größenändern einrastet */
function buildCand(skip){
  const rc=svg.getBoundingClientRect(), vx1=-view.x/view.k, vy1=-view.y/view.k, vx2=vx1+rc.width/view.k, vy2=vy1+rc.height/view.k, c={x:[],y:[]};
  for(const s of doc.items){ if(s.type!=='shape'||skip.has(s.id)) continue;
    if(s.x>vx2||s.x+s.w<vx1||s.y>vy2||s.y+s.h<vy1) continue;
    for(const f of [0,0.5,1]){ c.x.push({v:s.x+s.w*f,a:s.y,b:s.y+s.h}); c.y.push({v:s.y+s.h*f,a:s.x,b:s.x+s.w}); } }
  return c;
}
function nearCand(list,vals,T){ let best=null; for(const c of list) for(const v of vals){ const d=c.v-v; if(Math.abs(d)<=T&&(best===null||Math.abs(d)<Math.abs(best))) best=d; } return best; }
function guideLines(b,cand){
  const out=[];
  for(const [ax,lo,sz,olo,osz] of [['x',b.x,b.w,b.y,b.h],['y',b.y,b.h,b.x,b.w]]){ const seen=new Map();
    for(const c of cand[ax]) for(const f of [0,0.5,1]) if(Math.abs(c.v-(lo+sz*f))<0.05){ const key=Math.round(c.v*10), g=seen.get(key)||{v:c.v,a:olo,b:olo+osz}; g.a=Math.min(g.a,c.a); g.b=Math.max(g.b,c.b); seen.set(key,g); }
    let n=0; for(const g of seen.values()){ if(n++>=4) break; out.push(ax==='x'?{x:g.v,a:g.a,b:g.b}:{y:g.v,a:g.a,b:g.b}); } }
  return out;
}
function applyView(){
  worldG.setAttribute('transform',`translate(${r(view.x)} ${r(view.y)}) scale(${view.k})`);
  let g=20*view.k; while(g<12) g*=5;
  gridP.setAttribute('width',g); gridP.setAttribute('height',g);
  gridP.setAttribute('x',r(view.x%g-1.5)); gridP.setAttribute('y',r(view.y%g-1.5)); patShape();
  $('zoomLabel').textContent=Math.round(view.k*100)+' %';
  renderOverlay(); if(editing) placeEditor(); placeProps();
  if(viewNeedsRender()&&!viewRaf) viewRaf=requestAnimationFrame(()=>{ viewRaf=0; if(viewNeedsRender()) render(); });
}
function toWorld(cx,cy){ const rc=svg.getBoundingClientRect(); return {x:(cx-rc.left-view.x)/view.k,y:(cy-rc.top-view.y)/view.k}; }
function zoomAt(sx,sy,f){ const k=clamp(view.k*f,0.15,4),wx=(sx-view.x)/view.k,wy=(sy-view.y)/view.k; view.k=k; view.x=sx-wx*k; view.y=sy-wy*k; applyView(); }
function zoomCenter(f){ const rc=svg.getBoundingClientRect(); zoomAt(rc.width/2,rc.height/2,f); }
function contentBox(pad,noFrames){
  let x1=Infinity,y1=Infinity,x2=-Infinity,y2=-Infinity;
  for(const it of doc.items){ if(it.kind==='frame'){ if(noFrames) continue; y1=Math.min(y1,it.y-36); }
    const b=bbox(it); let ex=0,eb=0;
    if(it.type==='shape'&&it.text&&textBox(it).mode==='below'){ useFont(it); ex=50; eb=wrap(it.text,textBox(it).maxW).length*LH+8; }
    x1=Math.min(x1,b.x-ex); y1=Math.min(y1,b.y); x2=Math.max(x2,b.x+b.w+ex); y2=Math.max(y2,b.y+b.h+eb); }
  if(x1===Infinity) return null;
  return {x:Math.floor(x1-pad),y:Math.floor(y1-pad),w:Math.ceil(x2-x1+2*pad),h:Math.ceil(y2-y1+2*pad)};
}
function fit(){
  const rc=svg.getBoundingClientRect(); if(!rc.width||!rc.height) return;
  const b=contentBox(40);
  if(!b){ view={x:0,y:0,k:1}; applyView(); return; }
  const k=clamp(Math.min(rc.width/b.w,rc.height/b.h),0.15,1);
  view={k,x:(rc.width-b.w*k)/2-b.x*k,y:(rc.height-b.h*k)/2-b.y*k}; applyView();
}

