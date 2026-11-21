/* ---------- Zeiger auf der Tafel ---------- */
/* Magnetisches Andocken: sucht die Form in der Nähe des Pfeilendes und den passenden Andockpunkt */
function dockAt(w,exclude){
  const R=14/view.k; let best=null,bd=Infinity;
  for(let i=doc.items.length-1;i>=0;i--){ const s=doc.items[i]; if(s.type!=='shape'||noDock(s.kind)||s.id===exclude) continue;
    const dx=Math.max(s.x-w.x,0,w.x-s.x-s.w), dy=Math.max(s.y-w.y,0,w.y-s.y-s.h), d=Math.hypot(dx,dy);
    if(d<=R&&d<bd){ best=s; bd=d; if(!d) break; } }
  if(!best) return null;
  let side=null,sd=Infinity; for(const k in SIDES){ const p=sidePt(best,k), d=Math.hypot(p.x-w.x,p.y-w.y); if(d<sd){ sd=d; side=k; } }
  return {s:best,side:(bd>0||sd<=Math.max(16/view.k,Math.min(best.w,best.h)*0.22))?side:null};
}
function movers(){
  const ids=new Set(sel);
  if([...sel].some(id=>(byId(id)||{}).kind==='frame')) assignFrames();
  for(const id of sel){ const p=byId(id); if(!p||p.type!=='shape'||!isBox(p.kind)) continue;
    for(const o of doc.items){ if(o.id===p.id||o.type==='conn'||o.lock||o.kind==='frame') continue; const b=bbox(o),cx=b.x+b.w/2,cy=b.y+b.h/2;
      if(p.kind==='frame'?o.fr===p.id:(cx>p.x&&cx<p.x+p.w&&cy>p.y&&cy<p.y+p.h)) ids.add(o.id); } }
  return [...ids].map(byId).filter(it=>it&&!it.lock).map(it=>({id:it.id,d:JSON.parse(JSON.stringify(it))}));
}
function startConn(base,from,w){
  const c={id:nid(),type:'conn',from:from?from.id:null,to:null,p1:{x:w.x,y:w.y},p2:{x:w.x,y:w.y},text:'',stroke:INK,sw:2,style:'ortho',arrow:true,dash:false};
  if(from&&from.kind.startsWith('net')){ c.head='none'; c.style='straight'; delete c.arrow; }
  doc.items.push(c); sel=new Set([c.id]); action={...base,type:'connEnd',id:c.id,deps:[c.id],end:'b',isNew:true}; svg.classList.add('noconn'); render();
}
function eraseAt(e){
  const el=document.elementFromPoint(e.clientX,e.clientY), g=el&&el.closest&&el.closest('#items [data-id]');
  if(g&&!(byId(g.dataset.id)||{}).lock){ removeIds(new Set([g.dataset.id])); action.dirty=true; render(); }
}
function cancelAction(){
  if(!action) return;
  if(liveEl){ liveEl.remove(); liveEl=null; }
  if(action.type!=='pan'&&action.type!=='pen'&&hist[hi]) doc=snapDoc(hist[hi]);
  action=null; hoverId=null; svg.classList.remove('noconn'); render();
}
function touchPair(){ const rc=svg.getBoundingClientRect(),[p,q]=[...touches.values()];
  return {d:Math.hypot(p.x-q.x,p.y-q.y)||1,mx:(p.x+q.x)/2-rc.left,my:(p.y+q.y)/2-rc.top}; }

svg.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button===2) return;
  e.preventDefault(); finishEdit(); menu.hidden=true;
  if(e.pointerType==='touch'&&!coarse){ coarse=true; renderOverlay(); } else if(e.pointerType==='mouse'&&coarse){ coarse=false; }
  if(e.pointerType==='touch'){
    touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(touches.size===2){ cancelAction(); const t=touchPair(); pinch={d:t.d,mx:t.mx,my:t.my,v:{...view}}; return; }
    if(touches.size>2) return;
  }
  try{ svg.setPointerCapture(e.pointerId); }catch(_){}
  const w=toWorld(e.clientX,e.clientY);
  const base={pid:e.pointerId,sx:e.clientX,sy:e.clientY,w0:w,moved:false};
  if(e.button===1||spaceDown||tool==='pan'){ action={...base,type:'pan',vx:view.x,vy:view.y}; return; }
  const hEl=e.target.closest('[data-h]'), iEl=e.target.closest('#items [data-id]'), item=iEl?byId(iEl.dataset.id):null;
  if(DRAW[tool]&&e.pointerType==='touch'&&!uiCfg.finger){ action={...base,type:'pan',vx:view.x,vy:view.y}; return; }   /* nur der Stift zeichnet, der Finger verschiebt */
  if(DRAW[tool]&&e.pointerType==='pen'&&uiCfg.finger&&!uiCfg.fingerSet){ setUi({finger:false,fingerSet:true}); toast('Stift erkannt: Ab jetzt zeichnet nur der Stift, mit dem Finger verschiebst du die Tafel. Umstellen unter „Ansicht“.'); }
  if(DRAW[tool]){
    const pr=e.pointerType==='pen'&&tool!=='marker'&&uiCfg.press!=='off', f0=pr?pressW(e.pressure||0.25,e):0.45;
    action={...base,type:'pen',tool,pr,pts:[[r(w.x),r(w.y)]],ws:[r2(f0)],f:f0,t:performance.now(),lx:e.clientX,ly:e.clientY};
    liveEl=document.createElementNS('http://www.w3.org/2000/svg','g'); liveEl.setAttribute('pointer-events','none');
    liveEl.innerHTML=strokeSVG(Object.assign({pts:action.pts,ws:action.ws,tool},penStyles[tool]));
    itemsG.appendChild(liveEl); return;
  }
  if(tool==='erase'){ action={...base,type:'erase',dirty:false}; eraseAt(e); return; }
  if(tool==='text'){ action={...base,type:'textclick'}; return; }
  if(tool==='conn'){ startConn(base,item&&item.type==='shape'&&!noDock(item.kind)?item:null,w); return; }
  if(hEl){
    const [t,v]=hEl.dataset.h.split(':'), one=byId([...sel][0]);
    if(t==='gs'){ const its=[...sel].map(byId).filter(i=>i&&!i.lock), ub=unionBox(its.filter(i=>!(i.type==='conn'&&(i.from||i.to))));
      if(ub&&ub.w>1&&ub.h>1){ action={...base,type:'gresize',dir:v,box:{x1:ub.x,y1:ub.y,x2:ub.x+ub.w,y2:ub.y+ub.h},orig:its.map(i=>({id:i.id,d:JSON.parse(JSON.stringify(i))})),deps:depsFor(its.map(i=>i.id)),qmin:Math.max(0.05,12/Math.min(ub.w,ub.h))}; return; } }
    if(one&&(t==='tc'||t==='tr')){ action={...base,type:'tdiv',k:t==='tc'?'c':'r',i:+v,id:one.id,deps:depsFor([one.id]),o:{colW:one.colW.slice(),rowH:one.rowH.slice()}}; return; }
    if(one){
      if(t==='rs'){ action={...base,type:'resize',dir:v,id:one.id,deps:depsFor([one.id]),o:{x:one.x,y:one.y,w:one.w,h:one.h,colW:one.colW&&one.colW.slice(),rowH:one.rowH&&one.rowH.slice()}}; return; }
      if(t==='cn'){ startConn(base,one,w); return; }
      if(t==='ce'){ action={...base,type:'connEnd',id:one.id,deps:[one.id],end:v,isNew:false}; svg.classList.add('noconn'); return; }
    }
  }
  if(item){
    if(item.kind==='table') lastCell={id:item.id,cell:cellAt(item,w)};
    if(e.shiftKey){ const grp=item.g?doc.items.filter(i=>i.g===item.g).map(i=>i.id):[item.id], on=sel.has(item.id);
      grp.forEach(id=>on?sel.delete(id):sel.add(id)); action={...base,type:'none'}; render(); return; }
    if(item.lock){ sel.clear(); action={...base,type:'marquee',cur:w,lockHit:item.id}; render(); return; }   /* gesperrt: Antippen wählt aus, Ziehen zieht einen Auswahlrahmen auf */
    if(!sel.has(item.id)){ sel=new Set([item.id]); expandSel(); }
    action={...base,type:'move',hitId:item.id,orig:movers()}; action.deps=depsFor(action.orig.map(o=>o.id)); render(); return;
  }
  if(!e.shiftKey) sel.clear();
  action={...base,type:'marquee',cur:w}; render();
});
svg.addEventListener('pointermove',e=>{
  if(touches.has(e.pointerId)) touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch){ if(touches.size<2) return; const t=touchPair(),k=clamp(pinch.v.k*t.d/pinch.d,0.15,4);
    const wx=(pinch.mx-pinch.v.x)/pinch.v.k,wy=(pinch.my-pinch.v.y)/pinch.v.k;
    view.k=k; view.x=t.mx-wx*k; view.y=t.my-wy*k; applyView(); return; }
  const a=action; if(!a||a.pid!==e.pointerId) return;
  const w=toWorld(e.clientX,e.clientY);
  if(a.type==='pen'){
    /* Stift: alle Zwischenwerte nutzen (das iPad misst den Pencil viel öfter, als der Bildschirm Ereignisse meldet) */
    const evs=a.pr&&e.getCoalescedEvents?(e.getCoalescedEvents()||[]):[]; let added=false;
    for(const ev of (evs.length?evs:[e])){
      const p=toWorld(ev.clientX,ev.clientY), l=a.pts[a.pts.length-1];
      if(Math.hypot(p.x-l[0],p.y-l[1])*view.k<(a.pr?1.4:2)) continue;
      if(a.pr){ const target=pressW(ev.pressure>0?ev.pressure:a.lp||0.25,ev); a.lp=ev.pressure>0?ev.pressure:a.lp; a.f=a.f*0.62+target*0.38; a.ws.push(r2(a.f)); }
      else if(a.tool==='brush'){ const now=performance.now(), v=Math.hypot(ev.clientX-a.lx,ev.clientY-a.ly)/Math.max(1,now-a.t);
        a.f=a.f*0.65+clamp(1.45-v*0.55,0.35,1.45)*0.35; a.ws.push(r2(a.f)); a.t=now; a.lx=ev.clientX; a.ly=ev.clientY; }
      a.pts.push([r(p.x),r(p.y)]); added=true;
    }
    if(added){ liveEl.innerHTML=strokeSVG(Object.assign({pts:a.pts,ws:(a.pr||a.tool==='brush')?a.ws:null,tool:a.tool},penStyles[a.tool])); liveDraft(a); }
    return; }
  if(a.type==='erase'){ eraseAt(e); return; }
  if(!a.moved&&Math.hypot(e.clientX-a.sx,e.clientY-a.sy)<4) return;
  a.moved=true;
  const smart=uiCfg.snap&&!e.altKey, sn=smart?snap:(v=>v), TOL=6/view.k; a.guides=null;
  switch(a.type){
    case 'pan': view.x=a.vx+e.clientX-a.sx; view.y=a.vy+e.clientY-a.sy; applyView(); return;
    case 'move': {
      let dx=w.x-a.w0.x,dy=w.y-a.w0.y; const ref=a.orig.find(o=>o.d.type==='shape');
      if(ref){ dx=sn(ref.d.x+dx)-ref.d.x; dy=sn(ref.d.y+dy)-ref.d.y; }
      if(smart){   /* Kanten und Mitten rasten an anderen Formen ein; rosa Linien zeigen, woran */
        if(!a.cand){ a.cand=buildCand(new Set(a.orig.map(o=>o.id))); a.box0=unionBox(a.orig.map(o=>o.d).filter(d=>d.type!=='conn'||(!d.from&&!d.to))); }
        const b0=a.box0;
        if(b0){ const rx=w.x-a.w0.x, ry=w.y-a.w0.y;
          const hx=nearCand(a.cand.x,[b0.x+rx,b0.x+b0.w/2+rx,b0.x+b0.w+rx],TOL), hy=nearCand(a.cand.y,[b0.y+ry,b0.y+b0.h/2+ry,b0.y+b0.h+ry],TOL);
          if(hx!==null) dx=rx+hx; if(hy!==null) dy=ry+hy;
          a.guides=guideLines({x:b0.x+dx,y:b0.y+dy,w:b0.w,h:b0.h},a.cand); } }
      for(const o of a.orig){ const it=byId(o.id),d=o.d; if(!it) continue;
        if(it.type==='shape'){ it.x=r(d.x+dx); it.y=r(d.y+dy); }
        else if(it.type==='path') it.pts=d.pts.map(p=>[r(p[0]+dx),r(p[1]+dy)]);
        else { it.p1={x:r(d.p1.x+dx),y:r(d.p1.y+dy)}; it.p2={x:r(d.p2.x+dx),y:r(d.p2.y+dy)}; } }
      break; }
    case 'resize': {
      const it=byId(a.id),o=a.o,d=a.dir; if(!it) break;
      let x1=o.x,y1=o.y,x2=o.x+o.w,y2=o.y+o.h;
      const cand=smart?(a.cand||(a.cand=buildCand(new Set([a.id])))):null;
      const SX=v=>{ const h=cand?nearCand(cand.x,[v],TOL):null; return h!==null?v+h:sn(v); }, SY=v=>{ const h=cand?nearCand(cand.y,[v],TOL):null; return h!==null?v+h:sn(v); };
      if(d.includes('w')) x1=Math.min(SX(w.x),x2-20); if(d.includes('e')) x2=Math.max(SX(w.x),x1+20);
      if(d.includes('n')) y1=Math.min(SY(w.y),y2-20); if(d.includes('s')) y2=Math.max(SY(w.y),y1+20);
      if(d.length===2&&!e.shiftKey&&it.kind!=='text'){   /* Ecke: Seitenverhältnis bleibt, Umschalttaste gibt es frei */
        const sx=(x2-x1)/o.w, sy=(y2-y1)/o.h, q=Math.max(Math.abs(sx-1)>Math.abs(sy-1)?sx:sy,20/Math.min(o.w,o.h)), nw=r(o.w*q), nh=r(o.h*q);
        if(d.includes('w')) x1=x2-nw; else x2=x1+nw;
        if(d.includes('n')) y1=y2-nh; else y2=y1+nh;
      }
      it.x=x1; it.y=y1; it.w=x2-x1; it.h=y2-y1;
      if(it.kind==='table'){ it.colW=o.colW.map(v=>r(v*it.w/o.w)); it.rowH=o.rowH.map(v=>r(v*it.h/o.h)); }
      if(isSq(it.kind)){ const m=Math.max(it.w,it.h); if(d.includes('w')) it.x=x2-m; if(d.includes('n')) it.y=y2-m; it.w=it.h=m; }
      if(cand) a.guides=guideLines({x:it.x,y:it.y,w:it.w,h:it.h},cand);
      break; }
    case 'gresize': {   /* alles Ausgewählte gemeinsam um die gegenüberliegende Ecke skalieren */
      const B=a.box,d=a.dir, ax=d.includes('w')?B.x2:B.x1, ay=d.includes('n')?B.y2:B.y1, cx=d.includes('w')?B.x1:B.x2, cy=d.includes('n')?B.y1:B.y2;
      const q=clamp(Math.max((cx-ax+w.x-a.w0.x)/(cx-ax),(cy-ay+w.y-a.w0.y)/(cy-ay)),a.qmin,20), fsq=D=>clamp(Math.round((D.fs||14)*q),6,200);
      for(const o of a.orig){ const it=byId(o.id),D=o.d; if(!it) continue;
        if(it.type==='shape'){ it.x=r(ax+(D.x-ax)*q); it.y=r(ay+(D.y-ay)*q); it.w=r(D.w*q); it.h=r(D.h*q); it.fs=fsq(D);
          if(D.colW){ it.colW=D.colW.map(v=>r(v*q)); it.rowH=D.rowH.map(v=>r(v*q)); it.w=sum(it.colW); it.h=sum(it.rowH); } }
        else if(it.type==='path') it.pts=D.pts.map(p=>[r(ax+(p[0]-ax)*q),r(ay+(p[1]-ay)*q)]);
        else { it.p1={x:r(ax+(D.p1.x-ax)*q),y:r(ay+(D.p1.y-ay)*q)}; it.p2={x:r(ax+(D.p2.x-ax)*q),y:r(ay+(D.p2.y-ay)*q)}; it.fs=fsq(D); } }
      break; }
    case 'tdiv': {   /* Spaltenbreite oder Zeilenhöhe einer Tabelle */
      const it=byId(a.id); if(!it) break; const hz=a.k==='c', arr=(hz?a.o.colW:a.o.rowH).slice();
      arr[a.i]=Math.max(20,sn(arr[a.i]+(hz?w.x-a.w0.x:w.y-a.w0.y))); if(hz) it.colW=arr; else it.rowH=arr; it.w=sum(it.colW); it.h=sum(it.rowH);
      break; }
    case 'connEnd': {
      const c=byId(a.id); if(!c) break;
      const dk=dockAt(w,a.end==='a'?c.to:c.from); a.dock=dk; hoverId=dk?dk.s.id:null;
      if(dk){   /* in der Nähe einer Form: Ende springt an die Form bzw. an den nächsten Andockpunkt */
        if(a.end==='a'){ c.from=dk.s.id; if(dk.side) c.fa=dk.side; else delete c.fa; } else { c.to=dk.s.id; if(dk.side) c.ta=dk.side; else delete c.ta; }
        break; }
      if(a.end==='a'){ c.from=null; delete c.fa; } else { c.to=null; delete c.ta; }
      const oa=anchor(c,a.end==='a'?'b':'a'), ox=oa.x+oa.w/2, oy=oa.y+oa.h/2; let px=sn(w.x), py=sn(w.y);
      if(!e.altKey){   /* Umschalttaste: in 45°-Schritten einrasten; sonst nur knapp neben waagerecht/senkrecht */
        const dx=px-ox, dy=py-oy, ang=Math.atan2(dy,dx), step=e.shiftKey?Math.PI/4:Math.PI/2, near=Math.round(ang/step)*step;
        if((dx||dy)&&(e.shiftKey||Math.abs(ang-near)<0.045)){ const l=dx*Math.cos(near)+dy*Math.sin(near); px=r(ox+Math.cos(near)*l); py=r(oy+Math.sin(near)*l); }
      }
      if(a.end==='a') c.p1={x:px,y:py}; else c.p2={x:px,y:py};
      break; }
    case 'marquee': a.cur=w; renderOverlay(); return;
    default: return;
  }
  if(a.deps) renderPartial(a.deps); else render();
});
function tap(id,e){
  const now=performance.now();
  if(lastTap&&now-lastTap.t<420&&lastTap.id===id&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<26){
    lastTap=null; const ti=id&&byId(id); if(ti) startEdit(id,ti.kind==='table'?cellAt(ti,toWorld(e.clientX,e.clientY)):null); else if(tool==='select') newTextAt(toWorld(e.clientX,e.clientY)); return true; }
  lastTap={t:now,id,x:e.clientX,y:e.clientY}; return false;
}
function onUp(e){
  touches.delete(e.pointerId);
  if(pinch){ if(touches.size<2) pinch=null; return; }
  const a=action; if(!a||a.pid!==e.pointerId) return;
  action=null; hoverId=null; svg.classList.remove('noconn');
  if(e.type==='pointercancel'){ action=a; cancelAction(); return; }
  switch(a.type){
    case 'pen': if(liveEl){ liveEl.remove(); liveEl=null; }
      { const ps=penStyles[a.tool], it={id:nid(),type:'path',pts:a.pts,stroke:ps.stroke,sw:ps.sw,tool:a.tool,tip:ps.tip};
        if(a.tool==='brush'&&!a.pr){ const n=a.ws.length; [0.45,0.7,0.88].forEach((q,k)=>{ if(n-1-k>0) a.ws[n-1-k]=r2(a.ws[n-1-k]*q); }); }
        if((a.pr||a.tool==='brush')&&a.ws.length===a.pts.length) it.ws=a.ws;
        doc.items.push(it); commit(); }
      break;
    case 'erase': if(a.dirty) commit(); break;
    case 'textclick': if(!a.moved){ setTool('select'); newTextAt(a.w0); return; } break;
    case 'connEnd': {
      const c=byId(a.id); if(!c) break;
      if(a.isNew){ const pts=route(c),f=pts[0],l=pts[pts.length-1];
        if(!a.moved||Math.hypot(l.x-f.x,l.y-f.y)<12){ removeIds(new Set([c.id])); sel.clear(); if(a.moved) break; doc=snapDoc(hist[hi]); break; } }
      commit(); break; }
    case 'move': if(a.moved) commit(); else if(tap(a.hitId,e)) return; break;
    case 'resize': { const it=byId(a.id); if(it&&a.moved){ if(it.kind==='text'||it.kind==='table') autosize(it); commit(); } break; }
    case 'gresize': if(a.moved){ for(const o of a.orig){ const it=byId(o.id); if(it&&it.type==='shape'&&(it.kind==='text'||it.kind==='table')) autosize(it); } commit(); } break;
    case 'tdiv': { const it=byId(a.id); if(it&&a.moved){ autosize(it); commit(); } break; }
    case 'marquee':
      if(a.moved){ const x1=Math.min(a.w0.x,a.cur.x),y1=Math.min(a.w0.y,a.cur.y),x2=Math.max(a.w0.x,a.cur.x),y2=Math.max(a.w0.y,a.cur.y);
        for(const it of doc.items){ if(it.lock) continue; const b=bbox(it);
          const inside=b.x>=x1&&b.y>=y1&&b.x+b.w<=x2&&b.y+b.h<=y2, hit=b.x<x2&&b.x+b.w>x1&&b.y<y2&&b.y+b.h>y1;
          if(it.type==='shape'&&isBox(it.kind)?inside:hit) sel.add(it.id); }
        expandSel(); }
      else if(a.lockHit){ if(tap(a.lockHit,e)) return; if(byId(a.lockHit)) sel=new Set([a.lockHit]); }
      else if(tap(null,e)) return;
      break;
  }
  render();
}
svg.addEventListener('pointerup',onUp);
svg.addEventListener('pointercancel',onUp);
let wheelQ=null;   /* schnelle Mausrad- und Touchpad-Ereignisse werden pro Bild gebündelt */
svg.addEventListener('wheel',e=>{
  e.preventDefault(); const rc=svg.getBoundingClientRect(), q=wheelQ||(wheelQ={f:1,dx:0,dy:0,sx:0,sy:0});
  if(e.ctrlKey||e.metaKey){ q.f*=Math.exp(-e.deltaY*0.01); q.sx=e.clientX-rc.left; q.sy=e.clientY-rc.top; }
  else { q.dx+=e.deltaX; q.dy+=e.deltaY; }
  if(!q.raf) q.raf=requestAnimationFrame(()=>{ const w=wheelQ; wheelQ=null; view.x-=w.dx; view.y-=w.dy; if(w.f!==1) zoomAt(w.sx,w.sy,w.f); else applyView(); });
},{passive:false});
svg.addEventListener('contextmenu',e=>e.preventDefault());
/* Touch-Geräte: Der Browser darf nicht die ganze Seite zoomen, nur die Tafel zoomt. */
['gesturestart','gesturechange','gestureend'].forEach(n=>document.addEventListener(n,e=>e.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>{ if(e.touches.length>1) e.preventDefault(); },{passive:false});
svg.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});
svg.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});

