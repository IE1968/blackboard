/* ---------- Konto: Anmeldung mit E-Mail und Passwort, alle eigenen Boards auf allen angemeldeten Geräten ----------
   Die Anmeldung läuft über Supabase Auth. Im Konto steht nur die Liste der eigenen Live-Boards (Board-Schlüssel und Name),
   geschützt durch Zeilenrechte: Nur das angemeldete Konto selbst kann sie lesen (siehe quelle/supabase/01-konto.sql).
   Angemeldet heißt: Jedes eigene Board ist live und erscheint automatisch auf allen anderen angemeldeten Geräten.
   Gast-Boards (über einen Freigabe-Link) gehören nicht zum Konto. */
function ktOn(){ return !!(KT&&KT.s); }
var KT={s:null,busy:false,again:false,t:null,refreshing:null};
var KT_KEY='skizix-konto', KT_GONE='skizix-konto-weg';
function ktLoad(){
  for(const st of [localStorage,sessionStorage]){ try{ const v=st.getItem(KT_KEY); if(v){ const s=JSON.parse(v); if(s&&s.refresh_token){ s.keep=st===localStorage; return s; } } }catch(e){} }
  return null;
}
function ktStore(s){
  try{ localStorage.removeItem(KT_KEY); }catch(e){} try{ sessionStorage.removeItem(KT_KEY); }catch(e){}
  if(!s) return; const v=JSON.stringify({access_token:s.access_token,refresh_token:s.refresh_token,expires_at:s.expires_at,email:s.email,uid:s.uid});
  try{ (s.keep?localStorage:sessionStorage).setItem(KT_KEY,v); }catch(e){}
}
function ktFrom(j,keep){ return {access_token:j.access_token,refresh_token:j.refresh_token,expires_at:Date.now()+Math.max(30,(j.expires_in||3600)-60)*1000,email:(j.user&&j.user.email)||'',uid:(j.user&&j.user.id)||'',keep}; }
async function ktAuth(path,body,token){
  const h={apikey:SB_KEY,'Content-Type':'application/json'}; if(token) h.Authorization='Bearer '+token;
  const r=await fetch(SB_URL+'/auth/v1/'+path,{method:'POST',cache:'no-store',headers:h,body:JSON.stringify(body||{})});
  let j=null; try{ j=await r.json(); }catch(e){}
  if(!r.ok) throw {status:r.status,code:j&&(j.error_code||j.error)||'',msg:j&&(j.msg||j.error_description||j.message)||''};
  return j;
}
/* gültiges Zugangs-Token; läuft es ab, wird es mit dem Erneuerungs-Token still erneuert */
function ktToken(){
  const s=KT.s; if(!s) return Promise.resolve(null);
  if(Date.now()<s.expires_at) return Promise.resolve(s.access_token);
  if(KT.refreshing) return KT.refreshing;
  KT.refreshing=(async()=>{
    try{ const j=await ktAuth('token?grant_type=refresh_token',{refresh_token:s.refresh_token}); if(KT.s!==s) return KT.s&&KT.s.access_token; KT.s=ktFrom(j,s.keep); ktStore(KT.s); return KT.s.access_token; }
    catch(e){
      const o=ktLoad(); if(o&&o.refresh_token!==s.refresh_token){ KT.s=o; return Date.now()<o.expires_at?o.access_token:null; }   /* ein anderes Fenster hat schon erneuert */
      if(e&&e.status&&e.status<500) ktSignedOut('Deine Anmeldung ist abgelaufen. Bitte melde dich neu an.');
      return null; }
    finally{ KT.refreshing=null; }
  })();
  return KT.refreshing;
}
async function ktRest(method,query,body,prefer){
  const t=await ktToken(); if(!t) throw {status:401};
  const h={apikey:SB_KEY,Authorization:'Bearer '+t,'Content-Type':'application/json'}; if(prefer) h.Prefer=prefer;
  const r=await fetch(SB_URL+'/rest/v1/skizix_konto_boards'+query,{method,cache:'no-store',headers:h,body:body?JSON.stringify(body):undefined});
  if(!r.ok){ let msg=''; try{ msg=(await r.json()).message||''; }catch(e){} if(r.status===401&&KT.s) KT.s.expires_at=0; throw {status:r.status,msg}; }
  const x=await r.text(); return x?JSON.parse(x):null;
}
function ktGoneList(){ try{ const v=JSON.parse(lsGet(KT_GONE)||'[]'); return Array.isArray(v)?v.filter(k=>RE_KEY.test(k)):[]; }catch(e){ return []; } }
/* Abgleich der Board-Liste: eigene Boards ins Konto, fehlende vom Konto holen, anderswo gelöschte hier entfernen */
async function ktSync(){
  if(!KT.s||!liveOk()) return; if(KT.busy){ KT.again=true; return; } KT.busy=true; KT.again=false;
  try{
    const gone=ktGoneList();
    if(gone.length){ await ktRest('PATCH','?key=in.('+gone.join(',')+')',{del:true},'return=minimal'); lsSet(KT_GONE,'[]'); }
    const rows=await ktRest('GET','?select=key,name,del',null)||[], srv=new Map(rows.map(r=>[r.key,r]));
    const up=[], fresh=[], drop=[]; let idx=ktDedupe();
    for(const b of boards.list){
      if(b.tok) continue;   /* Gast-Board */
      if(!b.live){ b.live=liveNewKey(); b.kNew=true; b.liveDirty=true; idx=true; }
      const r=srv.get(b.live);
      if(r&&r.del){ drop.push(b); continue; }
      if(!r){ up.push({key:b.live,name:String(b.name||'Board').slice(0,120),del:false}); if(b.kNew) fresh.push(b); b.kName=b.name; idx=true; continue; }
      if(b.kName!==undefined&&b.name!==b.kName){ up.push({key:b.live,name:String(b.name||'Board').slice(0,120),del:false}); b.kName=b.name; idx=true; }
      else if(r.name&&r.name!==b.name){ b.name=String(r.name).slice(0,40); b.kName=r.name; idx=true; if(b.id===boards.cur) $('boardName').value=b.name; }
      else if(b.kName===undefined){ b.kName=b.name; idx=true; }
    }
    /* neue Boards zuerst hochladen, dann ins Konto eintragen: so findet ein anderes Gerät immer schon den Inhalt */
    for(const b of fresh){
      const d=b.id===boards.cur?doc:(storedDoc(b.id)||{items:[],n:0,fmt:DOC_FMT});
      try{ await liveRpc('skizix_save',{p_id:b.live,p_name:b.name||'Board',p_doc:Object.assign({},d,{fmt:Math.max(d.fmt||0,DOC_FMT)})}); delete b.kNew; if(b.id!==boards.cur) b.liveDirty=false; }
      catch(e){ const i=up.findIndex(u=>u.key===b.live); if(i>=0) up.splice(i,1); delete b.kName; }
    }
    if(up.length) await ktRest('POST','?on_conflict=user_id,key',up,'resolution=merge-duplicates,return=minimal');
    /* Boards aus dem Konto, die auf diesem Gerät noch fehlen */
    let added=0;
    for(const r of rows){
      if(r.del||boards.list.some(b=>b.live===r.key)) continue;
      let f=null; try{ f=await liveFetch({k:r.key,own:true}); }catch(e){ continue; }
      if(!f) continue;   /* Inhalt noch nicht hochgeladen: beim nächsten Abgleich */
      const nb={id:genId(),name:String(r.name||f.name||'Board').slice(0,40),live:r.key}; nb.kName=r.name;
      boards.list.push(nb); docSet(nb.id,JSON.stringify(f.doc)); added++; idx=true;
    }
    /* auf einem anderen Gerät gelöscht */
    for(const b of drop){
      if(boards.list.length<2){ const nb={id:genId(),name:'Board 1'}; boards.list.push(nb); docSet(nb.id,JSON.stringify({items:[],n:0,fmt:DOC_FMT})); }
      docDel(b.id); boards.list=boards.list.filter(x=>x!==b); idx=true;
      if(b.id===boards.cur){ openBoard(boards.list[0].id); toast('Das Board „'+b.name+'“ wurde auf einem anderen Gerät gelöscht.'); }
    }
    if(idx){ saveIdx(); if(!menu.hidden) renderBoardList(); }
    if(added) toast(added===1?'1 Board aus deinem Konto ist dazugekommen.':added+' Boards aus deinem Konto sind dazugekommen.');
    liveTick(); ktUi();
  }catch(e){ if(e&&e.status===404) ktUi('Konto-Tabelle fehlt in Supabase. Bitte das Skript 01-konto.sql ausführen.'); }
  finally{ KT.busy=false; if(KT.again) setTimeout(ktSync,300); }
}
/* Zwei Boards mit demselben Schlüssel auf einem Gerät (z. B. einmal vom Konto, einmal vom alten GitHub-Abgleich): eins behalten */
function ktDedupe(){
  const seen=new Map(), extra=[];
  for(const b of boards.list){ if(!b.live) continue; const o=seen.get(b.live); if(!o){ seen.set(b.live,b); continue; }
    const keepB=b.id===boards.cur||(o.id!==boards.cur&&(b.updated||0)>(o.updated||0)); if(keepB){ seen.set(b.live,b); extra.push(o); } else extra.push(b); }
  if(!extra.length) return false;
  for(const b of extra) docDel(b.id);
  const ex=new Set(extra); boards.list=boards.list.filter(b=>!ex.has(b));
  return true;
}
function ktSoon(ms){ if(!KT.s) return; clearTimeout(KT.t); KT.t=setTimeout(ktSync,ms||1500); }
/* lokal gelöschtes eigenes Board: im Konto als gelöscht markieren, damit es auch auf den anderen Geräten verschwindet */
function ktGone(b){
  if(!b||!b.live||b.tok) return;
  const l=ktGoneList(); if(!l.includes(b.live)) l.push(b.live); lsSet(KT_GONE,JSON.stringify(l));
  if(KT.s) ktSoon(300);
}
function ktSignedOut(msg){
  KT.s=null; ktStore(null); ktUi(); setSync(syncCfg?'wait':'off'); if(syncCfg) scheduleSync(800); if(msg) toast(msg);
}
function ktUi(note){
  const on=!!KT.s;
  $('ktInfo').textContent=note||(on?'Angemeldet als '+KT.s.email:liveOk()?'Nicht angemeldet':'Hier nicht verfügbar');
  $('ktLoginBtn').hidden=on||!liveOk(); $('ktLogoutBtn').hidden=!on;
  liveBadge();
}
/* ---- Anmelde-Dialog ---- */
function openKtDlg(){ $('ktMsg').textContent=''; $('ktPw').value=''; $('ktDlg').hidden=false; ($('ktMail').value?$('ktPw'):$('ktMail')).focus(); }
function closeKtDlg(){ if(!$('ktDlg').hidden) $('ktDlg').hidden=true; }
$('ktForm').addEventListener('submit',async e=>{
  e.preventDefault(); const mail=$('ktMail').value.trim(), pw=$('ktPw').value, keep=$('ktKeep').checked, msg=$('ktMsg'), go=$('ktGo');
  if(!mail||!pw){ msg.textContent='Bitte E-Mail-Adresse und Passwort eingeben.'; return; }
  msg.textContent='Anmeldung läuft …'; go.disabled=true;
  try{
    const j=await ktAuth('token?grant_type=password',{email:mail,password:pw});
    KT.s=ktFrom(j,keep); ktStore(KT.s); try{ lsSet('skizix-konto-mail',mail); }catch(_){}
    clearTimeout(syncTimer); closeKtDlg(); ktUi(); renderSyncInfo(); setSync(syncState); toast('Angemeldet. Deine Boards werden mit dem Konto abgeglichen …'); ktSync();
  }catch(err){
    msg.textContent=err&&err.code==='invalid_credentials'||(err&&err.status===400&&/invalid/i.test(err.msg||''))?'E-Mail-Adresse oder Passwort stimmt nicht.'
      :err&&err.code==='email_not_confirmed'?'Die E-Mail-Adresse ist noch nicht bestätigt.'
      :err&&err.status===429?'Zu viele Versuche. Bitte einen Moment warten.'
      :'Anmeldung nicht möglich. Prüfe die Internetverbindung.';
  }finally{ go.disabled=false; }
});
$('ktClose').onclick=closeKtDlg;
$('ktDlg').addEventListener('pointerdown',e=>{ if(e.target===$('ktDlg')) closeKtDlg(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!$('ktDlg').hidden){ e.preventDefault(); e.stopImmediatePropagation(); closeKtDlg(); } },true);
async function ktLogout(){
  const s=KT.s; if(!s) return;
  try{ const t=await ktToken(); if(t) await ktAuth('logout?scope=local',{},t); }catch(e){}
  ktSignedOut('Abgemeldet. Die Boards bleiben auf diesem Gerät, neue Boards anderer Geräte kommen aber nicht mehr dazu.');
}
/* Start und regelmäßiger Abgleich */
function ktStart(){
  KT.s=ktLoad(); try{ const m=lsGet('skizix-konto-mail'); if(m) $('ktMail').value=m; }catch(e){}
  ktUi(); if(KT.s) ktSync();
}
setInterval(()=>{ if(KT.s&&!document.hidden) ktSync(); },30000);
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) ktSoon(200); });
window.addEventListener('focus',()=>ktSoon(200));
window.addEventListener('online',()=>ktSoon(200));
window.addEventListener('storage',e=>{ if(e.key===KT_KEY){ const o=ktLoad(); if(!!o!==!!KT.s){ KT.s=o; ktUi(); if(o) ktSync(); } else if(o) KT.s=o; } });

