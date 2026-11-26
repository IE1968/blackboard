/* ---------- Auswahl der Stifte und Pinsel ----------
   Klick auf „Stift“ oder „Pinsel“: Das Werkzeug zeichnet sofort mit dem zuletzt gewählten Stift bzw. Pinsel,
   darunter öffnet sich die Auswahl. Der Knopf zeigt das Bild des gewählten Werkzeugs. */
const PEN_ICON={
  pencil:'<path d="M4 20l1.2-4.2L16 5l3 3L8.2 18.8z"/><path d="M5.2 15.8l3 3M14 7l3 3"/><path d="M4 20l2-.6-1.4-1.4z" fill="currentColor"/>',
  pen:'<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>',
  fountain:'<path d="M12 3l5 7-5 11-5-11z"/><path d="M12 10v6"/><circle cx="12" cy="10" r="1.2"/>',
  smart:'<path d="M3 21l3-1 8-8-2-2-8 8z"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><path d="M15 17a3 3 0 106 0 3 3 0 00-6 0"/>',
  water:'<path d="M12 3c3.2 4.2 6 7.6 6 11a6 6 0 01-12 0c0-3.4 2.8-6.8 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 002.5 2.5"/>',
  bristle:'<path d="M19 4l1.5 1.5-8 9-2.5 1 1-2.5zM9.5 16.5c-2 0-3 1.2-3 2.3S5.5 20 4 20c2.5 1 6.5.5 6.5-2.5"/>',
  chalk:'<path d="M4 15.5l9.5-9.5 4.5 4.5L8.5 20z"/><path d="M15.5 18.5h.01M19 15h.01M19.5 19.5h.01" stroke-width="2.4"/>',
  callig:'<path d="M4 19c4.5 0 5-4.5 7-7.5s3.5-5 6-5.5"/><path d="M15.5 4.5l4 4-2.5 1-2.5-2.5z"/>',
  spray:'<rect x="6" y="9" width="8" height="12" rx="1.5"/><path d="M8 9V6h4v3"/><path d="M17 5h.01M19.5 7.5h.01M19.5 3h.01M22 5.5h.01" stroke-width="2.2"/>'
};
function drawBtnSync(){   /* Knopfbild und -titel folgen dem gewählten Stift bzw. Pinsel */
  for(const [g,v] of [['stifte',uiCfg.penVar||'pen'],['pinsel',uiCfg.brushVar||'bristle']])
    document.querySelectorAll(`#tools [data-tool="${g}"], #phoneBar [data-tool="${g}"], #moreSheet [data-tool="${g}"]`).forEach(b=>{
      const s=b.querySelector('svg'); if(s&&s.dataset.v!==v){ s.innerHTML=PEN_ICON[v]; s.dataset.v=v; }
      b.setAttribute('aria-label',(g==='stifte'?'Stift':'Pinsel')+': '+DRAW[v]); });
}
function closeDrawPop(){ const p=$('drawPop'); if(p.hidden) return; p.hidden=true; document.querySelectorAll('[aria-haspopup][aria-expanded="true"]').forEach(b=>b.setAttribute('aria-expanded','false')); }
function openDrawPop(g,anchor){
  const p=$('drawPop'); if(!p.hidden&&p.dataset.g===g){ closeDrawPop(); return; }
  closeDrawPop(); p.dataset.g=g; p.setAttribute('aria-label',g==='stifte'?'Stift wählen':'Pinsel wählen');
  p.innerHTML=`<div class="dpH">${g==='stifte'?'Stifte':'Pinsel'}</div>`+GROUPS_DRAW[g].map(v=>`<button type="button" role="menuitemradio" data-var="${v}" aria-checked="${tool===v}"><svg viewBox="0 0 24 24" aria-hidden="true">${PEN_ICON[v]}</svg><span>${DRAW[v]}</span></button>`).join('');
  p.hidden=false; anchor.setAttribute('aria-expanded','true');
  const a=anchor.getBoundingClientRect(), w=p.offsetWidth, h=p.offsetHeight, up=a.top>innerHeight/2;
  p.style.left=Math.round(clamp(a.left+a.width/2-w/2,8,innerWidth-w-8))+'px';
  p.style.top=Math.round(up?a.top-h-8:a.bottom+8)+'px';
}
$('drawPop').addEventListener('click',e=>{ const b=e.target.closest('[data-var]'); if(!b) return;
  finishEdit(); setTool(b.dataset.var); updateProps(); closeDrawPop(); });
document.addEventListener('pointerdown',e=>{ if(!e.target.closest('#drawPop,[aria-haspopup][data-tool]')) closeDrawPop(); },true);
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!$('drawPop').hidden){ e.preventDefault(); e.stopImmediatePropagation(); closeDrawPop(); } },true);
addEventListener('resize',closeDrawPop);
