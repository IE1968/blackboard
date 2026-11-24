/* ---------- Beispiel und Start ---------- */
function exampleDoc(){
  const d={items:[],n:0}, id=()=>'i'+(++d.n);
  const S=(kind,x,y,text,o)=>{ const k=KINDS[kind],s=Object.assign({id:id(),type:'shape',kind,x,y,w:k.w,h:k.h,text:text||'',fill:k.fill||'#ffffff',stroke:INK,sw:2},o||{}); d.items.push(s); return s.id; };
  const C=(from,to,text,o)=>d.items.push(Object.assign({id:id(),type:'conn',from,to,p1:{x:0,y:0},p2:{x:0,y:0},text:text||'',stroke:INK,sw:2,style:'ortho',arrow:true,dash:false},o||{}));
  S('text',40,20,'Willkommen bei Skizix',{w:420,h:44,fs:28,bold:true,al:'left'});
  S('text',40,66,'Ein kleines Beispiel: alles lässt sich verschieben, ändern und löschen.',{w:760,h:28,fs:15,al:'left'});
  const i1=S('round',40,140,'Idee sammeln',{fill:'#cfe8ff'});
  const i2=S('round',240,140,'Skizzieren',{fill:'#e6dcff'});
  const d1=S('diamond',440,135,'Passt?',{fill:'#fff3b0'});
  const i3=S('round',640,140,'Mit anderen teilen',{fill:'#d3f0dc'});
  C(i1,i2); C(i2,d1); C(d1,i3,'Ja'); C(d1,i2,'Nein',{dash:true,fa:'s',ta:'s'});
  S('note',40,320,'Tipps:\n• Formen links hineinziehen\n• Doppelklick ändert den Text\n• An den blauen Punkten einen Pfeil ziehen',{w:300,h:150,al:'left'});
  S('text',380,330,'Einkauf\nMilch\nÄpfel\nBrot für Samstag',{w:260,h:110,list:true,pf:['b','l','l','l'],al:'left'});
  S('card',680,330,'Live: Board mit anderen teilen (oben rechts)',{w:200,h:90,fill:'#ffd9c7'});
  return d;
}
function start(data){
  loadBoards();
  const hot=data&&data.doc?cleanDoc(data.doc):null;
  const st=hot?null:storedDoc(boards.cur);
  doc=hot||st||exampleDoc(); fitTexts(); hist=[]; hi=-1; commit();
  if(!hot&&!st&&boards.list.length===1&&!curBoard().live){ curBoard().starter=1; saveIdx(); }   /* Startboard dieses Geräts: noch unverändert */ setTool('select'); render(); if(isNewer(doc)) setTimeout(newerWarn,600);
  $('boardName').value=curBoard().name;
  if(data&&data.view){ view=data.view; applyView(); } else fit();
  liveFromHash(); liveBadge(); liveViewMode(); ktStart(); applySides();
}
try{ window.claude&&window.claude.hot&&window.claude.hot.snapshot&&window.claude.hot.snapshot(()=>({doc,view})); }catch(e){}
storeInit().then(()=>{ if(window.claude&&window.claude.hot&&window.claude.hot.ready) window.claude.hot.ready(start); else start((window.claude&&window.claude.hot&&window.claude.hot.data)||{}); });
getDl();
/* Schrift ist erst kurz nach dem Start bereit: danach neu zeichnen, damit Textbreiten stimmen */
if(document.fonts&&document.fonts.load) Promise.all(["400","500","600"].map(w=>document.fonts.load(w+" 14px 'Roboto Mono'"))).then(()=>{ renderPal(); if(fitTexts()){ hist[hi]=mkSnap(doc,hist[hi]); persist(); } render(); }).catch(()=>{});
if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0) navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
