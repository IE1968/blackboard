/* ---------- Handy: Werkzeuge unten in Daumennähe, Formen und „Mehr“ als Blatt von unten ---------- */
function isPhone(){ return document.body.classList.contains('phone'); }
function phoneSync(){
  const t=tool, more=['brush','marker','smart','erase','pan','shape'];
  document.querySelectorAll('#phoneBar [data-tool],#moreSheet [data-tool]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===t));
  $('pbMore').classList.toggle('on',more.includes(t));
  $('pbPlus').setAttribute('aria-expanded',isPhone()&&!palState.closed);
}
function closeMore(){ const m=$('moreSheet'); if(m.hidden) return; m.hidden=true; $('pbMore').setAttribute('aria-expanded','false'); }
function openMore(){ closeHdrPops(); closeViewPop(); closeKtPop(); closeMenu(); if(!palState.closed){ palState.closed=true; renderPal(); } $('moreSheet').hidden=false; $('pbMore').setAttribute('aria-expanded','true'); phoneSync(); }
function pickTool(t){ finishEdit(); if(palState.optsClosed){ palState.optsClosed=false; savePal(); } setTool(t); updateProps(); }
$('phoneBar').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  if(b.dataset.tool){ closeMore(); if(!palState.closed){ palState.closed=true; renderPal(); } pickTool(b.dataset.tool); }
  else if(b.id==='pbPlus'){ closeMore(); closeMenu(); palState.closed=!palState.closed; savePal(); renderPal(); }
  else if(b.id==='pbMore'){ if($('moreSheet').hidden) openMore(); else closeMore(); }
  phoneSync();
});
$('moreSheet').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  if(b.dataset.tool){ closeMore(); pickTool(b.dataset.tool); phoneSync(); return; }
  closeMore();
  switch(b.dataset.ms){
    case 'files': palState.propsClosed=false; savePal(); applySides(); break;
    case 'tpl': openTpl(); break;
    case 'play': startPres(); break;
    case 'slides': toggleSlides(true); break;
    case 'exp': $('expBtn').click(); break;
    case 'view': openViewPop(); break;
    case 'help': openKeys('start'); break;
    case 'konto': $('ktBtn').click(); break;
  }
});
document.addEventListener('pointerdown',e=>{ if(!e.target.closest('#moreSheet,#pbMore')) closeMore(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!$('moreSheet').hidden){ e.preventDefault(); e.stopImmediatePropagation(); closeMore(); $('pbMore').focus(); } },true);
/* Form aus dem Blatt gewählt: Blatt schließen, damit man sie gleich sieht */
palEl.addEventListener('pointerup',()=>{ if(isPhone()&&!palState.closed) setTimeout(()=>{ if(sel.size){ palState.closed=true; renderPal(); phoneSync(); } },60); });
const _renderPalH=renderPal; renderPal=function(){ _renderPalH(); if(typeof phoneSync==='function') try{ phoneSync(); }catch(e){} };
phoneSync();
