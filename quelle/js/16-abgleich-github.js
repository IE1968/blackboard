/* ---------- Synchronisierung über ein privates GitHub-Repository ---------- */
const SYNC_KEY='blackboard-sync', canSync=!window.claude;
let syncCfg=null, syncBusy=false, syncAgain=false, syncTimer=null, syncState='off', syncAt=0, syncErr='';
try{ const c=JSON.parse(lsGet(SYNC_KEY)); if(c&&c.owner&&c.repo&&c.token) syncCfg=c; }catch(e){}
function b64(str){ const u=new TextEncoder().encode(str); let t=''; for(let i=0;i<u.length;i+=8192) t+=String.fromCharCode.apply(null,u.subarray(i,i+8192)); return btoa(t); }
function ghApi(cfg,path,opt){
  opt=opt||{}; const get=!opt.method||opt.method==='GET';
  const h={Authorization:'Bearer '+cfg.token,Accept:opt.raw?'application/vnd.github.raw+json':'application/vnd.github+json'};
  if(opt.body) h['Content-Type']='application/json';
  return fetch((cfg.api||'https://api.github.com')+'/repos/'+encodeURIComponent(cfg.owner)+'/'+encodeURIComponent(cfg.repo)+path+(get?'?_='+Date.now():''),
    {method:opt.method||'GET',cache:'no-store',headers:h,body:opt.body?JSON.stringify(opt.body):undefined});
}
function setSync(st,err){
  syncState=st; syncErr=err||''; if(st==='ok') syncAt=Date.now();
  if(syncCfg) $('menuBtn').dataset.sync=st; else delete $('menuBtn').dataset.sync;
  renderSyncInfo();
}
function renderSyncInfo(){
  $('syncSec').hidden=!canSync; if(!canSync) return;
  const t=syncAt?new Date(syncAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}):'';
  $('syncInfo').textContent=!syncCfg?'Nicht eingerichtet':syncState==='busy'?'Wird synchronisiert …':syncState==='wait'?'Änderungen warten auf den Abgleich':
    syncState==='auth'?'Zugang abgelehnt: Schlüssel prüfen':syncState==='err'?(syncErr||'Keine Verbindung')+' – wird erneut versucht':t?'Synchronisiert um '+t+' Uhr':'Verbunden mit '+syncCfg.owner+'/'+syncCfg.repo;
  $('syncNowBtn').hidden=!syncCfg; $('syncCfgBtn').textContent=syncCfg?'Einstellungen …':'Einrichten …';
  liveBadge();
}
function scheduleSync(ms){
  if(!syncCfg||!canSync) return;
  if(syncState!=='busy'&&boards.list.some(b=>b.dirty)) setSync('wait');
  clearTimeout(syncTimer); syncTimer=setTimeout(()=>syncNow(false),ms);
}
function localDoc(id){ return id===boards.cur?doc:(storedDoc(id)||{items:[],n:0}); }
function takeRemote(id,data,sha){
  let b=boards.list.find(x=>x.id===id); if(!b){ b={id}; boards.list.push(b); }
  b.name=String(data.name||'Board'); b.sha=sha; b.dirty=false; b.updated=data.updated||Date.now();
  if(typeof data.live==='string'&&/^[A-Za-z0-9]{20,64}$/.test(data.live)) b.live=data.live;
  else if(typeof data.tok==='string'&&/^[A-Za-z0-9]{20,64}$/.test(data.tok)){ b.tok=data.tok; b.role=data.role==='view'?'view':'edit'; b.exp=+data.exp||null; }
  docSet(id,JSON.stringify(data.doc));
  if(id===boards.cur){ doc=data.doc; fitTexts(); hist=[]; hi=-1; sel.clear(); commit(); render(); $('boardName').value=b.name; if(isNewer(doc)) newerWarn(); }
}
function keepLocalCopy(b){
  const id=genId(); docSet(id,JSON.stringify(localDoc(b.id)));
  boards.list.push({id,name:b.name+' (lokale Kopie)',dirty:true,rev:1,updated:Date.now()});
  toast('„'+b.name+'“ wurde auf einem anderen Gerät geändert. Deine Fassung liegt als „'+b.name+' (lokale Kopie)“ bereit.');
}
function dropLocalBoard(id){
  docDel(id); boards.list=boards.list.filter(b=>b.id!==id);
  if(!boards.list.length){ const nb={id:genId(),name:'Board 1'}; boards.list.push(nb); docSet(nb.id,JSON.stringify({items:[],n:0,fmt:DOC_FMT})); }
  if(boards.cur===id) openBoard(boards.list[0].id);
}
async function syncNow(manual){
  if(!syncCfg||!canSync) return;
  if(syncBusy){ syncAgain=true; return; }
  if(action||editing){ scheduleSync(2000); return; }
  syncBusy=true; setSync('busy'); const cfg=syncCfg;
  const fail=r=>{ throw {code:(r.status===401||r.status===403)?'auth':'http',status:r.status}; };
  try{
    /* 1. Was liegt auf dem Server? */
    const remote={}, lr=await ghApi(cfg,'/contents/boards');
    if(lr.ok){ for(const f of await lr.json()) if(f.type==='file'&&/\.json$/.test(f.name)) remote[f.name.slice(0,-5)]=f.sha; }
    else if(lr.status!==404) fail(lr);
    /* 2. Neues und Geändertes vom Server holen */
    for(const id in remote){
      if(boards.del.some(d=>d.id===id)) continue;
      const loc=boards.list.find(b=>b.id===id); if(loc&&loc.sha===remote[id]) continue;
      if(loc&&(loc.live||loc.tok)){ loc.sha=remote[id]; continue; }   /* Live-Boards gleichen sich über Supabase ab; GitHub dient nur als Sicherung */
      const r=await ghApi(cfg,'/contents/boards/'+id+'.json',{raw:true}); if(!r.ok){ if(r.status===401||r.status===403) fail(r); continue; }
      let data=null; try{ data=JSON.parse(await r.text()); }catch(e){}
      const cd=data&&cleanDoc(data.doc); if(!cd) continue; data.doc=cd;
      if(action||editing){ syncAgain=true; continue; }
      if(loc&&loc.dirty) keepLocalCopy(loc);
      takeRemote(id,data,remote[id]);
    }
    /* 3. Auf einem anderen Gerät gelöschte Boards entfernen */
    for(const b of boards.list.slice()) if(b.sha&&!(b.id in remote)){ if(b.dirty) delete b.sha; else dropLocalBoard(b.id); }
    /* 4. Eigene Änderungen hochladen */
    for(const b of boards.list.slice()){
      if(!b.dirty) continue; const rev=b.rev||0;
      if(isNewer(localDoc(b.id))) continue;   /* aus neuerer App-Version: erst nach dem Aktualisieren abgleichen */
      const body={message:'Skizix: '+b.name,content:b64(JSON.stringify({id:b.id,name:b.name,live:b.live||undefined,tok:b.tok||undefined,role:b.tok?b.role:undefined,exp:b.tok&&b.exp||undefined,updated:b.updated||Date.now(),doc:localDoc(b.id)}))}; if(b.sha) body.sha=b.sha;
      const r=await ghApi(cfg,'/contents/boards/'+b.id+'.json',{method:'PUT',body});
      if(r.ok){ const j=await r.json(); b.sha=j.content.sha; if((b.rev||0)===rev) b.dirty=false; else syncAgain=true; }
      else if(r.status===409||r.status===422) syncAgain=true;
      else fail(r);
    }
    /* 5. Hier gelöschte Boards auch auf dem Server löschen */
    for(const d of boards.del.slice()){
      if(d.id in remote){ const r=await ghApi(cfg,'/contents/boards/'+d.id+'.json',{method:'DELETE',body:{message:'Skizix: Board gelöscht',sha:remote[d.id]}});
        if(!r.ok&&r.status!==404&&r.status!==409&&r.status!==422) fail(r); if(r.status===409||r.status===422){ syncAgain=true; continue; } }
      boards.del=boards.del.filter(x=>x.id!==d.id);
    }
    saveIdx(); setSync(boards.list.some(b=>b.dirty)?'wait':'ok'); if(manual) toast('Boards sind synchronisiert.');
  }catch(e){
    saveIdx();
    if(e&&e.code==='auth') setSync('auth'); else setSync('err',e&&e.status?'Serverfehler '+e.status:'Keine Verbindung');
    if(manual) toast(e&&e.code==='auth'?'GitHub lehnt den Zugang ab. Prüfe den Schlüssel unter „Einstellungen“.':'Der Abgleich hat nicht geklappt. Es wird später erneut versucht.');
    if(!e||e.code!=='auth'){ clearTimeout(syncTimer); syncTimer=setTimeout(()=>syncNow(false),30000); }
  }finally{
    syncBusy=false; if(syncAgain){ syncAgain=false; scheduleSync(1500); }
  }
}
function openSyncDlg(){
  const m=location.hostname.match(/^([^.]+)\.github\.io$/);
  $('syOwner').value=syncCfg?syncCfg.owner:(m?m[1]:''); $('syRepo').value=syncCfg?syncCfg.repo:''; $('syToken').value=syncCfg?syncCfg.token:'';
  $('syMsg').textContent=syncCfg?'Verbunden mit '+syncCfg.owner+'/'+syncCfg.repo+'.':''; $('syOff').hidden=!syncCfg; $('syncDlg').hidden=false;
  ($('syOwner').value?($('syRepo').value?$('syToken'):$('syRepo')):$('syOwner')).focus();
}
function closeSyncDlg(){ if($('syncDlg').hidden) return; $('syncDlg').hidden=true; $('menuBtn').focus(); }
function closeMenu(focus){ if(menu.hidden) return; menu.hidden=true; $('menuBtn').setAttribute('aria-expanded','false'); if(focus) $('menuBtn').focus(); }
$('syClose').onclick=closeSyncDlg;
$('syncDlg').addEventListener('pointerdown',e=>{ if(e.target===$('syncDlg')) closeSyncDlg(); });
$('syncDlg').addEventListener('keydown',e=>{   /* Tab bleibt im Dialog */
  if(e.key!=='Tab') return; const f=[...$('syncForm').querySelectorAll('input,button')].filter(x=>!x.hidden&&!x.disabled); if(!f.length) return;
  const first=f[0], last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); }
});
document.addEventListener('keydown',e=>{   /* Esc schließt Dialog und Menü, auch wenn der Fokus in einem Eingabefeld steht */
  if(e.key!=='Escape') return;
  if(!$('syncDlg').hidden){ e.preventDefault(); e.stopImmediatePropagation(); closeSyncDlg(); }
  else if(!menu.hidden){ e.preventDefault(); e.stopImmediatePropagation(); closeMenu(true); }
},true);
$('syOff').onclick=()=>{ syncCfg=null; lsDel(SYNC_KEY); clearTimeout(syncTimer); setSync('off'); $('syncDlg').hidden=true; toast('Synchronisierung getrennt. Die Boards bleiben auf diesem Gerät und auf GitHub erhalten.'); };
$('syncForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const cfg={owner:$('syOwner').value.trim(),repo:$('syRepo').value.trim(),token:$('syToken').value.trim()}, msg=$('syMsg');
  if(syncCfg&&syncCfg.api) cfg.api=syncCfg.api;
  if(!cfg.owner||!cfg.repo||!cfg.token){ msg.textContent='Bitte alle drei Felder ausfüllen.'; return; }
  msg.textContent='Verbindung wird geprüft …'; $('syGo').disabled=true;
  try{
    const r=await ghApi(cfg,'');
    if(r.status===401){ msg.textContent='GitHub erkennt den Schlüssel nicht. Prüfe, ob er vollständig kopiert und noch gültig ist.'; return; }
    if(r.status===404||r.status===403){ msg.textContent='Repository nicht gefunden, oder der Schlüssel darf nicht darauf zugreifen. Prüfe Benutzername, Repository-Name und die Auswahl beim Schlüssel.'; return; }
    if(!r.ok){ msg.textContent='GitHub meldet Fehler '+r.status+'. Versuch es später noch einmal.'; return; }
    const info=await r.json();
    if(info.permissions&&info.permissions.push===false){ msg.textContent='Der Schlüssel darf nur lesen. Stelle bei GitHub „Contents“ auf „Read and write“.'; return; }
    syncCfg=cfg; lsSet(SYNC_KEY,JSON.stringify(cfg)); $('syncDlg').hidden=true; setSync('busy'); syncNow(true);
  }catch(err){ msg.textContent='Keine Verbindung zu GitHub. Prüfe die Internetverbindung.'; }
  finally{ $('syGo').disabled=false; }
});
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) scheduleSync(600); });
window.addEventListener('online',()=>scheduleSync(600));
setInterval(()=>{ if(syncCfg&&!document.hidden&&!syncBusy) syncNow(false); },90000);


