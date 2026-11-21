async function exportAs(kind){
  try{
    if(kind==='svg'){ const s=buildSVG(); if(!s) throw 'empty'; return saveFile(fileBase()+'.svg',s.svg); }
    if(kind==='png'){ const rr=await rasterize('image/png',2); return saveFile(fileBase()+'.png',rr.blob); }
    const fr=frames(), boxes=fr.length&&doc.items.some(i=>i.kind!=='frame')?fr.map(f=>({x:f.x,y:f.y,w:f.w,h:f.h})):[null];   /* mit Folien: jede Folie eine Seite; ohne: das ganze Board auf einer Seite */
    if(!buildSVG(boxes[0]||undefined)) throw 'empty';
    let pdf=null; toast('PDF wird erstellt …');
    try{ pdf=await pdfVector(boxes); }catch(e){ if(e==='empty') throw e; console.warn('Vektor-PDF nicht möglich, nehme Bild-PDF',e); }
    if(!pdf){ const pages=[]; for(const b of boxes) pages.push(await rasterize('image/jpeg',3,b||undefined)); pdf=await makePDF(pages); }
    await saveFile(fileBase()+'.pdf',pdf);
  }catch(e){ toast(e==='empty'?'Das Board ist leer.':'Der Export hat nicht geklappt. Bitte noch einmal versuchen.'); }
}
menu.addEventListener('click',e=>{
  const bb=e.target.closest('[data-b]');
  if(bb){ closeMenu(); if(bb.dataset.b!==boards.cur) openBoard(bb.dataset.b); renderBoardList(); return; }
  const b=e.target.closest('[data-m]'); if(!b) return;
  if(b.dataset.m==='ui'){ setUi({scale:+b.dataset.v,scaleSet:true}); fitMenu(); return; }
  if(b.dataset.m==='hc'){ setUi({hc:!uiCfg.hc}); return; }
  if(b.dataset.m==='snap'){ setUi({snap:!uiCfg.snap}); return; }
  if(b.dataset.m==='gridv'){ setUi({grid:!uiCfg.grid}); return; }
  if(b.dataset.m==='delboard'&&!b.dataset.sure){ b.dataset.sure='1'; b.textContent='Wirklich löschen? Das lässt sich nicht zurückholen.'; e.stopPropagation(); return; }
  closeMenu(); finishEdit();
  switch(b.dataset.m){
    case 'new': newBoard(); break;
    case 'fit': fit(); break;
    case 'keys': openKeys(); break;
    case 'tpl': openTpl(); break;
    case 'img': pickImage(); break;
    case 'slides': toggleSlides(true); break;
    case 'play': startPres(); break;
    case 'livestart': liveStart(); break;
    case 'liveshare': openLiveDlg(); break;
    case 'livestop': liveStop(); break;
    case 'ktlogin': openKtDlg(); break;
    case 'ktlogout': ktLogout(); break;
    case 'delboard': deleteBoard(); break;
    case 'manage': openBmDlg(); break;
    case 'png': case 'svg': case 'pdf': exportAs(b.dataset.m); break;
    case 'json': saveFile(fileBase()+'.json',JSON.stringify(Object.assign({},doc,{fmt:Math.max(doc.fmt||0,DOC_FMT)}))); break;
    case 'open': $('file').value=''; $('file').click(); break;
    case 'example': doc=exampleDoc(); doc.fmt=DOC_FMT; sel.clear(); commit(); render(); fit(); break;
    case 'clear': doc={items:[],n:doc.n}; sel.clear(); commit(); render(); toast('Board geleert. Mit „Zurück“ holst du alles wieder.'); break;
  }
});
$('boardName').addEventListener('input',e=>{ curBoard().name=e.target.value.trim()||'Board'; markDirty(); ktSoon(3000); });
$('boardName').addEventListener('keydown',e=>{ if(e.key==='Enter') e.target.blur(); });
$('file').addEventListener('change',async e=>{
  const f=e.target.files[0]; if(!f) return;
  let d=null; try{ let raw=JSON.parse(await f.text()); if(raw&&raw.doc&&Array.isArray(raw.doc.items)) raw=raw.doc; d=cleanDoc(raw); if(d&&raw.items.length&&!d.items.length) d=null; }catch(_){}
  if(!d){ toast('Diese Datei ist kein Skizix-Board (.json). Dein Board bleibt unverändert.'); return; }
  finishEdit(); doc=d; fitTexts(); sel.clear(); commit(); render(); fit(); if(isNewer(doc)) newerWarn();
});
document.addEventListener('keydown',e=>{
  const t=e.target; if(t&&(t.tagName==='TEXTAREA'||t.tagName==='INPUT')) return;
  const mod=e.ctrlKey||e.metaKey, k=e.key.toLowerCase();
  if(e.key===' '&&!(t&&t.tagName==='BUTTON')){ spaceDown=true; e.preventDefault(); return; }
  if(mod&&k==='z'){ e.preventDefault(); e.shiftKey?redo():undo(); return; }
  if(mod&&k==='y'){ e.preventDefault(); redo(); return; }
  if(mod&&k==='d'){ e.preventDefault(); duplicateSel(); return; }
  if(mod&&k==='c'){ if(sel.size){ e.preventDefault(); copySel(false); } return; }
  if(mod&&k==='x'){ if(sel.size){ e.preventDefault(); copySel(true); } return; }
  if(mod&&k==='v'){ clearTimeout(pastePending); pastePending=setTimeout(()=>{ pastePending=0; pasteClip(); },80); return; }   /* kurz warten: enthält die Zwischenablage ein Bild, fügt das paste-Ereignis es ein */
  if(mod&&k==='g'){ e.preventDefault(); e.shiftKey?ungroupSel():groupSel(); return; }
  if(mod&&k==='a'){ e.preventDefault(); setTool('select'); sel=new Set(doc.items.filter(i=>!i.lock).map(i=>i.id)); render(); return; }
  if(mod) return;
  if(e.key==='Delete'||e.key==='Backspace'){ e.preventDefault(); deleteSel(); return; }
  if(e.key==='Escape'){ cancelAction(); sel.clear(); setTool('select'); render(); return; }
  if((e.key==='Enter'||e.key==='F2')&&sel.size===1&&!(t&&t.tagName==='BUTTON')){ e.preventDefault(); startEdit([...sel][0]); return; }
  if(e.key.startsWith('Arrow')&&sel.size){ e.preventDefault(); const st=e.shiftKey?1:GRID, dx=k==='arrowleft'?-st:k==='arrowright'?st:0, dy=k==='arrowup'?-st:k==='arrowdown'?st:0;
    for(const it of [...sel].map(byId)){ if(!it||it.lock) continue; if(it.type==='shape'){ it.x+=dx; it.y+=dy; } else if(it.type==='path') it.pts=it.pts.map(p=>[p[0]+dx,p[1]+dy]); }
    commit(); render(); return; }
  if(e.shiftKey&&e.code==='Digit1'){ e.preventDefault(); fit(); return; }
  if(e.key==='0'){ e.preventDefault(); zoomCenter(1/view.k); return; }
  if(e.key==='?'){ e.preventDefault(); openKeys(); return; }
  const map={v:'select',f:'shape',p:'pen',b:'brush',m:'marker',t:'text',e:'erase',h:'pan'}; if(map[k]) setTool(map[k]);
});
document.addEventListener('keyup',e=>{ if(e.key===' ') spaceDown=false; });
function openKeys(){ closeMenu(); $('keysDlg').hidden=false; const b=$('keysBox'); b.scrollTop=0; b.focus({preventScroll:true}); }
function closeKeys(){ if($('keysDlg').hidden) return; $('keysDlg').hidden=true; svg.focus(); }
$('keysClose').onclick=closeKeys;
$('keysDlg').addEventListener('pointerdown',e=>{ if(e.target===$('keysDlg')) closeKeys(); });
$('keysDlg').addEventListener('keydown',e=>{ if(e.key==='Escape'||e.key==='?'){ e.preventDefault(); e.stopPropagation(); closeKeys(); } if(e.key==='Tab'){ e.preventDefault(); (document.activeElement===$('keysClose')?$('keysBox'):$('keysClose')).focus(); } });
window.addEventListener('resize',()=>applyView());

