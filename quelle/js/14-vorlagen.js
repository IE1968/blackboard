/* ---------- Vorlagen-Galerie ---------- */
const TC={blue:'#cfe8ff',green:'#d3f0dc',orange:'#ffd9c7',yellow:'#fff3b0',violet:'#e6dcff',pink:'#ffd6e7',grey:'#e3e8ea',white:'#ffffff'};
function tplKit(){
  const out=[];
  const B=(kind,x,y,w,h,text,o)=>{ const it=Object.assign({id:nid(),type:'shape',kind,x,y,w,h,text:text||'',fill:TC.white,stroke:INK,sw:2},o||{}); out.push(it); return it; };
  const X=(x,y,w,text,fs,o)=>B('text',x,y,w,Math.round((fs||16)*1.3*String(text).split('\n').length+10),text,Object.assign({fill:'none',fs:fs||16},o||{}));
  const H=(x,y,w,text,fs)=>X(x,y,w,text,fs||18,{bold:true});
  const L=(x1,y1,x2,y2,o)=>{ const c=Object.assign({id:nid(),type:'conn',from:null,to:null,p1:{x:x1,y:y1},p2:{x:x2,y:y2},text:'',stroke:INK,sw:2,style:'straight',dash:false,head:'arrow'},o||{}); out.push(c); return c; };
  const A=(a,b,fa,ta,o)=>{ const c=Object.assign({id:nid(),type:'conn',from:a.id,to:b.id,p1:{x:0,y:0},p2:{x:0,y:0},text:'',stroke:INK,sw:2,style:'ortho',dash:false,head:'arrow'},o||{}); if(fa) c.fa=fa; if(ta) c.ta=ta; out.push(c); return c; };
  const Q=(x,y,w,h,title,sub,fill)=>{ B('rect',x,y,w,h,'',{fill}); X(x+16,y+14,w-32,title,18,{bold:true,tc:CARD_INK}); if(sub) X(x+16,y+44,w-32,sub,13,{tc:'#5b6870'}); };
  const TB=(x,y,colW,rowH,cells,o)=>B('table',x,y,sum(colW),sum(rowH),'',Object.assign({colW,rowH,cells},o||{}));
  return {out,B,X,H,L,A,Q,TB};
}
/* Schrift auf farbigen Karten: bleibt dunkel, auch auf dunkler Tafel (INK selbst würde dort hell) */
const CARD_INK='#1d2b2f';
/* Checkliste: Zeilen mit „+“ am Anfang sind schon abgehakt */
function tplCheck(K,x,y,w,lines,o){ return K.X(x,y,w,lines.map(l=>l.replace(/^\+/,'')).join('\n'),16,Object.assign({pf:lines.map(l=>l.startsWith('+')?'x':'c'),tc:CARD_INK},o||{})); }
function tplCard(K,x,y,w,h,title,fill,lines){ K.B('rect',x,y,w,h,'',{fill}); K.X(x+16,y+14,w-32,title,18,{bold:true,tc:CARD_INK}); tplCheck(K,x+16,y+52,w-32,lines); }
/* ---------- Netzplan (Vorgangsknoten): Beispiel „Neuen PC-Arbeitsplatz einrichten“ ----------
   Zählweise: Projektbeginn = Zeitpunkt 0, FEZ = FAZ + D. Werte sind vorgerechnet und werden in Tests nachgeprüft. */
const NP_ROT='#c94040';
const NP_VG=[   /* Nr, Vorgang, Dauer, Vorgänger, FAZ, FEZ, SAZ, SEZ, GP, FP */
  ['A','Hardware bestellen',3,'–',0,3,0,3,0,0],
  ['B','Arbeitsplatz\nvorbereiten',2,'–',0,2,1,3,1,1],
  ['C','Image erstellen',1,'–',0,1,3,4,3,3],
  ['D','Hardware aufbauen',1,'A, B',3,4,3,4,0,0],
  ['E','Image installieren',1,'C, D',4,5,4,5,0,0],
  ['F','Software und\nKonten einrichten',2,'E',5,7,5,7,0,0],
  ['G','Übergabe und\nEinweisung',1,'F',7,8,7,8,0,0]];
/* Ein Vorgangsknoten: oben FAZ | D | FEZ, Mitte Nr · Vorgang, unten SAZ | GP | FP | SEZ. Gibt das mittlere Feld zurück (Andockpunkt für Pfeile). */
function npNode(K,x,y,v,o){
  o=o||{}; const crit=!!o.crit, st=crit?NP_ROT:INK, sw=crit?3:2, fs=o.fs||13, mid=crit?TC.pink:TC.white;
  const c=(cx,cy,w,h,t,f)=>K.B('rect',x+cx,y+cy,w,h,String(t),{fill:f||TC.white,stroke:st,sw,fs});
  c(0,0,64,34,v[0]); c(64,0,82,34,v[1]); c(146,0,64,34,v[2]);
  const m=c(0,34,210,52,v[3],mid);
  c(0,86,52,34,v[4]); c(52,86,53,34,v[5]); c(105,86,53,34,v[6]); c(158,86,52,34,v[7]);
  return m;
}
function npVals(r){ return [r[4],r[2],r[5],r[0]+' · '+r[1].replace(/\n/g,' ').replace(/(.{12,}?) /,'$1\n'),r[6],r[8],r[9],r[7]]; }
/* Das Beispiel-Netz; gibt die Knoten nach Nr zurück */
function npNetz(K,x0,y0){
  const pos={A:[0,0],B:[0,180],C:[0,360],D:[300,90],E:[600,225],F:[900,225],G:[1200,225]}, n={};
  for(const r of NP_VG){ const [px,py]=pos[r[0]]; n[r[0]]=npNode(K,x0+px,y0+py,npVals(r),{crit:r[8]===0}); }
  for(const [a,b] of [['A','D'],['B','D'],['D','E'],['C','E'],['E','F'],['F','G']]){ const crit=NP_VG.find(r=>r[0]===a)[8]===0&&NP_VG.find(r=>r[0]===b)[8]===0;
    K.A(n[a],n[b],'e','w',crit?{stroke:NP_ROT,sw:3}:{}); }
  return n;
}
function npListe(K,x,y,fs){ return K.TB(x,y,[50,280,130,120],[40].concat(NP_VG.map(()=>36)),[['Nr','Vorgang','Dauer (Tage)','Vorgänger']].concat(NP_VG.map(r=>[r[0],r[1].replace(/\n/g,' '),String(r[2]),r[3]])),{al:'center',fs:fs||14}); }
/* Folie 640 × 360 mit Titel; Inhalt relativ zur linken oberen Ecke */
function npFolie(K,i,titel){ const x=(i%3)*720, y=Math.floor(i/3)*440; K.B('frame',x,y,640,360,titel,{fill:'none',ord:i+1}); return {x,y}; }
function npQuiz(K,i,frage,antworten,richtig){
  const f=npFolie(K,i,'Frage '+i); K.X(f.x+40,f.y+32,560,frage,24,{bold:true});
  antworten.forEach((a,k)=>K.B('check',f.x+40,f.y+150+k*62,560,48,a,Object.assign({fill:'none',fs:20},k===richtig?{ok:true}:{})));
}
const TEMPLATES=[
 {name:'Einkaufsliste',info:'Zum Abhaken, nach Bereichen sortiert – mit Namen, wer was mitbringt',make(K){ const {H,X,B}=K; H(0,0,880,'Einkaufsliste',26);
   X(0,40,880,'Kästchen antippen zum Abhaken · neue Zeile mit Enter · hinter den Strich schreiben, wer es besorgt',13,{tc:'#5b6870'});
   tplCard(K,0,84,280,230,'Obst & Gemüse',TC.green,['Äpfel','+Bananen','Tomaten','Salat']);
   tplCard(K,300,84,280,230,'Kühlregal',TC.blue,['Milch – Sam','Joghurt','Käse','Butter']);
   tplCard(K,600,84,280,230,'Vorrat & Backwaren',TC.yellow,['Brot für Samstag','Nudeln','Kaffee – Alex','Reis']);
   tplCard(K,0,334,280,200,'Drogerie & Haushalt',TC.pink,['Zahnpasta','Spülmittel','Küchenrolle']);
   B('note',300,334,280,200,'Nicht vergessen:\nPfandflaschen mitnehmen',{fill:TC.yellow,al:'left'}); }},
 {name:'Wochenplaner',info:'Montag bis Sonntag für die ganze Familie, mit Aufgaben der Woche',make(K){ const {H,X,TB}=K; H(0,0,900,'Wochenplaner',26);
   const now=new Date(), mo=new Date(now.getFullYear(),now.getMonth(),now.getDate()-((now.getDay()+6)%7)), so=new Date(mo.getFullYear(),mo.getMonth(),mo.getDate()+6), dm=d=>d.getDate()+'.'+(d.getMonth()+1);
   X(0,40,900,'Woche vom '+dm(mo)+' bis '+dm(so),16);   /* aktuelle Woche, Montag bis Sonntag */
   const cw=[130,110,110,110,110,110,110,110], rh=[44,76,76,76,60];
   TB(0,80,cw,rh,[['','Mo','Di','Mi','Do','Fr','Sa','So'],['Morgens','','','','','','',''],['Nachmittags','','','','','','',''],['Abends','','','','','','',''],['Wichtig?','','','','','','','']],{al:'center'});
   tplCard(K,0,442,440,200,'Diese Woche erledigen',TC.orange,['Müll rausbringen (Di)','Geschenk für Oma besorgen','+Arzttermin ausmachen']);
   tplCard(K,460,442,440,200,'Einkauf fürs Wochenende',TC.green,['Grillgemüse','Brötchen','Getränke']); }},
 {name:'To-do-Liste',info:'Heute, diese Woche, irgendwann – zum Abhaken',make(K){ const {H,X}=K; H(0,0,880,'To-do-Liste',26);
   X(0,40,880,'Kästchen antippen zum Abhaken · Erledigtes wird durchgestrichen',13,{tc:'#5b6870'});
   tplCard(K,0,84,280,250,'Heute',TC.orange,['Arzttermin vereinbaren','+Wäsche waschen','Einkauf erledigen']);
   tplCard(K,300,84,280,250,'Diese Woche',TC.blue,['Rechnung bezahlen','Auto zum TÜV','Bewerbung abschicken']);
   tplCard(K,600,84,280,250,'Irgendwann',TC.violet,['Keller aufräumen','Fotobuch gestalten','Fahrrad reparieren']); }},
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
     B('round',x-85,up?110:330,170,80,'',{fill:i===4?TC.green:TC.white}); const tk=i===4?{tc:CARD_INK}:{}; X(x-75,(up?118:338),150,d,15,{bold:true,al:'center',...tk}); X(x-75,(up?146:366),150,t,13,{al:'center',...tk}); }); }},
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
 {name:'Gantt-Diagramm',info:'Aufgaben als Balken über zehn Wochen, mit Meilenstein',make(K){ const {H,B,TB}=K; H(0,0,700,'Gantt-Diagramm',26);
   const T=['Analyse','Konzept','Design','Umsetzung','Test','Abnahme'], cw=[180].concat(Array(10).fill(64)), rh=[40].concat(Array(T.length).fill(46));
   TB(0,60,cw,rh,[['Aufgabe'].concat(Array.from({length:10},(_,i)=>'KW '+(i+1)))].concat(T.map(t=>[t].concat(Array(10).fill('')))));
   [[0,2,TC.blue],[1,3,TC.blue],[3,3,TC.violet],[4,4,TC.orange],[7,2,TC.yellow],[9,1,TC.green]].forEach(([s,d,c],r)=>B('round',180+s*64+4,60+40+r*46+9,d*64-8,28,'',{fill:c,sw:1.500}));
   B('diamond',180+10*64-18,60+40+T.length*46+12,36,36,'',{fill:TC.green}); K.X(180+7*64-30,60+40+T.length*46+18,190,'Meilenstein: Abnahme',13,{al:'right',tc:'#5b6870'}); }},
 {name:'Zeitstrahl senkrecht',info:'Ereignisse von oben nach unten, abwechselnd links und rechts',make(K){ const {H,L,B,X}=K; H(0,0,700,'Zeitstrahl',26);
   L(400,60,400,700,{sw:4});
   [['2022','Idee'],['2023','Erste Version'],['2024','Erweiterung'],['2025','Neue Kunden'],['2026','Heute']].forEach(([d,t],i)=>{ const y=100+i*130, li=i%2===0;
     B('ellipse',386,y-14,28,28,'',{fill:i===4?TC.green:TC.blue,sw:3}); L(li?386:414,y,li?330:470,y,{head:'none',dash:true});
     B('round',li?150:470,y-40,180,80,'',{fill:TC.white}); X(li?160:480,y-32,160,d,15,{bold:true,al:'center'}); X(li?160:480,y-6,160,t,13,{al:'center'}); }); }},
 {name:'Roadmap',info:'Vorhaben je Bereich über vier Quartale',make(K){ const {H,B,X}=K; H(0,0,700,'Roadmap',26);
   ['Q1','Q2','Q3','Q4'].forEach((q,i)=>B('rect',160+i*220,60,220,44,q,{fill:TC.grey,bold:true,fs:16}));
   [['Produkt',TC.blue,[[0,1.6,'Grundfunktionen'],[1.8,2,'Version 2.0']]],['Technik',TC.violet,[[0.3,1.4,'Neue Server'],[2,1.8,'Schnittstellen']]],['Marketing',TC.orange,[[1,1.5,'Website'],[2.7,1.2,'Messe']]]].forEach(([n,c,its],r)=>{ const y=104+r*120;
     B('rect',0,y,160,120,n,{fill:c,bold:true,fs:15}); B('rect',160,y,880,120,'',{fill:TC.white});
     its.forEach(([s,d,t])=>B('round',170+s*220,y+34,d*220-20,52,t,{fill:c,fs:14})); }); }},
 {name:'Zahlenstrahl 0–20',info:'Zahlenstrahl in Einerschritten für Rechenwege',make(K){ const {H,L,X}=K; H(0,0,700,'Zahlenstrahl',26);
   const x0=40, st=50; L(x0-20,160,x0+20*st+40,160,{sw:3});
   for(let i=0;i<=20;i++){ const x=x0+i*st, g=i%5===0; L(x,g?140:148,x,g?180:172,{head:'none',sw:g?3:2}); X(x-25,188,50,String(i),g?16:14,{al:'center',bold:g}); } }},
 {name:'Zahlenstrahl 0–100',info:'Zehner beschriftet, Fünferschritte als Striche',make(K){ const {H,L,X}=K; H(0,0,700,'Zahlenstrahl bis 100',26);
   const x0=40, st=10; L(x0-20,160,x0+100*st+40,160,{sw:3});
   for(let i=0;i<=100;i+=5){ const x=x0+i*st, g=i%10===0; L(x,g?138:148,x,g?182:172,{head:'none',sw:g?3:2}); if(g) X(x-25,190,50,String(i),15,{al:'center',bold:i%50===0}); } }},
 {name:'Netzplan',info:'Vorgangsknoten mit Legende und Formeln, Beispiel PC-Arbeitsplatz, kritischer Weg rot',make(K){ const {H,X,B}=K;
   H(0,0,1100,'Netzplan: Neuen PC-Arbeitsplatz einrichten',26);
   X(0,40,1400,'Vorgangsknoten nach dem Schema in der Legende · Zeiten in Tagen, Projektbeginn = 0 · rot = kritischer Weg',13,{tc:'#5b6870'});
   K.H(0,80,560,'Vorgangsliste',16); npListe(K,0,112);
   B('rect',610,80,350,360,'',{fill:TC.blue}); X(626,92,318,'Legende',18,{bold:true});
   npNode(K,680,136,['FAZ','D','FEZ','Nr · Vorgang','SAZ','GP','FP','SEZ'],{fs:12});
   X(626,282,318,'FAZ  frühester Anfangszeitpunkt\nFEZ  frühester Endzeitpunkt\nSAZ  spätester Anfangszeitpunkt\nSEZ  spätester Endzeitpunkt\nD    Dauer\nGP   Gesamtpuffer\nFP   freier Puffer',13);
   B('rect',980,80,430,360,'',{fill:TC.yellow}); X(996,92,398,'Berechnung',18,{bold:true});
   X(996,126,398,'1 · Vorwärts (links → rechts)',14,{bold:true}); X(996,148,398,'FAZ = größter FEZ aller Vorgänger (Start: 0)\nFEZ = FAZ + D',13);
   X(996,200,398,'2 · Rückwärts (rechts → links)',14,{bold:true}); X(996,222,398,'SEZ = kleinster SAZ aller Nachfolger\n       (letzter Vorgang: SEZ = FEZ)\nSAZ = SEZ − D',13);
   X(996,292,398,'3 · Puffer',14,{bold:true}); X(996,314,398,'GP = SAZ − FAZ  (= SEZ − FEZ)\nFP = kleinster FAZ der Nachfolger − FEZ',13);
   X(996,366,398,'Kritischer Weg: alle Vorgänge mit GP = 0',14,{bold:true});
   npNetz(K,0,500);
   B('note',0,1010,520,90,'Ergebnis: Projektdauer 8 Tage\nKritischer Weg: A → D → E → F → G',{fill:TC.yellow,fs:16,al:'left'});
   B('note',540,1010,520,90,'Puffer: B darf 1 Tag später fertig werden, C sogar 3 Tage, ohne dass sich das Projektende verschiebt.',{fill:TC.green,fs:14,al:'left'}); }},
 {name:'Netzplan – Präsentation',info:'9 Folien: Vorgangsknoten, Vorwärts- und Rückwärtsrechnung, Puffer, kritischer Weg',make(K){ const {X,B}=K;
   let f=npFolie(K,0,'Titel'); B('rect',f.x+40,f.y+96,8,140,'',{fill:'#3b6fe8',stroke:'#3b6fe8'});
   X(f.x+64,f.y+96,540,'Netzplantechnik',40,{bold:true}); X(f.x+64,f.y+156,540,'Projekte planen, Puffer finden,\nden kritischen Weg erkennen',20);
   X(f.x+64,f.y+290,540,'Beispiel: Neuen PC-Arbeitsplatz einrichten',14,{tc:'#5b6870'});
   f=npFolie(K,1,'Wozu ein Netzplan?'); X(f.x+40,f.y+32,560,'Wozu ein Netzplan?',28,{bold:true});
   X(f.x+40,f.y+100,560,'• zeigt, welche Vorgänge voneinander abhängen\n• berechnet die kürzeste Projektdauer\n• zeigt, wo Verzögerungen erlaubt sind\n• macht den kritischen Weg sichtbar',20);
   f=npFolie(K,2,'Der Vorgangsknoten'); X(f.x+40,f.y+32,560,'Der Vorgangsknoten',28,{bold:true});
   npNode(K,f.x+40,f.y+120,['FAZ','D','FEZ','Nr · Vorgang','SAZ','GP','FP','SEZ'],{fs:12});
   X(f.x+290,f.y+112,320,'oben: frühe Zeiten und Dauer\n\nMitte: Nummer und Vorgang\n\nunten: späte Zeiten und Puffer',16);
   f=npFolie(K,3,'Schritt 1: Vorgangsliste'); X(f.x+40,f.y+24,560,'Schritt 1: Vorgangsliste',28,{bold:true});
   K.TB(f.x+40,f.y+80,[44,270,110,120],[30].concat(NP_VG.map(()=>30)),[['Nr','Vorgang','Dauer','Vorgänger']].concat(NP_VG.map(r=>[r[0],r[1].replace(/\n/g,' '),r[2]+' T.',r[3]])),{al:'center',fs:13});
   f=npFolie(K,4,'Schritt 2: Vorwärtsrechnung'); X(f.x+40,f.y+32,560,'Schritt 2: Vorwärtsrechnung',28,{bold:true});
   X(f.x+40,f.y+88,560,'Von links nach rechts, Start bei 0',18);
   B('rect',f.x+40,f.y+128,560,84,'FEZ = FAZ + D\nFAZ = größter FEZ aller Vorgänger',{fill:TC.yellow,fs:20,bold:true});
   X(f.x+40,f.y+236,560,'Beispiel D: Vorgänger A (FEZ 3) und B (FEZ 2)\n→ FAZ = 3, FEZ = 3 + 1 = 4',18);
   f=npFolie(K,5,'Schritt 3: Rückwärtsrechnung'); X(f.x+40,f.y+32,560,'Schritt 3: Rückwärtsrechnung',28,{bold:true});
   X(f.x+40,f.y+88,560,'Von rechts nach links, Ende = Projektende',18);
   B('rect',f.x+40,f.y+128,560,84,'SAZ = SEZ − D\nSEZ = kleinster SAZ aller Nachfolger',{fill:TC.blue,fs:20,bold:true});
   X(f.x+40,f.y+236,560,'Beispiel C: Nachfolger E (SAZ 4)\n→ SEZ = 4, SAZ = 4 − 1 = 3',18);
   f=npFolie(K,6,'Schritt 4: Puffer'); X(f.x+40,f.y+32,560,'Schritt 4: Puffer',28,{bold:true});
   B('rect',f.x+40,f.y+88,560,56,'GP = SAZ − FAZ',{fill:TC.green,fs:20,bold:true}); X(f.x+40,f.y+152,560,'→ Spielraum, ohne das Projektende zu verschieben',15);
   B('rect',f.x+40,f.y+196,560,56,'FP = kleinster FAZ der Nachfolger − FEZ',{fill:TC.green,fs:20,bold:true}); X(f.x+40,f.y+260,560,'→ Spielraum, ohne den Nachfolger zu verschieben',15);
   X(f.x+40,f.y+306,560,'Beispiel: C hat GP = 3 und FP = 3, B hat GP = 1 und FP = 1',15,{bold:true});
   f=npFolie(K,7,'Der kritische Weg'); X(f.x+40,f.y+32,560,'Der kritische Weg',28,{bold:true});
   let prev=null; ['A','D','E','F','G'].forEach((nr,k)=>{ const r=NP_VG.find(v=>v[0]===nr), b=B('round',f.x+56+k*112,f.y+110,80,56,nr+'\n'+r[2]+' T.',{fill:TC.pink,stroke:NP_ROT,sw:3,fs:16,bold:true}); if(prev) K.A(prev,b,'e','w',{stroke:NP_ROT,sw:3}); prev=b; });
   X(f.x+40,f.y+200,560,'Alle Vorgänge mit GP = 0. Verzögert sich einer davon, verzögert sich das ganze Projekt.',18);
   X(f.x+40,f.y+280,560,'Projektdauer: 3 + 1 + 1 + 2 + 1 = 8 Tage',20,{bold:true});
   f=npFolie(K,8,'Merksätze'); X(f.x+40,f.y+32,560,'Merksätze',28,{bold:true});
   X(f.x+40,f.y+100,560,'1. Vorwärts: der größte Wert gewinnt (FAZ)\n2. Rückwärts: der kleinste Wert gewinnt (SEZ)\n3. GP = 0 → kritischer Weg\n4. Puffer zeigen, wo Spielraum ist',20); }},
 {name:'Netzplan – Quiz',info:'8 Quizfragen zum Netzplan, auch als Live-Quiz mit dem Handy',make(K){
   const f=npFolie(K,0,'Quiz'); K.X(f.x+40,f.y+110,560,'Quiz: Netzplantechnik',36,{bold:true}); K.X(f.x+40,f.y+170,560,'8 Fragen zum Beispiel „Neuen PC-Arbeitsplatz einrichten“',18);
   npQuiz(K,1,'Wofür steht FAZ?',['Frühester Anfangszeitpunkt','Fester Abschlusszeitpunkt','Freier Anfangszeitraum'],0);
   npQuiz(K,2,'Wie berechnet man den FEZ?',['FAZ + Dauer','SEZ − Dauer','FAZ − Dauer'],0);
   npQuiz(K,3,'Zwei Vorgänger enden mit FEZ 3 und FEZ 5. Wie groß ist der FAZ?',['3','5','8'],1);
   npQuiz(K,4,'Zwei Nachfolger haben SAZ 6 und SAZ 4. Wie groß ist der SEZ?',['4','6','10'],0);
   npQuiz(K,5,'Wie berechnet man den Gesamtpuffer?',['SAZ − FAZ','FEZ − FAZ','SEZ − SAZ'],0);
   npQuiz(K,6,'Was bedeutet GP = 0?',['Der Vorgang liegt auf dem kritischen Weg','Der Vorgang ist abgeschlossen','Der Vorgang hat keinen Vorgänger'],0);
   npQuiz(K,7,'Im Beispiel: Wie lange dauert das ganze Projekt?',['7 Tage','8 Tage','11 Tage'],1);
   npQuiz(K,8,'Im Beispiel: Wie groß ist der Gesamtpuffer von Vorgang C?',['0 Tage','1 Tag','3 Tage'],2); }},
 {name:'Kanban-Board',info:'To Do, In Arbeit, Erledigt',kind:'kanban'},
 {name:'Scrum-Board',info:'Backlog, Sprint, Review',kind:'scrum'},
 {name:'Mindmap',info:'Thema mit Zweigen, per „+ Zweig“ erweiterbar',kind:'mindmap'}
];
const TKAT={'Netzplan':'Unterricht','Netzplan – Präsentation':'Unterricht','Netzplan – Quiz':'Unterricht','Einkaufsliste':'Alltag','Wochenplaner':'Alltag','To-do-Liste':'Alltag','Mindmap':'Unterricht','Zahlenstrahl 0–20':'Unterricht','Zahlenstrahl 0–100':'Unterricht','Zeitstrahl':'Unterricht','Zeitstrahl senkrecht':'Unterricht','PDCA-Zyklus':'Unterricht','5-Why-Analyse':'Unterricht','Ishikawa-Diagramm':'Unterricht'};
const TKAT_FARBE={Alltag:'coral',Unterricht:'blue',Beruf:'violet'};
let tplKat='*';
function tplFilter(k){ tplKat=k; document.querySelectorAll('#tplFilt button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===k)); document.querySelectorAll('#tplGrid .tc').forEach(b=>b.hidden=k!=='*'&&b.dataset.kat!==k); }
function tplItems(t){ const K=tplKit(); t.make(K); return tplInk(K.out); }
/* Texte, die auf einer farbigen (hellen) Fläche liegen, behalten dunkle Schrift – auch auf dunkler Tafel */
function tplInk(its){
  const light=new Set(Object.values(TC).filter(c=>c!==TC.white));
  const boxes=its.filter(i=>i.type==='shape'&&i.kind!=='text'&&light.has(i.fill));
  for(const t of its){ if(t.type!=='shape'||t.kind!=='text'||t.tc) continue; const cx=t.x+t.w/2, cy=t.y+t.h/2;
    if(boxes.some(b=>cx>=b.x&&cx<=b.x+b.w&&cy>=b.y&&cy<=b.y+b.h)) t.tc=CARD_INK; }
  return its;
}
function tplPreview(t){
  if(t.kind) return iconFor(t.kind,44,28).replace('<svg ','<svg style="padding:22px 50px;color:#5b6870" ');
  const n0=doc.n, its=tplItems(t), b=unionBox(its), dk=darkBoard, ed=editing; doc.n=n0; darkBoard=false; editing=null;
  const keep=doc.items; doc.items=its; let body=''; try{ body=its.map(itemSVG).join(''); } finally { doc.items=keep; darkBoard=dk; editing=ed; }
  return `<svg viewBox="${r(b.x-20)} ${r(b.y-20)} ${r(b.w+40)} ${r(b.h+40)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${body}</svg>`;
}
function openTpl(){
  closeMenu(); const g=$('tplGrid');
  if(!g.dataset.done){ const ord={Alltag:0,Unterricht:1,Beruf:2}, ks=i=>TKAT[TEMPLATES[i].name]||'Beruf';
    g.innerHTML=TEMPLATES.map((t,i)=>i).sort((a,b)=>ord[ks(a)]-ord[ks(b)]||a-b).map(i=>{ const t=TEMPLATES[i], k=ks(i); return `<button type="button" class="tc" data-t="${i}" data-kat="${k}">${tplPreview(t)}<b>${esc(t.name)}</b><small><em style="color:var(--c-${TKAT_FARBE[k]})">${k}</em> · ${esc(t.info)}</small></button>`; }).join(''); g.dataset.done='1';
    $('tplFilt').innerHTML=[['*','Alle'],['Alltag','Alltag'],['Unterricht','Unterricht'],['Beruf','Beruf']].map(([k,n])=>`<button type="button" class="chip" data-k="${k}" aria-pressed="${k===tplKat}">${n}</button>`).join(''); }
  tplFilter(tplKat);
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
$('tplClose').onclick=closeTpl; $('tplX').onclick=closeTpl;
$('tplFilt').addEventListener('click',e=>{ const b=e.target.closest('[data-k]'); if(b) tplFilter(b.dataset.k); });
$('tplDlg').addEventListener('pointerdown',e=>{ if(e.target===$('tplDlg')) closeTpl(); });
$('tplDlg').addEventListener('keydown',e=>{ if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); closeTpl(); } });

