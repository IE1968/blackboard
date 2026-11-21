/* ---------- Vorlagen-Galerie ---------- */
const TC={blue:'#cfe8ff',green:'#d3f0dc',orange:'#ffd9c7',yellow:'#fff3b0',violet:'#e6dcff',pink:'#ffd6e7',grey:'#e3e8ea',white:'#ffffff'};
function tplKit(){
  const out=[];
  const B=(kind,x,y,w,h,text,o)=>{ const it=Object.assign({id:nid(),type:'shape',kind,x,y,w,h,text:text||'',fill:TC.white,stroke:INK,sw:2},o||{}); out.push(it); return it; };
  const X=(x,y,w,text,fs,o)=>B('text',x,y,w,Math.round((fs||16)*1.3*String(text).split('\n').length+10),text,Object.assign({fill:'none',fs:fs||16},o||{}));
  const H=(x,y,w,text,fs)=>X(x,y,w,text,fs||18,{bold:true});
  const L=(x1,y1,x2,y2,o)=>{ const c=Object.assign({id:nid(),type:'conn',from:null,to:null,p1:{x:x1,y:y1},p2:{x:x2,y:y2},text:'',stroke:INK,sw:2,style:'straight',dash:false,head:'arrow'},o||{}); out.push(c); return c; };
  const A=(a,b,fa,ta,o)=>{ const c=Object.assign({id:nid(),type:'conn',from:a.id,to:b.id,p1:{x:0,y:0},p2:{x:0,y:0},text:'',stroke:INK,sw:2,style:'ortho',dash:false,head:'arrow'},o||{}); if(fa) c.fa=fa; if(ta) c.ta=ta; out.push(c); return c; };
  const Q=(x,y,w,h,title,sub,fill)=>{ B('rect',x,y,w,h,'',{fill}); H(x+16,y+14,w-32,title); if(sub) X(x+16,y+44,w-32,sub,13,{tc:'#5b6870'}); };
  const TB=(x,y,colW,rowH,cells,o)=>B('table',x,y,sum(colW),sum(rowH),'',Object.assign({colW,rowH,cells},o||{}));
  return {out,B,X,H,L,A,Q,TB};
}
const TEMPLATES=[
 {name:'SWOT-Analyse',info:'Stärken, Schwächen, Chancen und Risiken auf einen Blick',make(K){ const {H,X,Q}=K; H(0,0,700,'SWOT-Analyse',26);
   X(90,56,380,'hilfreich',14,{al:'center',tc:'#5b6870'}); X(490,56,380,'schädlich',14,{al:'center',tc:'#5b6870'}); X(0,170,80,'intern',14,{tc:'#5b6870'}); X(0,440,80,'extern',14,{tc:'#5b6870'});
   Q(90,84,380,250,'Stärken','Was können wir besonders gut?',TC.green); Q(490,84,380,250,'Schwächen','Wo haben wir Nachholbedarf?',TC.orange);
   Q(90,354,380,250,'Chancen','Welche Entwicklungen nützen uns?',TC.blue); Q(490,354,380,250,'Risiken','Was könnte uns schaden?',TC.pink); }},
 {name:'Eisenhower-Matrix',info:'Aufgaben nach Wichtigkeit und Dringlichkeit sortieren',make(K){ const {H,X,Q}=K; H(0,0,700,'Eisenhower-Matrix',26);
   X(130,56,380,'dringend',14,{al:'center',tc:'#5b6870'}); X(530,56,380,'nicht dringend',14,{al:'center',tc:'#5b6870'}); X(0,190,120,'wichtig',14,{tc:'#5b6870'}); X(0,460,120,'nicht wichtig',14,{tc:'#5b6870'});
   Q(130,84,380,250,'1 · Sofort erledigen','wichtig und dringend: selbst und jetzt',TC.orange); Q(530,84,380,250,'2 · Planen','wichtig, nicht dringend: Termin festlegen',TC.blue);
   Q(130,354,380,250,'3 · Delegieren','dringend, nicht wichtig: abgeben',TC.yellow); Q(530,354,380,250,'4 · Weglassen','weder wichtig noch dringend',TC.grey); }},
 {name:'Retrospektive',info:'Start, Stop, Weitermachen und Maßnahmen fürs Team',make(K){ const {H,B,X}=K; H(0,0,700,'Retrospektive',26);
   [['Start','Was sollten wir neu anfangen?',TC.green],['Stop','Was sollten wir lassen?',TC.pink],['Weitermachen','Was hat sich bewährt?',TC.blue]].forEach(([t,q,c],i)=>{ const x=i*290;
     B('rect',x,60,270,56,t,{fill:c,bold:true,fs:18}); B('rect',x,116,270,330,'',{fill:TC.white}); X(x+14,126,242,q,13,{tc:'#5b6870'}); });
   B('note',14,170,150,90,'Idee hier notieren',{fill:TC.yellow,fs:13});
   B('rect',0,470,850,56,'Maßnahmen: Wer macht was bis wann?',{fill:TC.yellow,bold:true,fs:16}); B('rect',0,526,850,120,'',{fill:TC.white}); }},
 {name:'Prozesslandkarte',info:'Führungs-, Kern- und Unterstützungsprozesse',make(K){ const {H,B}=K; H(0,0,700,'Prozesslandkarte',26);
   B('rect',0,60,130,520,'Kunde\n\nAnforderungen',{fill:TC.grey,bold:true,fs:14}); B('rect',1050,60,130,520,'Kunde\n\nZufriedenheit',{fill:TC.grey,bold:true,fs:14});
   B('rect',150,60,880,150,'',{fill:TC.violet}); K.H(166,70,400,'Führungsprozesse',15); ['Strategie','Qualitäts-\nmanagement','Controlling'].forEach((t,i)=>B('round',190+i*280,110,240,80,t,{fs:14}));
   B('rect',150,230,880,170,'',{fill:TC.blue}); K.H(166,240,400,'Kernprozesse',15); ['Vertrieb','Planung','Leistungs-\nerbringung','Service'].forEach((t,i)=>B('arrowr',170+i*214,280,206,100,t,{fs:14}));
   B('rect',150,420,880,160,'',{fill:TC.grey}); K.H(166,430,400,'Unterstützungsprozesse',15); ['Personal','IT','Einkauf','Buchhaltung'].forEach((t,i)=>B('round',180+i*212,470,180,80,t,{fs:14})); }},
 {name:'Zeitstrahl',info:'Meilensteine eines Projekts in zeitlicher Reihenfolge',make(K){ const {H,L,B,X}=K; H(0,0,700,'Zeitstrahl',26);
   L(0,260,1000,260,{sw:4});
   [['Januar','Projektstart'],['März','Konzept fertig'],['Mai','Umsetzung'],['August','Test'],['Oktober','Abschluss']].forEach(([d,t],i)=>{ const x=80+i*200, up=i%2===0;
     B('ellipse',x-14,246,28,28,'',{fill:TC.blue,sw:3}); L(x,up?246:274,x,up?190:330,{head:'none',dash:true});
     B('round',x-85,up?110:330,170,80,'',{fill:i===4?TC.green:TC.white}); X(x-75,(up?118:338),150,d,15,{bold:true,al:'center'}); X(x-75,(up?146:366),150,t,13,{al:'center'}); }); }},
 {name:'Business Model Canvas',info:'Geschäftsmodell auf neun Feldern',make(K){ const {H,B,X}=K; H(0,0,700,'Business Model Canvas',26);
   const F=(x,y,w,h,t,c)=>{ B('rect',x,y,w,h,'',{fill:c}); X(x+12,y+10,w-24,t,14,{bold:true}); };
   F(0,60,220,420,'Schlüssel-\npartner',TC.white); F(220,60,220,210,'Schlüssel-\naktivitäten',TC.white); F(220,270,220,210,'Schlüssel-\nressourcen',TC.white);
   F(440,60,220,420,'Wertangebote',TC.yellow); F(660,60,220,210,'Kunden-\nbeziehungen',TC.white); F(660,270,220,210,'Kanäle',TC.white); F(880,60,220,420,'Kunden-\nsegmente',TC.white);
   F(0,480,550,170,'Kostenstruktur',TC.grey); F(550,480,550,170,'Einnahmequellen',TC.green); }},
 {name:'Ishikawa-Diagramm',info:'Ursachen eines Problems nach den 6 M ordnen',make(K){ const {H,L,B}=K; H(0,0,700,'Ursache-Wirkungs-Diagramm',26);
   L(0,320,820,320,{sw:4}); B('rect',830,280,200,80,'Problem /\nWirkung',{fill:TC.orange,bold:true,fs:15});
   [['Mensch',100],['Methode',360],['Messung',620]].forEach(([t,x])=>{ L(x,120,x+110,320,{head:'none',sw:3}); B('round',x-70,70,140,46,t,{fill:TC.blue,fs:14}); });
   [['Maschine',100],['Material',360],['Mitwelt',620]].forEach(([t,x])=>{ L(x,520,x+110,320,{head:'none',sw:3}); B('round',x-70,524,140,46,t,{fill:TC.blue,fs:14}); }); }},
 {name:'Organigramm',info:'Aufbau einer Organisation mit Leitung und Teams',make(K){ const {H,B,A}=K; H(0,0,700,'Organigramm',26);
   const top=B('round',360,60,220,64,'Geschäftsführung',{fill:TC.blue,bold:true,fs:15});
   ['Vertrieb','Produktion','Verwaltung'].forEach((t,i)=>{ const x=40+i*320, m=B('round',x+40,190,200,60,t,{fill:TC.green,fs:14}); A(top,m,'s','n',{head:'none'});
     ['Team A','Team B'].forEach((u,j)=>{ const c=B('round',x+j*140,320,130,52,u,{fs:13}); A(m,c,'s','n',{head:'none'}); }); }); }},
 {name:'PDCA-Zyklus',info:'Plan, Do, Check, Act: kontinuierlich verbessern',make(K){ const {H,B,A}=K; H(0,0,700,'PDCA-Zyklus',26);
   const p=B('round',0,70,280,130,'Plan\nZiele und Maßnahmen planen',{fill:TC.blue,fs:15}), d=B('round',400,70,280,130,'Do\nMaßnahmen umsetzen',{fill:TC.green,fs:15}),
     c=B('round',400,300,280,130,'Check\nErgebnisse prüfen',{fill:TC.yellow,fs:15}), a=B('round',0,300,280,130,'Act\nStandardisieren oder anpassen',{fill:TC.orange,fs:15});
   B('ellipse',285,205,110,90,'PDCA',{bold:true,fs:16}); A(p,d,'e','w',{sw:3}); A(d,c,'s','n',{sw:3}); A(c,a,'w','e',{sw:3}); A(a,p,'n','s',{sw:3}); }},
 {name:'Stakeholder-Matrix',info:'Beteiligte nach Einfluss und Interesse einordnen',make(K){ const {H,X,Q,L}=K; H(0,0,700,'Stakeholder-Matrix',26);
   L(60,620,60,70,{sw:3}); L(60,620,880,620,{sw:3}); X(0,40,160,'Einfluss',14,{bold:true}); X(760,630,140,'Interesse',14,{bold:true});
   Q(80,70,390,260,'Zufriedenstellen','hoher Einfluss, geringes Interesse',TC.yellow); Q(480,70,390,260,'Eng einbinden','hoher Einfluss, hohes Interesse',TC.orange);
   Q(80,340,390,260,'Beobachten','geringer Einfluss, geringes Interesse',TC.grey); Q(480,340,390,260,'Informieren','geringer Einfluss, hohes Interesse',TC.blue); }},
 {name:'RACI-Matrix',info:'Wer ist verantwortlich, wer macht mit, wer wird informiert?',make(K){ const {H,TB,X}=K; H(0,0,700,'RACI-Matrix',26);
   const cw=[240,140,140,140,160], rh=[44,40,40,40,40,40];
   TB(0,60,cw,rh,[['Aufgabe','Projektleitung','Team','Fachbereich','Geschäftsführung'],['Anforderungen erheben','A','R','C','I'],['Konzept erstellen','A','R','C','I'],['Umsetzung','A','R','I','I'],['Abnahme','R','C','A','I'],['Projektabschluss','R','C','I','A']],{al:'center'});
   X(0,320,860,'R = Responsible (führt durch) · A = Accountable (verantwortlich, eine Person) · C = Consulted (wird befragt) · I = Informed (wird informiert)',13,{tc:'#5b6870'}); }},
 {name:'Projektsteckbrief',info:'Die wichtigsten Eckdaten eines Projekts',make(K){ const {H,TB}=K; H(0,0,700,'Projektsteckbrief',26);
   TB(0,60,[220,600],[42,44,44,44,64,64,64,64,44,64],[['Thema','Beschreibung'],['Projektname',''],['Auftraggeber',''],['Projektleitung',''],['Ausgangslage',''],['Ziele',''],['Nicht im Umfang',''],['Meilensteine',''],['Budget',''],['Risiken','']],{align:'left'}); }},
 {name:'Empathy Map',info:'Sich in Kundinnen und Kunden hineinversetzen',make(K){ const {H,B,Q}=K; H(0,0,700,'Empathy Map',26);
   Q(0,60,440,250,'Denkt und fühlt','Was beschäftigt die Person wirklich?',TC.violet); Q(460,60,440,250,'Hört','Was sagen Freunde, Kollegen, Chefs?',TC.blue);
   Q(0,330,440,250,'Sieht','Umfeld, Angebote, Probleme',TC.green); Q(460,330,440,250,'Sagt und tut','Verhalten, Aussagen, Auftreten',TC.yellow);
   B('ellipse',360,240,180,110,'Persona',{bold:true,fs:16}); Q(0,600,440,150,'Schmerzpunkte','Ängste, Frust, Hindernisse',TC.pink); Q(460,600,440,150,'Gewinne','Wünsche, Bedürfnisse, Erfolg',TC.green); }},
 {name:'5-Why-Analyse',info:'Mit fünfmal „Warum?“ zur Grundursache',make(K){ const {H,B,A}=K; H(0,0,700,'5-Why-Analyse',26);
   let prev=B('round',0,60,420,60,'Problem: …',{fill:TC.orange,bold:true,fs:15});
   for(let i=1;i<=5;i++){ const n=B('round',0,60+i*95,420,60,'Warum '+i+'? …',{fill:i===5?TC.green:TC.white,fs:14}); A(prev,n,'s','n'); prev=n; }
   B('note',460,535,200,70,'Grundursache gefunden: Maßnahme ableiten',{fill:TC.yellow,fs:13}); }},
 {name:'Kanban-Board',info:'To Do, In Arbeit, Erledigt',kind:'kanban'},
 {name:'Scrum-Board',info:'Backlog, Sprint, Review',kind:'scrum'},
 {name:'Mindmap',info:'Thema mit Zweigen, per „+ Zweig“ erweiterbar',kind:'mindmap'}
];
function tplItems(t){ const K=tplKit(); t.make(K); return K.out; }
function tplPreview(t){
  if(t.kind) return iconFor(t.kind,44,28).replace('<svg ','<svg style="padding:22px 50px;color:#5b6870" ');
  const n0=doc.n, its=tplItems(t), b=unionBox(its), dk=darkBoard, ed=editing; doc.n=n0; darkBoard=false; editing=null;
  const keep=doc.items; doc.items=its; let body=''; try{ body=its.map(itemSVG).join(''); } finally { doc.items=keep; darkBoard=dk; editing=ed; }
  return `<svg viewBox="${r(b.x-20)} ${r(b.y-20)} ${r(b.w+40)} ${r(b.h+40)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${body}</svg>`;
}
function openTpl(){
  closeMenu(); const g=$('tplGrid');
  if(!g.dataset.done){ g.innerHTML=TEMPLATES.map((t,i)=>`<button type="button" class="tc" data-t="${i}">${tplPreview(t)}<b>${esc(t.name)}</b><small>${esc(t.info)}</small></button>`).join(''); g.dataset.done='1'; }
  $('tplDlg').hidden=false; const b=$('tplBox'); b.scrollTop=0; b.focus({preventScroll:true});
}
function closeTpl(){ if($('tplDlg').hidden) return; $('tplDlg').hidden=true; svg.focus(); }
function insertTpl(i){
  const t=TEMPLATES[i]; closeTpl(); if(!t) return;
  const rc=svg.getBoundingClientRect(), c=toWorld(rc.left+rc.width/2,rc.top+rc.height/2);
  if(t.kind){ addShape(t.kind,c,'mouse'); return; }
  const its=tplItems(t), b=unionBox(its), dx=snap(c.x-b.w/2)-b.x, dy=snap(c.y-b.h/2)-b.y;
  for(const it of its) moveCopy(it,dx,dy);
  finishEdit(); doc.items.push(...its); fitTexts(); sel=new Set(its.map(i=>i.id)); setTool('select'); commit();
  const k=clamp(Math.min(rc.width/(b.w+100),rc.height/(b.h+100)),0.15,1.2); view={k,x:rc.width/2-(b.x+dx+b.w/2)*k,y:rc.height/2-(b.y+dy+b.h/2)*k}; applyView(); render();
  toast('Vorlage eingefügt. Alles ist ausgewählt und lässt sich gemeinsam verschieben.');
}
$('tplGrid').addEventListener('click',e=>{ const b=e.target.closest('[data-t]'); if(b) insertTpl(+b.dataset.t); });
$('tplClose').onclick=closeTpl;
$('tplDlg').addEventListener('pointerdown',e=>{ if(e.target===$('tplDlg')) closeTpl(); });
$('tplDlg').addEventListener('keydown',e=>{ if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); closeTpl(); } });

