/* Leeres Board: zurückhaltender Startbereich mit drei Wegen, beliebten Vorlagen und Gesten-Tipps.
   Er verschwindet, sobald etwas auf der Tafel liegt. */
const START_TPL=['Einkaufsliste','Wochenplaner','To-do-Liste','Retrospektive'];
const SA_IC={tpl:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  shape:'<rect x="4" y="5" width="11" height="9" rx="1.500"/><circle cx="15.500" cy="15.500" r="4.500"/>', pen:'<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>'};
function saTipsOff(){ try{ return localStorage.getItem('skizix-starttipps')==='aus'; }catch(e){ return false; } }
function buildStart(){
  const a=$('startArea'), touch=!isPC;
  const tips=touch?[['Doppeltippen: Text ändern'],['Zwei Finger: Tafel bewegen und zoomen'],['Kästchen antippen: abhaken']]
                  :[['Doppelklick: Text ändern'],['Mausrad: bewegen · Strg + Mausrad: zoomen'],['Leertaste halten: Tafel verschieben']];
  const card=(m,c,ic,t,d)=>`<button type="button" class="saCard" data-sa="${m}" style="--c:var(--c-${c})"><i><svg viewBox="0 0 24 24" aria-hidden="true">${SA_IC[ic]}</svg></i><b>${t}</b><span>${d}</span></button>`;
  const tpls=START_TPL.map(n=>{ const i=TEMPLATES.findIndex(t=>t.name===n); return i<0?'':`<button type="button" class="saTpl" data-st="${i}">${tplPreview(TEMPLATES[i])}<b>${esc(n)}</b><small>${esc(TKAT[n]||'Beruf')}</small></button>`; }).join('');
  a.innerHTML=`<div class="saBox" role="region" aria-label="Einstieg"><h2>Leeres Board – wie möchtest du anfangen?</h2><p class="saSub">Dieser Bereich verschwindet, sobald etwas auf der Tafel liegt.</p>
    <div class="saCards">${card('tpl','gold','tpl','Mit Vorlage starten','Einkaufsliste, Wochenplaner, Retro und über 20 weitere')}${card('shape','violet','shape','Formen hinzufügen','Öffnet die Formenleiste – Form antippen oder auf die Tafel ziehen')}${card('pen','coral','pen','Frei zeichnen',touch?'Mit Stift oder Finger direkt loslegen – wie auf Papier':'Mit Maus oder Stift direkt loslegen – wie auf Papier')}</div>
    <div class="saRow"><h3>Beliebte Vorlagen</h3><button type="button" class="saLink" data-sa="tpl">Alle Vorlagen ansehen →</button></div>
    <div class="saTpls">${tpls}</div>
    <div class="saTips"${saTipsOff()?' hidden':''}>${tips.map(t=>`<span>${t[0]}</span>`).join('')}<button type="button" class="saLink" data-sa="tipsoff">Tipps ausblenden</button></div></div>`;
  a.dataset.done='1';
}
function updateStart(){
  const a=$('startArea'); if(!a||!saReady) return;
  const show=doc.items.length===0&&!document.body.classList.contains('liveview')&&!editing
    &&!(location.hostname==='localhost'&&!localStorage.getItem('skizix-test-start'));   /* (Tests auf localhost: nur wenn ausdrücklich gewünscht) */
  if(show&&!a.dataset.done) buildStart();
  a.hidden=!show;
}
$('startArea').addEventListener('click',e=>{
  const t=e.target.closest('[data-st]'); if(t){ insertTpl(+t.dataset.st); return; }
  const b=e.target.closest('[data-sa]'); if(!b) return;
  switch(b.dataset.sa){
    case 'tpl': openTpl(); break;
    case 'shape': palState.closed=false; savePal(); renderPal(); setTool('select'); { const q=$('palQ'); if(q&&isPC) q.focus(); } break;
    case 'pen': setTool('stifte'); $('startArea').hidden=true; svg.focus(); break;
    case 'tipsoff': try{ localStorage.setItem('skizix-starttipps','aus'); }catch(_){} b.parentNode.hidden=true; break;
  }
});
var saReady=true;
