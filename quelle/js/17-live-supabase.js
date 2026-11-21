/* ---------- Live: dasselbe Board auf mehreren Geräten gleichzeitig (über Supabase) ----------
   Besitzer: kennt den geheimen Board-Schlüssel (b.live) und verwaltet die Freigabe-Links.
   Gäste: kommen über einen Freigabe-Link (b.tok) ins Board, entweder zum Mitzeichnen oder nur zum Ansehen.
   Änderungen gehen sofort über einen Echtzeit-Kanal an alle offenen Geräte und werden kurz danach in der Datenbank gespeichert. */
var SB_URL='https://qgddexalpzzwyvaqleud.supabase.co', SB_KEY='sb_publishable_vFLIL6z-AO-hOVzr9HJIHw_3LgYAoLl';
var LV={topic:null,ws:null,key:null,own:false,role:'edit',chan:null,joined:false,ref:0,joinRef:null,hb:null,retry:null,tries:0,base:null,ord:null,queue:[],saveT:null,saving:false,saveAgain:false,peers:new Map(),pingT:null,name:'',drafts:new Map(),gen:0};
var RE_KEY=/^[A-Za-z0-9]{20,64}$/;
function liveOk(){ return !window.claude&&typeof WebSocket!=='undefined'&&typeof fetch!=='undefined'; }
function liveNewKey(){ const a='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', u=new Uint8Array(28); crypto.getRandomValues(u); let s=''; for(const x of u) s+=a[x%a.length]; return s; }
function liveBase(){ return location.origin+location.pathname; }
function liveParse(t){ t=String(t||'').trim(); let m=/[#&?]join=([A-Za-z0-9]{20,64})/.exec(t); if(m) return {tok:m[1]}; m=/[#&?]live=([A-Za-z0-9]{20,64})/.exec(t); if(m) return {own:m[1]}; m=/^([A-Za-z0-9]{20,64})$/.exec(t); return m?{tok:m[1]}:null; }
function liveCur(){ const b=curBoard(); if(!b) return null; if(b.live) return {b,k:b.live,own:true,role:'edit'}; if(b.tok) return {b,k:b.tok,own:false,role:b.role==='view'?'view':'edit'}; return null; }
function liveRO(){ const c=liveCur(); return !!(c&&c.role==='view'); }
async function liveRpc(fn,args){
  const r=await fetch(SB_URL+'/rest/v1/rpc/'+fn,{method:'POST',cache:'no-store',headers:{apikey:SB_KEY,'Content-Type':'application/json'},body:JSON.stringify(args)});
  if(!r.ok){ let msg=''; try{ msg=(await r.json()).message||''; }catch(e){} throw {status:r.status,msg}; }
  const t=await r.text(); return t?JSON.parse(t):null;
}
/* Stand vom Server: null heißt „gibt es nicht“ bzw. „Zugang beendet oder abgelaufen“ */
async function liveFetch(c){
  const rows=c.own?await liveRpc('skizix_get',{p_id:c.k}):await liveRpc('skizix_tget',{p_tok:c.k});
  const row=Array.isArray(rows)?rows[0]:rows; if(!row||!row.doc) return null; const d=cleanDoc(row.doc); if(!d) return null;
  return {name:row.name,doc:d,chan:row.chan,role:row.role==='view'?'view':'edit',exp:row.expires_at?Date.parse(row.expires_at):null};
}
function liveSnap(){ const m=new Map(); for(const it of doc.items) m.set(it.id,JSON.stringify(it)); return {m,ord:doc.items.map(i=>i.id)}; }
function liveSetBase(){ const s=liveSnap(); LV.base=s.m; LV.ord=s.ord; }
function liveDiff(){
  if(!LV.base) return null;
  const up=[], del=[], cur=new Set();
  for(const it of doc.items){ cur.add(it.id); const j=JSON.stringify(it); if(LV.base.get(it.id)!==j) up.push(it); }
  for(const id of LV.base.keys()) if(!cur.has(id)) del.push(id);
  const a=LV.ord.filter(id=>cur.has(id)), b=doc.items.map(i=>i.id).filter(id=>LV.base.has(id));
  const moved=a.length!==b.length||a.some((id,i)=>id!==b[i]);
  if(!up.length&&!del.length&&!moved) return null;
  const o={up,del}; if(moved) o.ord=doc.items.map(i=>i.id); return o;
}
/* Wird nach jeder eigenen Änderung aufgerufen (Speichern, Rückgängig, Board wechseln) */
function liveTick(){
  if(!liveOk()) return;
  const c=liveCur(), k=c?c.k:null;
  if(k!==LV.key){ liveConnect(c); return; }
  if(!c||c.role==='view') return;
  const b=c.b;
  if(!LV.joined||!LV.base){ b.liveDirty=true; saveIdx(); liveBadge(); return; }
  const o=liveDiff(); if(!o) return;
  liveSetBase(); b.liveDirty=true; saveIdx();
  const msg={t:'ops',up:o.up,del:o.del,nm:b.name}; if(o.ord) msg.ord=o.ord;
  if(JSON.stringify(msg).length>200000) liveSave(0,true); else { liveSend(msg); liveSave(1500); }
}
function liveSend(msg){
  if(!LV.ws||LV.ws.readyState!==1||!LV.joined) return false;
  try{ LV.ws.send(JSON.stringify({topic:LV.topic,event:'broadcast',payload:{type:'broadcast',event:'m',payload:Object.assign({dev:DEV},msg)},ref:String(++LV.ref),join_ref:LV.joinRef})); return true; }catch(e){ return false; }
}
function liveSave(ms,thenReload){
  clearTimeout(LV.saveT); LV.saveT=setTimeout(async()=>{
    if(LV.saving){ LV.saveAgain=true; return; }
    const c=liveCur(); if(!c||c.k!==LV.key||c.role==='view') return;
    const b=c.b, rev=b.rev; LV.saving=true;
    const d=Object.assign({},doc,{fmt:Math.max(doc.fmt||0,DOC_FMT)});
    try{ if(c.own) await liveRpc('skizix_save',{p_id:c.k,p_name:b.name||'Board',p_doc:d}); else await liveRpc('skizix_tsave',{p_tok:c.k,p_name:b.name||'Board',p_doc:d});
      if(b.rev===rev) b.liveDirty=false; saveIdx(); if(thenReload) liveSend({t:'reload'}); }
    catch(e){ if(!c.own&&e&&/denied/.test(e.msg||'')){ LV.saving=false; liveEnded(c.b,'Der Zugang zu diesem Live-Board wurde beendet. Das Board bleibt als Kopie auf diesem Gerät.'); return; } liveSave(10000,thenReload); }
    finally{ LV.saving=false; if(LV.saveAgain){ LV.saveAgain=false; liveSave(500,thenReload); } liveBadge(); }
  },ms||0);
}
/* ---- Striche schon während des Zeichnens zeigen ---- */
function liveDraft(a){
  if(!LV.joined||liveRO()) return;
  const now=performance.now(); if(a.liveT&&now-a.liveT<50) return;
  if(!a.liveK){ a.liveK=Math.random().toString(36).slice(2,8); a.liveN=0; }
  const from=Math.max(0,(a.liveN||0)-1), ps=penStyles[a.tool];
  liveSend({t:'dr',k:a.liveK,i:from,p:a.pts.slice(from),w:a.ws?a.ws.slice(from):null,s:{stroke:ps.stroke,sw:ps.sw,tool:a.tool,tip:ps.tip}});
  a.liveN=a.pts.length; a.liveT=now;
}
function liveDraftG(){
  let g=document.getElementById('liveDraftG');
  if(!g||!g.isConnected){ g=document.createElementNS('http://www.w3.org/2000/svg','g'); g.id='liveDraftG'; g.setAttribute('pointer-events','none'); worldG.insertBefore(g,overlayG); }
  return g;
}
function liveDraftIn(m){
  const id=m.dev+':'+String(m.k||'').slice(0,12); let d=LV.drafts.get(id);
  if(!d){ d={pts:[],ws:[],el:document.createElementNS('http://www.w3.org/2000/svg','g'),dev:m.dev}; liveDraftG().appendChild(d.el); LV.drafts.set(id,d); }
  const pts=Array.isArray(m.p)?m.p.filter(q=>Array.isArray(q)&&Number.isFinite(q[0])&&Number.isFinite(q[1])).slice(0,4000):[], i=Math.max(0,Math.min(d.pts.length,+m.i||0));
  if(d.pts.length>20000) return;
  d.pts.length=i; d.pts.push(...pts.map(q=>[q[0],q[1]]));
  if(Array.isArray(m.w)){ d.ws.length=i; d.ws.push(...m.w.map(v=>Number.isFinite(+v)?+v:1)); }
  const s=m.s||{}, col=(typeof s.stroke==='string'&&/^#[0-9a-f]{6}$/i.test(s.stroke))?s.stroke:INK;
  const it={pts:d.pts,ws:d.ws.length===d.pts.length?d.ws:null,stroke:col,sw:clamp(+s.sw||3,0.5,100),tool:['pen','brush','marker'].includes(s.tool)?s.tool:'pen',tip:['round','flat','calli'].includes(s.tip)?s.tip:'round'};
  if(d.pts.length) d.el.innerHTML=strokeSVG(it);
  clearTimeout(d.t); d.t=setTimeout(()=>liveDraftEnd(m.dev),4000);
}
function liveDraftEnd(dev){ for(const [id,d] of LV.drafts) if(!dev||d.dev===dev){ clearTimeout(d.t); d.el.remove(); LV.drafts.delete(id); } }
/* ---- Änderungen anderer Geräte übernehmen ---- */
function liveApply(m){
  if(!m||m.dev===DEV) return;
  if(m.t==='hi'||m.t==='here'){ const isNew=!LV.peers.has(m.dev); LV.peers.set(m.dev,{at:Date.now()}); if(m.t==='hi') liveSend({t:'here'}); if(isNew&&m.t==='hi') toast('Jemand ist dem Live-Board beigetreten.'); liveBadge(); return; }
  if(m.t==='bye'){ LV.peers.delete(m.dev); liveDraftEnd(m.dev); liveBadge(); return; }
  LV.peers.set(m.dev,Object.assign(LV.peers.get(m.dev)||{},{at:Date.now()}));
  if(m.t==='dr'){ liveDraftIn(m); return; }
  if(m.t==='moved'){ liveRefresh(); return; }
  if(m.t==='ops') liveDraftEnd(m.dev);
  if(action||editing||pres){ LV.queue.push(m); return; }
  if(m.t==='reload'){ liveResync(); return; }
  if(m.t!=='ops') return;
  const c=liveCur(); if(!c) return; const b=c.b;
  if(typeof m.nm==='string'&&m.nm.trim()&&m.nm!==b.name){ b.name=m.nm.slice(0,40); if(document.activeElement!==$('boardName')) $('boardName').value=b.name; saveIdx(); }
  /* eingehende Elemente prüfen; vorhandene Formen dienen als Platzhalter, damit Pfeile ihre Enden behalten */
  const stubs=doc.items.filter(i=>i.type==='shape').map(i=>({id:i.id,type:'shape',kind:'rect',x:0,y:0,w:1,h:1}));
  const ups=Array.isArray(m.up)?m.up.slice(0,5000):[], upIds=new Set(ups.map(u=>u&&u.id));
  const cd=cleanDoc({items:ups.concat(stubs.filter(s=>!upIds.has(s.id)))}); if(!cd) return;
  const clean=cd.items.filter(i=>upIds.has(i.id)), del=new Set(Array.isArray(m.del)?m.del.filter(x=>typeof x==='string'):[]);
  let items=doc.items.filter(i=>!del.has(i.id)); const pos=new Map(items.map((it,i)=>[it.id,i]));
  for(const it of clean){ if(pos.has(it.id)) items[pos.get(it.id)]=it; else { pos.set(it.id,items.length); items.push(it); } }
  if(Array.isArray(m.ord)){ const rank=new Map(m.ord.map((id,i)=>[id,i])); const known=items.filter(i=>rank.has(i.id)).sort((x,y)=>rank.get(x.id)-rank.get(y.id)), rest=items.filter(i=>!rank.has(i.id)); items=known.concat(rest); }
  const mine=c.role==='view'?null:liveDiff();   /* eigene, noch nicht verschickte Änderungen bleiben erhalten */
  doc.items=items; for(const id of [...sel]) if(!byId(id)) sel.delete(id);
  liveHist(clean,del);
  liveSetBase();
  if(mine){ for(const it of mine.up) LV.base.delete(it.id); for(const id of mine.del) if(!byId(id)) LV.base.set(id,'-'); }
  persist(); render(); if(mine) liveTick();
  if(c.role!=='view') liveSave(8000);
}
/* „Rückgängig“-Stände anpassen, damit Zurück nicht die Änderungen der anderen wieder entfernt */
function liveHist(clean,del){
  for(let i=0;i<hist.length;i++){
    const h=hist[i]; if(!h||!h.ids) continue;
    let ids=h.ids, items=h.items;
    if(del.size){ const keep=ids.map(id=>!del.has(id)); ids=ids.filter((_,j)=>keep[j]); items=items.filter((_,j)=>keep[j]); }
    const pos=new Map(ids.map((id,j)=>[id,j]));
    for(const it of clean){ const j=JSON.stringify(it); if(pos.has(it.id)) items[pos.get(it.id)]=j; else { pos.set(it.id,ids.length); ids.push(it.id); items.push(j); } }
    h.ids=ids; h.items=items; delete h.m;
  }
}
setInterval(()=>{ if(LV.queue.length&&!action&&!editing&&!pres){ const q=LV.queue; LV.queue=[]; q.forEach(liveApply); } },700);
/* Ablaufzeit eines Gast-Links prüfen */
setInterval(()=>{ const c=liveCur(); if(c&&!c.own&&c.b.exp&&Date.now()>c.b.exp) liveEnded(c.b,'Der Link zu diesem Live-Board ist abgelaufen. Das Board bleibt als Kopie auf diesem Gerät.'); },20000);
/* Stand vom Server holen und mit eigenen, noch nicht gespeicherten Änderungen zusammenführen */
async function liveResync(){
  const c=liveCur(); if(!c||c.k!==LV.key) return; const b=c.b;
  let r=null; try{ r=await liveFetch(c); }catch(e){ return; }
  if(liveCur()===null||liveCur().k!==c.k) return;
  if(!r){ if(c.own){ liveSetBase(); liveSave(0); } else liveEnded(b,'Der Zugang zu diesem Live-Board wurde beendet. Das Board bleibt als Kopie auf diesem Gerät.'); return; }
  if(!c.own){ b.role=r.role; b.exp=r.exp; saveIdx(); liveViewMode(); }
  if(r.chan&&r.chan!==LV.chan){ LV.chan=r.chan; LV.tries=0; liveOpenWs(); return; }
  if(action||editing||pres){ LV.queue.push({t:'reload',dev:'srv'}); return; }
  const mine=(LV.base&&b.role!=='view')?liveDiff():null;
  let items=r.doc.items;
  if(mine){ const del=new Set(mine.del), pos=new Map(); items=items.filter(i=>!del.has(i.id)); items.forEach((it,i)=>pos.set(it.id,i));
    for(const it of mine.up){ if(pos.has(it.id)) items[pos.get(it.id)]=it; else items.push(it); } }
  else if(!LV.base&&b.liveDirty&&b.role!=='view'){ const pos=new Map(items.map((it,i)=>[it.id,i])); items=items.slice(); for(const it of doc.items){ if(pos.has(it.id)) items[pos.get(it.id)]=it; else items.push(it); } }
  const changed=JSON.stringify(items)!==JSON.stringify(doc.items);
  doc=Object.assign({},doc,{items,n:Math.max(doc.n||0,r.doc.n||0)}); for(const id of [...sel]) if(!byId(id)) sel.delete(id);
  if(r.name&&r.name!==b.name){ b.name=String(r.name).slice(0,40); $('boardName').value=b.name; saveIdx(); }
  if(changed){ resetHist(); persist(); render(); }
  liveSetBase();
  if((mine||b.liveDirty)&&b.role!=='view') liveSave(0,true);
}
/* Kanal neu ermitteln, z. B. nachdem der Besitzer einen Link beendet hat */
async function liveRefresh(){
  const c=liveCur(); if(!c) return; let r=null;
  try{ r=await liveFetch(c); }catch(e){ return; }
  if(!r){ if(!c.own) liveEnded(c.b,'Der Zugang zu diesem Live-Board wurde beendet. Das Board bleibt als Kopie auf diesem Gerät.'); return; }
  if(r.chan&&r.chan!==LV.chan){ LV.chan=r.chan; LV.tries=0; liveOpenWs(); }
}
function liveConnect(c){
  liveClose(); liveDraftEnd();
  LV.key=c?c.k:null; LV.own=!!(c&&c.own); LV.chan=null; LV.base=null; LV.ord=null; LV.queue=[]; LV.peers.clear(); LV.tries=0; const gen=++LV.gen;
  liveViewMode(); liveBadge(); if(!c) return;
  (async()=>{
    let r=null; try{ r=await liveFetch(c); }catch(e){ if(gen===LV.gen) liveRetryStart(c); return; }
    if(gen!==LV.gen) return;
    if(!r){
      if(!c.own){ liveEnded(c.b,'Diesen Live-Zugang gibt es nicht mehr. Das Board bleibt als Kopie auf diesem Gerät.'); return; }
      try{ await liveRpc('skizix_save',{p_id:c.k,p_name:c.b.name||'Board',p_doc:Object.assign({},doc,{fmt:Math.max(doc.fmt||0,DOC_FMT)})}); r=await liveFetch(c); }catch(e){ if(gen===LV.gen) liveRetryStart(c); return; }
      if(gen!==LV.gen||!r) return; c.b.liveDirty=false; saveIdx();
    }
    if(!c.own){ c.b.role=r.role; c.b.exp=r.exp; saveIdx(); liveViewMode(); }
    LV.chan=r.chan; liveOpenWs();
  })();
}
function liveRetryStart(c){ clearTimeout(LV.retry); LV.tries++; LV.retry=setTimeout(()=>{ const cc=liveCur(); if(cc&&cc.k===c.k&&!LV.chan) { LV.key=null; liveConnect(cc); } },Math.min(30000,1000*Math.pow(2,Math.min(LV.tries,5)))); liveBadge(); }
function liveClose(){
  clearTimeout(LV.retry); clearInterval(LV.hb); clearInterval(LV.pingT);
  if(LV.ws){ try{ if(LV.joined) liveSend({t:'bye'}); LV.ws.onclose=null; LV.ws.close(); }catch(e){} }
  LV.ws=null; LV.joined=false; LV.topic=null;
}
/* Kanal betreten; die Verbindung bleibt bestehen, beim Kanalwechsel wird nur der Kanal getauscht */
function liveJoinTopic(){
  const ws=LV.ws; if(!ws||ws.readyState!==1||!LV.chan) return;
  if(LV.topic){ try{ if(LV.joined) liveSend({t:'bye'}); ws.send(JSON.stringify({topic:LV.topic,event:'phx_leave',payload:{},ref:String(++LV.ref),join_ref:LV.joinRef})); }catch(e){} }
  LV.joined=false; LV.peers.clear(); liveDraftEnd(); clearInterval(LV.pingT);
  LV.topic='realtime:skizix-'+LV.chan; LV.joinRef=String(++LV.ref);
  ws.send(JSON.stringify({topic:LV.topic,event:'phx_join',payload:{config:{broadcast:{self:false,ack:false},presence:{key:''},private:false}},ref:LV.joinRef,join_ref:LV.joinRef}));
  liveBadge();
}
function liveOpenWs(){
  if(!LV.key||!LV.chan) return;
  if(LV.ws&&LV.ws.readyState===1){ liveJoinTopic(); return; }
  if(LV.ws&&LV.ws.readyState===0) return;   /* Verbindung entsteht gerade; danach wird der aktuelle Kanal betreten */
  clearInterval(LV.hb); clearInterval(LV.pingT); LV.peers.clear(); liveDraftEnd(); LV.topic=null;
  let ws; try{ ws=new WebSocket(SB_URL.replace(/^http/,'ws')+'/realtime/v1/websocket?apikey='+encodeURIComponent(SB_KEY)+'&vsn=1.0.0'); }catch(e){ liveRetry(); return; }
  LV.ws=ws; LV.joined=false; liveBadge();
  ws.onopen=()=>{
    if(ws!==LV.ws) return; liveJoinTopic();
    clearInterval(LV.hb); LV.hb=setInterval(()=>{ try{ ws.send(JSON.stringify({topic:'phoenix',event:'heartbeat',payload:{},ref:String(++LV.ref)})); }catch(e){} },25000);
  };
  ws.onmessage=e=>{
    let m=null; try{ m=JSON.parse(e.data); }catch(_){ return; } if(!m||ws!==LV.ws||m.topic!==LV.topic) return;
    if(m.event==='phx_reply'&&m.ref===LV.joinRef){
      if(m.payload&&m.payload.status==='ok'){ LV.joined=true; LV.tries=0; liveBadge(); liveSend({t:'hi'}); liveResync();
        clearInterval(LV.pingT); LV.pingT=setInterval(()=>{ liveSend({t:'hi'}); const old=Date.now()-60000; for(const [d,p] of LV.peers) if(p.at<old) LV.peers.delete(d); liveBadge(); },25000); }
      else { try{ ws.close(); }catch(_){} }
      return;
    }
    if(m.event==='broadcast'&&m.payload&&m.payload.event==='m') liveApply(m.payload.payload);
    if(m.event==='phx_error'||m.event==='phx_close'){ try{ ws.close(); }catch(_){} }
  };
  ws.onclose=()=>{ if(ws!==LV.ws) return; LV.ws=null; LV.joined=false; LV.topic=null; clearInterval(LV.hb); clearInterval(LV.pingT); liveBadge(); liveRetry(); };
  ws.onerror=()=>{};
}
function liveRetry(){ clearTimeout(LV.retry); if(!LV.key) return; LV.tries++; LV.retry=setTimeout(liveOpenWs,Math.min(30000,1000*Math.pow(2,Math.min(LV.tries,5)))); }
document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&LV.key&&LV.chan&&(!LV.ws||LV.ws.readyState>1)){ LV.tries=0; liveOpenWs(); } });
window.addEventListener('online',()=>{ if(LV.key&&LV.chan&&!LV.joined){ LV.tries=0; liveOpenWs(); } });
window.addEventListener('pagehide',()=>{ if(LV.joined) liveSend({t:'bye'}); });
/* Gast-Zugang endet: Board bleibt als normales Board auf dem Gerät */
function liveEnded(b,msg){
  if(!b||!b.tok) return; delete b.tok; delete b.role; delete b.exp; delete b.liveDirty; saveIdx();
  if(b===curBoard()) liveConnect(null); toast(msg);
}
/* Nur-Ansehen: Werkzeuge ausblenden, jede Änderung wird sofort zurückgenommen */
function liveViewMode(){
  const ro=liveRO(); document.body.classList.toggle('liveview',ro); $('boardName').readOnly=ro;
  if(ro&&tool!=='pan') setTool('pan');
}
function liveBadge(){
  const el=$('liveBadge'); if(!el) return; const c=liveCur(), on=!!c;
  el.hidden=!on;
  if(on){ const n=LV.peers.size+1, lbl=c.role==='view'?'ANSEHEN':'LIVE'; el.dataset.st=LV.joined?'ok':'off'; el.dataset.role=c.role;
    el.textContent=LV.joined?(lbl+(n>1?' · '+n:'')):lbl+' …';
    el.title=(c.role==='view'?'Nur ansehen. ':'')+(LV.joined?(n>1?n+' Geräte sind mit diesem Board verbunden':'Verbunden, gerade niemand sonst da'):'Verbindung wird aufgebaut …'); }
  const info=$('liveInfo'); if(!info) return;
  info.textContent=!liveOk()?'Hier nicht verfügbar':!on?'Nur auf diesem Gerät':(c.own?'':c.role==='view'?'Gast, nur ansehen · ':'Gast, mitzeichnen · ')+(LV.joined?(LV.peers.size?'verbunden mit '+LV.peers.size+(LV.peers.size>1?' anderen Geräten':' anderem Gerät'):'verbunden, niemand sonst da'):'Verbindung wird aufgebaut …');
  $('liveStartBtn').hidden=on||!liveOk(); $('liveShareBtn').hidden=!(on&&c.own); $('liveStopBtn').hidden=!on;
  $('liveStopBtn').textContent=on&&!c.own?'Live-Board verlassen':'Live beenden (nur hier)';
}
/* ---- Teilen-Dialog für den Besitzer ---- */
function liveFmtExp(t){ if(!t) return 'ohne Ablauf'; const d=new Date(t); return 'bis '+d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+', '+d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})+' Uhr'; }
function liveExpFrom(v){ const now=new Date(); if(v==='1h') return new Date(now.getTime()+3600e3); if(v==='today'){ const d=new Date(now); d.setHours(23,59,0,0); return d; } if(v==='7d') return new Date(now.getTime()+7*86400e3); return null; }
async function liveShareTo(url,title){
  try{ if(navigator.share&&coarse){ await navigator.share({title:title||'Skizix',url}); return; } }catch(e){ if(e&&e.name==='AbortError') return; }
  try{ await navigator.clipboard.writeText(url); toast('Link kopiert.'); }catch(e){ const i=$('lvOut'); i.value=url; i.hidden=false; i.select(); toast('Link markiert: jetzt kopieren.'); }
}
async function liveLinksRender(){
  const c=liveCur(), box=$('lvList'); if(!c||!c.own){ box.textContent=''; return; }
  box.textContent='Wird geladen …';
  let rows=[]; try{ rows=await liveRpc('skizix_link_list',{p_id:c.k})||[]; }catch(e){ box.textContent='Liste nicht abrufbar. Prüfe die Internetverbindung.'; return; }
  const now=Date.now(); rows=rows.filter(r=>!r.expires_at||Date.parse(r.expires_at)>now);
  if(!rows.length){ box.textContent='Noch keine Links geteilt.'; return; }
  box.innerHTML=rows.map(r=>`<div class="lvRow"><span><b>${r.role==='view'?'Ansehen':'Mitzeichnen'}</b> · ${esc(liveFmtExp(r.expires_at?Date.parse(r.expires_at):null))}</span><button type="button" data-cp="${esc(r.token)}">Teilen</button><button type="button" data-rv="${esc(r.token)}">Beenden</button></div>`).join('');
}
function openLiveDlg(){ const c=liveCur(); if(!c||!c.own) return; $('lvOut').hidden=true; $('lvMsg').textContent=''; $('liveDlg').hidden=false; liveLinksRender(); $('lvEdit').focus(); }
function closeLiveDlg(){ if($('liveDlg').hidden) return; $('liveDlg').hidden=true; }
async function liveMakeLink(role){
  const c=liveCur(); if(!c||!c.own) return; const tok=liveNewKey(), exp=liveExpFrom($('lvExp').value);
  $('lvMsg').textContent='Link wird erstellt …';
  try{ if(!LV.chan) throw {msg:'offline'}; await liveRpc('skizix_link_add',{p_id:c.k,p_tok:tok,p_role:role,p_expires:exp?exp.toISOString():null}); }
  catch(e){ $('lvMsg').textContent='Das hat nicht geklappt. Ist das Board schon verbunden (LIVE oben)? Sonst kurz warten und noch einmal versuchen.'; return; }
  $('lvMsg').textContent=(role==='view'?'Link zum Ansehen':'Link zum Mitzeichnen')+' erstellt, '+liveFmtExp(exp&&exp.getTime())+'.';
  liveShareTo(liveBase()+'#join='+tok,c.b.name); liveLinksRender();
}
async function liveRevoke(tok){
  const c=liveCur(); if(!c||!c.own) return; let chan=null;
  try{ chan=await liveRpc('skizix_link_del',{p_id:c.k,p_tok:tok}); }catch(e){ toast('Beenden hat nicht geklappt. Prüfe die Internetverbindung.'); return; }
  liveSend({t:'moved'});   /* alle Geräte holen sich den neuen Kanal; wer keinen gültigen Link mehr hat, fliegt raus */
  if(typeof chan==='string'&&chan){ LV.chan=chan; LV.tries=0; setTimeout(liveOpenWs,200); }
  toast('Link beendet. Wer nur diesen Link hatte, ist jetzt draußen.'); liveLinksRender();
}
$('lvEdit').onclick=()=>liveMakeLink('edit');
$('lvView').onclick=()=>liveMakeLink('view');
$('lvOwn').onclick=()=>{ const c=liveCur(); if(c&&c.own) liveShareTo(liveBase()+'#live='+c.k,c.b.name); };
$('lvClose').onclick=closeLiveDlg;
$('liveDlg').addEventListener('pointerdown',e=>{ if(e.target===$('liveDlg')) closeLiveDlg(); });
$('lvList').addEventListener('click',e=>{
  const cp=e.target.closest('[data-cp]'); if(cp){ liveShareTo(liveBase()+'#join='+cp.dataset.cp,curBoard().name); return; }
  const rv=e.target.closest('[data-rv]'); if(rv){ if(!rv.dataset.sure){ rv.dataset.sure='1'; rv.textContent='Sicher?'; return; } liveRevoke(rv.dataset.rv); }
});
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!$('liveDlg').hidden){ e.preventDefault(); e.stopImmediatePropagation(); closeLiveDlg(); } },true);
function liveStart(){
  if(!liveOk()) return; const b=curBoard(); if(b.live||b.tok){ openLiveDlg(); return; }
  b.live=liveNewKey(); b.liveDirty=true; markDirty(b); saveIdx(); liveConnect(liveCur()); openLiveDlg();
}
function liveStop(){
  const c=liveCur(); if(!c) return; const b=c.b;
  if(c.own){ delete b.live; delete b.liveDirty; markDirty(b); saveIdx(); liveConnect(null); toast('Live beendet. Das Board bleibt auf diesem Gerät, die anderen können weiter damit arbeiten.'); }
  else { delete b.tok; delete b.role; delete b.exp; delete b.liveDirty; saveIdx(); liveConnect(null); toast('Live-Board verlassen. Eine Kopie bleibt auf diesem Gerät.'); }
}
async function liveJoin(p){
  if(!p||!liveOk()) return false;
  const k=p.own||p.tok, have=boards.list.find(x=>x.live===k||x.tok===k);
  if(have){ if(have.id!==boards.cur) openBoard(have.id); else liveTick(); return true; }
  const c={k,own:!!p.own}; let r=null;
  try{ r=await liveFetch(c); }catch(e){ toast('Keine Verbindung zum Live-Board. Prüfe die Internetverbindung.'); return false; }
  if(!r){ toast(p.own?'Dieses Live-Board gibt es nicht (mehr). Prüfe den Link.':'Dieser Link ist ungültig, abgelaufen oder wurde beendet.'); return false; }
  const id=genId(), nb={id,name:String(r.name||'Live-Board').slice(0,40)};
  if(p.own) nb.live=k; else { nb.tok=k; nb.role=r.role; nb.exp=r.exp; }
  boards.list.push(nb); docSet(id,JSON.stringify(r.doc)); saveIdx(); openBoard(id);
  toast('Live-Board „'+nb.name+'“ geöffnet'+(nb.role==='view'?' (nur ansehen).':'. Änderungen erscheinen sofort bei allen.')); return true;
}
function liveFromHash(){
  const p=liveParse(location.hash); if(!p) return;
  try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){}
  liveJoin(p);
}
window.addEventListener('hashchange',liveFromHash);
$('liveJoinForm').addEventListener('submit',async e=>{
  e.preventDefault(); const inp=$('liveJoinIn'), p=liveParse(inp.value);
  if(!p){ toast('Das ist kein gültiger Live-Link. Füge den ganzen Link ein.'); return; }
  closeMenu(); if(await liveJoin(p)) inp.value='';
});

$('liveBadge').onclick=e=>{ e.stopPropagation(); const c=liveCur(); if(c&&c.own) openLiveDlg(); else toast(c&&c.role==='view'?'Du siehst dieses Live-Board nur an.':'Du zeichnest live mit.'); };
$('boardName').addEventListener('change',()=>{ const c=liveCur(); if(c&&c.role!=='view'&&LV.joined){ liveSend({t:'ops',up:[],del:[],nm:curBoard().name}); liveSave(1500); } });

