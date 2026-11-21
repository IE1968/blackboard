/* ---------- Folienübersicht: Vorschau aller Folien, Klick springt hin, Ziehen sortiert um ---------- */
const slidesEl=$('slides'), slList=$('slList'); let slT=0, slSel=null, slDrag=null;
function toggleSlides(on){ const show=on===undefined?slidesEl.hidden:on; slidesEl.hidden=!show; closeMenu(); if(show) renderSlides(); }
function slideThumb(f){
  assignFrames(); const ids=new Set(doc.items.filter(i=>i.fr===f.id).map(i=>i.id));
  for(const i of doc.items) if(i.type==='conn'&&i.from&&i.to&&ids.has(i.from)&&ids.has(i.to)) ids.add(i.id);
  const ed=editing; editing=null; const body=doc.items.filter(i=>ids.has(i.id)).map(itemSVG).join(''); editing=ed;
  return `<svg viewBox="${r(f.x)} ${r(f.y)} ${r(f.w)} ${r(f.h)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><rect x="${r(f.x)}" y="${r(f.y)}" width="${r(f.w)}" height="${r(f.h)}" fill="${paper()}"/>${body}</svg>`;
}
function renderSlides(){
  clearTimeout(slT); slT=0; if(slidesEl.hidden) return;
  const fr=frames(); if(slSel&&!fr.some(f=>f.id===slSel)) slSel=null;
  const one=[...sel].map(byId).find(i=>i&&i.kind==='frame'); if(one) slSel=one.id;
  slList.innerHTML=fr.length?fr.map((f,i)=>`<div class="st" role="option" tabindex="0" data-f="${f.id}" aria-selected="${f.id===slSel}" title="Folie ${i+1}: anklicken springt hin, ziehen sortiert um">${slideThumb(f)}<span>${i+1}${f.text?' · '+esc(String(f.text).replace(/\s+/g,' ').slice(0,30)):''}</span></div>`).join('')
    :'<div class="slEmpty">Noch keine Folien. „+ Folie“ legt eine an, oder ziehe „Folie“ aus der Formenleiste auf das Board.</div>';
}
function scheduleSlides(){ if(!slidesEl.hidden&&!slT) slT=setTimeout(renderSlides,350); }
function gotoFrame(id){
  const f=byId(id); if(!f) return; slSel=id; const rc=svg.getBoundingClientRect(), ph=slidesEl.hidden?0:slidesEl.getBoundingClientRect().height;
  const H=Math.max(80,rc.height-ph), k=clamp(Math.min(rc.width/(f.w+80),H/(f.h+110)),0.15,2);
  view={k,x:rc.width/2-(f.x+f.w/2)*k,y:H/2-(f.y+f.h/2)*k+12*k}; sel=new Set([id]); applyView(); render(); renderSlides();
}
slList.addEventListener('pointerdown',e=>{
  const t=e.target.closest('.st'); if(!t||(e.pointerType==='mouse'&&e.button!==0)) return;
  slDrag={id:t.dataset.f,x:e.clientX,y:e.clientY,on:false,pid:e.pointerId,el:t};
});
slList.addEventListener('pointermove',e=>{
  const d=slDrag; if(!d||d.pid!==e.pointerId) return;
  if(!d.on){ if(Math.abs(e.clientX-d.x)<8) return; if(Math.abs(e.clientY-d.y)>Math.abs(e.clientX-d.x)*2) return; d.on=true; d.el.classList.add('drag'); try{ slList.setPointerCapture(e.pointerId); }catch(_){} }
  const ts=[...slList.querySelectorAll('.st')]; let idx=ts.length;
  for(let i=0;i<ts.length;i++){ const rc=ts[i].getBoundingClientRect(); if(e.clientX<rc.left+rc.width/2){ idx=i; break; } }
  d.idx=idx; let ins=$('slIns'); if(!ins){ ins=document.createElement('div'); ins.id='slIns'; slidesEl.appendChild(ins); }
  const lr=slList.getBoundingClientRect(), z=uiCfg.scale, ref=ts[idx]||ts[ts.length-1], rr=ref.getBoundingClientRect();
  ins.style.left=((idx<ts.length?rr.left:rr.right+10)-lr.left)/z+'px'; ins.style.top=(slList.offsetTop+8)+'px'; ins.style.height=(slList.clientHeight-18)+'px';
  const ed=lr.right-e.clientX<40?1:e.clientX-lr.left<40?-1:0; if(ed) slList.scrollLeft+=ed*12;
});
function slEnd(e){
  const d=slDrag; slDrag=null; const ins=$('slIns'); if(ins) ins.remove(); if(!d) return;
  if(d.on){ d.el.classList.remove('drag'); if(d.idx==null) return;
    const fr=frames(), from=fr.findIndex(f=>f.id===d.id); if(from<0) return; let to=d.idx; if(to>from) to--;
    if(to!==from){ const [m]=fr.splice(from,1); fr.splice(to,0,m); fr.forEach((f,n)=>f.ord=n+1); slSel=d.id; commit(); render(); }
    return; }
  if(e.type==='pointerup') gotoFrame(d.id);
}
slList.addEventListener('pointerup',slEnd); slList.addEventListener('pointercancel',slEnd);
slList.addEventListener('keydown',e=>{ const t=e.target.closest('.st'); if(!t) return;
  if(e.key==='Enter'||e.key===' '){ e.preventDefault(); gotoFrame(t.dataset.f); }
  else if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&e.altKey){ e.preventDefault(); slSel=t.dataset.f; moveFrame(t.dataset.f,e.key==='ArrowLeft'?-1:1); setTimeout(()=>{ renderSlides(); const n=slList.querySelector(`[data-f="${slSel}"]`); n&&n.focus(); },0); }
  else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){ e.preventDefault(); const n=e.key==='ArrowLeft'?t.previousElementSibling:t.nextElementSibling; n&&n.focus(); }
});
$('slClose').onclick=()=>toggleSlides(false);
$('slPlay').onclick=()=>startPres(slSel);
$('slAdd').onclick=()=>{ const rc=svg.getBoundingClientRect(); addShape('frame',toWorld(rc.left+rc.width/2,rc.top+rc.height/2)); const f=frames().pop(); if(f){ slSel=f.id; renderSlides(); gotoFrame(f.id); } };

