(function(){
'use strict';
const INK='#1c2a2e', INK_D='#eef3f3';
let SEL='#1763cf', darkBoard=true, presLive=null, plainOut=false;
function tink(){ return darkBoard?INK_D:INK; }
function paper(){ const s=BG_OK?SURF[bgCur().s]:null; return s&&s.dark===darkBoard?s.bg:(darkBoard?'#0d1011':'#fbfbf8'); }   /* Farbe der Tafel (für Export, Präsentation, Beschriftungen) */
function mapC(c){ if(!darkBoard) return c; if(c===INK) return INK_D; if(c==='#ffffff') return '#1b2427'; return c; }
function onFill(f){ return f==='none'?tink():(isDark(mapC(f))?'#ffffff':INK); }
function vis(it){ return Object.assign({},it,{fill:mapC(it.fill),stroke:mapC(it.stroke)}); }
const FONT="'Roboto Mono',ui-monospace,Menlo,Consolas,monospace", HAND="'Caveat','Comic Sans MS',cursive";
/* Schriftarten auf dem Board (alle in der App eingebettet, damit sie überall gleich aussehen) */
const FONTS={mono:['Standard',FONT],sans:['Klar',"'Plus Jakarta Sans',system-ui,sans-serif"],serif:['Serifen',"'Lora',Georgia,serif"],
  school:['Schulschrift',"'Andika',sans-serif"],display:['Plakativ',"'Archivo Black',Impact,sans-serif"],hand:['Handschrift',HAND]};
const FS_STUFEN=[10,12,14,16,18,20,24,28,32,40,48,64,80,96,128];
const LH_STUFEN=[[1,'1,0'],[1.3,'1,3'],[1.6,'1,6'],[2,'2,0']];
let FAM=FONT, ITAL=false, FX='';   /* Schrift des gerade gezeichneten Elements; FX = zusätzliche SVG-Angaben (kursiv, Linien) */
let FS=14, LH=18, BOLD=false, lastCell=null;
const GRID=20, KEY='blackboard-v1';
function useFont(it){ FS=(it&&it.fs)||14; LH=Math.round(FS*((it&&it.lh)||1.3)); BOLD=!!(it&&it.bold); FAM=(it&&FONTS[it.ff]||FONTS.mono)[1]; ITAL=!!(it&&it.it);
  const dc=[it&&it.ul&&'underline',it&&it.st&&'line-through'].filter(Boolean).join(' '); FX=(ITAL?' font-style="italic"':'')+(dc?` text-decoration="${dc}"`:''); }
const COLORS=['none','#1c2a2e','#ffffff','#7a8790','#c8321f','#d97a00','#f2c200','#1f8a4c','#1e63d0','#7446c9','#fff3b0','#ffd9c7','#cfe8ff','#d3f0dc','#e6dcff','#e3e8ea'];
const WIDTHS={shape:[1,2,3,5,8],pen:[1.5,3,5,8,12],brush:[4,8,12,18,26],marker:[8,14,20,28,40],smart:[1.5,2,3,5,8]};
const DRAW={pen:'Stift',brush:'Pinsel',marker:'Marker',smart:'Formstift'};
const r2=v=>Math.round(v*100)/100;
/* Stiftdruck (0 bis 1) in einen Breitenfaktor umrechnen; Stufen unter „Ansicht“. Beim Pinsel macht ein schräg gehaltener Stift breitere Striche. */
const PRESS={soft:[0.72,1.3,0.85],normal:[0.35,1.6,0.9],strong:[0.12,2.1,1.1]};
function pressW(p,e){
  const c=PRESS[uiCfg.press]||PRESS.normal; let f=c[0]+(c[1]-c[0])*Math.pow(Math.min(1,Math.max(0,p)),c[2]);
  if(tool==='brush'&&e&&typeof e.altitudeAngle==='number'&&e.altitudeAngle<1.2) f*=1+(1.2-e.altitudeAngle)*0.9;
  return f;
}
const KINDS={
  rect:{label:'Rechteck',w:140,h:80},
  ellipse:{label:'Ellipse',w:130,h:80},
  text:{label:'Text',w:160,h:30,fill:'none',text:'Text'},
  note:{label:'Notiz',w:150,h:110,fill:'#fff3b0'},
  bullets:{label:'Aufzählung',as:'text',w:320,h:90,fill:'none',text:'Erster Punkt\nZweiter Punkt\nDritter Punkt',list:1},
  checklist:{label:'Checkliste',as:'text',w:320,h:90,fill:'none',text:'Erste Aufgabe\nZweite Aufgabe\nDritte Aufgabe',chk:1},
  lineArrow:{label:'Pfeil',line:'arrow',w:140,h:40},
  linePlain:{label:'Linie',line:'none',w:140,h:40},
  gSquare:{label:'Quadrat',as:'rect',w:100,h:100},
  gRound:{label:'Abgerundet',as:'round',w:140,h:80},
  gCircle:{label:'Kreis',as:'ellipse',w:90,h:90},
  gDia:{label:'Raute',as:'diamond',w:120,h:90},
  tri:{label:'Dreieck',w:120,h:100},
  hex:{label:'Sechseck',w:140,h:90},
  trap:{label:'Trapez',w:140,h:90},
  para:{label:'Parallelogramm',w:150,h:80},
  star:{label:'Stern',w:110,h:110},
  arrowr:{label:'Blockpfeil',w:140,h:70},
  arrowlr:{label:'Doppelpfeil',w:150,h:70},
  bubble:{label:'Sprechblase',w:160,h:110},
  cloud:{label:'Wolke',w:160,h:100},
  cross:{label:'Kreuz',w:90,h:90},
  card:{label:'Karte',w:140,h:70,fill:'#fff3b0'},
  image:{label:'Bild',w:240,h:160},
  mindmap:{label:'Mindmap',tpl:2,w:760,h:420},
  frame:{label:'Folie',w:640,h:360,fill:'none'},
  quiz:{label:'Quizfolie',tpl:2,w:640,h:360},
  check:{label:'Antwort',w:520,h:44,fill:'none',text:'Antwort'},
  table:{label:'Tabelle',tpl:1,w:360,h:144},
  kanban:{label:'Kanban-Board',tpl:1,w:600,h:400},
  scrum:{label:'Scrum-Board',tpl:1,w:850,h:420},
  term:{label:'Start / Ende',w:130,h:50},
  diamond:{label:'Entscheidung',w:130,h:90},
  io:{label:'Ein-/Ausgabe',w:150,h:70},
  doc:{label:'Dokument',w:140,h:90},
  db:{label:'Datenbank',w:100,h:90},
  evstart:{label:'Start',w:40,h:40},
  evmid:{label:'Zwischen',w:40,h:40},
  evend:{label:'Ende',w:40,h:40},
  evmsg:{label:'Nachricht',w:40,h:40},
  evtimer:{label:'Timer',w:40,h:40},
  evmidmsg:{label:'Zwischen: Nachricht',w:40,h:40},
  evmidtimer:{label:'Zwischen: Timer',w:40,h:40},
  evendmsg:{label:'Ende: Nachricht',w:40,h:40},
  evterm:{label:'Ende: Abbruch',w:40,h:40},
  everr:{label:'Ende: Fehler',w:40,h:40},
  taskuser:{label:'Benutzer-aufgabe',w:140,h:80},
  tasksvc:{label:'Service-aufgabe',w:140,h:80},
  tasksend:{label:'Sende-aufgabe',w:140,h:80},
  taskrecv:{label:'Empfangs-aufgabe',w:140,h:80},
  callact:{label:'Aufruf-aktivität',w:140,h:80},
  round:{label:'Aufgabe',w:140,h:80},
  subproc:{label:'Teilprozess',w:160,h:90},
  gwx:{label:'Gateway XOR',w:50,h:50},
  gwplus:{label:'Gateway UND',w:50,h:50},
  gwo:{label:'Gateway ODER',w:50,h:50},
  gwev:{label:'Gateway Ereignis',w:50,h:50},
  data:{label:'Datenobjekt',w:60,h:80},
  datastore:{label:'Daten-speicher',as:'db',w:70,h:60},
  pool:{label:'Pool',w:700,h:220,text:'Pool'},
  lane:{label:'Lane',as:'pool',w:670,h:120,text:'Lane'},
  poollanes:{label:'Pool mit Lanes',tpl:2,w:700,h:240},
  bgroup:{label:'Gruppe',w:220,h:140,fill:'none'},
  flowseq:{label:'Sequenz-fluss',line:'arrow',w:140,h:40},
  flowmsg:{label:'Nachrichten-fluss',line:'msg',dash:true,w:140,h:40},
  flowassoc:{label:'Assoziation',line:'none',dash:true,w:140,h:40},
  annot:{label:'Anmerkung',w:160,h:60,fill:'none'},
  erent:{label:'Entität',as:'rect',w:140,h:60,text:'Entität'},
  erweak:{label:'Schwache Entität',w:140,h:60},
  errel:{label:'Beziehung',as:'diamond',w:130,h:70},
  erattr:{label:'Attribut',as:'ellipse',w:110,h:50},
  erkey:{label:'Schlüssel',w:110,h:50,text:'id'},
  ertable:{label:'Entitäts-tabelle',tpl:1,w:170,h:116},
  umlclass:{label:'Klasse',tpl:1,w:190,h:132},
  umliface:{label:'Interface',tpl:1,w:190,h:96},
  umlactor:{label:'Akteur',w:40,h:70},
  umlcase:{label:'Anwendungs-fall',as:'ellipse',w:150,h:70},
  umlpkg:{label:'Paket',w:160,h:100},
  umlnote:{label:'UML-Notiz',w:140,h:70},
  umllife:{label:'Lebenslinie',w:120,h:260},
  nsstmt:{label:'Anweisung',as:'rect',w:240,h:40},
  nsif:{label:'Verzweigung',w:240,h:60,text:'Bedingung?'},
  nsloop:{label:'Schleife (Kopf)',w:240,h:120,text:'solange …'},
  nsloopf:{label:'Schleife (Fuß)',w:240,h:120,text:'bis …'},
  nscall:{label:'Aufruf',w:240,h:40},
  netrouter:{label:'Router',w:70,h:70},
  netswitch:{label:'Switch',w:100,h:50},
  netfw:{label:'Firewall',w:70,h:60},
  netserver:{label:'Server',w:60,h:90},
  netpc:{label:'PC',w:80,h:70},
  netlaptop:{label:'Notebook',w:100,h:60},
  netprinter:{label:'Drucker',w:80,h:70},
  netap:{label:'WLAN',w:70,h:70},
  netphone:{label:'Smartphone',w:40,h:70},
  netcloud:{label:'Internet',as:'cloud',w:150,h:95,text:'Internet'},
  netdb:{label:'Speicher',as:'db',w:80,h:80}
};
const GROUPS=[['Allgemein',['lineArrow','linePlain','rect','gSquare','gRound','ellipse','gCircle','tri','gDia','hex','trap','para','star','arrowr','arrowlr','bubble','cloud','cross','note','bullets','checklist','image','table','card']],
  ['Vorlagen',['kanban','scrum','mindmap']],
  ['Präsentation',['frame','quiz','check']],
  ['Flussdiagramm',['term','diamond','io','doc','db']],
  ['Netzwerk',['netrouter','netswitch','netfw','netserver','netpc','netlaptop','netprinter','netap','netphone','netcloud','netdb']],
  ['BPMN',['evstart','evmid','evend','evmsg','evtimer','evmidmsg','evmidtimer','evendmsg','evterm','everr','round','taskuser','tasksvc','tasksend','taskrecv','subproc','callact','gwx','gwplus','gwo','gwev','flowseq','flowmsg','flowassoc','pool','lane','poollanes','data','datastore','annot','bgroup']],
  ['ER-Diagramm',['erent','erweak','errel','erattr','erkey','ertable']],
  ['UML',['umlclass','umliface','umlactor','umlcase','umlpkg','umlnote','umllife']],
  ['Struktogramm',['nsstmt','nsif','nsloop','nsloopf','nscall']]];

const $=id=>document.getElementById(id);
const svg=$('board'), worldG=$('world'), itemsG=$('items'), overlayG=$('overlay'), gridP=$('grid');
const editor=$('editor'), propsEl=$('props'), palEl=$('palette'), toastEl=$('toast'), menu=$('menu');
const mctx=document.createElement('canvas').getContext('2d');

let doc={items:[],n:0};
let view={x:0,y:0,k:1};
let sel=new Set();
let tool='select';
let drawTool='pen';
const penStyles={pen:{stroke:INK,sw:3,tip:'round'},brush:{stroke:INK,sw:12,tip:'round'},marker:{stroke:'#f2c200',sw:20,tip:'flat'},smart:{stroke:INK,sw:3,tip:'round'}};
let hist=[],hi=-1;
let editCell=null;
let palState={closed:false,open:{Allgemein:true}};
const sum=a=>a.reduce((x,y)=>x+y,0);
let coarse=window.matchMedia&&window.matchMedia('(pointer:coarse)').matches;
let action=null, pinch=null, liveEl=null, hoverId=null, editing=null, lastTap=null, spaceDown=false, dl=null;
const touches=new Map();

const r=n=>Math.round(n*100)/100;
const snap=v=>Math.round(v/GRID)*GRID;
const up10=v=>Math.ceil(v/GRID)*GRID;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const byId=id=>doc.items.find(i=>i.id===id);
const DEV=(()=>{ let d=null; try{ d=localStorage.getItem('skizix-dev'); }catch(e){} if(!d||!/^[a-z0-9]{4}$/.test(d)){ d=Math.random().toString(36).slice(2,6).padEnd(4,'0'); try{ localStorage.setItem('skizix-dev',d); }catch(e){} } return d; })();
const nid=()=>'i'+(++doc.n)+'_'+DEV;   /* Gerätekennung im Namen: zwei Geräte am selben Live-Board vergeben nie dieselbe ID */
const isSq=k=>k.startsWith('ev')||k.startsWith('gw');
const isBox=k=>k==='pool'||k==='table'||k==='nsloop'||k==='nsloopf'||k==='frame';
const noDock=k=>k==='pool'||k==='table'||k==='frame'||k==='bgroup'||k==='check';
function isDark(c){ if(!/^#[0-9a-f]{6}$/i.test(c))return false; const n=parseInt(c.slice(1),16); return (0.299*(n>>16)+0.587*((n>>8)&255)+0.114*(n&255))/255<0.45; }
function measure(t){ mctx.font=(ITAL?'italic ':'')+(BOLD?'600 ':'')+FS+'px '+FAM; return mctx.measureText(t).width; }
function wrap(text,maxW){
  const out=[];
  for(const para of String(text).split('\n')){
    let line='';
    for(const wd of para.split(/\s+/)){
      const t=line?line+' '+wd:wd;
      if(line&&measure(t)<=maxW){ line=t; continue; }
      if(line) out.push(line);
      line=wd;
      while(line.length>1&&measure(line)>maxW){   /* ein einzelnes Wort ist breiter als die Form: an passender Stelle trennen */
        let cut=line.length-1; while(cut>1&&measure(line.slice(0,cut))>maxW) cut--;
        out.push(line.slice(0,cut)); line=line.slice(cut);
      }
    }
    out.push(line);
  }
  return out;
}

