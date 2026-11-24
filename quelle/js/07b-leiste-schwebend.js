/* ---------- Optionsleiste über der Auswahl (Standard) oder fest oben (Ansicht → Optionsleiste) ----------
   Schwebend: Mit Auswahl steht die Leiste direkt über den gewählten Elementen (passt sie dort nicht hin, darunter).
   Mit Stift, Pinsel oder Marker ohne Auswahl steht sie oben in der Mitte der Tafel. Sonst ist sie ausgeblendet. */
function barFloat(){ return uiCfg.bar!=='top'&&!(location.hostname==='localhost'&&(localStorage.getItem('skizix-test-opts')||localStorage.getItem('skizix-test-bartop'))&&!uiCfg.barSet); }   /* (Tests auf localhost prüfen meist die feste Leiste) */
function placeProps(){ try{ placeProps_(); }catch(e){} }
function placeProps_(){
  const fl=barFloat(); document.body.classList.toggle('floatbar',fl);
  if(!fl){ propsEl.classList.remove('fhide'); propsEl.style.left=propsEl.style.top=propsEl.style.maxWidth=''; return; }
  const items=[...sel].map(byId).filter(Boolean), show=items.length>0||!!DRAW[tool];
  propsEl.classList.toggle('fhide',!show); if(!show){ closeColorPop&&closeColorPop(); return; }
  const z=uiCfg.scale||1, rc=$('stage').getBoundingClientRect(), m0=10;
  propsEl.style.maxWidth=Math.max(160,(rc.width-2*m0)/z)+'px';   /* nie breiter als die Tafel */
  const bw=propsEl.offsetWidth*z, bh=propsEl.offsetHeight*z, m=10;
  let left, top;
  if(items.length){
    let x1=Infinity,y1=Infinity,x2=-Infinity,y2=-Infinity;
    for(const it of items){ let q; try{ q=bbox(it); }catch(e){ continue; } x1=Math.min(x1,q.x); y1=Math.min(y1,q.y); x2=Math.max(x2,q.x+q.w); y2=Math.max(y2,q.y+q.h); }
    const sx1=rc.left+view.x+x1*view.k, sx2=rc.left+view.x+x2*view.k, sy1=rc.top+view.y+y1*view.k, sy2=rc.top+view.y+y2*view.k;
    left=(sx1+sx2)/2-bw/2; top=sy1-bh-46;   /* Abstand: Drehgriff über dem Element bleibt frei */
    if(top<rc.top+m) top=sy2+26;
    if(top+bh>rc.bottom-m) top=rc.top+m;
  } else { left=rc.left+rc.width/2-bw/2; top=rc.top+m; }
  left=Math.max(rc.left+m,Math.min(rc.right-bw-m,left));
  propsEl.style.left=(left/z)+'px'; propsEl.style.top=(top/z)+'px';
}
