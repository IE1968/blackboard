/* ---------- Ansicht: Fläche und Muster der Tafel (pro Board), Farbthema der Oberfläche und Anzeige (pro Gerät) ---------- */
/* Flächen: bg = Farbe der Tafel, dot = Farbe von Punkten und Linien, dark = helle Schrift und Linien auf dunkler Fläche */
const SURF={
  white:{n:'Weiß',bg:'#ffffff',dot:'#d4d4d2',dark:false,g:1},
  grey:{n:'Hellgrau',bg:'#ececea',dot:'#c3c3c0',dark:false,g:1},
  heft:{n:'Schulheft',bg:'#fffef6',dot:'#b9d3ec',dark:false,g:1},
  night:{n:'Nacht',bg:'#18181a',dot:'#3a3a40',dark:true,g:1},
  anthra:{n:'Anthrazit',bg:'#2b2d30',dot:'#4a4d53',dark:true,g:1},
  black:{n:'Schwarz',bg:'#0b0b0c',dot:'#2e2e33',dark:true,g:1},
  chalk:{n:'Tafelgrün',bg:'#26392e',dot:'#3f5848',dark:true,g:1},
  blue:{n:'Blaupause',bg:'#163a66',dot:'#2f5f96',dark:true,g:1},
  paper:{n:'Leinen',bg:'#f3f2ee',dot:'#cfccc3',dark:false,g:2},
  used:{n:'Vintage hell',bg:'#e4e0d6',dot:'#b9b2a3',dark:false,g:2},
  stone:{n:'Stein',bg:'#d2d1cc',dot:'#a7a59e',dark:false,g:2},
  cloth:{n:'Textil',bg:'#dcd8cf',dot:'#b2ac9f',dark:false,g:2},
  grunge:{n:'Grunge',bg:'#9c9d98',dot:'#7f807b',dark:false,g:2},
  slate:{n:'Schiefer',bg:'#2f3a3d',dot:'#4d5c60',dark:true,g:2},
  usedd:{n:'Vintage dunkel',bg:'#1f2122',dot:'#3d4243',dark:true,g:2}
};
const PATS={dots:'Punkte',grid:'Kariert',lines:'Liniert',mm:'Millimeter',none:'Leer'};
const THEMES={blue:{n:'Blau',sel:['#5b8cf5','#3b6fe8']}};   /* Auswahlfarbe auf dunkler bzw. heller Tafel */
function bgDefault(){
  let s=null; try{ s=JSON.parse(lsGet('skizix-flaeche')); }catch(e){}
  if(s&&SURF[s.s]&&PATS[s.p]) return s;
  return {s:lsGet('blackboard-bg')==='light'?'white':'night',p:uiCfg.grid===false?'none':'dots'};
}
function bgCur(){ const b=doc&&doc.bg; return b&&SURF[b.s]&&PATS[b.p]?b:bgDefault(); }
function cleanBg(b){ return b&&typeof b==='object'&&SURF[b.s]&&PATS[b.p]?{s:b.s,p:b.p}:null; }
var bgShown='';
/* Fläche und Muster anwenden; wird bei jedem Zeichnen aufgerufen, tut aber nur bei einer Änderung etwas */
function applyBg(){
  const b=bgCur(), key=b.s+'/'+b.p+'/'+uiCfg.theme+'/'+(uiCfg.hc?1:0); if(key===bgShown) return; bgShown=key;
  const S=SURF[b.s], st=$('stage');
  darkBoard=S.dark; SEL=(THEMES[uiCfg.theme]||THEMES.blue).sel[S.dark?0:1];
  st.classList.toggle('dark',S.dark); st.dataset.surf=b.s;
  st.style.setProperty('--paper',S.bg); st.style.setProperty('--dot',uiCfg.hc?(S.dark?'#6f8086':'#8d999b'):S.dot);
  st.style.setProperty('--hint-bg',S.dark?'rgba(24,24,26,.85)':'rgba(255,255,255,.85)');
  document.body.style.setProperty('--sel',SEL); editor.style.borderColor=SEL;
  gridP.dataset.p=b.p; patShape();
  if(!$('viewPop').hidden) renderViewPop();
}
/* Inhalt des Musters in der aktuellen Rastergröße */
function patShape(){
  const p=gridP.dataset.p||'dots', g=+gridP.getAttribute('width')||20, h=patHTML(p,g);
  if(gridP.dataset.h!==p+g){ gridP.dataset.h=p+g; gridP.innerHTML=h; }
  $('gridRect').style.display=p==='none'?'none':'';
}
function patHTML(p,g){
  const o=1.5, c='var(--dot)'; let h='';
  if(p==='dots') h=`<circle cx="${o}" cy="${o}" r="1.3" fill="${c}"/>`;
  else if(p==='grid') h=`<path d="M${o} 0V${r(g)}M0 ${o}H${r(g)}" stroke="${c}" stroke-width="1" fill="none"/>`;
  else if(p==='lines') h=`<path d="M0 ${o}H${r(g)}" stroke="${c}" stroke-width="1" fill="none"/>`;
  else if(p==='mm'){ const q=g/5; let d=''; for(let i=1;i<5;i++) d+=`M${r(o+q*i)} 0V${r(g)}M0 ${r(o+q*i)}H${r(g)}`;
    h=`<path d="${d}" stroke="${c}" stroke-width=".6" stroke-opacity=".55" fill="none"/><path d="M${o} 0V${r(g)}M0 ${o}H${r(g)}" stroke="${c}" stroke-width="1.1" fill="none"/>`; }
  return h;
}
/* Fläche oder Muster für dieses Board wählen (geht an alle, die das Board sehen) */
function setBoardSurface(ch){
  if(liveRO()) { toast('Nur der Besitzer und Mitzeichnende können die Tafel ändern.'); return; }
  const b=Object.assign({},bgCur(),ch); if(b.s==='heft'&&!ch.p&&bgCur().s!=='heft') b.p='lines';
  finishEdit(); doc.bg={s:b.s,p:b.p}; lsSet('skizix-flaeche',JSON.stringify(doc.bg));
  commit(); render();
}
function setBoardBg(d,keep){   /* schneller Wechsel hell/dunkel */
  if(keep) return; setBoardSurface({s:d?'night':'white'});
}
var BG_OK;
function applyTheme(){ bgShown=''; if(BG_OK) applyBg(); }
/* ---- Fenster „Ansicht“ ---- */
function renderViewPop(){
  const b=bgCur(), ro=liveRO();
  const sw=([k,s])=>`<button type="button" class="vpSw" data-s="${k}" aria-pressed="${b.s===k}" title="${s.n}"${ro?' disabled':''}><span style="background-color:${s.bg}" class="vpChip s-${k}${['white','grey','night','anthra','black'].includes(k)?' p-'+b.p:''}"></span><small>${s.n}</small></button>`, all=Object.entries(SURF);
  $('vpSurf').innerHTML='<div class="vpSub">Einfarbig</div>'+all.filter(e=>e[1].g===1).map(sw).join('')+'<div class="vpSub">Mit Struktur</div>'+all.filter(e=>e[1].g===2).map(sw).join('');
  $('vpSurf').querySelectorAll('.vpChip').forEach((c,i)=>{ const k=c.parentNode.dataset.s; c.style.setProperty('--dot',SURF[k].dot); });
  const S=SURF[b.s];
  $('vpPat').innerHTML=Object.entries(PATS).map(([k,n])=>`<button type="button" class="vpSw" data-p="${k}" aria-pressed="${b.p===k}" title="${n}"${ro?' disabled':''}><span class="vpChip p-${k}" style="background-color:${S.bg};--dot:${S.dot}"></span><small>${n}</small></button>`).join('');
  document.querySelectorAll('#uiRow button').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.v===uiCfg.scale));
  document.querySelectorAll('#appRow button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.app===uiCfg.app));
  $('hcBtn').setAttribute('aria-pressed',uiCfg.hc); $('snapBtn').setAttribute('aria-pressed',uiCfg.snap);
  document.querySelectorAll('#pressRow button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.press===uiCfg.press)); $('fingerBtn').setAttribute('aria-pressed',uiCfg.finger);
}
function placeViewPop(){
  const p=$('viewPop'), br=$('viewBtn').getBoundingClientRect(), z=uiCfg.scale, w=p.offsetWidth*z;
  const left=Math.max(6,Math.min(innerWidth-w-6,br.left+br.width/2-w/2));
  p.style.left=left/z+'px'; p.style.top=(br.bottom+6)/z+'px';
  const vh=(window.visualViewport&&window.visualViewport.height)||innerHeight; p.style.maxHeight=Math.max(200,(vh-br.bottom-14)/z)+'px';
}
function openViewPop(){ closeMenu(); closeKtPop(); renderViewPop(); $('viewPop').hidden=false; $('viewBtn').setAttribute('aria-expanded','true'); placeViewPop(); }
function closeViewPop(){ if($('viewPop').hidden) return; $('viewPop').hidden=true; $('viewBtn').setAttribute('aria-expanded','false'); }
$('viewBtn').onclick=e=>{ e.stopPropagation(); if($('viewPop').hidden) openViewPop(); else closeViewPop(); };
$('viewPop').addEventListener('click',e=>{
  e.stopPropagation(); const t=e.target.closest('button'); if(!t||t.disabled) return;
  if(t.dataset.s) setBoardSurface({s:t.dataset.s});
  else if(t.dataset.p) setBoardSurface({p:t.dataset.p});
  else if(t.dataset.app) setUi({app:t.dataset.app});
  else if(t.dataset.m==='ui') setUi({scale:+t.dataset.v,scaleSet:true});
  else if(t.dataset.m==='hc') setUi({hc:!uiCfg.hc});
  else if(t.dataset.m==='snap') setUi({snap:!uiCfg.snap});
  else if(t.dataset.press) setUi({press:t.dataset.press});
  else if(t.dataset.m==='finger') setUi({finger:!uiCfg.finger,fingerSet:true});
  renderViewPop(); placeViewPop();
});
document.addEventListener('pointerdown',e=>{ if(!$('viewPop').hidden&&!e.target.closest('#viewPop,#viewBtn')) closeViewPop(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!$('viewPop').hidden){ e.preventDefault(); e.stopImmediatePropagation(); closeViewPop(); $('viewBtn').focus(); } },true);
window.addEventListener('resize',()=>{ if(!$('viewPop').hidden) placeViewPop(); });
/* ---- Knopf „Konto“ ganz rechts ---- */
function ktBtnUi(){
  const b=$('ktBtn'); if(!b) return; const on=ktOn(), m=on?String(KT.s.email||'?'):'';
  b.classList.toggle('on',on); $('ktInitial').textContent=on?m.charAt(0).toUpperCase():'';
  b.title=on?'Angemeldet als '+m:'Anmelden: alle deine Boards auf allen Geräten';
  b.hidden=!liveOk();
}
function closeKtPop(){ const p=$('ktPop'); if(p&&!p.hidden) p.hidden=true; }
$('ktBtn').onclick=e=>{
  e.stopPropagation(); closeMenu(); closeViewPop();
  if(!ktOn()){ openKtDlg(); return; }
  const p=$('ktPop'); if(!p.hidden){ p.hidden=true; return; }
  $('ktPopMail').textContent=KT.s.email; p.hidden=false;
  const br=$('ktBtn').getBoundingClientRect(), z=uiCfg.scale; p.style.right=Math.max(6,innerWidth-br.right)/z+'px'; p.style.top=(br.bottom+6)/z+'px';
};
$('ktPopOut').onclick=()=>{ closeKtPop(); ktLogout(); };
document.addEventListener('pointerdown',e=>{ if(!e.target.closest('#ktPop,#ktBtn')) closeKtPop(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!$('ktPop').hidden){ e.preventDefault(); e.stopImmediatePropagation(); closeKtPop(); } },true);

/* Probierfläche für den Stiftdruck im Fenster „Ansicht“ */
(function(){
  const box=$('pressTest'), sv=$('pressSvg'); let st=null;
  box.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); try{ box.setPointerCapture(e.pointerId); }catch(_){}
    const rc=sv.getBoundingClientRect(), z=rc.width/sv.clientWidth||1, pr=e.pointerType==='pen'&&uiCfg.press!=='off';
    st={rc,z,pr,pts:[[(e.clientX-rc.left)/z,(e.clientY-rc.top)/z]],ws:[pr?pressW(e.pressure||0.25):1],f:pr?pressW(e.pressure||0.25):1}; box.classList.add('used'); });
  box.addEventListener('pointermove',e=>{ if(!st) return;
    const evs=e.getCoalescedEvents?(e.getCoalescedEvents()||[]):[];
    for(const ev of (evs.length?evs:[e])){ const x=(ev.clientX-st.rc.left)/st.z, y=(ev.clientY-st.rc.top)/st.z, l=st.pts[st.pts.length-1]; if(Math.hypot(x-l[0],y-l[1])<1.4) continue;
      if(st.pr){ st.f=st.f*0.62+pressW(ev.pressure>0?ev.pressure:0.25)*0.38; } st.pts.push([r(x),r(y)]); st.ws.push(r2(st.f)); }
    sv.innerHTML=strokeSVG({pts:st.pts,ws:st.pr?st.ws:null,tool:'pen',stroke:'#1c2a2e',sw:3,tip:'round'}); });
  const end=()=>{ st=null; }; box.addEventListener('pointerup',end); box.addEventListener('pointercancel',end);
})();
BG_OK=true;
