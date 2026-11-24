/* ---------- Ordner für Boards (eine Ebene) ----------
   Ein Ordner ist ein Name am Board (b.f). Die Reihenfolge der Ordner steht in boards.folders, auch leere Ordner.
   Mit Konto wird der Ordner jedes Boards mit abgeglichen (Spalte „folder“, siehe quelle/supabase/02-ordner.sql). */
const FOLD_C=['var(--c-blue)','var(--c-mint)','var(--c-gold)','var(--c-coral)','var(--c-violet)'];
var fUi={adding:false,edit:null,menu:null,bm:null,bmF:false,bmDel:false};
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
  let h=`<div class="bRow${fUi.bm===b.id?' open':''}"><button data-b="${b.id}" aria-current="${cur}" title="${nm}">${thHTML(b)}<span class="bn">${cur?'✓ ':''}${nm}</span></button><button type="button" class="bM" data-bm="${b.id}" aria-expanded="${fUi.bm===b.id}" title="Umbenennen, Ordner, Duplizieren, Löschen" aria-label="Board ${nm}: weitere Befehle">⋯</button></div>`;
  if(fUi.bm!==b.id) return h;
  if(fUi.bmF){ const F=folderList(), here=fClean(b.f);
    return h+`<div class="fAct bAct"><div class="bActH">In Ordner verschieben</div>`+F.map(f=>`<button type="button" data-bto="${esc(f)}" style="--fc:${fColor(f)}" aria-pressed="${f===here}"><i class="bDot"></i>${esc(f)}</button>`).join('')+`<button type="button" data-bto="" aria-pressed="${!here}">Ohne Ordner</button><button type="button" data-bnewf="1" class="bAdd">+ Neuer Ordner …</button><button type="button" data-bback="1" class="bBack">‹ Zurück</button></div>`; }
  return h+`<div class="fAct bAct"><button type="button" data-bact="ren">Umbenennen</button><button type="button" data-bact="fold">In Ordner verschieben ›</button><button type="button" data-bact="dup">Duplizieren</button>`
    +(cur?`<button type="button" data-m="clear">Board leeren</button>`:'')
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
    else h+=`<div class="fh" style="--fc:${fColor(f)}"><button type="button" class="fhT" data-fo="${a}" aria-expanded="${isOpen}"><i></i><span>${a}</span><small>${bs.length}</small></button><button type="button" class="fhM" data-fm="${a}" title="Ordner umbenennen oder auflösen" aria-label="Ordner ${a}: weitere Befehle">⋯</button></div>`;
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
    if(q.dataset.bm!==undefined){ fUi.bm=fUi.bm===q.dataset.bm?null:q.dataset.bm; fUi.bmF=false; fUi.bmDel=false; fUi.menu=null; renderBoardList(); return; }
    if(q.dataset.bback!==undefined){ fUi.bmF=false; renderBoardList(); return; }
    if(q.dataset.bnewf!==undefined){ fUi.bm=null; fUi.bmF=false; fUi.adding=true; renderBoardList(); fFocus(); toast('Ordner anlegen, dann das Board über „⋯ → In Ordner verschieben“ hineinlegen.'); return; }
    if(q.dataset.bto!==undefined){ const n=moveBoards([id],q.dataset.bto); fUi.bm=null; fUi.bmF=false; renderBoardList(); if(n) toast(q.dataset.bto?'In „'+q.dataset.bto+'“ verschoben.':'Steht jetzt unter „Ohne Ordner“.'); return; }
    switch(q.dataset.bact){
      case 'ren': fUi.bm=null; if(id!==boards.cur) openBoard(id); renderBoardList(); closeMenu(); { const i=$('boardName'); i.focus(); i.select(); } break;
      case 'fold': fUi.bmF=true; renderBoardList(); break;
      case 'dup': dupBoard(id); break;
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
/* „Boards verwalten“: angekreuzte Boards in einen Ordner verschieben */
function bmFolderOpts(){
  const s=$('bmMove'); if(!s) return;
  s.innerHTML='<option value="">In Ordner verschieben …</option>'+folderList().map(f=>`<option value="f:${esc(f)}">${esc(f)}</option>`).join('')+'<option value="none">Ohne Ordner</option><option value="new">+ Neuer Ordner …</option>';
  s.value='';
}
$('bmMove').addEventListener('change',e=>{
  const v=e.target.value, ids=bmSel(); if(!v||!ids.length){ e.target.value=''; return; }
  let f='';
  if(v==='new'){ f=fClean(prompt('Name des neuen Ordners')||''); if(!f){ e.target.value=''; return; } }
  else if(v.startsWith('f:')) f=v.slice(2);
  const n=moveBoards(ids,f); bmRender();
  const w=(ids.length===1?'1 Board':ids.length+' Boards'); $('bmMsg').textContent=f?w+' liegen jetzt im Ordner „'+f+'“.':w+' liegen jetzt ohne Ordner.';
  if(n) toast($('bmMsg').textContent);
});
