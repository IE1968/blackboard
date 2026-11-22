/* ---------- Präsentation: Folie für Folie im Vollbild, mit Laserpointer ---------- */
const presEl=$('pres'), presSvg=$('presSvg'), laserEl=$('laser'), trailEl=$('laserTrail');
let pres=null;
function presBox(b){ pres.box=b; presSvg.setAttribute('viewBox',r(b.x)+' '+r(b.y)+' '+r(b.w)+' '+r(b.h));
  const c=$('presClipR'); c.setAttribute('x',r(b.x)); c.setAttribute('y',r(b.y)); c.setAttribute('width',r(b.w)); c.setAttribute('height',r(b.h)); }
function presBar(){ const n=pres.slides.length;
  $('presNo').textContent=pres.whole?'Ganzes Board':(pres.i+1)+' / '+n; $('presPrev').disabled=pres.i<=0; $('presNext').disabled=pres.i>=n-1;
  $('presSolve').hidden=!pres.quiz; $('presSolve').setAttribute('aria-pressed',pres.shown.has(pres.whole?'*':pres.ids[pres.i]));
  $('presLaser').setAttribute('aria-pressed',pres.laser); presEl.classList.toggle('laser',pres.laser); if(!pres.laser){ laserEl.hidden=true; pres.trail=[]; trailEl.setAttribute('points',''); } }
function presWake(){ if(!pres) return; presEl.classList.remove('idle'); clearTimeout(pres.idleT); pres.idleT=setTimeout(()=>{ if(pres) presEl.classList.add('idle'); },2600); }
function presGo(i){
  if(!pres) return; i=clamp(i,0,pres.slides.length-1); if(i===pres.i) return;
  pres.i=i; presBar(); const from=pres.box, to=pres.slides[i], t0=performance.now(), D=480; cancelAnimationFrame(pres.raf);
  const step=now=>{ if(!pres) return; let t=Math.min(1,(now-t0)/D); t=t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    presBox({x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t,w:from.w+(to.w-from.w)*t,h:from.h+(to.h-from.h)*t});
    if(t<1) pres.raf=requestAnimationFrame(step); };
  pres.raf=requestAnimationFrame(step);
}
function presRender(){ $('presBody').innerHTML=doc.items.filter(i=>i.kind!=='frame').map(itemSVG).join(''); }
function presSolve(){ if(!pres||!pres.quiz) return; const k=pres.whole?'*':pres.ids[pres.i]; if(pres.shown.has(k)) pres.shown.delete(k); else pres.shown.add(k); presRender(); presBar(); }
function startPres(fromId){
  finishEdit(); cancelAction(); closeMenu();
  const fr=frames(); let slides=fr.map(f=>({x:f.x,y:f.y,w:f.w,h:f.h})), whole=false;
  if(!slides.length){ const b=contentBox(30,true); if(!b){ toast('Das Board ist leer.'); return; } slides=[b]; whole=true; }
  assignFrames();
  /* Hintergrund wie auf dem Board: Fläche mit Struktur und Muster (Punkte, Karos, Linien …) */
  const cs=getComputedStyle($('stage')), pat=gridP.dataset.p||'dots';
  for(const k of ['backgroundColor','backgroundImage','backgroundSize','backgroundPosition','backgroundRepeat']) presEl.style[k]=cs[k];
  presEl.style.setProperty('--dot',cs.getPropertyValue('--dot'));
  presSvg.innerHTML=`<defs><clipPath id="presClip"><rect id="presClipR"/></clipPath><pattern id="presGrid" width="20" height="20" x="-1.5" y="-1.5" patternUnits="userSpaceOnUse">${pat==='none'?'':patHTML(pat,20)}</pattern></defs>`+
    (pat==='none'?'':`<rect x="-200000" y="-200000" width="400000" height="400000" fill="url(#presGrid)" pointer-events="none"/>`)+`<g id="presBody" clip-path="url(#presClip)"></g>`;
  pres=presLive={slides,whole,ids:fr.map(f=>f.id),i:Math.max(0,fr.findIndex(f=>f.id===fromId)),laser:false,trail:[],fs:false,ticks:new Set(),shown:new Set(),quiz:doc.items.some(i=>i.kind==='check')};
  presRender();
  presEl.hidden=false; presBox(slides[pres.i]); presBar(); presWake(); presEl.focus();
  try{ const q=presEl.requestFullscreen&&presEl.requestFullscreen(); if(q&&q.then) q.then(()=>{ if(pres) pres.fs=true; },()=>{}); }catch(e){}
}
function stopPres(){
  if(!pres) return; const p=pres; pres=presLive=null; cancelAnimationFrame(p.raf); clearTimeout(p.idleT);
  presEl.hidden=true; presSvg.innerHTML=''; laserEl.hidden=true; trailEl.setAttribute('points','');
  try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){}
  svg.focus(); if(p.whole) toast('Tipp: Ziehe unter „Präsentation“ Folien auf das Board. Dann blätterst du von Folie zu Folie.');
}
function laserMove(e){
  const rc=presEl.getBoundingClientRect(), x=e.clientX-rc.left, y=e.clientY-rc.top, now=performance.now();
  laserEl.hidden=false; laserEl.style.transform=`translate(${x}px,${y}px)`; pres.trail.push([x,y,now]);
  if(!pres.trailRaf){ const tick=()=>{ if(!pres){ return; } const t=performance.now(); pres.trail=pres.trail.filter(q=>t-q[2]<110);
      trailEl.setAttribute('points',pres.trail.map(q=>r(q[0])+','+r(q[1])).join(' ')); pres.trailRaf=pres.trail.length?requestAnimationFrame(tick):0; };
    pres.trailRaf=requestAnimationFrame(tick); }
}
presEl.addEventListener('pointerdown',e=>{ if(!pres||e.target.closest('#presBar')) return; e.preventDefault(); presWake();
  pres.down={x:e.clientX,y:e.clientY,id:e.pointerId}; try{ presEl.setPointerCapture(e.pointerId); }catch(_){} if(pres.laser) laserMove(e); });
presEl.addEventListener('pointermove',e=>{ if(!pres) return; presWake(); if(pres.laser&&(e.pointerType==='mouse'||pres.down)) laserMove(e); });
presEl.addEventListener('pointerup',e=>{ if(!pres||!pres.down||pres.down.id!==e.pointerId) return; const d=pres.down; pres.down=null;
  if(pres.laser){ if(e.pointerType!=='mouse') laserEl.hidden=true; return; }
  const dx=e.clientX-d.x, dy=e.clientY-d.y, rc=presEl.getBoundingClientRect();
  if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)) presGo(pres.i+(dx<0?1:-1));   /* wischen */
  else if(Math.hypot(dx,dy)<12){   /* tippen: Antwort ankreuzen, sonst linkes Drittel zurück, rechts weiter */
    const el=document.elementFromPoint(e.clientX,e.clientY), g=el&&el.closest&&el.closest('.it'), it=g&&byId(g.dataset.id);
    if(it&&it.kind==='check'){ if(pres.ticks.has(it.id)) pres.ticks.delete(it.id); else pres.ticks.add(it.id); presRender(); return; }
    presGo(pres.i+(e.clientX-rc.left<rc.width*0.3?-1:1)); } });   /* tippen: linkes Drittel zurück, sonst weiter */
presEl.addEventListener('pointercancel',()=>{ if(pres) pres.down=null; });
presEl.addEventListener('wheel',e=>e.preventDefault(),{passive:false});
presEl.addEventListener('contextmenu',e=>e.preventDefault());
$('presPrev').onclick=()=>presGo(pres.i-1); $('presNext').onclick=()=>presGo(pres.i+1); $('presClose').onclick=stopPres;
$('presLaser').onclick=()=>{ pres.laser=!pres.laser; presBar(); }; $('presSolve').onclick=presSolve;
document.addEventListener('fullscreenchange',()=>{ if(pres&&pres.fs&&!document.fullscreenElement) stopPres(); });
document.addEventListener('keydown',e=>{   /* während der Präsentation gehören alle Tasten der Präsentation */
  if(!pres) return; const k=e.key;
  if(k==='Tab'){ presWake(); return; }
  if((k===' '||k==='Enter')&&e.target&&e.target.closest&&e.target.closest('#presBar')){ presWake(); e.stopImmediatePropagation(); return; }
  e.preventDefault(); e.stopImmediatePropagation();
  if(k==='Escape') stopPres();
  else if(k==='ArrowRight'||k==='ArrowDown'||k===' '||k==='PageDown'||k==='Enter') presGo(pres.i+1);
  else if(k==='ArrowLeft'||k==='ArrowUp'||k==='PageUp'||k==='Backspace') presGo(pres.i-1);
  else if(k==='Home') presGo(0); else if(k==='End') presGo(pres.slides.length-1);
  else if(k.toLowerCase()==='l'){ pres.laser=!pres.laser; presBar(); }
  else if(k.toLowerCase()==='a') presSolve();
},true);
document.addEventListener('keyup',e=>{ if(pres) e.stopImmediatePropagation(); },true);

