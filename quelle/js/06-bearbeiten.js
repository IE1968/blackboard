/* ---------- Bearbeiten ---------- */
function mkShape(kind,cx,cy){
  const d=KINDS[kind];
  if(kind==='frame') return {id:nid(),type:'shape',kind,x:snap(cx-d.w/2),y:snap(cy-d.h/2),w:d.w,h:d.h,text:'',fill:'none',stroke:INK,sw:2,ord:frames().reduce((m,f)=>Math.max(m,f.ord||0),0)+1};
  return {id:nid(),type:'shape',kind:d.as||kind,x:snap(cx-d.w/2),y:snap(cy-d.h/2),w:d.w,h:d.h,text:d.text||'',fill:d.fill||'#ffffff',stroke:INK,sw:2,...(d.list?{list:true,fs:16}:{}),...(d.chk?{pf:String(d.text).split('\n').map(()=>'c'),fs:16}:{})};
}
function mkTable(colW,rowH,heads){
  return {id:nid(),type:'shape',kind:'table',x:0,y:0,w:sum(colW),h:sum(rowH),colW,rowH,
    cells:rowH.map((_,rr)=>colW.map((_,cc)=>rr===0&&heads?heads[cc]:'')),text:'',fill:'#ffffff',stroke:INK,sw:2};
}
function addTemplate(kind,c,ptype){
  let t,cards=[];
  const Y='#fff3b0',B='#cfe8ff',G='#d3f0dc',O='#ffd9c7';
  if(kind==='table') t=mkTable([120,120,120],[36,36,36,36]);
  else if(kind==='kanban'){ t=mkTable([200,200,200],[40,360],['To Do','In Progress','Done']);
    cards=[[0,55,'Aufgabe 1',Y],[0,140,'Aufgabe 2',Y],[1,55,'Aufgabe 3',B],[2,55,'Aufgabe 4',G]]; }
  else if(kind==='scrum'){ t=mkTable([170,170,170,170,170],[40,380],['Product Backlog','Sprint Backlog','In Progress','Review','Done']);
    cards=[[0,55,'User Story 3',Y],[0,140,'User Story 4',Y],[1,55,'Task A',Y],[1,140,'Task B',Y],[2,55,'Task C',B],[3,55,'Task D',O],[4,55,'Task E',G]]; }
  else if(kind==='ertable'){ t=mkTable([170],[32,28,28,28],['Kunde']); t.align='left'; t.cells[1][0]='kundenNr (PK)'; t.cells[2][0]='name'; t.cells[3][0]='ort'; }
  else if(kind==='umlclass'){ t=mkTable([190],[32,50,50],['Klassenname']); t.align='left'; t.cells[1][0]='- attribut: Typ\n- attribut2: Typ'; t.cells[2][0]='+ methode(): Typ\n+ methode2()'; }
  else { t=mkTable([190],[46,50],['«interface»\nName']); t.align='left'; t.cells[1][0]='+ methode(): Typ\n+ methode2()'; }
  t.x=snap(c.x-t.w/2); t.y=snap(c.y-t.h/2);
  if(kind==='kanban'||kind==='scrum') doc.items.unshift(t); else doc.items.push(t);
  for(const [col,yo,text,fill] of cards){ const k=mkShape('card',0,0);
    k.x=t.x+sum(t.colW.slice(0,col))+(t.colW[col]-k.w)/2; k.y=t.y+yo; k.text=text; k.fill=fill; doc.items.push(k); }
  sel=new Set([t.id]); setTool('select'); commit(); render();
  if(kind==='table'&&ptype==='mouse') startEdit(t.id,{r:0,c:0});
}
function placeFrame(s){   /* neue Folie nie auf eine vorhandene legen: rechts neben die letzte setzen */
  const fr=frames(), hit=f=>s.x<f.x+f.w+20&&s.x+s.w>f.x-20&&s.y<f.y+f.h+20&&s.y+s.h>f.y-20;
  if(!fr.some(hit)) return;
  const last=fr[fr.length-1]; s.w=last.w; s.h=last.h; s.y=last.y; s.x=last.x+last.w+60; let n=0; while(fr.some(hit)&&n++<400) s.x+=20;
  const rc=svg.getBoundingClientRect(), k=view.k;   /* liegt die neue Folie außerhalb des Bildschirms, dorthin fahren */
  if(view.x+s.x*k<0||view.x+(s.x+s.w)*k>rc.width||view.y+s.y*k<0||view.y+(s.y+s.h)*k>rc.height){ view.x=rc.width/2-(s.x+s.w/2)*k; view.y=rc.height/2-(s.y+s.h/2)*k; applyView(); }
  toast('Neue Folie rechts neben die letzte Folie gesetzt.');
}
function addQuiz(c){   /* Folie mit Frage und drei Antworten zum Ankreuzen */
  const f=mkShape('frame',c.x,c.y); placeFrame(f); const q=f.w/640, add=[];
  const t=mkShape('text',0,0); Object.assign(t,{x:f.x+r(40*q),y:f.y+r(36*q),w:r(560*q),h:r(70*q),text:'Wie lautet die Frage?',fs:Math.round(26*q),bold:true}); add.push(t);
  ['Antwort A','Antwort B','Antwort C'].forEach((tx,i)=>{ const a=mkShape('check',0,0); Object.assign(a,{x:f.x+r(40*q),y:f.y+r((140+i*64)*q),w:r(560*q),h:r(48*q),text:tx,fs:Math.round(20*q)}); add.push(a); });
  doc.items.unshift(f); doc.items.push(...add); sel=new Set([f.id]); setTool('select'); commit(); render();
  toast('Antwort antippen und in der Optionsleiste „Richtig“ wählen, um die Lösung festzulegen. Ohne Lösung läuft die Frage im Live-Quiz als Umfrage.');
}
function addLanes(c){   /* Pool mit zwei Lanes */
  const p=mkShape('pool',c.x,c.y); p.w=700; p.h=240; p.x=snap(c.x-350); p.y=snap(c.y-120);
  const ls=[0,1].map(i=>{ const l=mkShape('lane',0,0); Object.assign(l,{x:p.x+30,y:p.y+i*120,w:670,h:120,text:'Lane '+(i+1)}); return l; });
  doc.items.unshift(...ls); doc.items.unshift(p); sel=new Set([p.id]); setTool('select'); commit(); render();
}
/* Mindmap: Thema in der Mitte, Zweige als abgerundete Kästen, verbunden mit Linien ohne Spitze */
const MMC=[['#cfe8ff','#1e63d0'],['#d3f0dc','#1f8a4c'],['#ffd9c7','#c8551f'],['#e6dcff','#6b46c1'],['#fff3b0','#b88a00'],['#ffd6e7','#c2185b']];
function mmNode(x,y,text,fill,stroke,root){ const n=mkShape(root?'ellipse':'round',0,0); Object.assign(n,{x:snap(x-(root?90:65)),y:snap(y-(root?45:25)),w:root?180:130,h:root?90:50,text,fill,stroke:root?INK:stroke,sw:root?3:2,mm:root?'root':'node',fs:root?18:14}); if(root) n.bold=true; return n; }
function mmLink(a,b,col){ return {id:nid(),type:'conn',from:a.id,to:b.id,p1:{x:0,y:0},p2:{x:0,y:0},text:'',stroke:col,sw:3,style:'straight',dash:false,head:'none',mm:1}; }
function addMindmap(c){
  const root=mmNode(c.x,c.y,'Thema','#ffffff',INK,true), add=[root], R=250;
  ['Idee 1','Idee 2','Idee 3','Idee 4','Idee 5','Idee 6'].forEach((t,i)=>{ const a=-Math.PI/2+i*Math.PI/3, [f,st]=MMC[i%MMC.length];
    const n=mmNode(c.x+Math.cos(a)*R*1.15,c.y+Math.sin(a)*R*0.62,t,f,st); n.mc=i%MMC.length; add.push(n,mmLink(root,n,st)); });
  doc.items.push(...add); sel=new Set([root.id]); setTool('select'); commit(); render();
  toast('Knoten auswählen und in der Optionsleiste „+ Zweig“ tippen, um weiterzuverzweigen.');
}
function addBranch(id){
  const p=byId(id); if(!p) return; const pc={x:p.x+p.w/2,y:p.y+p.h/2};
  const kids=doc.items.filter(c=>c.type==='conn'&&c.from===p.id&&c.to).map(c=>byId(c.to)).filter(Boolean);
  const inc=doc.items.find(c=>c.type==='conn'&&c.to===p.id&&c.from&&c.mm), par=inc&&byId(inc.from);
  let ang, ci=p.mc!=null?p.mc:0, nx, ny;
  if(!par){   /* am Thema: in die größte Lücke zwischen den vorhandenen Zweigen */
    const as=kids.map(k=>Math.atan2((k.y+k.h/2-pc.y)/0.62,(k.x+k.w/2-pc.x)/1.15)).sort((a,b)=>a-b);
    if(!as.length) ang=0; else { let best=0,gap=-1; for(let i=0;i<as.length;i++){ const a=as[i], b=i+1<as.length?as[i+1]:as[0]+2*Math.PI; if(b-a>gap){ gap=b-a; best=a+(b-a)/2; } } ang=best; }
    ci=kids.length%MMC.length; nx=pc.x+Math.cos(ang)*250*1.15; ny=pc.y+Math.sin(ang)*250*0.62; }
  else {   /* an einem Zweig: weiter nach außen, Geschwister untereinander */
    const dx=pc.x-(par.x+par.w/2), dy=pc.y-(par.y+par.h/2), dir=Math.abs(dx)>=Math.abs(dy)?{x:Math.sign(dx)||1,y:0}:{x:0,y:Math.sign(dy)||1};
    const k=kids.length, off=(k%2?1:-1)*Math.ceil(k/2)*70;
    if(dir.x){ nx=pc.x+dir.x*(p.w/2+130); ny=pc.y+off; } else { nx=pc.x+off*2.2; ny=pc.y+dir.y*(p.h/2+90); } }
  const [f,st]=MMC[ci], n=mmNode(nx,ny,'Neuer Zweig',par?p.fill:f,par?p.stroke:st); if(par){ n.w=120; n.h=44; n.fs=13; n.x=snap(nx-60); n.y=snap(ny-22); } n.mc=ci;
  doc.items.push(n,mmLink(p,n,par?p.stroke:st)); sel=new Set([n.id]); commit(); render(); startEdit(n.id);
}
/* Bilder: werden auf höchstens 1600 Pixel verkleinert und direkt im Board gespeichert */
let imgAt=null;
function pickImage(c){ imgAt=c||null; const f=$('imgFile'); f.value=''; f.click(); }
async function imgData(blob){
  const url=URL.createObjectURL(blob);
  try{
    const im=await new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
    let w=im.naturalWidth||im.width, h=im.naturalHeight||im.height; if(!w||!h) throw 0;
    const q=Math.min(1,1600/Math.max(w,h)); w=Math.max(1,Math.round(w*q)); h=Math.max(1,Math.round(h*q));
    const cv=document.createElement('canvas'); cv.width=w; cv.height=h; const cx=cv.getContext('2d'); cx.drawImage(im,0,0,w,h);
    let alpha=false; if(!/jpe?g/.test(blob.type)){ const d=cx.getImageData(0,0,w,h).data; for(let i=3;i<d.length;i+=4) if(d[i]<250){ alpha=true; break; } }
    return {src:alpha?cv.toDataURL('image/png'):cv.toDataURL('image/jpeg',0.85),w,h};
  } finally { URL.revokeObjectURL(url); }
}
async function addImage(blob,c){
  if(!blob||!/^image\//.test(blob.type||'')){ toast('Diese Datei ist kein Bild.'); return; }
  let d; try{ d=await imgData(blob); }catch(e){ toast('Das Bild konnte nicht gelesen werden.'); return; }
  if(!/^data:image\/(png|jpeg);base64,/.test(d.src)||d.src.length>=8e6){ toast('Das Bild ist zu groß.'); return; }
  if(!c){ const rc=svg.getBoundingClientRect(); c=toWorld(rc.left+rc.width/2,rc.top+rc.height/2); }
  const k=Math.min(1,480/d.w,360/d.h), w=Math.round(d.w*k), h=Math.round(d.h*k);
  const it={id:nid(),type:'shape',kind:'image',x:snap(c.x-w/2),y:snap(c.y-h/2),w,h,text:'',fill:'none',stroke:INK,sw:0,src:d.src};
  finishEdit(); doc.items.push(it); sel=new Set([it.id]); setTool('select'); commit(); render();
}
$('imgFile').addEventListener('change',e=>{ const f=e.target.files&&e.target.files[0]; if(f) addImage(f,imgAt); imgAt=null; });
let pastePending=0;
document.addEventListener('paste',e=>{   /* Bild aus der Zwischenablage */
  if(editing||(e.target&&e.target.closest&&e.target.closest('input,textarea'))) return;
  const fl=[...((e.clipboardData&&e.clipboardData.items)||[])].find(i=>i.kind==='file'&&/^image\//.test(i.type)), f=fl&&fl.getAsFile();
  if(!f) return; e.preventDefault(); clearTimeout(pastePending); pastePending=0; addImage(f);
});
svg.addEventListener('dragover',e=>{ if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){ e.preventDefault(); e.dataTransfer.dropEffect='copy'; } });
svg.addEventListener('drop',e=>{
  const fs=[...((e.dataTransfer&&e.dataTransfer.files)||[])].filter(f=>/^image\//.test(f.type)); if(!fs.length) return;
  e.preventDefault(); const c=toWorld(e.clientX,e.clientY); fs.slice(0,10).forEach((f,i)=>addImage(f,{x:c.x+i*30,y:c.y+i*30}));
});
function addShape(kind,c,ptype){
  if(kind==='image') return pickImage(c);
  if(kind==='mindmap') return addMindmap(c);
  if(kind==='quiz') return addQuiz(c);
  if(kind==='poollanes') return addLanes(c);
  if(KINDS[kind].tpl) return addTemplate(kind,c,ptype);
  if(KINDS[kind].line){
    const cn={id:nid(),type:'conn',from:null,to:null,p1:{x:snap(c.x-70),y:snap(c.y+30)},p2:{x:snap(c.x+70),y:snap(c.y-30)},text:'',stroke:INK,sw:2,style:'straight',dash:!!KINDS[kind].dash,head:KINDS[kind].line};
    doc.items.push(cn); sel=new Set([cn.id]); setTool('select'); commit(); render(); return;
  }
  const s=mkShape(kind,c.x,c.y);
  if(kind==='frame') placeFrame(s);
  if(s.kind==='pool'||kind==='frame') doc.items.unshift(s); else doc.items.push(s);
  sel=new Set([s.id]); setTool('select'); commit(); render();
  if(ptype==='mouse'&&kind!=='frame') startEdit(s.id);
}
function removeIds(ids){ doc.items=doc.items.filter(i=>!ids.has(i.id)&&!(i.type==='conn'&&(ids.has(i.from)||ids.has(i.to)))); }
function deleteSel(){ if(!sel.size) return;
  const ids=new Set([...sel].filter(id=>{ const i=byId(id); return i&&!i.lock; }));
  if(!ids.size){ toast('Gesperrte Elemente lassen sich nicht löschen. Erst in der Optionsleiste unter „Element“ entsperren.'); return; }
  removeIds(ids); sel.clear(); commit(); render(); }
function frames(){ return doc.items.map((f,i)=>({f,i})).filter(o=>o.f.type==='shape'&&o.f.kind==='frame').sort((a,b)=>((a.f.ord||0)-(b.f.ord||0))||(a.i-b.i)).map(o=>o.f); }
function frameNo(id){ return frames().findIndex(f=>f.id===id)+1; }
function moveFrame(id,dir){ const fr=frames(), i=fr.findIndex(f=>f.id===id), j=i+dir; if(i<0||j<0||j>=fr.length) return;
  const t=fr[i]; fr[i]=fr[j]; fr[j]=t; fr.forEach((f,n)=>f.ord=n+1); commit(); render(); }
let clipB=null, pasteN=0;
function withFrameContent(ids){   /* ausgewählte Folien bringen ihren Inhalt mit, dazu Pfeile zwischen diesen Elementen */
  const fids=new Set([...ids].filter(id=>(byId(id)||{}).kind==='frame')); if(!fids.size) return ids;
  assignFrames(); const out=new Set(ids);
  for(const it of doc.items) if(it.fr&&fids.has(it.fr)) out.add(it.id);
  for(const it of doc.items) if(it.type==='conn'&&it.from&&it.to&&out.has(it.from)&&out.has(it.to)) out.add(it.id);
  return out;
}
function frameShift(copies){   /* kopierte Folien rechts neben die letzte vorhandene Folie, ohne Überlappung */
  const fc=copies.filter(c=>c.kind==='frame'); if(!fc.length) return null;
  const fr=frames(); if(!fr.length) return {dx:40,dy:40};
  const last=fr[fr.length-1], first=fc.reduce((a,b)=>a.x<b.x?a:b);
  let dx=last.x+last.w+60-first.x, dy=last.y-first.y, n=0;
  const obs=doc.items.filter(i=>i.type!=='conn').map(i=>i.kind==='frame'?i:bbox(i));   /* auch andere Elemente freihalten, sonst würde die Kopie sie einsammeln */
  const hit=()=>fc.some(c=>obs.some(f=>c.x+dx<f.x+f.w+20&&c.x+dx+c.w>f.x-20&&c.y+dy<f.y+f.h+20&&c.y+dy+c.h>f.y-20));
  while(hit()&&n++<400) dx+=20;
  return {dx,dy};
}
function fixCopies(copies,map){   /* Folienzuordnung und Reihenfolge der Kopien richtigstellen */
  let ord=frames().reduce((m,f)=>Math.max(m,f.ord||0),0);
  for(const c of copies){ if(c.fr){ if(map[c.fr]) c.fr=map[c.fr]; else delete c.fr; } }
  copies.filter(c=>c.kind==='frame').sort((a,b)=>(a.ord||0)-(b.ord||0)).forEach(c=>c.ord=++ord);
}
function moveCopy(c,dx,dy){ if(c.type==='shape'){ c.x+=dx; c.y+=dy; } else if(c.type==='path') c.pts=c.pts.map(q=>[q[0]+dx,q[1]+dy]); else { c.p1={x:c.p1.x+dx,y:c.p1.y+dy}; c.p2={x:c.p2.x+dx,y:c.p2.y+dy}; } }
function copySel(cut){
  const ids=withFrameContent(sel), src=doc.items.filter(i=>ids.has(i.id)); if(!src.length) return;
  clipB=src.map(i=>{ const c=JSON.parse(JSON.stringify(i)); if(c.type==='conn'){ const pts=route(i), l=pts[pts.length-1]; c.p1={x:pts[0].x,y:pts[0].y}; c.p2={x:l.x,y:l.y}; } return c; });
  pasteN=0; try{ localStorage.setItem('blackboard-clip',JSON.stringify(clipB)); }catch(e){}
  if(cut){ removeIds(ids); sel.clear(); commit(); render(); toast('Ausgeschnitten.'); } else { toast(src.length===1?'Element kopiert.':src.length+' Elemente kopiert.'); updateProps(); }
}
function hasClip(){ if(clipB&&clipB.length) return true; try{ return !!localStorage.getItem('blackboard-clip'); }catch(e){ return false; } }
function pasteClip(){
  let src=clipB; if(!src){ try{ const cd=cleanDoc({items:JSON.parse(localStorage.getItem('blackboard-clip'))}); src=cd&&cd.items; }catch(e){} }
  if(!src||!src.length) return;
  finishEdit(); pasteN++; const off=20*pasteN, map={}, gmap={}, ids=new Set(src.map(i=>i.id));
  const copies=src.map(i=>{ const c=JSON.parse(JSON.stringify(i)); c.id=nid(); map[i.id]=c.id; if(c.g) c.g=gmap[c.g]=gmap[c.g]||newGid(); return c; });
  const fs=frameShift(copies), dx=fs?fs.dx:off, dy=fs?fs.dy:off;
  for(const c of copies){
    if(c.type==='conn'){ c.from=ids.has(c.from)?map[c.from]:null; c.to=ids.has(c.to)?map[c.to]:null; }
    moveCopy(c,dx,dy);
  }
  fixCopies(copies,map);
  doc.items.unshift(...copies.filter(c=>c.kind==='frame')); doc.items.push(...copies.filter(c=>c.kind!=='frame')); sel=new Set(copies.map(c=>c.id)); setTool('select'); sel=new Set(copies.map(c=>c.id)); commit(); render();
}
function duplicateSel(){
  const ids=withFrameContent(sel), src=doc.items.filter(i=>ids.has(i.id)); if(!src.length) return;
  const map={}, gmap={}; const copies=src.map(i=>{ const c=JSON.parse(JSON.stringify(i)); c.id=nid(); map[i.id]=c.id; if(c.g) c.g=gmap[c.g]=gmap[c.g]||newGid(); return c; });
  const fs=frameShift(copies), dx=fs?fs.dx:20, dy=fs?fs.dy:20;
  src.forEach((i,ix)=>{ const c=copies[ix];
    if(c.type==='conn'){ const pts=route(i);
      if(map[c.from]) c.from=map[c.from]; else { c.from=null; c.p1={x:pts[0].x,y:pts[0].y}; }
      if(map[c.to]) c.to=map[c.to]; else { c.to=null; const l=pts[pts.length-1]; c.p2={x:l.x,y:l.y}; } }
    moveCopy(c,dx,dy); });
  fixCopies(copies,map);
  doc.items.unshift(...copies.filter(c=>c.kind==='frame')); doc.items.push(...copies.filter(c=>c.kind!=='frame')); sel=new Set(copies.map(c=>c.id)); commit(); render();
}
function expandSel(){
  const gs=new Set(); for(const id of sel){ const it=byId(id); if(it&&it.g) gs.add(it.g); }
  if(gs.size) for(const it of doc.items) if(it.g&&gs.has(it.g)) sel.add(it.id);
}
function newGid(){ return 'g'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function groupSel(){ const its=doc.items.filter(i=>sel.has(i.id)); if(its.length<2) return; const g=newGid(); its.forEach(i=>i.g=g); commit(); render(); }
function ungroupSel(){ let ch=false; for(const i of doc.items) if(sel.has(i.id)&&i.g){ delete i.g; ch=true; } if(ch){ commit(); render(); } }
function isTied(it){ return it.type==='conn'&&!!(it.from||it.to); }   /* angedockte Pfeile folgen ihren Formen */
function selUnits(){
  const map=new Map(), units=[];
  for(const it of doc.items){ if(!sel.has(it.id)||it.lock||(isTied(it)&&!it.g)) continue;
    const key=it.g||it.id; let u=map.get(key); if(!u){ u={items:[]}; map.set(key,u); units.push(u); } u.items.push(it); }
  for(const u of units){ const free=u.items.filter(i=>!isTied(i)), src=free.length?free:u.items; let x1=Infinity,y1=Infinity,x2=-Infinity,y2=-Infinity;
    for(const it of src){ const b=bbox(it); x1=Math.min(x1,b.x); y1=Math.min(y1,b.y); x2=Math.max(x2,b.x+b.w); y2=Math.max(y2,b.y+b.h); }
    u.x=x1; u.y=y1; u.w=x2-x1; u.h=y2-y1; }
  return units;
}
function shiftItem(it,dx,dy){
  if(it.type==='shape'){ it.x=r(it.x+dx); it.y=r(it.y+dy); }
  else if(it.type==='path') it.pts=it.pts.map(q=>[r(q[0]+dx),r(q[1]+dy)]);
  else { if(!it.from) it.p1={x:r(it.p1.x+dx),y:r(it.p1.y+dy)}; if(!it.to) it.p2={x:r(it.p2.x+dx),y:r(it.p2.y+dy)}; }
}
function alignSel(mode){
  const us=selUnits(); if(us.length<2) return;
  const X1=Math.min(...us.map(u=>u.x)), X2=Math.max(...us.map(u=>u.x+u.w)), Y1=Math.min(...us.map(u=>u.y)), Y2=Math.max(...us.map(u=>u.y+u.h));
  if(mode==='dh'||mode==='dv'){
    if(us.length<3) return; const hz=mode==='dh';
    us.sort((a,b)=>hz?(a.x+a.w/2)-(b.x+b.w/2):(a.y+a.h/2)-(b.y+b.h/2));
    const total=us.reduce((t,u)=>t+(hz?u.w:u.h),0), gap=((hz?X2-X1:Y2-Y1)-total)/(us.length-1); let pos=hz?X1:Y1;
    for(const u of us){ const dd=pos-(hz?u.x:u.y); u.items.forEach(it=>shiftItem(it,hz?dd:0,hz?0:dd)); pos+=(hz?u.w:u.h)+gap; }
  } else for(const u of us){
    const dx=mode==='l'?X1-u.x:mode==='c'?(X1+X2)/2-(u.x+u.w/2):mode==='r'?X2-(u.x+u.w):0;
    const dy=mode==='t'?Y1-u.y:mode==='m'?(Y1+Y2)/2-(u.y+u.h/2):mode==='b'?Y2-(u.y+u.h):0;
    u.items.forEach(it=>shiftItem(it,dx,dy));
  }
  commit(); render();
}
function reorder(front){
  const a=doc.items.filter(i=>sel.has(i.id)),b=doc.items.filter(i=>!sel.has(i.id));
  doc.items=front?b.concat(a):a.concat(b); commit(); render();
}
function editRect(it){
  if(it.type==='conn'){ const m=connMid(route(it)); return {x:m.x-85,y:m.y-16,w:170,h:32}; }
  if(it.kind==='table'){ const c=cellRect(it,editCell.r,editCell.c); return {x:it.x+c.x,y:it.y+c.y,w:c.w,h:c.h}; }
  if(it.kind==='frame') return {x:it.x,y:it.y-36,w:260,h:34};
  const tb=textBox(it);
  if(tb.mode==='below') return {x:it.x+it.w/2-90,y:it.y+it.h+4,w:180,h:40};
  if(tb.mode==='pool') return {x:it.x,y:it.y,w:220,h:36};
  const w=Math.max(it.w,110),h=Math.max(it.h,32);
  return {x:it.x+it.w/2-w/2,y:it.y+it.h/2-h/2,w,h};
}
/* Schreiben direkt in der Form: das Eingabefeld ist durchsichtig, liegt genau über dem Text und hat dessen Farbe.
   Aufzählungspunkte und Kästchen zeichnet das Board darunter, so bleibt die Formatierung sichtbar. */
function edTextColor(s){ const tb=textBox(s); let f=tink(); if(tb.mode!=='below'){ f=onFill(s.fill); if(s.kind==='text') f=s.stroke==='none'?onFill(s.fill):mapC(s.stroke); } if(s.tc) f=mapC(s.tc); return f; }
function placeEditor(){
  const it=byId(editing); if(!it) return; useFont(it); editor.style.fontWeight=BOLD?'600':'400'; const k=view.k;
  if(inlineEd(it)&&!editCell){
    const tb=textBox(it), T=editor.value, pf=it.pf?remapPf(it.text||'',T,it.pf):null, s2=Object.assign({},it,{text:T}); if(pf) s2.pf=pf; else delete s2.pf;
    let n, ind=0;
    if(s2.pf&&tb.mode!=='below'){ const Q=paraLines(s2,T,tb.maxW); n=Q.out.length; if(Q.anyL) ind=Q.ind; }
    else if(it.list&&canList(it)&&tb.mode!=='below'){ const L=listLines(T,tb.maxW); n=L.out.length; ind=L.ind; }
    else n=wrap(T,tb.maxW).length;
    n=Math.max(1,n);
    let base0;   /* Grundlinie der ersten Zeile, wie beim Zeichnen */
    if(tb.mode==='below') base0=it.h+LH; else base0=it.h/2+(tb.dy||0)-(n-1)*LH/2+FS*0.35;
    const top=base0-FS*0.35-LH/2;
    let x0, w, al;
    if(ind){ x0=(tb.mode==='left'?tb.pad:Math.max(6,it.w/2-tb.maxW/2))+ind; w=Math.max(20,tb.maxW-ind); al='left'; }
    else if(tb.mode==='left'){ x0=tb.pad; w=tb.maxW; al=it.al||'left'; }
    else { x0=it.w/2-tb.maxW/2; w=tb.maxW; al=it.al||'center'; }
    editor.classList.add('inl');
    editor.style.left=(view.x+(it.x+x0)*k)+'px'; editor.style.top=(view.y+(it.y+top)*k)+'px';
    editor.style.width=(w*k+2)+'px'; editor.style.height=(n*LH*k+2)+'px';
    editor.style.fontSize=(FS*k)+'px'; editor.style.lineHeight=(LH*k)+'px'; editor.style.padding='0';
    editor.style.textAlign=al; editor.style.color=edTextColor(it); editor.style.caretColor=edTextColor(it);
    if(editor.scrollHeight>editor.clientHeight+1) editor.style.height=(editor.scrollHeight+2)+'px';   /* falls das Feld anders umbricht: nichts abschneiden */
    if(it.rot){ editor.style.transformOrigin=((it.w/2-x0)*k)+'px '+((it.h/2-top)*k)+'px'; editor.style.transform='rotate('+it.rot+'deg)'; } else editor.style.transform='';
    return;
  }
  editor.classList.remove('inl'); editor.style.color=editor.style.caretColor=editor.style.transform='';
  const R=editRect(it);
  const lines=Math.max(1,editor.value.split('\n').length), H=R.h*k, lh=LH*k;
  editor.style.left=(view.x+R.x*k)+'px'; editor.style.top=(view.y+R.y*k)+'px';
  editor.style.width=Math.max(90,R.w*k)+'px'; editor.style.height=Math.max(H,lines*lh+8)+'px';
  editor.style.fontSize=(FS*k)+'px'; editor.style.lineHeight=lh+'px';
  editor.style.padding=Math.max(2,(H-lines*lh)/2-2)+'px 6px 0';
  editor.style.textAlign=it.kind==='table'?(editCell&&editCell.r===0&&!it.al?'center':alOf(it)):it.list?'left':alOf(it);
}
function startEdit(id,cell){
  finishEdit(); const it=byId(id); if(!it||it.type==='path') return;
  const tbl=it.kind==='table'; editCell=tbl?(cell||{r:0,c:0}):null;
  editing=id; sel=new Set([id]); editor.value=(tbl?it.cells[editCell.r][editCell.c]:it.text)||''; editor.hidden=false; placeEditor(); render();
  editor.focus(); editor.select();
}
function finishEdit(cancel){
  if(editing==null) return;
  const it=byId(editing); editing=null; editor.hidden=true;
  if(it){
    const v=editor.value.replace(/\s+$/,'');
    if(!cancel){ if(it.kind==='table') it.cells[editCell.r][editCell.c]=v; else { if(it.pf){ it.pf=remapPf(it.text||'',v,it.pf); if(!it.pf.some(x=>x)) delete it.pf; } it.text=v; } }
    if(it.type==='shape'&&it.kind==='text'&&!it.text){ removeIds(new Set([it.id])); sel.delete(it.id); }
    else autosize(it);
    commit();
  }
  render();
}
let keepEdit=0, edSel=null;   /* Tippen in die Optionsleiste beendet das Schreiben nicht; die Markierung bleibt erhalten */
editor.addEventListener('blur',()=>{ if(Date.now()-keepEdit<800) return; finishEdit(); });
function holdEdit(e){ if(editing==null||!e.target.closest('button,.pg,.pmenu,#colorPop')) return; keepEdit=Date.now(); edSel=[editor.selectionStart,editor.selectionEnd]; if(e.type==='mousedown') e.preventDefault(); }
for(const el of [propsEl,$('colorPop')]){ el.addEventListener('pointerdown',holdEdit,true); el.addEventListener('mousedown',holdEdit,true); }
function backToEdit(){ if(editing==null) return; editor.focus({preventScroll:true}); if(edSel) editor.setSelectionRange(edSel[0],edSel[1]); }
function editParas(){ const v=editor.value, [a,b]=edSel||[editor.selectionStart,editor.selectionEnd], cnt=p=>(v.slice(0,p).match(/\n/g)||[]).length; return [cnt(a),cnt(b>a?b-1:b)]; }
editor.addEventListener('input',()=>{ placeEditor(); const it=byId(editing); if(it&&(it.pf||it.list)) render(); });   /* Punkte und Kästchen wandern mit */
editor.addEventListener('keydown',e=>{
  /* Enter = neuer Absatz; fertig mit Strg+Enter, Esc oder Tippen daneben. Mindmap-Knoten: Enter = fertig (Umschalt+Enter = neue Zeile) */
  if(e.key==='Enter'&&(e.ctrlKey||e.metaKey||(!e.shiftKey&&!editCell&&(byId(editing)||{}).mm))){ e.preventDefault(); finishEdit(); }
  else if(e.key==='Escape'){ e.preventDefault(); finishEdit(); }
  else if(e.key==='Tab'&&!editCell&&(byId(editing)||{}).mm){ e.preventDefault(); const id=editing; finishEdit(); addBranch(id); }   /* Mindmap: Tab hängt direkt einen neuen Zweig an */
  else if(e.key==='Tab'&&editCell){ e.preventDefault(); const id=editing,t=byId(id); let {r:rr,c}=editCell;
    c+=e.shiftKey?-1:1; if(c>=t.colW.length){ c=0; rr++; } if(c<0){ c=t.colW.length-1; rr--; }
    finishEdit(); if(rr>=0&&rr<t.rowH.length) startEdit(id,{r:rr,c}); }
  e.stopPropagation();
});
function newTextAt(w){
  const s=mkShape('text',w.x+80,w.y); s.text=''; s.fresh=true; doc.items.push(s); startEdit(s.id);
}
function setTool(t){
  if(liveRO()&&t!=='pan') t='pan';
  tool=t; if(DRAW[t]) drawTool=t; svg.setAttribute('class','t-'+t);
  document.querySelectorAll('#tools .tb').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===t));
  if(t!=='select'&&t!=='shape'&&sel.size){ sel.clear(); render(); }
  else if(t==='shape'&&sel.size){ for(const id of [...sel]){ const i=byId(id); if(!i||i.type!=='shape') sel.delete(id); } render(); } else updateProps();
}

