/* ---------- Leisten, Menü, Tastatur ---------- */
$('tools').addEventListener('click',e=>{ const b=e.target.closest('[data-tool]'); if(b){ finishEdit(); if(palState.optsClosed){ palState.optsClosed=false; savePal(); } setTool(b.dataset.tool); updateProps(); } });
$('undo').onclick=undo; $('redo').onclick=redo; $('keysBtn').onclick=()=>{ closeHdrPops(); openKeys(); };
function zoomStep(d){ const p=Math.round(view.k*100), n=d>0?Math.floor(p/10)*10+10:Math.ceil(p/10)*10-10; zoomCenter(clamp(n,20,400)/100/view.k); }   /* immer auf volle 10 % */
$('zoomIn').onclick=()=>zoomStep(1); $('zoomOut').onclick=()=>zoomStep(-1); $('zoomLabel').onclick=()=>zoomCenter(1/view.k);
function fitMenu(){}
/* Kleine Auswahlfelder unter den Knöpfen oben: Export, Präsentation, Live */
const HDRPOPS=[['expBtn','expPop'],['playBtn','presPop'],['liveBtn','livePop']];
function closeHdrPops(){ for(const [b,p] of HDRPOPS){ if(!$(p).hidden){ $(p).hidden=true; $(b).setAttribute('aria-expanded','false'); } } }
function closeExpPop(){ closeHdrPops(); }
for(const [bid,pid] of HDRPOPS){
  $(bid).onclick=e=>{ e.stopPropagation(); const p=$(pid), was=!p.hidden; closeHdrPops(); if(was) return;
    closeViewPop(); closeKtPop(); closeMenu(); if(pid==='livePop') liveBadge(); p.hidden=false; $(bid).setAttribute('aria-expanded','true');
    const br=$(bid).getBoundingClientRect(), z=uiCfg.scale, w=p.offsetWidth*z; p.style.left=Math.max(6,Math.min(innerWidth-w-6,br.left+br.width/2-w/2))/z+'px'; p.style.top=(br.bottom+6)/z+'px';
    if(e.detail===0){ const f=p.querySelector('button:not([hidden]),input'); if(f) f.focus(); } };
  $(pid).addEventListener('click',e=>{ const b=e.target.closest('[data-m]'); if(!b) return; closeHdrPops(); menuDo(b.dataset.m); });
}
document.addEventListener('pointerdown',e=>{ if(!e.target.closest('.hdrPop,#expBtn,#playBtn,#liveBtn')) closeHdrPops(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ const o=HDRPOPS.find(([b,p])=>!$(p).hidden); if(o){ e.preventDefault(); e.stopImmediatePropagation(); closeHdrPops(); $(o[0]).focus(); } } },true);
document.addEventListener('pointerdown',e=>{ if(document.body.classList.contains('compact')&&!palState.propsClosed&&!menu.contains(e.target)&&!e.target.closest('#propsToggle')) closeMenu(); });

function buildSVG(box){
  const b=box||contentBox(30,true); if(!b) return null;
  const ed=editing, nt=noText; editing=null; noText=false; plainOut=true; const body=doc.items.filter(i=>i.kind!=='frame').map(itemSVG).join(''); editing=ed; noText=nt; plainOut=false;
  return {w:b.w,h:b.h,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${b.w}" height="${b.h}" viewBox="${b.x} ${b.y} ${b.w} ${b.h}"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${darkBoard?paper():'#ffffff'}"/><style>${$('fontBoard').textContent}</style>${body}</svg>`};
}
async function getDl(){
  if(dl) return dl;
  for(let i=0;i<20&&!(window.claude&&window.claude.use);i++) await new Promise(r=>setTimeout(r,150));
  try{ dl=(window.claude&&window.claude.use)?await window.claude.use('downloads'):null; }catch(e){ dl=null; }
  return dl;
}
async function saveFile(filename,data){
  toast('Export wird vorbereitet …');
  const d=await getDl();
  if(d){
    try{ await d.save({filename,data}); toast('Gespeichert: '+filename); }
    catch(err){ if(err&&err.code==='declined') toastEl.hidden=true; else toast('Speichern hat nicht geklappt. Bitte noch einmal versuchen.'); }
    return;
  }
  const ext=filename.split('.').pop(), mime={png:'image/png',svg:'image/svg+xml',pdf:'application/pdf',json:'application/json'}[ext]||'application/octet-stream';
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(ios&&navigator.canShare){   /* iPad/iPhone: über "Teilen" sichern, ein normaler Download klappt dort oft nicht */
    const f=new File([data],filename,{type:mime});
    if(navigator.canShare({files:[f]})){
      try{ await navigator.share({files:[f]}); toastEl.hidden=true; return; }
      catch(e){ if(e&&e.name==='AbortError'){ toastEl.hidden=true; return; } }
    }
  }
  try{
    const a=document.createElement('a'), url=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type:mime}));
    a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),10000);
    toast('Download gestartet: '+filename+'. Kommt nichts an, lade die Seite neu und versuche es noch einmal.');
  }catch(e){ toast('In dieser Ansicht sind keine Downloads möglich. Lade die Seite neu oder öffne sie im Browser.'); }
}
function rasterize(mime,scaleMax,box){
  return new Promise((res,rej)=>{
    const s=buildSVG(box); if(!s) return rej('empty');
    const img=new Image();
    img.onload=()=>{ const sc=Math.min(scaleMax,6000/Math.max(s.w,s.h)),c=document.createElement('canvas');
      c.width=Math.round(s.w*sc); c.height=Math.round(s.h*sc); const g=c.getContext('2d');
      g.fillStyle=darkBoard?paper():'#fff'; g.fillRect(0,0,c.width,c.height); g.drawImage(img,0,0,c.width,c.height);
      c.toBlob(b=>b?res({blob:b,w:c.width,h:c.height}):rej('render'),mime,0.93); };
    img.onerror=()=>rej('render');
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s.svg);
  });
}
async function makePDF(pages){   /* je Bild eine A4-Seite, quer oder hoch je nach Format */
  const enc=new TextEncoder(), parts=[], offs=[]; let len=0;
  const add=p=>{ const b=typeof p==='string'?enc.encode(p):p; parts.push(b); len+=b.length; };
  const obj=(n,body)=>{ offs[n]=len; add(n+' 0 obj\n'); body(); add('\nendobj\n'); };
  const n=pages.length, jpgs=[]; for(const p of pages) jpgs.push(new Uint8Array(await p.blob.arrayBuffer()));
  add('%PDF-1.4\n');
  obj(1,()=>add('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2,()=>add(`<< /Type /Pages /Kids [${pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')}] /Count ${n} >>`));
  pages.forEach((p,i)=>{ const o=3+i*3, jpg=jpgs[i], iw=p.w, ih=p.h, land=iw>=ih, PW=land?841.89:595.28, PH=land?595.28:841.89, M=28;
    const sc=Math.min((PW-2*M)/iw,(PH-2*M)/ih), w=iw*sc, h=ih*sc, px=(PW-w)/2, py=(PH-h)/2;
    obj(o,()=>add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${o+1} 0 R >> >> /Contents ${o+2} 0 R >>`));
    obj(o+1,()=>{ add(`<< /Type /XObject /Subtype /Image /Width ${iw} /Height ${ih} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`); add(jpg); add('\nendstream'); });
    const cs=`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${px.toFixed(2)} ${py.toFixed(2)} cm /Im0 Do Q`;
    obj(o+2,()=>add(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`)); });
  const N=3+n*3, xref=len; let t=`xref\n0 ${N}\n0000000000 65535 f \n`;
  for(let i=1;i<N;i++) t+=String(offs[i]).padStart(10,'0')+' 00000 n \n';
  add(t+`trailer\n<< /Size ${N} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts,{type:'application/pdf'});
}
