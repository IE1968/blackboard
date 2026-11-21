/* ---------- Beispiel und Start ---------- */
function exampleDoc(){
  const d={items:[],n:0}, id=()=>'i'+(++d.n);
  const S=(kind,x,y,text,o)=>{ const k=KINDS[kind],s=Object.assign({id:id(),type:'shape',kind,x,y,w:k.w,h:k.h,text:text||'',fill:k.fill||'#ffffff',stroke:INK,sw:2},o||{}); d.items.push(s); return s.id; };
  const C=(from,to,text,o)=>d.items.push(Object.assign({id:id(),type:'conn',from,to,p1:{x:0,y:0},p2:{x:0,y:0},text:text||'',stroke:INK,sw:2,style:'ortho',arrow:true,dash:false},o||{}));
  S('pool',40,40,'Urlaubsantrag',{w:900,h:320,fill:'#e3e8ea'});
  const st=S('evstart',106,180,'Urlaub\ngeplant',{fill:'#d3f0dc'});
  const a=S('round',190,160,'Antrag ausfüllen');
  const b=S('round',380,160,'Antrag prüfen',{fill:'#cfe8ff'});
  const g=S('gwx',570,175,'Genehmigt?');
  const y=S('round',700,80,'Urlaub eintragen',{fill:'#d3f0dc'});
  const n=S('round',700,240,'Absage begründen',{fill:'#ffd9c7'});
  const e1=S('evend',880,100,''), e2=S('evend',880,260,'');
  C(st,a); C(a,b); C(b,g); C(g,y,'Ja'); C(g,n,'Nein'); C(y,e1); C(n,e2);
  S('note',40,390,'Beispiel: Formen anklicken und verschieben, Doppelklick ändert den Text.',{w:230,h:90});
  return d;
}
function start(data){
  loadBoards();
  const hot=data&&data.doc?cleanDoc(data.doc):null;
  doc=hot||storedDoc(boards.cur)||exampleDoc(); fitTexts(); hist=[]; hi=-1; commit(); setTool('select'); render(); if(isNewer(doc)) setTimeout(newerWarn,600);
  $('boardName').value=curBoard().name;
  if(data&&data.view){ view=data.view; applyView(); } else fit();
  liveFromHash(); liveBadge(); liveViewMode(); ktStart();
}
try{ window.claude&&window.claude.hot&&window.claude.hot.snapshot&&window.claude.hot.snapshot(()=>({doc,view})); }catch(e){}
storeInit().then(()=>{ if(window.claude&&window.claude.hot&&window.claude.hot.ready) window.claude.hot.ready(start); else start((window.claude&&window.claude.hot&&window.claude.hot.data)||{}); });
getDl();
/* Schrift ist erst kurz nach dem Start bereit: danach neu zeichnen, damit Textbreiten stimmen */
if(document.fonts&&document.fonts.load) Promise.all(["400","500","600"].map(w=>document.fonts.load(w+" 14px 'Roboto Mono'"))).then(()=>{ renderPal(); fitHeads(); if(fitTexts()){ hist[hi]=mkSnap(doc,hist[hi]); persist(); } render(); }).catch(()=>{});
if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0) navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
