/* ---------- Palette ---------- */
function iconFor(kind,W,H){
  const d=KINDS[kind];
  if(d.line){ let v=`<svg viewBox="0 0 ${W} ${H}"><path d="M4 ${H-6}L${W-(d.line==='arrow'?9:4)} ${d.line==='arrow'?9:6}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>${d.line==='arrow'?`<polygon points="${W-3},5 ${W-13},7 ${W-7},14" fill="currentColor"/>`:d.line==='msg'?`<polygon points="${W-3},5 ${W-13},7 ${W-7},14" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="5" cy="${H-6}" r="2.6" fill="none" stroke="currentColor" stroke-width="1.4"/>`:''}</svg>`; return d.dash?v.replace('stroke-width="1.8"','stroke-width="1.8" stroke-dasharray="4 3"'):v; }
  if(kind==='frame') return `<svg viewBox="0 0 ${W} ${H}"><rect x="3" y="2" width="${W-6}" height="${H-4}" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="4 3"/><text x="${W/2}" y="${H*0.68}" text-anchor="middle" font-size="${H*0.5}" font-weight="600" fill="currentColor">1</text></svg>`;
  if(kind==='mindmap') return `<svg viewBox="0 0 ${W} ${H}"><g fill="none" stroke="currentColor" stroke-width="1.500"><path d="M${W/2} ${H/2}L8 5M${W/2} ${H/2}L${W-8} 5M${W/2} ${H/2}L8 ${H-5}M${W/2} ${H/2}L${W-8} ${H-5}"/><ellipse cx="${W/2}" cy="${H/2}" rx="8" ry="5" fill="var(--panel,#101617)"/><rect x="2" y="2" width="11" height="6" rx="2" fill="var(--panel,#101617)"/><rect x="${W-13}" y="2" width="11" height="6" rx="2" fill="var(--panel,#101617)"/><rect x="2" y="${H-8}" width="11" height="6" rx="2" fill="var(--panel,#101617)"/><rect x="${W-13}" y="${H-8}" width="11" height="6" rx="2" fill="var(--panel,#101617)"/></g></svg>`;
  if(kind==='quiz') return `<svg viewBox="0 0 ${W} ${H}"><rect x="3" y="2" width="${W-6}" height="${H-4}" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="4 3"/><path d="M9 8h${W-18}" stroke="currentColor" stroke-width="2.2" fill="none"/>${[13,18,23].map(y=>`<rect x="9" y="${y-2}" width="4" height="4" fill="none" stroke="currentColor" stroke-width="1"/><path d="M16 ${y}h${W-30}" stroke="currentColor" stroke-width="1.2" fill="none"/>`).join('')}</svg>`;
  if(kind==='check') return `<svg viewBox="0 0 ${W} ${H}"><rect x="5" y="${H/2-6}" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 ${H/2}l3 3 5-7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M22 ${H/2}h${W-28}" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>`;
  if(kind==='poollanes') return `<svg viewBox="0 0 ${W} ${H}"><rect x="2" y="3" width="${W-4}" height="${H-6}" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 3v${H-6}M14 3v${H-6}M14 ${H/2}H${W-2}" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`;
  if(kind==='checklist') return `<svg viewBox="0 0 ${W} ${H}">${[7,14,21].map((y,i)=>`<rect x="4" y="${y-2.6}" width="5.2" height="5.2" rx="1.2" fill="${i===0?'currentColor':'none'}" stroke="currentColor" stroke-width="1.4"/><path d="M13 ${y}h${W-20}" stroke="currentColor" stroke-width="1.800" fill="none"${i===0?' opacity=".45"':''}/>`).join('')}</svg>`;
  if(kind==='bullets') return `<svg viewBox="0 0 ${W} ${H}">${[7,14,21].map(y=>`<circle cx="7" cy="${y}" r="1.900" fill="currentColor"/><path d="M13 ${y}h${W-20}" stroke="currentColor" stroke-width="1.800" fill="none"/>`).join('')}</svg>`;
  if(kind==='image') return `<svg viewBox="0 0 ${W} ${H}"><rect x="6" y="3" width="${W-12}" height="${H-6}" rx="2" fill="none" stroke="currentColor" stroke-width="1.600"/><circle cx="${W*0.36}" cy="${H*0.36}" r="2.600" fill="currentColor"/><path d="M8 ${H-5}l${W*0.22} -${H*0.38} ${W*0.14} ${H*0.2} ${W*0.12} -${H*0.12} ${W*0.2} ${H*0.3}" fill="none" stroke="currentColor" stroke-width="1.600" stroke-linejoin="round"/></svg>`;
  if(kind==='text') return `<svg viewBox="0 0 ${W} ${H}"><text x="${W/2}" y="${H*0.75}" text-anchor="middle" font-size="${H*0.7}" font-weight="600" fill="currentColor">Aa</text></svg>`;
  if(d.tpl){
    const one=kind==='ertable'||kind==='umlclass'||kind==='umliface', n=one?1:kind==='scrum'?5:3, tw=one?W*0.55:W;
    const fr=kind==='table'?[1/3,1/3,1/3]:kind==='ertable'?[0.28,0.24,0.24,0.24]:kind==='umlclass'?[0.3,0.35,0.35]:kind==='umliface'?[0.42,0.58]:[0.24,0.76];
    let b=shapeBody({kind:'table',w:tw,h:H,colW:Array(n).fill(tw/n),rowH:fr.map(v=>v*H),fill:'none',stroke:'currentColor',sw:1.6});
    const cw=tw/n, cd=(c,y)=>`<rect x="${c*cw+1.5}" y="${y}" width="${cw-3}" height="${H*0.17}" rx="1" fill="currentColor" opacity=".55"/>`;
    if(kind==='kanban') b+=cd(0,H*0.32)+cd(0,H*0.56)+cd(1,H*0.32)+cd(2,H*0.32);
    if(kind==='scrum') b+=cd(0,H*0.32)+cd(0,H*0.56)+cd(1,H*0.32)+cd(2,H*0.32)+cd(3,H*0.32)+cd(4,H*0.32);
    return `<svg viewBox="${-(W-tw)/2-1} -1 ${W+2} ${H+2}">${b}</svg>`;
  }
  const sc=Math.min(W/d.w,H/d.h), w=d.w*sc, h=d.h*sc;
  const body=shapeBody({kind:d.as||kind,w,h,fill:kind==='note'?'#f4d95a':'none',stroke:'currentColor',sw:1.6});
  return `<svg viewBox="${-(W-w)/2-1} ${-(H-h)/2-1} ${W+2} ${H+2}">${body}</svg>`;
}
/* Anzeige: Größe der Bedienoberfläche (100/125/150 %) und hoher Kontrast; die Layout-Stufen rechnen mit der gewählten Größe */
/* PC = Maus als Hauptzeiger; Smartphones und Tablets werden mit dem Finger bedient */
const isPC=!!(window.matchMedia&&matchMedia('(pointer:fine)').matches&&matchMedia('(hover:hover)').matches);
const pcScale=()=>isPC&&innerWidth/1.25>1000&&innerHeight/1.25>500?1.25:1;   /* am PC 125 %, sofern der Bildschirm groß genug ist */
let uiCfg={scale:pcScale(),hc:false,snap:true,grid:true,theme:'blue',app:'dark',bar:'float',press:'normal',finger:true,fingerSet:false};
try{ const u=JSON.parse(localStorage.getItem('blackboard-ui')); if(u) uiCfg={scale:u.scaleSet&&[1,1.25,1.5].includes(u.scale)?u.scale:pcScale(),scaleSet:!!u.scaleSet&&[1,1.25,1.5].includes(u.scale),hc:!!u.hc,snap:u.snap!==false,grid:u.grid!==false,theme:'blue',app:['dark','light','auto'].includes(u.app)?u.app:'dark',bar:u.bar==='top'?'top':'float',barSet:!!u.barSet,press:['off','soft','normal','strong'].includes(u.press)?u.press:'normal',finger:u.finger!==false,fingerSet:!!u.fingerSet}; }catch(e){}
/* Oberfläche hell oder dunkel (pro Gerät); „auto“ folgt der Einstellung des Betriebssystems */
const mqLight=window.matchMedia?matchMedia('(prefers-color-scheme: light)'):null;
function appLight(){ return uiCfg.app==='light'||(uiCfg.app==='auto'&&!!(mqLight&&mqLight.matches)); }
function applyAppTheme(){
  const l=appLight(); document.body.classList.toggle('light',l);
  const m=document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute('content',l?'#ffffff':'#18181a');
  document.querySelectorAll('#appRow button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.app===uiCfg.app));
}
if(mqLight){ const f=()=>{ if(uiCfg.app==='auto') applyAppTheme(); }; if(mqLight.addEventListener) mqLight.addEventListener('change',f); else if(mqLight.addListener) mqLight.addListener(f); }
function isCompactNow(){ return innerWidth/uiCfg.scale<=1000||innerHeight/uiCfg.scale<=500; }
function applyLayout(){
  const w=innerWidth/uiCfg.scale, c=document.body.classList; c.toggle('touch',!isPC);
  document.documentElement.style.setProperty('--ui',uiCfg.scale); c.toggle('hc',uiCfg.hc);
  c.toggle('compact',isCompactNow()); c.toggle('nolabels',w<=1100); c.toggle('narrow',w<=480); c.toggle('tiny',w<=400); c.toggle('midwide',w>=640);
  document.querySelectorAll('#uiRow button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===uiCfg.scale));
  $('hcBtn').setAttribute('aria-pressed',uiCfg.hc); $('snapBtn').setAttribute('aria-pressed',uiCfg.snap);
  applyAppTheme(); applyTheme(); fitBar(); if(typeof placeProps==='function'&&propsEl) placeProps();
  document.querySelectorAll('#barRow button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.bar===uiCfg.bar));
}
/* Kopfleiste: Passt sie nicht in die Breite, stufenweise verdichten, damit Live und Konto immer sichtbar bleiben */
function fitBar(){
  const c=document.body.classList, bar=document.querySelector('header .bar'); if(!bar) return;
  for(let i=1;i<=5;i++) c.remove('eng'+i);
  c.toggle('nolabels',innerWidth/uiCfg.scale<=1100);
  if(bar.scrollWidth>bar.clientWidth+1) c.add('nolabels');   /* Beschriftungen nur, wenn sie hineinpassen */
  for(let i=1;i<=5&&bar.scrollWidth>bar.clientWidth+1;i++) c.add('eng'+i);
}
addEventListener('load',fitBar);
function setUi(ch){ Object.assign(uiCfg,ch); try{ localStorage.setItem('blackboard-ui',JSON.stringify(uiCfg)); }catch(e){} applyLayout(); applyView(); }
applyLayout();
try{ const ps=JSON.parse(localStorage.getItem('blackboard-pal')); if(ps&&ps.open) palState=ps; }catch(e){}
{ const shut=!isPC||innerWidth/uiCfg.scale<=700; palState.closed=shut; palState.propsClosed=shut; palState.open={Allgemein:true}; }   /* beim Öffnen: am PC ausgeklappt, auf Smartphone und Tablet eingeklappt; nur „Allgemein“ aufgeklappt */
window.addEventListener('resize',applyLayout);
function savePal(){ try{ localStorage.setItem('blackboard-pal',JSON.stringify(palState)); }catch(e){} }
function renderPal(){
  document.querySelector('main').classList.toggle('pal-closed',!!palState.closed);
  const ph=$('palHandle'); ph.textContent=palState.closed?'›':'‹'; ph.setAttribute('aria-expanded',!palState.closed); ph.title=palState.closed?'Formenleiste ausklappen':'Formenleiste einklappen';
  palEl.innerHTML=`<div class="palSearch"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="palQ" type="search" placeholder="Form suchen" aria-label="Form suchen" autocomplete="off" spellcheck="false"></div><div class="palgrid" id="palFind" hidden></div><div class="palEmpty" id="palNone" hidden>Nichts gefunden</div>`+GROUPS.map(([name,kinds])=>`<button class="gh" data-g="${esc(name)}" aria-expanded="${!!palState.open[name]}"><span>${esc(name)}</span></button><div class="palgrid"${palState.open[name]?'':' hidden'}>`+
    (name==='Vorlagen'?`<button class="pal palbtn" data-tpl="1" title="Alle Vorlagen: SWOT, Eisenhower, Retro, Zeitstrahl und mehr" aria-label="Alle Vorlagen"><svg viewBox="0 0 44 28"><rect x="6" y="3" width="14" height="10" rx="1.500" fill="none" stroke="currentColor" stroke-width="1.600"/><rect x="24" y="3" width="14" height="10" rx="1.500" fill="currentColor" opacity=".55"/><rect x="6" y="15" width="14" height="10" rx="1.500" fill="currentColor" opacity=".55"/><rect x="24" y="15" width="14" height="10" rx="1.500" fill="none" stroke="currentColor" stroke-width="1.600"/></svg><span>Alle Vorlagen</span></button>`:'')+
    kinds.map(k=>`<button class="pal" data-kind="${k}" title="${KINDS[k].label.replace('-','')}" aria-label="${KINDS[k].label.replace('-','')}">${iconFor(k,44,28)}<span>${KINDS[k].label}</span></button>`).join('')+(name==='Präsentation'?`<button class="pal palbtn" data-slides="1" title="Folienübersicht: Vorschau aller Folien, Reihenfolge per Ziehen" aria-label="Folienübersicht"><svg viewBox="0 0 44 28"><rect x="3" y="7" width="11" height="14" rx="1.500" fill="none" stroke="currentColor" stroke-width="1.600"/><rect x="17" y="7" width="11" height="14" rx="1.500" fill="none" stroke="currentColor" stroke-width="1.600"/><rect x="31" y="7" width="11" height="14" rx="1.500" fill="none" stroke="currentColor" stroke-width="1.600"/></svg><span>Übersicht</span></button>`:'')+(name==='Präsentation'?`<button class="pal palbtn" data-play="1" title="Präsentation starten" aria-label="Präsentation starten"><svg viewBox="0 0 44 28"><path d="M16 5v18l15-9z" fill="currentColor"/></svg><span>Starten</span></button>`:'')+`</div>`).join('');
}
/* Suche über alle Formen: zeigt Treffer aus allen Gruppen, die Gruppen werden solange ausgeblendet */
let palQuery='';
function palFind(){
  const q=palQuery.trim().toLowerCase(), f=$('palFind'); palEl.classList.toggle('finding',!!q);
  if(!q){ f.hidden=true; f.innerHTML=''; $('palNone').hidden=true; return; }
  const norm=t=>t.replace(/-/g,'').toLowerCase(), seen=new Set(), hit=[];
  for(const [g,kinds] of GROUPS) for(const k of kinds){ if(seen.has(k)) continue; const l=norm(KINDS[k].label); if(l.includes(q)||norm(g).includes(q)){ seen.add(k); hit.push([g,k]); } }
  f.innerHTML=hit.map(([g,k])=>`<button class="pal" data-kind="${k}" data-grp="${esc(g)}" title="${KINDS[k].label.replace('-','')}" aria-label="${KINDS[k].label.replace('-','')}">${iconFor(k,44,28)}<span>${KINDS[k].label}</span></button>`).join('');
  f.querySelectorAll('.pal span').forEach(x=>{ x.textContent=x.textContent.replace(/-(?=[a-zäöüß])/g,'\u00ad'); });
  f.hidden=!hit.length; $('palNone').hidden=!!hit.length;
}
const _renderPal=renderPal;
renderPal=function(){ _renderPal(); palEl.querySelectorAll('.pal span').forEach(x=>{ x.textContent=x.textContent.replace(/-(?=[a-zäöüß])/g,'\u00ad'); }); const i=$('palQ'); if(i){ i.value=palQuery; i.oninput=()=>{ palQuery=i.value; palFind(); }; i.onkeydown=e=>{ if(e.key==='Escape'&&i.value){ e.preventDefault(); e.stopPropagation(); i.value=palQuery=''; palFind(); } }; } palFind(); };
renderPal();
palEl.addEventListener('click',e=>{
  if(e.target.closest('[data-play]')){ startPres(); return; }
  if(e.target.closest('[data-slides]')){ toggleSlides(); return; }
  if(e.target.closest('[data-tpl]')){ openTpl(); return; }
  const g=e.target.closest('.gh'); if(!g) return;
  palState.open[g.dataset.g]=!palState.open[g.dataset.g];
  savePal(); renderPal();
});
$('palHandle').onclick=()=>{ palState.closed=!palState.closed; savePal(); renderPal(); };
$('propsToggle').onclick=()=>{ palState.propsClosed=!palState.propsClosed; savePal(); applySides(); };
palState.optsClosed=!(location.hostname==='localhost'&&localStorage.getItem('skizix-test-opts'));   /* (nur Tests auf localhost: offen lassen) */ /* beim Öffnen der App zu; ein Klick auf ein Werkzeug öffnet sie */
$('optsToggle').onclick=()=>{ palState.optsClosed=!palState.optsClosed; savePal(); updateProps(); };
/* rechte Leiste = Datei (Boards, Live, Export …); auf und zu über den Griff oder den Knopf „Datei“ */
function applySides(){
  const shut=!!palState.propsClosed, pt=$('propsToggle');
  document.querySelector('main').classList.toggle('props-closed',shut);
  pt.textContent=shut?'‹':'›'; pt.setAttribute('aria-expanded',!shut); pt.title=shut?'Datei-Leiste ausklappen':'Datei-Leiste einklappen';
  if(!shut) renderBoardList();
}
palEl.addEventListener('click',e=>{   /* Tastatur: Eingabe oder Leertaste auf einem Symbol legt die Form in die Bildmitte */
  const b=e.target.closest('.pal'); if(!b||!b.dataset.kind||e.detail!==0) return;
  finishEdit(); const rc=svg.getBoundingClientRect(), o=(dropN++%6)*20; addShape(b.dataset.kind,toWorld(rc.left+rc.width/2+o,rc.top+rc.height/2+o),'key');
  say(KINDS[b.dataset.kind].label.replace('-','')+' hinzugefügt und ausgewählt.');
});
function say(t){ const el=$('sr'); el.textContent=''; setTimeout(()=>{ el.textContent=t; },30); }
function describe(it){
  if(it.type==='path') return 'Freihandstrich';
  if(it.type==='conn') return (headOf(it)==='none'?'Linie':'Pfeil')+(it.text?' „'+it.text+'“':'');
  const k=Object.keys(KINDS).find(x=>(KINDS[x].as||x)===it.kind&&!KINDS[x].tpl), nm=it.kind==='table'?'Tabelle':it.kind==='text'?'Text':k?KINDS[k].label.replace('-',''):'Form';
  return nm+(it.text?' „'+it.text.replace(/\s+/g,' ').slice(0,60)+'“':'');
}
svg.addEventListener('keydown',e=>{   /* Tab wandert durch die Elemente der Tafel */
  if(e.key!=='Tab'||e.ctrlKey||e.metaKey||e.altKey||!doc.items.length) return;
  const ids=doc.items.map(i=>i.id), cur=sel.size===1?ids.indexOf([...sel][0]):-1, nx=cur+(e.shiftKey?-1:1);
  if(cur===-1&&e.shiftKey) return;
  if(nx<0||nx>=ids.length){ sel.clear(); render(); return; }   /* am Ende: Tafel verlassen */
  e.preventDefault(); setTool('select'); sel=new Set([ids[nx]]); render();
  const it=byId(ids[nx]), b=bbox(it), rc=svg.getBoundingClientRect(), sx=view.x+(b.x+b.w/2)*view.k, sy=view.y+(b.y+b.h/2)*view.k;
  if(sx<40||sy<40||sx>rc.width-40||sy>rc.height-40){ view.x+=rc.width/2-sx; view.y+=rc.height/2-sy; applyView(); }
  say(describe(it)+', '+(nx+1)+' von '+ids.length+'.');
});
let dropN=0;
palEl.addEventListener('pointerdown',e=>{
  const b=e.target.closest('.pal'); if(!b||!b.dataset.kind||(e.pointerType==='mouse'&&e.button!==0)) return;
  const kind=b.dataset.kind,pid=e.pointerId,sx=e.clientX,sy=e.clientY; let ghost=null;
  const mv=ev=>{ if(ev.pointerId!==pid) return;
    if(!ghost&&Math.hypot(ev.clientX-sx,ev.clientY-sy)>7){ ghost=document.createElement('div'); ghost.id='ghost'; ghost.innerHTML=iconFor(kind,56,36)+'<div>'+esc(KINDS[kind].label.replace('-',''))+'</div>'; document.body.appendChild(ghost); }
    if(ghost){ ghost.style.left=ev.clientX+'px'; ghost.style.top=ev.clientY+'px'; ev.preventDefault(); } };
  const up=ev=>{ if(ev.pointerId!==pid) return;
    window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up); window.removeEventListener('pointercancel',up);
    const dragged=!!ghost; if(ghost) ghost.remove(); if(ev.type==='pointercancel') return;
    finishEdit(); const rc=svg.getBoundingClientRect();
    if(dragged){ if(ev.clientX>=rc.left&&ev.clientX<=rc.right&&ev.clientY>=rc.top&&ev.clientY<=rc.bottom) addShape(kind,toWorld(ev.clientX,ev.clientY),ev.pointerType); }
    else { const o=(dropN++%6)*20; addShape(kind,toWorld(rc.left+rc.width/2+o,rc.top+rc.height/2+o),ev.pointerType); } };
  window.addEventListener('pointermove',mv); window.addEventListener('pointerup',up); window.addEventListener('pointercancel',up);
});

