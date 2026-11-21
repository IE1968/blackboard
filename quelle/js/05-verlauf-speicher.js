/* ---------- Verlauf und Speicher ---------- */
const IDX='blackboard-boards', BK='blackboard-b-';
let boards={cur:'b1',list:[{id:'b1',name:'Board 1'}],del:[],v:2};
function genId(){ return 'b'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function markDirty(b){ b=b||curBoard(); b.dirty=true; b.rev=(b.rev||0)+1; b.updated=Date.now(); saveIdx(); }
/* Mehrere Fenster derselben App (z. B. installierte App und Browser-Tab) halten sich gegenseitig auf dem neuesten Stand */
let bcast=null; try{ bcast=new BroadcastChannel('blackboard'); }catch(e){}
function announce(m){ try{ bcast&&bcast.postMessage(m); }catch(e){} }
let extPending=null;
function applyExternal(json){
  if(action||editing||pres){ extPending=json; return; }
  extPending=null; let d=null; try{ d=cleanDoc(JSON.parse(json)); }catch(e){} if(!d) return;
  if(JSON.stringify(d)===JSON.stringify(doc)) return;
  doc=d; fitTexts(); for(const id of [...sel]) if(!byId(id)) sel.delete(id);
  resetHist(); render(); toast('In einem anderen Fenster geändert – hier aktualisiert.');
}
function onExternal(m){
  if(!m||typeof m!=='object') return;
  if(m.t==='doc'&&typeof m.json==='string'){ if(DB.ok) DB.cache.set(m.id,m.json); if(m.id===boards.cur) applyExternal(m.json); }
  else if(m.t==='del'){ if(DB.ok) DB.cache.delete(m.id); }
  else if(m.t==='idx'){ try{ const b=JSON.parse(lsGet(IDX)); if(b&&Array.isArray(b.list)&&b.list.length){ const cur=boards.cur; boards=b; boards.del=boards.del||[];
      if(boards.list.some(x=>x.id===cur)) boards.cur=cur; else openBoard(boards.list[0].id);
      renderBoardList(); $('boardName').value=curBoard().name; } }catch(e){} }
}
if(bcast) bcast.onmessage=e=>onExternal(e.data);
window.addEventListener('storage',e=>{ if(bcast) return; if(e.key===IDX) onExternal({t:'idx'}); else if(e.key&&e.key.startsWith(BK)&&e.newValue) onExternal({t:'doc',id:e.key.slice(BK.length),json:e.newValue}); });
setInterval(()=>{ if(extPending&&!action&&!editing&&!pres) applyExternal(extPending); },1000);
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); return true; }catch(e){ lsSet.full=!!(e&&/quota/i.test(e.name+' '+e.message)); return false; } }
/* Boards liegen in IndexedDB (viel Platz). Kleine Einstellungen bleiben im localStorage.
   Ein Zwischenspeicher im Arbeitsspeicher hält alles sofort verfügbar; geschrieben wird kurz verzögert im Hintergrund. */
const DB={ok:false,db:null,cache:new Map(),pend:new Map(),del:new Set(),t:null};
function idbReq(rq){ return new Promise((res,rej)=>{ rq.onsuccess=()=>res(rq.result); rq.onerror=()=>rej(rq.error); }); }
async function storeInit(){
  try{
    if(!window.indexedDB) return;
    const db=await Promise.race([new Promise((res,rej)=>{ const rq=indexedDB.open('blackboard',1); rq.onupgradeneeded=()=>rq.result.createObjectStore('docs'); rq.onsuccess=()=>res(rq.result); rq.onerror=()=>rej(rq.error); rq.onblocked=()=>rej('blocked'); }),new Promise(res=>setTimeout(()=>res(null),4000))]);
    if(!db) return;
    const tx=db.transaction('docs','readonly'), st=tx.objectStore('docs'), keys=await idbReq(st.getAllKeys()), vals=await idbReq(st.getAll());
    keys.forEach((k,i)=>DB.cache.set(String(k),vals[i]));
    DB.db=db; DB.ok=true;
    const mig=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.startsWith(BK)) mig.push(k); }   /* bisherige Boards umziehen */
    for(const k of mig){ const id=k.slice(BK.length), v=lsGet(k); if(v!=null){ DB.cache.set(id,v); DB.pend.set(id,v); } }   /* ein noch vorhandener Eintrag ist neuer (z. B. von einer alten App-Version im anderen Tab) */
    if(mig.length&&await idbFlush()) mig.forEach(k=>lsDel(k));
    db.onversionchange=()=>{ try{ db.close(); }catch(e){} DB.ok=false; };
    try{ navigator.storage&&navigator.storage.persist&&navigator.storage.persist(); }catch(e){}
  }catch(e){ DB.ok=false; }
}
function idbFlush(){
  clearTimeout(DB.t); DB.t=null;
  if(!DB.ok||(!DB.pend.size&&!DB.del.size)) return Promise.resolve(true);
  const put=new Map(DB.pend), del=new Set(DB.del); DB.pend.clear(); DB.del.clear();
  return new Promise(res=>{
    let tx; try{ tx=DB.db.transaction('docs','readwrite'); const st=tx.objectStore('docs'); put.forEach((v,k)=>st.put(v,k)); del.forEach(k=>st.delete(k)); }catch(e){ return res(storeFail(e,put)); }
    tx.oncomplete=()=>{ storeFail.warned=false; del.forEach(k=>announce({t:'del',id:k})); res(true); };
    tx.onerror=tx.onabort=()=>res(storeFail(tx.error,put));
  });
}
function storeFail(err,put){
  put.forEach((v,k)=>{ if(!DB.pend.has(k)) DB.pend.set(k,v); });
  if(!storeFail.warned){ storeFail.warned=true; const full=err&&/quota/i.test((err.name||'')+' '+(err.message||''));
    toast(full?'Speicher voll: Die letzten Änderungen konnten nicht gespeichert werden. Lösche nicht benötigte Boards oder sichere das Board über „Datei“.':'Speichern fehlgeschlagen. Sichere das Board sicherheitshalber über „Datei“.'); }
  clearTimeout(DB.t); DB.t=setTimeout(idbFlush,5000); return false;
}
function docGet(id){ return DB.ok?(DB.cache.has(id)?DB.cache.get(id):null):lsGet(BK+id); }
function docSet(id,json){
  if(!DB.ok){ const ok=lsSet(BK+id,json); if(ok) announce({t:'doc',id,json}); return ok; }
  DB.cache.set(id,json); DB.del.delete(id); DB.pend.set(id,json); if(!DB.t) DB.t=setTimeout(idbFlush,250);
  announce({t:'doc',id,json});   /* andere Fenster sofort informieren, nicht erst nach dem Schreiben: sonst überschreibt ein schnelles zweites Fenster die Änderung */
  return true;
}
function docDel(id){ if(!DB.ok){ lsDel(BK+id); return; } DB.cache.delete(id); DB.pend.delete(id); DB.del.add(id); if(!DB.t) DB.t=setTimeout(idbFlush,250); }
document.addEventListener('visibilitychange',()=>{ if(document.hidden) idbFlush(); });
window.addEventListener('pagehide',()=>idbFlush());
function lsDel(k){ try{ localStorage.removeItem(k); }catch(e){} }
function curBoard(){ return boards.list.find(b=>b.id===boards.cur)||boards.list[0]; }
function saveIdx(){ lsSet(IDX,JSON.stringify(boards)); announce({t:'idx'}); if(!palState.propsClosed) renderBoardList(); }
function persist(json){ if(!docSet(boards.cur,json||JSON.stringify(doc))&&!persist.warned){ persist.warned=true; toast(lsSet.full?'Speicher voll: Lösche nicht benötigte Boards oder sichere das Board über „Datei“.':'Der Browser-Speicher ist nicht verfügbar. Sichere das Board über „Datei“.'); } }
function loadBoards(){
  try{ const b=JSON.parse(lsGet(IDX)); if(b&&Array.isArray(b.list)&&b.list.length){ boards=b; if(!boards.list.some(x=>x.id===boards.cur)) boards.cur=boards.list[0].id;
    if(!boards.v){ boards.list.forEach(x=>{ x.dirty=true; x.updated=x.updated||Date.now(); }); boards.v=2; }   /* Boards aus älteren Versionen gelten als geändert, damit nichts verloren geht */
    boards.del=boards.del||[]; saveIdx(); return; } }catch(e){}
  const old=lsGet(KEY)||lsGet('prozesstafel-v1'); if(old){ docSet('b1',old); boards.list[0].dirty=true; boards.list[0].updated=Date.now(); } saveIdx();
}
/* Prüft und bereinigt ein Board aus Datei, Speicher oder Abgleich: nur bekannte Elemente, Zahlen, Farben und Texte bleiben übrig. */
const DOC_FMT=3;   /* Version des Datenformats; ältere Apps erkennen daran Boards aus neueren Versionen */
const KNOWN_KEYS=new Set('src id type kind x y w h text fill stroke sw colW rowH cells align ord ok pts tool tip ws from to p1 p2 style dash head arrow fa ta mm fs bold list al mc tc g lock fr fresh'.split(' '));
function keepExtra(s,o){   /* Eigenschaften, die diese Version nicht kennt, unverändert mitnehmen */
  for(const k in s){ if(KNOWN_KEYS.has(k)||k in o||!/^[a-zA-Z]\w{0,30}$/.test(k)||/^(constructor|toString|valueOf|hasOwnProperty)$/.test(k)) continue;
    const v=s[k]; if(v===undefined||typeof v==='function') continue; try{ const j=JSON.stringify(v); if(j&&j.length<=4000) o[k]=JSON.parse(j); }catch(e){} }
}
const BODY_KINDS=new Set(Object.keys(KINDS).filter(k=>!KINDS[k].tpl&&!KINDS[k].line).map(k=>KINDS[k].as||k).concat(['table']));
function cleanDoc(d){
  if(!d||typeof d!=='object'||!Array.isArray(d.items)) return null;
  const num=(v,def,lo,hi)=>{ v=(v===null||v===''||typeof v==='boolean')?NaN:+v; return Number.isFinite(v)?Math.min(hi,Math.max(lo,v)):def; };
  const col=(v,def)=>(v==='none'||(typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)))?v:def;
  const sid=v=>(typeof v==='string'&&/^[\w-]{1,40}$/.test(v))?v:null;
  const str=v=>v==null?'':String(v).slice(0,5000);
  const line=v=>{ const c=col(v,INK); return c==='none'?INK:c; };
  const out=[], seen=new Set(), extra=[]; let n=0;
  if(Array.isArray(d.extra)) for(const x of d.extra.slice(0,2000)) if(x&&typeof x==='object'){ try{ const j=JSON.stringify(x); if(j.length<=20000) extra.push(JSON.parse(j)); }catch(e){} }
  for(const s of d.items.slice(0,5000)){
    if(!s||typeof s!=='object') continue;
    const id=sid(s.id); if(!id||seen.has(id)) continue;
    let o=null;
    if(s.type==='shape'&&(BODY_KINDS.has(s.kind)||(typeof s.kind==='string'&&/^[a-z][\w-]{0,30}$/i.test(s.kind)))){   /* unbekannte Formen bleiben erhalten und erscheinen als Platzhalter */
      o={id,type:'shape',kind:s.kind,x:num(s.x,0,-1e6,1e6),y:num(s.y,0,-1e6,1e6),w:num(s.w,100,1,20000),h:num(s.h,60,1,20000),text:str(s.text),fill:col(s.fill,'#ffffff'),stroke:col(s.stroke,INK),sw:num(s.sw,2,0.5,60)};
      if(s.kind==='table'){
        const colW=(Array.isArray(s.colW)?s.colW:[]).slice(0,40).map(v=>num(v,100,10,4000)), rowH=(Array.isArray(s.rowH)?s.rowH:[]).slice(0,200).map(v=>num(v,32,10,4000));
        if(!colW.length||!rowH.length) continue;
        o.colW=colW; o.rowH=rowH; o.cells=rowH.map((_,rr)=>colW.map((_,cc)=>str(Array.isArray(s.cells)&&Array.isArray(s.cells[rr])?s.cells[rr][cc]:'')));
        o.w=sum(colW); o.h=sum(rowH); if(s.align==='left') o.align='left';
      }
      if(s.kind==='frame') o.ord=num(s.ord,0,0,1e6);
      if(s.kind==='check'&&s.ok) o.ok=true;
      if(s.kind==='image'&&typeof s.src==='string'&&s.src.length<8e6&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s.src)) o.src=s.src;
    } else if(s.type==='path'&&Array.isArray(s.pts)){
      const ok=s.pts.length<=20000&&s.pts.every(q=>Array.isArray(q)&&Number.isFinite(q[0])&&Number.isFinite(q[1])); if(!ok||!s.pts.length) continue;
      o={id,type:'path',pts:s.pts.map(q=>[q[0],q[1]]),stroke:line(s.stroke),sw:num(s.sw,3,0.5,100),tool:['pen','brush','marker'].includes(s.tool)?s.tool:'pen',tip:['round','flat','calli'].includes(s.tip)?s.tip:'round'};
      if(Array.isArray(s.ws)&&s.ws.length===s.pts.length) o.ws=s.ws.map(v=>num(v,1,0.05,5));
    } else if(s.type==='conn'){
      const pt=q=>({x:num(q&&q.x,0,-1e6,1e6),y:num(q&&q.y,0,-1e6,1e6)});
      o={id,type:'conn',from:sid(s.from),to:sid(s.to),p1:pt(s.p1),p2:pt(s.p2),text:str(s.text),stroke:line(s.stroke),sw:num(s.sw,2,0.5,60),style:s.style==='straight'?'straight':'ortho',dash:!!s.dash,head:HEADS.some(h=>h[0]===s.head)?s.head:(s.arrow===false?'none':'arrow')};
      if(o.from&&SIDES[s.fa]) o.fa=s.fa; if(o.to&&SIDES[s.ta]) o.ta=s.ta; if(s.mm) o.mm=1;
    }
    if(!o){ if(s.type&&!['shape','path','conn'].includes(s.type)&&extra.length<2000){ try{ const j=JSON.stringify(s); if(j.length<=20000) extra.push(JSON.parse(j)); }catch(e){} } continue; }
    keepExtra(s,o);
    if(o.type!=='path'){ if(s.fs) o.fs=num(s.fs,14,6,200); if(s.bold) o.bold=true; if(s.list) o.list=true; if(['left','center','right'].includes(s.al)) o.al=s.al; if(s.mm==='root'||s.mm==='node') o.mm=s.mm; if(Number.isInteger(s.mc)&&s.mc>=0&&s.mc<6) o.mc=s.mc; const tc=col(s.tc,null); if(tc&&tc!=='none') o.tc=tc; }
    const g=sid(s.g); if(g) o.g=g; if(s.lock) o.lock=true; const fr=sid(s.fr); if(fr) o.fr=fr;
    seen.add(id); out.push(o); const m=/^i(\d+)$/.exec(id); if(m) n=Math.max(n,+m[1]);
  }
  const shapes=new Set(out.filter(o=>o.type==='shape').map(o=>o.id));
  for(const o of out) if(o.type==='conn'){ if(!shapes.has(o.from)){ o.from=null; delete o.fa; } if(!shapes.has(o.to)){ o.to=null; delete o.ta; } }
  const fmt=num(d.fmt,1,1,1e6), r={items:out,n:Math.max(n,num(d.n,0,0,1e9)),fmt:Math.max(fmt,DOC_FMT)};
  if(extra.length) r.extra=extra;
  const bg=cleanBg(d.bg); if(bg) r.bg=bg;   /* Fläche und Muster der Tafel */
  return r;
}
const isNewer=d=>!!d&&d.fmt>DOC_FMT;
function newerWarn(){ toast('Dieses Board stammt aus einer neueren App-Version. Bitte die App neu laden, damit nichts verloren geht. Bis dahin wird es nicht abgeglichen.'); }
function storedDoc(id){ try{ return cleanDoc(JSON.parse(docGet(id))); }catch(e){ return null; } }
function openBoard(id){
  finishEdit(); boards.cur=id; saveIdx(); doc=storedDoc(id)||{items:[],n:0,fmt:DOC_FMT}; fitTexts(); if(isNewer(doc)) setTimeout(newerWarn,300);
  hist=[]; hi=-1; sel.clear(); commit(); setTool('select'); render(); fit(); $('boardName').value=curBoard().name;
}
function newBoard(){
  const id=genId(); let n=boards.list.length+1; while(boards.list.some(b=>b.name==='Board '+n)) n++;
  const nb={id,name:'Board '+n}; boards.list.push(nb); docSet(id,JSON.stringify({items:[],n:0,fmt:DOC_FMT})); openBoard(id); markDirty(nb); ktSoon(500);
}
function deleteBoard(){ if(boards.list.length<2) return; removeBoards([boards.cur]); }
/* Boards löschen (auch mehrere). Bleibt keins übrig, entsteht ein leeres neues. Löschen wird ans Konto weitergegeben. */
function removeBoards(ids){
  const set=new Set(ids), gone=boards.list.filter(b=>set.has(b.id)); if(!gone.length) return 0;
  for(const b of gone){ ktGone(b); docDel(b.id); }
  boards.list=boards.list.filter(b=>!set.has(b.id));
  if(!boards.list.length){ const nb={id:genId(),name:'Board 1'}; boards.list.push(nb); docSet(nb.id,JSON.stringify({items:[],n:0,fmt:DOC_FMT})); markDirty(nb); ktSoon(500); }
  if(set.has(boards.cur)) openBoard(boards.list[0].id); else saveIdx();
  return gone.length;
}
function renderBoardList(){
  $('boardList').innerHTML=boards.list.map(b=>`<button data-b="${b.id}" aria-current="${b.id===boards.cur}">${b.id===boards.cur?'✓ ':''}${esc(b.name)}</button>`).join('');
  const d=$('delBoard'); d.textContent='Dieses Board löschen'; delete d.dataset.sure; d.hidden=boards.list.length<2;
}
function fileBase(){ return (curBoard().name||'').trim().replace(/[^\wäöüÄÖÜß -]+/g,'').replace(/\s+/g,'-')||'skizix'; }
function assignFrames(){
  const fr=frames(), inside=(b,f)=>b.x>=f.x-0.5&&b.y>=f.y-0.5&&b.x+b.w<=f.x+f.w+0.5&&b.y+b.h<=f.y+f.h+0.5;
  for(const it of doc.items){
    if(!fr.length||it.kind==='frame'||(it.type==='conn'&&(it.from||it.to))){ delete it.fr; continue; }
    const b=bbox(it), cur=it.fr&&fr.find(f=>f.id===it.fr); if(cur&&inside(b,cur)) continue;
    let best=null; for(const f of fr) if(inside(b,f)&&(!best||f.w*f.h<best.w*best.h)) best=f;
    if(best) it.fr=best.id; else delete it.fr; }
}
/* „Rückgängig“: Jeder Stand besteht aus den Texten der einzelnen Elemente. Unveränderte Elemente teilen sich den Text mit dem
   vorigen Stand, daher kostet ein Schritt nur so viel Speicher, wie sich wirklich geändert hat. */
function mkSnap(d,prev){
  const pm=prev?prev.m||(prev.m=new Map(prev.ids.map((id,i)=>[id,prev.items[i]]))):null, items=[], ids=[]; let bytes=0;
  for(const it of d.items){ let j=JSON.stringify(it); const o=pm&&pm.get(it.id); if(o===j) j=o; else bytes+=j.length; items.push(j); ids.push(it.id); }
  const rest=JSON.stringify(Object.assign({},d,{items:0}));
  return {items,ids,rest,bytes:bytes+rest.length+items.length*8};
}
function snapSame(a,b){ if(!a||!b||a.rest!==b.rest||a.items.length!==b.items.length) return false; for(let i=0;i<a.items.length;i++) if(a.items[i]!==b.items[i]) return false; return true; }
function snapJSON(sn){ return sn.rest.replace('"items":0','"items":['+sn.items.join(',')+']'); }
function snapDoc(sn){ return JSON.parse(snapJSON(sn)); }
function resetHist(){ hist=[mkSnap(doc)]; hi=0; }
function commit(){
  if(hi>=0&&liveRO()){ doc=snapDoc(hist[hi]); sel.clear(); render(); toast('Dieses Live-Board ist nur zum Ansehen freigegeben.'); return; }
  assignFrames();
  const sn=mkSnap(doc,hist[hi]); if(snapSame(sn,hist[hi])) return;
  const first=hi<0;
  hist=hist.slice(0,hi+1); hist.push(sn); if(hist.length>300) hist.shift();
  let tot=0; for(const h of hist) tot+=h.bytes; while(tot>24e6&&hist.length>3){ tot-=hist.shift().bytes; }   /* Speicher für „Rückgängig“ begrenzen */
  hi=hist.length-1; persist(snapJSON(sn));
  if(!first) markDirty();
  liveTick();
}
function restore(i){ if(liveRO()) return; hi=i; doc=snapDoc(hist[hi]); sel.clear(); persist(); markDirty(); render(); liveTick(); }
function undo(){ finishEdit(); if(hi>0) restore(hi-1); }
function redo(){ finishEdit(); if(hi<hist.length-1) restore(hi+1); }
function toast(msg){ toastEl.textContent=msg; toastEl.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>toastEl.hidden=true,3200); }

/* ---- Dialog „Boards verwalten“: mehrere Boards ankreuzen und auf einmal löschen ---- */
function bmInfo(b){
  let n=0; const d=b.id===boards.cur?doc:storedDoc(b.id); if(d) n=d.items.length;
  const t=b.updated?new Date(b.updated):null;
  return (n===1?'1 Element':n+' Elemente')+(t?' · geändert '+t.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+', '+t.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}):'')+(b.tok?' · Gast':'')+(b.id===boards.cur?' · gerade geöffnet':'');
}
function bmRender(){
  const L=boards.list.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),'de',{numeric:true})||((b.updated||0)-(a.updated||0)));
  const cnt=new Map(); for(const b of L){ const k=String(b.name).trim().toLowerCase(); cnt.set(k,(cnt.get(k)||0)+1); }
  $('bmList').innerHTML=L.map(b=>`<label class="bmRow${cnt.get(String(b.name).trim().toLowerCase())>1?' dup':''}"><input type="checkbox" data-id="${b.id}"><span><b>${esc(b.name)}</b><small>${esc(bmInfo(b))}</small></span></label>`).join('');
  $('bmAll').checked=false; bmUpd();
}
function bmSel(){ return [...$('bmList').querySelectorAll('input:checked')].map(i=>i.dataset.id); }
function bmUpd(){
  const n=bmSel().length, d=$('bmDel'); d.disabled=!n; delete d.dataset.sure;
  d.textContent=n?(n===1?'1 Board löschen':n+' Boards löschen'):'Löschen'; $('bmMsg').textContent='';
  const all=$('bmList').querySelectorAll('input'); $('bmAll').checked=!!all.length&&n===all.length;
}
function openBmDlg(){ bmRender(); $('bmDlg').hidden=false; $('bmClose').focus(); }
function closeBmDlg(){ if(!$('bmDlg').hidden) $('bmDlg').hidden=true; }
$('bmList').addEventListener('change',bmUpd);
$('bmAll').addEventListener('change',e=>{ $('bmList').querySelectorAll('input').forEach(i=>i.checked=e.target.checked); bmUpd(); });
$('bmDel').onclick=()=>{
  const ids=bmSel(), d=$('bmDel'); if(!ids.length) return;
  if(!d.dataset.sure){ d.dataset.sure='1'; d.textContent='Wirklich '+(ids.length===1?'1 Board':ids.length+' Boards')+' löschen?'; $('bmMsg').textContent=ktOn()?'Sie verschwinden auch auf deinen anderen angemeldeten Geräten. Das lässt sich nicht zurückholen.':'Das lässt sich nicht zurückholen.'; return; }
  finishEdit(); const n=removeBoards(ids); bmRender(); $('bmMsg').textContent=(n===1?'1 Board':n+' Boards')+' gelöscht.'; toast((n===1?'1 Board':n+' Boards')+' gelöscht.');
};
/* Boards mit gleichem Namen und gleichem Inhalt: alle bis auf eins ankreuzen (behalten wird das geöffnete, sonst das zuletzt geänderte) */
$('bmSame').onclick=()=>{
  const groups=new Map();
  for(const b of boards.list){ const d=b.id===boards.cur?doc:storedDoc(b.id); const k=String(b.name).trim().toLowerCase()+'\u0000'+JSON.stringify(d?d.items:[]); if(!groups.has(k)) groups.set(k,[]); groups.get(k).push(b); }
  const pick=new Set();
  for(const g of groups.values()){ if(g.length<2) continue; g.sort((a,b)=>(b.id===boards.cur)-(a.id===boards.cur)||(b.updated||0)-(a.updated||0)); g.slice(1).forEach(b=>pick.add(b.id)); }
  $('bmList').querySelectorAll('input').forEach(i=>i.checked=pick.has(i.dataset.id)); bmUpd();
  $('bmMsg').textContent=pick.size?(pick.size===1?'1 Board':pick.size+' Boards')+' mit gleichem Namen und Inhalt angekreuzt. Je eins bleibt.':'Keine Boards mit gleichem Namen und gleichem Inhalt gefunden.';
};
$('bmClose').onclick=closeBmDlg;
$('bmDlg').addEventListener('pointerdown',e=>{ if(e.target===$('bmDlg')) closeBmDlg(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!$('bmDlg').hidden){ e.preventDefault(); e.stopImmediatePropagation(); closeBmDlg(); } },true);
