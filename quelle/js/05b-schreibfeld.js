/* ---------- Schreibfeld ----------
   Das Eingabefeld ist ein bearbeitbarer Bereich mit einem Block je Absatz. So sind Fett, Kursiv,
   Unterstrichen, Durchgestrichen und Einrückung schon beim Tippen zu sehen.
   Nach außen verhält es sich wie ein Textfeld: value, selectionStart/End, setSelectionRange, select, setRangeText. */
(function(){
  const E=editor;
  const paras=()=>[...E.children];
  /* Normalform: nur DIV-Absätze, darin nur Text (ein <br> am Ende hält leere Absätze offen) */
  function canon(){ if(!E.childNodes.length) return false;
    for(const c of E.childNodes){ if(c.nodeType!==1||c.tagName!=='DIV') return false;
      for(const d of c.childNodes){ if(d.nodeType===3) continue; if(d.tagName==='BR'&&d===c.lastChild) continue; return false; } }
    return true; }
  /* Text aus beliebigem Inhalt (auch nach Einfügen oder Zusammenführen durch den Browser) */
  function looseText(root){ const L=[]; let cur=null;
    for(const c of root.childNodes){
      if(c.nodeType===3) cur=(cur||'')+c.data;
      else if(c.tagName==='BR'){ L.push(cur||''); cur=null; }
      else if(/^(DIV|P|LI|H[1-6])$/.test(c.tagName)){ if(cur!==null){ L.push(cur); cur=null; } L.push(c.textContent); }
      else cur=(cur||'')+c.textContent; }
    if(cur!==null) L.push(cur);
    return (L.length?L:['']).join('\n').replace(/ /g,' '); }
  function build(lines){ E.textContent='';
    for(const t of lines){ const d=document.createElement('div'); if(t) d.textContent=t; else d.appendChild(document.createElement('br')); E.appendChild(d); }
    edStyle(); }
  function idxOf(node,off){   /* Stelle im Text für eine Position im Feld */
    if(!E.contains(node)) return null;
    const r=document.createRange(); r.setStart(E,0); try{ r.setEnd(node,off); }catch(e){ return null; }
    const f=document.createElement('div'); f.appendChild(r.cloneContents()); return looseText(f).length; }
  function posOf(i){   /* Position im Feld für eine Stelle im Text */
    const P=paras(); if(!P.length) return [E,0];
    for(const p of P){ const L=p.textContent.length;
      if(i<=L){ const w=document.createTreeWalker(p,NodeFilter.SHOW_TEXT); let n,last=null;
        while((n=w.nextNode())){ last=n; if(i<=n.data.length) return [n,i]; i-=n.data.length; }
        return last?[last,last.data.length]:[p,0]; }
      i-=L+1; }
    const p=P[P.length-1], w=document.createTreeWalker(p,NodeFilter.SHOW_TEXT); let n,last=null; while((n=w.nextNode())) last=n;
    return last?[last,last.data.length]:[p,0]; }
  let last=[0,0];
  function curSel(){ const s=getSelection(); if(s&&s.rangeCount&&E.contains(s.anchorNode)){
      const r=s.getRangeAt(0), a=idxOf(r.startContainer,r.startOffset), b=idxOf(r.endContainer,r.endOffset);
      if(a!=null&&b!=null) last=[a,b]; }
    return last; }
  Object.defineProperty(E,'value',{get(){ return canon()?paras().map(p=>p.textContent).join('\n').replace(/ /g,' '):looseText(E); },
    set(v){ build(String(v==null?'':v).replace(/\r\n?/g,'\n').split('\n')); last=[0,0]; }});
  Object.defineProperty(E,'selectionStart',{get(){ return curSel()[0]; }});
  Object.defineProperty(E,'selectionEnd',{get(){ return curSel()[1]; }});
  E.setSelectionRange=function(a,b){ const n=E.value.length; a=Math.max(0,Math.min(n,a|0)); b=Math.max(a,Math.min(n,b==null?a:b|0)); last=[a,b];
    const [an,ao]=posOf(a), [bn,bo]=posOf(b), s=getSelection(); try{ s.setBaseAndExtent(an,ao,bn,bo); }catch(e){} };
  E.select=function(){ E.setSelectionRange(0,E.value.length); };
  E.setRangeText=function(t,a,b){ const v=E.value; a=a==null?E.selectionStart:a; b=b==null?E.selectionEnd:b;
    E.value=v.slice(0,a)+t+v.slice(b); E.setSelectionRange(a+t.length); };
  function ins(t){ const [a,b]=curSel(); E.setRangeText(t,a,b); E.dispatchEvent(new Event('input')); }
  E.addEventListener('beforeinput',e=>{ const t=e.inputType;
    if(t==='insertParagraph'||t==='insertLineBreak'){ e.preventDefault(); ins('\n'); }
    else if(t==='insertFromDrop'||t==='insertFromPaste'&&e.dataTransfer){ e.preventDefault(); const s=e.dataTransfer?e.dataTransfer.getData('text/plain'):''; if(s) ins(s); }
    else if(/^format/.test(t)){ e.preventDefault(); const a={formatBold:'bold',formatItalic:'ital',formatUnderline:'ul',formatStrikeThrough:'strike'}[t]; if(a) edFormat(a); } });
  E.addEventListener('paste',e=>{ e.preventDefault(); e.stopPropagation(); const s=e.clipboardData?e.clipboardData.getData('text/plain'):''; if(s) ins(s); });
  E.addEventListener('drop',e=>{ e.preventDefault(); });
  /* Was der Browser selbst einfügt (z. B. beim Zusammenführen zweier Absätze), wieder in die Normalform bringen */
  E.addEventListener('input',e=>{ if(e.isComposing) return; if(!canon()){ const [a,b]=curSel(); E.value=E.value; E.setSelectionRange(a,b); } else edStyle(); },true);
  E.addEventListener('compositionend',()=>{ if(!canon()){ const [a,b]=curSel(); E.value=E.value; E.setSelectionRange(a,b); } });
  document.addEventListener('selectionchange',()=>{ if(!E.hidden) curSel(); });
})();
/* Absätze im Schreibfeld so zeigen, wie sie gezeichnet werden: fett, kursiv, Linien, Einrückung, abgehakt */
function edStyle(){
  const it=editing!=null?byId(editing):null, P=[...editor.children];
  if(!it||it.type!=='shape'||!inlineEd(it)||editCell){ for(const p of P) p.removeAttribute('style'); return; }
  const T=editor.value, s2=Object.assign({},it,{text:T}); if(it.pf) s2.pf=remapPf(it.text||'',T,it.pf);
  useFont(it); const k=view.k, ind=Math.round(FS*1.25)*k;
  P.forEach((p,i)=>{ const f=pfOf(s2,i), dc=[f.n&&'underline',(f.s||f.x)&&'line-through'].filter(Boolean).join(' ');
    p.style.fontWeight=f.b?'600':'400'; p.style.fontStyle=f.i?'italic':'normal'; p.style.textDecoration=dc||'none';
    p.style.opacity=f.x?'.55':''; p.style.paddingLeft=f.l?ind+'px':''; });
}
