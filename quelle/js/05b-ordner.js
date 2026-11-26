/* ---------- Ordner für Boards (eine Ebene) ----------
   Ein Ordner ist ein Name am Board (b.f). Die Reihenfolge der Ordner steht in boards.folders, auch leere Ordner.
   Mit Konto wird der Ordner jedes Boards mit abgeglichen (Spalte „folder“, siehe quelle/supabase/02-ordner.sql). */
const FOLD_C=['var(--c-blue)','var(--c-mint)','var(--c-gold)','var(--c-coral)','var(--c-violet)'];
var fUi={adding:false,edit:null,menu:null,bm:null,bmF:false,bmDel:false,bmClr:false};
function fClean(n){ return String(n==null?'':n).replace(/\s+/g,' ').trim().slice(0,40); }
function fOpenSet(){ try{ const v=JSON.parse(lsGet('skizix-ordner-offen')||'{}'); return v&&typeof v==='object'?v:{}; }catch(e){ return {}; } }
function fSetOpen(n,o){ const v=fOpenSet(); v[n]=o; lsSet('skizix-ordner-offen',JSON.stringify(v)); }
function folderList(){
  const L=Array.isArray(boards.folders)?boards.folders.map(fClean).filter(Boolean):[];
  for(const b of boards.list){ const f=fClean(b.f); if(f&&!L.includes(f)) L.push(f); }
  return [...new Set(L)];
}
function fColor(n){ const i=folderList().indexOf(n); return FOLD_C[(i<0?0:i)%FOLD_C.length]; }
function addFolder(n){ n=fClean(n); if(!n) return null; boards.folders=folderList(); if(!boards.folders.includes(n)) boards.folders.push(n); fSetOpen(n,true); saveIdx(); return n; }
function renameFolder(a,n){
  n=fClean(n); if(!n||n===a) return;
  boards.folders=[...new Set(folderList().map(x=>x===a?n:x))];
  for(const b of boards.list) if(fClean(b.f)===a) b.f=n;
  fSetOpen(n,fOpenSet()[a]!==false); saveIdx(); ktSoon(300);
}
function dissolveFolder(a){ boards.folders=folderList().filter(x=>x!==a); for(const b of boards.list) if(fClean(b.f)===a) b.f=''; saveIdx(); ktSoon(300); }
function moveBoards(ids,f){
  f=fClean(f); if(f) addFolder(f); const s=new Set(ids); let n=0;
  for(const b of boards.list) if(s.has(b.id)&&fClean(b.f)!==f){ b.f=f; n++; }
  saveIdx(); ktSoon(300); return n;
}
function boardBtn(b){
  const cur=b.id===boards.cur, nm=esc(b.name);
  let h=`<div class="bRow${fUi.bm===b.id?' open':''}"><button data-b="${b.id}" aria-current="${cur}" title="${nm}">${thHTML(b)}<span class="bn">${cur?'✓ ':''}${nm}</span></button><button type="button" class="bM" data-bm="${b.id}" aria-expanded="${fUi.bm===b.id}" title="Umbenennen, Ordner, Duplizieren, Leeren, Löschen" aria-label="Board ${nm}: weitere Befehle">⋯</button></div>`;
  if(fUi.bm!==b.id) return h;
  if(fUi.bmF){ const F=folderList(), here=fClean(b.f);
    return h+`<div class="fAct bAct"><div class="bActH">In Ordner verschieben</div>`+F.map(f=>`<button type="button" data-bto="${esc(f)}" style="--fc:${fColor(f)}" aria-pressed="${f===here}"><i class="bDot"></i>${esc(f)}</button>`).join('')+`<button type="button" data-bto="" aria-pressed="${!here}">Ohne Ordner</button><button type="button" data-bnewf="1" class="bAdd">+ Neuer Ordner …</button><button type="button" data-bback="1" class="bBack">‹ Zurück</button></div>`; }
  return h+`<div class="fAct bAct"><button type="button" data-bact="ren">Umbenennen</button><button type="button" data-bact="fold">In Ordner verschieben ›</button><button type="button" data-bact="dup">Duplizieren</button>`
    +(cur?`<button type="button" data-m="clear">Board leeren</button>`:`<button type="button" data-bact="clr">${fUi.bmClr?'Wirklich leeren? Alles darauf wird entfernt.':'Board leeren'}</button>`)
    +`<button type="button" data-bact="del" class="fDel">${fUi.bmDel?'Wirklich löschen? Das lässt sich nicht zurückholen.':'Board löschen'}</button></div>`;
}
function dupBoard(id){
  const src=boards.list.find(b=>b.id===id); if(!src) return;
  const json=id===boards.cur?JSON.stringify(Object.assign({},doc,{fmt:Math.max(doc.fmt||0,DOC_FMT)})):(docGet(id)||JSON.stringify({items:[],n:0,fmt:DOC_FMT}));
  const nb={id:genId(),name:(src.name+' (Kopie)').slice(0,40)}; if(src.f) nb.f=src.f;
  boards.list.splice(boards.list.indexOf(src)+1,0,nb); docSet(nb.id,json); markDirty(nb); saveIdx(); ktSoon(500);
  fUi.bm=null; renderBoardList(); toast('„'+src.name+'“ dupliziert.');
}
function folderListHTML(){
  const F=folderList(), open=fOpenSet(); let h='';
  if(!F.length&&!fUi.adding) return boards.list.map(boardBtn).join('');
  for(const f of F){
    const bs=boards.list.filter(b=>fClean(b.f)===f), isOpen=open[f]!==false, a=esc(f);
    if(fUi.edit===f) h+=`<form class="fNew" data-ren="${a}"><input value="${a}" maxlength="40" aria-label="Ordner umbenennen" enterkeyhint="done"></form>`;
    else h+=`<div class="fh" style="--fc:${fColor(f)}"><button type="button" class="fhT" data-fo="${a}" aria-expanded="${isOpen}">${isOpen?'<svg class="fIc" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 014.5 5h4.6l2 2h8.4A1.5 1.5 0 0121 8.5V10H7.2a1.5 1.5 0 00-1.4 1L3 18z"/><path d="M5.8 11a1.5 1.5 0 011.4-1h14.3l-2.8 8a1.5 1.5 0 01-1.4 1H3z"/></svg>':'<svg class="fIc" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 014.5 5h4.6l2 2h8.4A1.5 1.5 0 0121 8.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5z"/></svg>'}<span>${a}</span><small>${bs.length}</small></button><button type="button" class="fhM" data-fm="${a}" title="Ordner umbenennen oder auflösen" aria-label="Ordner ${a}: weitere Befehle">⋯</button></div>`;
    if(fUi.menu===f) h+=`<div class="fAct"><button type="button" data-fren="${a}">Umbenennen</button><button type="button" data-fdel="${a}" class="fDel">Auflösen</button></div>`;
    if(isOpen) h+=`<div class="fIn" style="--fc:${fColor(f)}">${bs.map(boardBtn).join('')||'<div class="fEmpty">Noch leer. Boards legst du über „Boards verwalten“ hinein.</div>'}</div>`;
  }
  if(fUi.adding) h+=`<form class="fNew"><input placeholder="Name des Ordners" maxlength="40" aria-label="Name des neuen Ordners" enterkeyhint="done"></form>`;
  const rest=boards.list.filter(b=>!F.includes(fClean(b.f)));
  if(rest.length) h+=`<div class="fRest">Ohne Ordner</div>`+rest.map(boardBtn).join('');
  return h;
}
function fFocus(){ const i=$('boardList').querySelector('.fNew input'); if(i){ i.focus(); if(fUi.edit) i.select(); } }
$('newFolder').onclick=e=>{
  e.stopPropagation(); fUi.adding=true; fUi.edit=null; fUi.menu=null;
  if(palState.propsClosed){ palState.propsClosed=false; savePal(); applySides(); } else renderBoardList();
  fFocus();
};
$('boardList').addEventListener('click',e=>{
  const q=e.target.closest('[data-bm],[data-bact],[data-bto],[data-bnewf],[data-bback]');
  if(q){ e.stopPropagation(); const id=fUi.bm;
    if(q.dataset.bm!==undefined){ fUi.bm=fUi.bm===q.dataset.bm?null:q.dataset.bm; fUi.bmF=false; fUi.bmDel=false; fUi.bmClr=false; fUi.menu=null; renderBoardList(); return; }
    if(q.dataset.bback!==undefined){ fUi.bmF=false; renderBoardList(); return; }
    if(q.dataset.bnewf!==undefined){ fUi.bm=null; fUi.bmF=false; fUi.adding=true; renderBoardList(); fFocus(); toast('Ordner anlegen, dann das Board über „⋯ → In Ordner verschieben“ hineinlegen.'); return; }
    if(q.dataset.bto!==undefined){ const n=moveBoards([id],q.dataset.bto); fUi.bm=null; fUi.bmF=false; renderBoardList(); if(n) toast(q.dataset.bto?'In „'+q.dataset.bto+'“ verschoben.':'Steht jetzt unter „Ohne Ordner“.'); return; }
    switch(q.dataset.bact){
      case 'ren': fUi.bm=null; if(id!==boards.cur) openBoard(id); renderBoardList(); closeMenu(); { const i=$('boardName'); i.focus(); i.select(); } break;
      case 'fold': fUi.bmF=true; renderBoardList(); break;
      case 'dup': dupBoard(id); break;
      case 'clr': if(!fUi.bmClr){ fUi.bmClr=true; renderBoardList(); return; } { const b=boards.list.find(x=>x.id===id), nm=b?b.name:''; fUi.bm=null; fUi.bmClr=false; clearBoards([id]); renderBoardList(); toast('„'+nm+'“ geleert.'); } break;
      case 'del': if(!fUi.bmDel){ fUi.bmDel=true; renderBoardList(); return; } { const b=boards.list.find(x=>x.id===id), nm=b?b.name:''; fUi.bm=null; fUi.bmDel=false; removeBoards([id]); renderBoardList(); toast('„'+nm+'“ gelöscht.'); } break;
    }
    return; }
  if(e.target.closest('[data-m="clear"]')){ fUi.bm=null; setTimeout(renderBoardList,0); return; }   /* läuft weiter zum Menü (Board leeren) */
  const t=e.target.closest('[data-fo],[data-fm],[data-fren],[data-fdel]'); if(!t) return; e.stopPropagation();
  if(t.dataset.fo!==undefined){ const f=t.dataset.fo; fSetOpen(f,fOpenSet()[f]===false); fUi.menu=null; renderBoardList(); }
  else if(t.dataset.fm!==undefined){ fUi.menu=fUi.menu===t.dataset.fm?null:t.dataset.fm; renderBoardList(); }
  else if(t.dataset.fren!==undefined){ fUi.edit=t.dataset.fren; fUi.menu=null; renderBoardList(); fFocus(); }
  else if(t.dataset.fdel!==undefined){
    if(!t.dataset.sure){ t.dataset.sure='1'; t.textContent='Sicher? Boards bleiben'; return; }
    const f=t.dataset.fdel; fUi.menu=null; dissolveFolder(f); renderBoardList(); toast('Ordner „'+f+'“ aufgelöst. Die Boards stehen jetzt unter „Ohne Ordner“.'); }
});
function fCommit(form){
  if(!form) return; const v=form.querySelector('input').value;
  if(form.dataset.ren!==undefined){ const a=form.dataset.ren; fUi.edit=null; renameFolder(a,v); }
  else if(fUi.adding){ fUi.adding=false; const n=addFolder(v); if(n) toast('Ordner „'+n+'“ angelegt. Boards legst du über „Boards verwalten“ hinein.'); }
  renderBoardList();
}
$('boardList').addEventListener('submit',e=>{ const f=e.target.closest('.fNew'); if(!f) return; e.preventDefault(); fCommit(f); });
$('boardList').addEventListener('focusout',e=>{ const f=e.target.closest&&e.target.closest('.fNew'); if(f&&(fUi.adding||fUi.edit!==null)) setTimeout(()=>{ if(f.isConnected) fCommit(f); },0); });
$('boardList').addEventListener('keydown',e=>{ if(e.key==='Escape'&&e.target.closest('.fNew')){ e.preventDefault(); e.stopPropagation(); fUi.adding=false; fUi.edit=null; renderBoardList(); } });
/* „Boards verwalten“: angekreuzte Boards in einen Ordner verschieben. Die Ordner erscheinen als Knöpfe unter „Verschieben“. */
function bmFolderOpts(){ bmFoldClose(); }
function bmFoldClose(){ const p=$('bmFold'); if(!p) return; p.hidden=true; p.innerHTML=''; $('bmMoveBtn').setAttribute('aria-expanded','false'); }
function bmFoldRender(nw){
  const p=$('bmFold'), ids=bmSel(), here=new Set(boards.list.filter(b=>ids.includes(b.id)).map(b=>fClean(b.f)));
  const one=here.size===1?[...here][0]:null;
  p.innerHTML='<div class="bmFH">In welchen Ordner?</div><div class="bmFL">'
    +folderList().map(f=>`<button type="button" data-to="f:${esc(f)}" style="--fc:${fColor(f)}" aria-pressed="${one===f}"><i class="bDot"></i>${esc(f)}</button>`).join('')
    +`<button type="button" data-to="none" aria-pressed="${one===''}">Ohne Ordner</button>`
    +(nw?'':'<button type="button" data-to="new" class="bAdd">+ Neuer Ordner …</button>')+'</div>'
    +(nw?'<form class="bmFNew"><input id="bmNewF" placeholder="Name des neuen Ordners" maxlength="40" aria-label="Name des neuen Ordners" enterkeyhint="done"><button type="submit" class="pb">Anlegen und verschieben</button></form>':'');
  p.hidden=false; $('bmMoveBtn').setAttribute('aria-expanded','true');
  if(nw) $('bmNewF').focus();
}
function bmMoveTo(f){
  const ids=bmSel(); if(!ids.length) return; f=fClean(f);
  const n=moveBoards(ids,f); bmRender();
  const w=bmN(ids.length); $('bmMsg').textContent=f?w+' liegen jetzt im Ordner „'+f+'“.':w+' liegen jetzt ohne Ordner.';
  if(n) toast($('bmMsg').textContent);
}
$('bmMoveBtn').onclick=()=>{
  if(!bmSel().length) return;
  for(const o of ['bmClear','bmDel']) if($(o).dataset.sure){ delete $(o).dataset.sure; bmLbl(o,o==='bmDel'?'Löschen':'Leeren'); $('bmMsg').textContent=''; }
  if($('bmFold').hidden) bmFoldRender(); else bmFoldClose();
};
$('bmFold').addEventListener('click',e=>{
  const q=e.target.closest('[data-to]'); if(!q) return; const v=q.dataset.to;
  if(v==='new') return bmFoldRender(true);
  bmMoveTo(v.startsWith('f:')?v.slice(2):'');
});
$('bmFold').addEventListener('submit',e=>{ e.preventDefault(); const f=fClean($('bmNewF').value); if(!f){ $('bmNewF').focus(); return; } bmMoveTo(f); });
/* Rechte Leiste: „Board verschieben“ legt das geöffnete Board in einen Ordner */
function curFoldClose(){ const p=$('curFold'); p.hidden=true; p.innerHTML=''; $('curMove').setAttribute('aria-expanded','false'); }
function curFoldRender(nw){
  const p=$('curFold'), here=fClean(curBoard().f);
  p.innerHTML='<div class="bActH">In Ordner verschieben</div>'+folderList().map(f=>`<button type="button" data-cto="f:${esc(f)}" style="--fc:${fColor(f)}" aria-pressed="${f===here}"><i class="bDot"></i>${esc(f)}</button>`).join('')
    +`<button type="button" data-cto="none" aria-pressed="${!here}">Ohne Ordner</button>`
    +(nw?'<form class="fNew" id="curNewF"><input placeholder="Name des Ordners" maxlength="40" aria-label="Name des neuen Ordners" enterkeyhint="done"></form>':'<button type="button" data-cto="new" class="bAdd">+ Neuer Ordner …</button>');
  p.hidden=false; $('curMove').setAttribute('aria-expanded','true');
  if(nw) p.querySelector('input').focus();
}
function curMoveTo(f){ const n=moveBoards([boards.cur],f); curFoldClose(); renderBoardList(); if(n) toast(f?'„'+curBoard().name+'“ liegt jetzt im Ordner „'+f+'“.':'„'+curBoard().name+'“ steht jetzt unter „Ohne Ordner“.'); }
$('curMove').addEventListener('click',e=>{ e.stopPropagation(); delSure(); if($('curFold').hidden) curFoldRender(); else curFoldClose(); });
$('curFold').addEventListener('click',e=>{ e.stopPropagation(); const q=e.target.closest('[data-cto]'); if(!q) return; const v=q.dataset.cto;
  if(v==='new') return curFoldRender(true); curMoveTo(v.startsWith('f:')?v.slice(2):''); });
$('curFold').addEventListener('submit',e=>{ e.preventDefault(); const f=fClean(e.target.querySelector('input').value); if(!f) return; curMoveTo(f); });
$('curFold').addEventListener('keydown',e=>{ if(e.key==='Escape'&&e.target.tagName==='INPUT'){ e.preventDefault(); e.stopPropagation(); curFoldRender(); } });
