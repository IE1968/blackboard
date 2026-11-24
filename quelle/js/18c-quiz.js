/* ---------- Live-Quiz: Fragen der Quizfolien auf dem Handy beantworten ----------
   Beamer (Präsentation): startet das Quiz, zeigt QR-Code, Link und Code, zählt Antworten, vergibt Punkte, zeigt Balken und Rangliste.
   Handy: öffnet den Link (#quiz=CODE), gibt einen Spitznamen ein und tippt die Antwort.
   Alles läuft über einen Echtzeit-Kanal (Supabase Broadcast). Es wird nichts in einer Datenbank gespeichert. */
const QZ_ABC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789', QZ_RE=/^[A-HJ-NP-Z2-9]{6}$/;
const QZ_COL=['#ee6a57','#3b6fe8','#e9b52f','#22a88c','#6a55e0','#e0628f'], QZ_INK=['#18181a','#ffffff','#18181a','#18181a','#ffffff','#18181a'];   /* Schrift je Farbe: Kontrast mind. 4,5 : 1 */
function qzCode(){ const u=new Uint8Array(6); crypto.getRandomValues(u); return [...u].map(x=>QZ_ABC[x%QZ_ABC.length]).join(''); }
function qzLink(code){ return liveBase()+'#quiz='+code; }
function qzPlain(t){ return String(t||'').replace(/\s+/g,' ').trim().slice(0,300); }

/* Verbindung zu einem Quiz-Kanal; meldet Nachrichten und den Verbindungsstand */
function qzConn(code,onMsg,onState){
  const c={topic:'realtime:skizix-quiz-'+code,ws:null,joined:false,ref:0,joinRef:null,hb:null,retry:null,tries:0,closed:false};
  c.send=m=>{ if(!c.joined) return false; try{ c.ws.send(JSON.stringify({topic:c.topic,event:'broadcast',payload:{type:'broadcast',event:'q',payload:m},ref:String(++c.ref),join_ref:c.joinRef})); return true; }catch(e){ return false; } };
  c.open=()=>{
    if(c.closed) return; let ws; try{ ws=new WebSocket(SB_URL.replace(/^http/,'ws')+'/realtime/v1/websocket?apikey='+encodeURIComponent(SB_KEY)+'&vsn=1.0.0'); }catch(e){ c.again(); return; }
    c.ws=ws; c.joined=false;
    ws.onopen=()=>{ if(ws!==c.ws) return; c.joinRef=String(++c.ref);
      ws.send(JSON.stringify({topic:c.topic,event:'phx_join',payload:{config:{broadcast:{self:false,ack:false},presence:{key:''},private:false}},ref:c.joinRef,join_ref:c.joinRef}));
      clearInterval(c.hb); c.hb=setInterval(()=>{ try{ ws.send(JSON.stringify({topic:'phoenix',event:'heartbeat',payload:{},ref:String(++c.ref)})); }catch(e){} },25000); };
    ws.onmessage=e=>{ let m=null; try{ m=JSON.parse(e.data); }catch(_){ return; } if(!m||ws!==c.ws||m.topic!==c.topic) return;
      if(m.event==='phx_reply'&&m.ref===c.joinRef){ if(m.payload&&m.payload.status==='ok'){ c.joined=true; c.tries=0; onState(true); } else { try{ ws.close(); }catch(_){} } return; }
      if(m.event==='broadcast'&&m.payload&&m.payload.event==='q'&&m.payload.payload&&typeof m.payload.payload==='object') onMsg(m.payload.payload); };
    ws.onclose=()=>{ if(ws!==c.ws) return; c.ws=null; c.joined=false; clearInterval(c.hb); onState(false); c.again(); };
    ws.onerror=()=>{};
  };
  c.again=()=>{ if(c.closed) return; clearTimeout(c.retry); c.tries++; c.retry=setTimeout(c.open,Math.min(15000,700*Math.pow(2,Math.min(c.tries,4)))); };
  c.close=()=>{ c.closed=true; clearTimeout(c.retry); clearInterval(c.hb); const w=c.ws; c.ws=null; try{ w&&w.close(); }catch(e){} };
  c.open(); return c;
}

/* ================= Beamer ================= */
let QH=null;   /* {code,c,players:Map(pid→{name,score}),ans:Map(qid→Map(pid→{a,t})),t0:Map(qid→Zeit),pts:Map(qid→Map(pid→Punkte)),rank,mini} */
function qzQuestion(){
  if(!pres||pres.whole) return null; const fid=pres.ids[pres.i]; if(!fid) return null;
  const its=doc.items.filter(i=>i.fr===fid&&i.kind!=='frame'), ans=its.filter(i=>i.kind==='check').sort((a,b)=>a.y-b.y||a.x-b.x);
  if(!ans.length) return null;
  const tq=its.filter(i=>i.type==='shape'&&i.kind!=='check'&&qzPlain(i.text)).sort((a,b)=>a.y-b.y||a.x-b.x)[0];
  return {id:fid,text:tq?qzPlain(tq.text):'',a:ans.map(i=>qzPlain(i.text)||'–').slice(0,12),ok:ans.map((i,k)=>i.ok?k:-1).filter(k=>k>=0),items:ans.slice(0,12)};
}
function qzSolved(q){ return !!(pres&&q&&pres.shown.has(q.id)); }
function qzScore(q){   /* einmal je Frage: richtige Antwort 500–1000 Punkte, je schneller, desto mehr */
  if(QH.pts.has(q.id)) return; const P=new Map(), A=QH.ans.get(q.id)||new Map(), t0=QH.t0.get(q.id)||Date.now();
  if(!q.ok.length){ QH.pts.set(q.id,P); return; }   /* keine richtige Antwort markiert: Umfrage, keine Punkte */
  for(const [pid,x] of A){ if(!q.ok.includes(x.a)) { P.set(pid,0); continue; } const p=500+Math.round(500*Math.max(0,1-(x.t-t0)/20000)); P.set(pid,p); const pl=QH.players.get(pid); if(pl) pl.score+=p; }
  QH.pts.set(q.id,P);
}
function qzRanking(){ return [...QH.players.entries()].map(([pid,p])=>({pid,name:p.name,score:p.score})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)); }
function qzHostState(){
  if(!QH) return null; const q=qzQuestion(), sol=qzSolved(q);
  if(q&&!sol&&!QH.t0.has(q.id)) QH.t0.set(q.id,Date.now());
  if(q&&sol) qzScore(q);
  const A=q?QH.ans.get(q.id):null, sc={}; for(const [pid,p] of QH.players) sc[pid]=p.score;
  const s={t:'s',n:QH.players.size,sc,end:false};
  if(q){ s.q={id:q.id,text:q.text,a:q.a}; s.poll=!q.ok.length; s.open=!sol&&!QH.pts.has(q.id); s.cnt=A?A.size:0;
    if(sol){ s.sol=q.ok; const P=QH.pts.get(q.id); if(P){ s.pts={}; for(const [pid,v] of P) s.pts[pid]=v; } s.votes=q.a.map((_,k)=>{ let n=0; if(A) for(const x of A.values()) if(x.a===k) n++; return n; }); } }
  if(QH.rank) s.rank=qzRanking().slice(0,10).map(r=>[r.name,r.score]);
  return s;
}
function qzSend(){ if(!QH) return; clearTimeout(QH.sendT); QH.sendT=setTimeout(()=>{ if(!QH||!pres) return; const s=qzHostState(); if(s) QH.c.send(s); qzHostUI(); presRender(); },120); }
function qzHostMsg(m){
  if(!QH||!m||typeof m.pid!=='string'||!/^[A-Za-z0-9]{6,40}$/.test(m.pid)) return;
  const name=String(m.name||'').replace(/\s+/g,' ').trim().slice(0,24)||'Gast';
  if(m.t==='j'||m.t==='a'){ const p=QH.players.get(m.pid); if(p) p.name=name; else { if(QH.players.size>=300) return; QH.players.set(m.pid,{name,score:0}); } }
  if(m.t==='a'){ const q=qzQuestion(); if(!q||m.q!==q.id||qzSolved(q)||QH.pts.has(q.id)) { qzSend(); return; }
    const k=+m.a; if(!Number.isInteger(k)||k<0||k>=q.a.length) return;
    if(!QH.ans.has(q.id)) QH.ans.set(q.id,new Map()); const A=QH.ans.get(q.id); if(!A.has(m.pid)) A.set(m.pid,{a:k,t:Date.now()}); }
  qzSend();
}
function qzStart(){
  if(!pres) return; if(!liveOk()){ toast('Das Live-Quiz braucht eine Internetverbindung.'); return; }
  if(QH){ QH.mini=!QH.mini; qzHostUI(); return; }
  const code=qzCode();
  QH={code,players:new Map(),ans:new Map(),t0:new Map(),pts:new Map(),rank:false,mini:false,on:false};
  QH.c=qzConn(code,qzHostMsg,on=>{ if(!QH) return; QH.on=on; if(on) qzSend(); qzHostUI(); });
  QH.tick=setInterval(()=>{ if(QH&&QH.on){ const s=qzHostState(); if(s) QH.c.send(s); } },3000);
  qzHostUI(); presBar();
}
function qzStop(){
  if(!QH) return; const h=QH; QH=null; try{ h.c.send({t:'s',end:true,n:h.players.size,sc:Object.fromEntries([...h.players].map(([p,x])=>[p,x.score])),rank:[...h.players.values()].sort((a,b)=>b.score-a.score).slice(0,10).map(p=>[p.name,p.score])}); }catch(e){}
  clearInterval(h.tick); clearTimeout(h.sendT); setTimeout(()=>h.c.close(),300);
  const el=$('qzHost'); if(el) el.remove(); const r=$('qzRank'); if(r) r.remove(); if(pres){ presRender(); presBar(); }
}
function qzHostUI(){
  let el=$('qzHost'); if(!QH||!pres){ if(el) el.remove(); return; }
  if(!el){ el=document.createElement('div'); el.id='qzHost'; presEl.appendChild(el);
    el.addEventListener('pointerdown',e=>e.stopPropagation()); el.addEventListener('pointerup',e=>e.stopPropagation());
    el.addEventListener('click',e=>{ const b=e.target.closest('[data-qz]'); if(!b) return; const a=b.dataset.qz;
      if(a==='mini'){ QH.mini=!QH.mini; qzHostUI(); } else if(a==='rank'){ QH.rank=!QH.rank; qzSend(); qzHostUI(); } else if(a==='end'){ qzStop(); } }); }
  const q=qzQuestion(), A=q?QH.ans.get(q.id):null, n=QH.players.size, cnt=A?A.size:0, sol=qzSolved(q);
  if(sol&&q&&QH.autoMini!==q.id){ QH.autoMini=q.id; QH.mini=true; }   /* bei der Lösung Platz für die Folie machen */
  const stat=`<b>${n}</b> dabei`+(q?` · <b>${cnt}</b> ${cnt===1?'Antwort':'Antworten'}${!q.ok.length?' · Umfrage':''}${sol?' · Ergebnis':''}`:'');
  el.className=QH.mini?'mini':'';
  if(QH.mini) el.innerHTML=`<button data-qz="mini" class="qzPill" title="Mitmach-Infos zeigen"><span class="qzCode">${QH.code}</span><span>${stat}</span>${QH.on?'':'<i class="qzOff">verbinde …</i>'}</button><button data-qz="rank" class="qzPill" aria-pressed="${QH.rank}">Rangliste</button>`;
  else el.innerHTML=`<div class="qzHead"><span>Live-Quiz</span><button data-qz="mini" title="Verkleinern" aria-label="Verkleinern">–</button></div>
    <div class="qzQr">${QR.svg(qzLink(QH.code))}</div>
    <div class="qzJoin">Mitmachen: QR-Code scannen<br>oder <b>${esc(qzLink(QH.code).replace(/^https?:\/\//,''))}</b></div>
    <div class="qzCodeBig">${QH.code}</div>
    <div class="qzStat">${stat}${QH.on?'':' · <i class="qzOff">verbinde …</i>'}</div>
    <div class="qzBtns"><button data-qz="rank" aria-pressed="${QH.rank}">Rangliste</button><button data-qz="end">Beenden</button></div>`;
  let rk=$('qzRank');
  if(QH.rank){ if(!rk){ rk=document.createElement('div'); rk.id='qzRank'; presEl.appendChild(rk); rk.addEventListener('pointerdown',e=>e.stopPropagation()); rk.addEventListener('pointerup',e=>e.stopPropagation()); rk.addEventListener('click',()=>{ QH.rank=false; qzSend(); qzHostUI(); }); }
    const R=qzRanking().slice(0,10);
    rk.innerHTML=`<h2>Rangliste</h2>`+(R.length?`<ol>`+R.map((r,i)=>`<li><span class="qzPl">${i+1}</span><span class="qzNm">${esc(r.name)}</span><b>${r.score}</b></li>`).join('')+`</ol>`:'<p>Noch niemand dabei.</p>')+`<small>Tippen zum Schließen</small>`; }
  else if(rk) rk.remove();
}
/* Balken auf der Folie: nach „Lösung“ zeigt jede Antwort, wie viele sie gewählt haben */
function qzBars(){
  if(!QH||!pres) return; const q=qzQuestion(); if(!q||!qzSolved(q)) return; const A=QH.ans.get(q.id); const tot=A?A.size:0;
  const poll=!q.ok.length;
  let h=''; q.items.forEach((it,k)=>{ let n=0; if(A) for(const x of A.values()) if(x.a===k) n++; const sh=tot?n/tot:0, ok=q.ok.includes(k), bh=Math.max(4,it.h*0.14), x0=it.x+(textBox(it).pad||0),
    bw=n?Math.max(bh,(it.x+it.w-x0)*0.8*sh):0, c=poll?'#5b8cf5':ok?'#22a88c':'#8d8d93', fs=Math.max(12,it.h*0.34), y=it.y+it.h-bh*1.3;
    if(bw) h+=`<rect x="${r(x0)}" y="${r(y-bh/2)}" width="${r(bw)}" height="${r(bh)}" rx="${r(bh/2)}" fill="${c}" opacity=".9"/>`;
    h+=`<text x="${r(x0+bw+(bw?fs*0.4:0))}" y="${r(y+fs*0.35)}" font-family="${FONT}" font-size="${r(fs)}" font-weight="700" fill="${c}">${n}</text>`; });
  const g=document.createElementNS('http://www.w3.org/2000/svg','g'); g.id='qzBars'; g.innerHTML=h; const b=$('presBody'); if(b) b.appendChild(g);
}
{ const _pr=presRender; presRender=function(f){ _pr(f); qzBars(); }; }
{ const _pb=presBar; presBar=function(){ _pb(); const b=$('presQuiz'); if(b&&pres){ b.hidden=!pres.quiz||pres.whole; b.setAttribute('aria-pressed',!!QH); } if(QH) qzSend(); }; }
{ const _sp=stopPres; stopPres=function(){ qzStop(); _sp(); }; }
$('presQuiz').onclick=()=>qzStart();

/* ================= Handy ================= */
let QP=null;   /* {code,pid,name,c,s(letzter Stand),my:Map(qid→Antwort),on} */
function qzMe(){ try{ return JSON.parse(localStorage.getItem('skizix-quiz-ich'))||{}; }catch(e){ return {}; } }
function qzPlayOpen(code){
  if(QP&&QP.code===code) return; qzPlayClose(true);
  const me=qzMe(); let pid=me.pid; if(!pid||!/^[A-Za-z0-9]{6,40}$/.test(pid)){ pid=liveNewKey().slice(0,16); }
  QP={code,pid,name:me.code===code?me.name||'':'',c:null,s:null,my:new Map(),on:false,joined:false};
  let el=$('qzPlay'); if(!el){ el=document.createElement('div'); el.id='qzPlay'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); el.setAttribute('aria-label','Live-Quiz'); document.body.appendChild(el);
    el.addEventListener('click',qzPlayClick); el.addEventListener('submit',e=>{ e.preventDefault(); qzPlayJoin(); }); }
  el.hidden=false; document.body.classList.add('qz-play');
  if(code&&QP.name) qzPlayJoin(); else qzPlayUI();
}
function qzPlayClose(silent){
  if(!QP) return; const p=QP; QP=null; if(p.c) p.c.close(); clearInterval(p.ping);
  const el=$('qzPlay'); if(el){ el.hidden=true; el.innerHTML=''; } document.body.classList.remove('qz-play');
  if(!silent&&/[#&]quiz/.test(location.hash)) history.replaceState(null,'',location.pathname+location.search);
}
function qzPlayJoin(){
  if(!QP) return; const el=$('qzPlay'), ci=el.querySelector('#qzIn'), ni=el.querySelector('#qzName');
  if(ci){ const c=ci.value.toUpperCase().replace(/[^A-Z0-9]/g,''); if(!QZ_RE.test(c)){ qzPlayUI('Bitte den 6-stelligen Code vom Beamer eingeben.'); return; } QP.code=c; }
  if(ni){ const n=ni.value.replace(/\s+/g,' ').trim().slice(0,24); if(!n){ qzPlayUI('Bitte einen Spitznamen eingeben.'); return; } QP.name=n; }
  if(!QP.code||!QP.name){ qzPlayUI(); return; }
  try{ localStorage.setItem('skizix-quiz-ich',JSON.stringify({pid:QP.pid,name:QP.name,code:QP.code})); }catch(e){}
  QP.joined=true; if(!liveOk()){ qzPlayUI('Keine Verbindung möglich.'); return; }
  const p=QP; p.c=qzConn(p.code,m=>{ if(QP!==p||m.t!=='s') return; p.s=m; p.seen=Date.now(); qzPlayUI(); },on=>{ if(QP!==p) return; p.on=on; if(on) p.c.send({t:'j',pid:p.pid,name:p.name}); qzPlayUI(); });
  p.ping=setInterval(()=>{ if(QP===p&&p.on) p.c.send({t:'j',pid:p.pid,name:p.name}); qzPlayUI(); },15000);
  qzPlayUI();
}
function qzPlayClick(e){
  const b=e.target.closest('[data-qa],[data-qp]'); if(!b||!QP) return;
  if(b.dataset.qp==='leave'){ qzPlayClose(); return; }
  if(b.dataset.qp==='name'){ QP.joined=false; if(QP.c){ QP.c.close(); QP.c=null; } clearInterval(QP.ping); qzPlayUI(); return; }
  const s=QP.s, k=+b.dataset.qa; if(!s||!s.q||!s.open||QP.my.has(s.q.id)) return;
  QP.my.set(s.q.id,k); QP.c.send({t:'a',pid:QP.pid,name:QP.name,q:s.q.id,a:k}); qzPlayUI();
}
function qzPlayUI(err){
  const el=$('qzPlay'); if(!el||!QP) return; const s=QP.s;
  const head=`<div class="qpTop"><span class="qpLogo">Live-Quiz</span>${QP.joined?`<span class="qpMe">${esc(QP.name)}${s&&s.sc&&s.sc[QP.pid]!=null?` · <b>${s.sc[QP.pid]}</b> P.`:''}</span>`:''}<button data-qp="leave" class="qpX" aria-label="Quiz verlassen" title="Quiz verlassen">✕</button></div>`;
  let body='';
  if(!QP.joined){
    body=`<form class="qpForm"><h1>Mitmachen</h1>`+(QP.code?`<p>Quiz <b>${QP.code}</b></p>`:`<label>Code vom Beamer<input id="qzIn" inputmode="text" autocomplete="off" autocapitalize="characters" maxlength="8" placeholder="z. B. K7M4QP"></label>`)+
      `<label>Dein Spitzname<input id="qzName" maxlength="24" autocomplete="nickname" value="${esc(QP.name||'')}" placeholder="z. B. Sam"></label>${err?`<p class="qpErr">${esc(err)}</p>`:''}<button type="submit" class="qpGo">Los geht's</button></form>`;
  } else if(!s){
    body=`<div class="qpWait"><div class="qpSpin"></div><p>${QP.on?'Verbunden. Warte auf den Beamer …':'Verbinde …'}</p>${err?`<p class="qpErr">${esc(err)}</p>`:''}</div>`;
  } else if(s.end){
    const R=s.rank||[], pl=R.findIndex(x=>x[0]===QP.name);
    body=`<div class="qpEnd"><h1>Quiz beendet</h1><p class="qpBig">${s.sc&&s.sc[QP.pid]!=null?s.sc[QP.pid]:0} Punkte</p>${pl>=0?`<p>Platz ${pl+1}</p>`:''}<button data-qp="leave" class="qpGo">Schließen</button></div>`;
  } else if(s.q){
    const mine=QP.my.has(s.q.id)?QP.my.get(s.q.id):null, sol=Array.isArray(s.sol);
    let info='';
    if(sol&&s.poll) info=mine==null?`<p class="qpRes">Keine Antwort abgegeben</p>`:`<p class="qpRes ok">Danke für deine Stimme!</p><p class="qpRes">Das Ergebnis siehst du vorne.</p>`;
    else if(sol){ const p=s.pts&&s.pts[QP.pid]; info=mine==null?`<p class="qpRes">Keine Antwort abgegeben</p>`:(p>0?`<p class="qpRes ok">Richtig! +${p}</p>`:`<p class="qpRes no">Leider falsch</p>`); }
    else if(mine!=null) info=`<p class="qpRes">Antwort gesendet – warte auf die Lösung</p>`;
    else if(!s.open) info=`<p class="qpRes">Abstimmung geschlossen</p>`;
    body=`<div class="qpQ">${s.q.text?`<h1>${esc(s.q.text)}</h1>`:''}<div class="qpAns">`+s.q.a.map((t,k)=>{ const on=mine===k, ok=sol&&s.sol.includes(k);
      if(sol&&s.poll) return `<button data-qa="${k}" style="--c:${QZ_COL[k%QZ_COL.length]};--t:${QZ_INK[k%QZ_INK.length]}" class="${on?'on':''}" disabled><span class="qpK">${String.fromCharCode(65+k)}</span><span>${esc(t)}</span>${s.votes?`<i>${s.votes[k]}</i>`:''}</button>`;
      return `<button data-qa="${k}" style="--c:${QZ_COL[k%QZ_COL.length]};--t:${QZ_INK[k%QZ_INK.length]}" class="${on?'on ':''}${ok?'ok ':''}${sol&&!ok?'dim ':''}"${!s.open||mine!=null?' disabled':''}><span class="qpK">${String.fromCharCode(65+k)}</span><span>${esc(t)}</span>${ok?'<i>✓</i>':''}</button>`; }).join('')+`</div>${info}</div>`;
  } else body=`<div class="qpWait"><p class="qpBig">Du bist dabei!</p><p>Warte auf die nächste Frage …</p><button data-qp="name" class="qpLink">Namen ändern</button></div>`;
  const off=QP.joined&&!QP.on?`<div class="qpOff">Verbindung unterbrochen – verbinde neu …</div>`:'';
  const f=document.activeElement&&document.activeElement.id, val=f&&el.querySelector('#'+f)?el.querySelector('#'+f).value:null;
  el.innerHTML=head+off+`<main>${body}</main>`;
  if(f&&val!=null&&el.querySelector('#'+f)){ const i=el.querySelector('#'+f); i.value=val; i.focus(); }
  else if(!QP.joined){ const i=el.querySelector('#qzIn')||el.querySelector('#qzName'); if(i) setTimeout(()=>{ try{ i.focus(); }catch(e){} },50); }
}
function qzFromHash(){
  const m=/[#&]quiz(?:=([A-Za-z0-9]{0,8}))?(?:&|$)/.exec(location.hash); if(!m) return;
  const c=(m[1]||'').toUpperCase(); qzPlayOpen(QZ_RE.test(c)?c:'');
}
window.addEventListener('hashchange',qzFromHash);
/* Beim Mitmachen gehören Tastatur und Einfügen dem Quiz, nicht dem Board dahinter */
for(const ev of ['keydown','keyup','paste']) document.addEventListener(ev,e=>{ if(QP&&$('qzPlay')&&!$('qzPlay').hidden) e.stopImmediatePropagation(); },true);
setTimeout(qzFromHash,0);
