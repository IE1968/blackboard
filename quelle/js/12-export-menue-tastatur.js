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
function saveJSON(){ saveFile(fileBase()+'.json',JSON.stringify(Object.assign({},doc,{fmt:Math.max(doc.fmt||0,DOC_FMT)}))); }
menu.addEventListener('click',e=>{
  const bb=e.target.closest('[data-b]');
  if(bb){ closeMenu(); if(bb.dataset.b!==boards.cur) openBoard(bb.dataset.b); renderBoardList(); return; }
  const b=e.target.closest('[data-m]'); if(!b) return;
  if(b.dataset.m==='ui'){ setUi({scale:+b.dataset.v,scaleSet:true}); fitMenu(); return; }
  if(b.dataset.m==='hc'){ setUi({hc:!uiCfg.hc}); return; }
  if(b.dataset.m==='snap'){ setUi({snap:!uiCfg.snap}); return; }
  if(b.dataset.m==='gridv'){ setUi({grid:!uiCfg.grid}); return; }
  if(b.dataset.m==='delboard'&&!b.dataset.sure){ b.dataset.sure='1'; (b.querySelector('.t')||b).textContent='Wirklich löschen? Das lässt sich nicht zurückholen.'; e.stopPropagation(); return; }
  closeMenu(); menuDo(b.dataset.m);
});
function menuDo(m){
  finishEdit();
  switch(m){
    case 'new': newBoard(); break;
    case 'fit': fit(true); break;
    case 'keys': openKeys(); break;
    case 'tpl': openTpl(); break;
    case 'img': pickImage(); break;
    case 'slides': toggleSlides(true); break;
    case 'play': startPres(); break;
    case 'livestart': liveStart(); break;
    case 'liveshare': openLiveDlg(); break;
    case 'livestop': liveStop(); break;
    case 'quizjoin': qzPlayOpen(''); break;
    case 'ktlogin': openKtDlg(); break;
    case 'ktlogout': ktLogout(); break;
    case 'delboard': deleteBoard(); break;
    case 'manage': openBmDlg(); break;
    case 'png': case 'svg': case 'pdf': exportAs(m); break;
    case 'json': saveJSON(); break;
    case 'open': $('file').value=''; $('file').click(); break;
    case 'example': doc=exampleDoc(); doc.fmt=DOC_FMT; sel.clear(); commit(); render(); fit(); break;
    case 'clear': doc={items:[],n:doc.n}; sel.clear(); commit(); render(); toast('Board geleert.',{undo:true}); break;
  }
}
$('boardName').addEventListener('input',e=>{ const b=curBoard(); b.name=e.target.value.trim()||'Board'; delete b.starter; markDirty(); ktSoon(3000); });
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
  if(e.shiftKey&&e.code==='Digit1'){ e.preventDefault(); fit(true); return; }
  if(e.key==='0'){ e.preventDefault(); zoomCenter(1/view.k); return; }
  if(e.key==='?'){ e.preventDefault(); openKeys('keys'); return; }
  /* Genau eine Form ausgewählt und einfach lostippen: der Buchstabe ersetzt ihren Text (wie in Präsentationsprogrammen) */
  if(sel.size===1&&e.key.length===1&&e.key!==' '&&!e.altKey&&!liveRO()&&!(t&&t.tagName==='BUTTON')){ const it=byId([...sel][0]);
    if(it&&it.type==='shape'&&it.kind!=='frame'&&!it.lock){ e.preventDefault(); startEdit(it.id); editor.value=e.key; editor.setSelectionRange(1,1); placeEditor(); if(it.pf||it.list) render(); return; } }
  const map={v:'select',f:'shape',p:'pen',b:'brush',m:'marker',s:'smart',t:'text',e:'erase',h:'pan'}; if(map[k]) setTool(map[k]);
});
document.addEventListener('keyup',e=>{ if(e.key===' ') spaceDown=false; });
let keysTab=null;
function helpStartHTML(){
  const t=!isPC, I=(c,p)=>`<i style="--c:var(--c-${c})"><svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg></i>`;
  const R=[
    [I('coral','<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>'),'Zeichnen','Oben Stift, Pinsel oder Marker wählen und losziehen.'+(t?' Mit einem digitalen Stift zeichnet nur der Stift – mit dem Finger verschiebst du dann die Tafel.':'')],
    [I('violet','<rect x="4" y="5" width="11" height="9" rx="1.5"/><circle cx="15.5" cy="15.5" r="4.5"/>'),'Formen',(t?'Formenleiste links mit ›  öffnen, Form antippen':'Form in der Leiste links anklicken')+' oder auf die Tafel ziehen. Neue Boards bieten auch Vorlagen an.'],
    [I('mint','<path d="M5 6h14M12 6v13M9 19h6"/>'),'Text ändern',(t?'Doppeltippen':'Doppelklicken')+' auf eine Form oder einen Text – oder Form wählen und einfach lostippen.'],
    [I('blue','<path d="M4 12h12M12 7l5 5-5 5"/>'),'Pfeile','An einem der blauen Punkte einer gewählten Form ziehen. Der Pfeil dockt an der nächsten Form an.'],
    [I('gold','<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>'),'Tafel bewegen und zoomen',t?'Mit zwei Fingern ziehen; zum Zoomen zwei Finger auseinander- oder zusammenschieben.':'Mausrad oder Touchpad verschiebt, Strg + Mausrad zoomt. Leertaste halten und ziehen geht auch.'],
    [I('blue','<path d="M5 3l14 8-6 2-2 6z"/>'),'Auswählen',(t?'Antippen':'Anklicken')+' wählt aus. Mit „Auswahl“ einen Rahmen um mehrere Elemente ziehen. Die Leiste über der Auswahl ändert Farbe, Text und mehr.'],
    [I('coral','<path d="M8 7L4 11l4 4M4 11h10a5 5 0 010 10h-3"/>'),'Rückgängig','Oben „Zurück“'+(t?'.':' oder Strg + Z.')+' Nichts geht verloren: Boards werden auf dem Gerät gespeichert.'],
    [I('mint','<circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7"/>'),'Teilen und präsentieren','„Teilen“ bringt das Board per Link auf andere Geräte, auch als Quiz per QR-Code. „Präsentieren“ zeigt deine Folien.']];
  return '<div class="hsList">'+R.map(([i,h,d])=>`<div class="hs">${i}<div><b>${h}</b><span>${d}</span></div></div>`).join('')+'</div>';
}
function setKeysTab(t){ keysTab=t; document.querySelectorAll('#keysBox [data-kt]').forEach(b=>b.setAttribute('aria-selected',b.dataset.kt===t)); document.querySelectorAll('#keysBox [data-kp]').forEach(p=>p.hidden=p.dataset.kp!==t); }
function openKeys(tab){ closeMenu(); $('helpStart').innerHTML=helpStartHTML(); setKeysTab(tab||keysTab||'start'); $('keysDlg').hidden=false; const b=$('keysBox'); b.scrollTop=0; b.focus({preventScroll:true}); }
$('keysBox').addEventListener('click',e=>{ const b=e.target.closest('[data-kt]'); if(b) setKeysTab(b.dataset.kt); if(e.target.closest('#keysX')) closeKeys(); });
function closeKeys(){ if($('keysDlg').hidden) return; $('keysDlg').hidden=true; svg.focus(); }
$('keysClose').onclick=closeKeys;
$('keysDlg').addEventListener('pointerdown',e=>{ if(e.target===$('keysDlg')) closeKeys(); });
$('keysDlg').addEventListener('keydown',e=>{ if(e.key==='Escape'||e.key==='?'){ e.preventDefault(); e.stopPropagation(); closeKeys(); } if(e.key==='Tab'){ e.preventDefault(); (document.activeElement===$('keysClose')?$('keysBox'):$('keysClose')).focus(); } });
window.addEventListener('resize',()=>applyView());

