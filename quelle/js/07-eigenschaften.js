/* ---------- Eigenschaftenleiste ---------- */
const CNAMES={none:'Ohne','#1c2a2e':'Schwarz','#ffffff':'Weiß','#7a8790':'Grau','#c8321f':'Rot','#d97a00':'Orange','#f2c200':'Gelb','#1f8a4c':'Grün','#1e63d0':'Blau','#7446c9':'Violett','#fff3b0':'Hellgelb','#ffd9c7':'Apricot','#cfe8ff':'Hellblau','#d3f0dc':'Hellgrün','#e6dcff':'Flieder','#e3e8ea':'Hellgrau'};
function cname(c){ if(darkBoard){ if(c==='#1c2a2e') return 'Weiß'; if(c==='#ffffff') return 'Dunkel'; } return CNAMES[c]||c; }
function updateProps(){ updateProps_(); placeProps(); }
function updateProps_(){
  const items=[...sel].map(byId).filter(Boolean), penMode=!items.length, shut=!!palState.optsClosed, ot=$('optsToggle');
  document.body.classList.toggle('opts-closed',shut); ot.setAttribute('aria-expanded',!shut); ot.title=shut?'Optionen zum Werkzeug einblenden':'Optionen zum Werkzeug ausblenden';
  if(!items.length&&!DRAW[tool]){ closeColorPop();   /* ohne Auswahl: kurzer Hinweis je nach Werkzeug */
    propsEl.innerHTML=`<div class="optHint">${{shape:'Form antippen: Farbe, Linie, Stärke, Reihenfolge und Gruppe erscheinen hier.',text:'Auf die Tafel tippen und schreiben. Für Größe, Fett und Ausrichtung den Text auswählen.',erase:'Über Striche und Elemente wischen, um sie zu löschen.',pan:'Tafel mit dem Finger oder der Maus verschieben.'}[tool]||'Element antippen: seine Optionen erscheinen hier. Für Stift, Pinsel und Marker oben das Werkzeug wählen.'}</div>`+(hasClip()?`<button class="pb optPaste" data-act="paste" title="Strg+V">Einfügen</button>`:'');
    return; }
  const ps=penStyles[drawTool], cur=items[0]||ps, hasShape=items.some(i=>i.type==='shape'), conns=items.filter(i=>i.type==='conn'), paths=items.filter(i=>i.type==='path');
  const sws=(act,on,none,lab)=>`<div class="sws">`+COLORS.filter(c=>none||c!=='none').map(c=>`<button class="sw${c==='none'?' none':''}" data-act="${act}" data-val="${c}" aria-pressed="${on===c}" title="${cname(c)}" aria-label="${lab}: ${cname(c)}" style="${c==='none'?'':'background:'+mapC(c)}"></button>`).join('')+`</div>`;
  /* Farben: ein Knopf mit der aktuellen Farbe, die Auswahl klappt darunter auf */
  const cd=(act,on,none,lab)=>{ CDROP[act]={html:sws(act,on,none,lab),lab}; const c=on&&on!=='none'?mapC(on):null;
    return `<button class="pb cdrop" data-drop="${act}" aria-haspopup="true" title="${lab}: ${on?cname(on):'–'}" aria-label="${lab} wählen"><span class="cdot${c?'':' none'}"${c?` style="background:${c}"`:''}></span><i></i></button>`; };
  /* Menüs (Text, Element): ein Knopf, die Knöpfe klappen darunter auf */
  const md=(key,lab,inner,face)=>{ CDROP[key]={html:`<div class="pmenu">${inner}</div>`,lab,menu:true};
    return `<button class="pb cdrop mdrop" data-drop="${key}" aria-haspopup="true" title="${lab}" aria-label="${lab}: Optionen aufklappen"><span class="mface">${face}</span><i></i></button>`; };
  let h='';
  if(items.length===1&&items[0].type==='shape'&&items[0].mm) h+=`<div class="pg"><b>Mindmap</b><button class="pb wide" data-act="branch" title="Neuen Zweig an diesen Knoten hängen (beim Schreiben: Tab)">+ Zweig</button></div>`;
  if(items.length&&items.every(i=>i.kind==='check')) h+=`<div class="pg"><b>Quiz</b><button class="pb" data-act="qok" aria-pressed="${items.every(i=>i.ok)}" title="Als richtige Antwort markieren. In der Präsentation zeigt „Lösung“ die richtigen Antworten.">Richtig</button></div>`;
  const texty=items.filter(i=>i.type!=='path');
  let tm='';   /* Text: Knöpfe kommen in ein Aufklappfeld */
  if(texty.length) tm=(items.length===1?`<button class="pb wide" data-act="edit">Text ändern</button>`:'')+`<div class="sws two"><button class="pb" data-act="fsdown" title="Schrift kleiner">A−</button><button class="pb" data-act="fsup" title="Schrift größer">A+</button></div><div class="sws two"><button class="pb" data-act="bold" aria-pressed="${allF(texty[0],'b')}" title="Fett">Fett</button><button class="pb" data-act="list" aria-pressed="${texty.some(canList)&&texty.filter(canList).every(i=>allF(i,'l'))}" title="Aufzählung: jeder Absatz beginnt mit einem Punkt" aria-label="Aufzählung"${texty.some(canList)?'':' disabled'}><svg viewBox="0 0 24 24"><circle cx="5" cy="7" r="1.600" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.600" fill="currentColor" stroke="none"/><circle cx="5" cy="17" r="1.600" fill="currentColor" stroke="none"/><path d="M10 7h10M10 12h10M10 17h10" stroke-linecap="round"/></svg></button></div></div>`;
  const alable=texty.filter(i=>i.type==='shape'&&i.kind!=='pool'&&i.kind!=='frame');
  if(alable.length){ const A=alOf(alable[0]); tm=tm.replace(/<\/div><\/div>$/,`</div><div class="sws three"><button class="pb" data-act="txal" data-val="left" aria-pressed="${A==='left'}" title="Linksbündig" aria-label="Linksbündig"><svg viewBox="0 0 20 20"><path d="M3 5h14M3 9h9M3 13h14M3 17h9"/></svg></button><button class="pb" data-act="txal" data-val="center" aria-pressed="${A==='center'}" title="Zentriert" aria-label="Zentriert"><svg viewBox="0 0 20 20"><path d="M3 5h14M5.500 9h9M3 13h14M5.500 17h9"/></svg></button><button class="pb" data-act="txal" data-val="right" aria-pressed="${A==='right'}" title="Rechtsbündig" aria-label="Rechtsbündig"><svg viewBox="0 0 20 20"><path d="M3 5h14M8 9h9M3 13h14M8 17h9"/></svg></button></div></div>`); }
  if(tm) h+=`<div class="pg"><b>Text</b>${md('text','Text',tm.replace('<div class="pg"><b>Text</b>','').replace(/<\/div>$/,''),'Aa')}</div>`;
  const onlyText=items.length>0&&items.every(i=>i.type==='shape'&&i.kind==='text');
  if(texty.length){ const t0=texty[0]; h+=`<div class="pg"><b>Schrift</b>${cd('tc',t0.tc||(t0.kind==='text'?t0.stroke:''),false,'Schriftfarbe')}</div>`; }
  if(hasShape) h+=`<div class="pg"><b>${onlyText?'Hintergrund':'Füllung'}</b>${cd('fill',(items.find(i=>i.type==='shape')||{}).fill,true,'Füllung')}</div>`;
  if(!onlyText) h+=`<div class="pg"><b>${penMode?DRAW[drawTool]+'farbe':'Linie'}</b>${cd('stroke',cur.stroke,hasShape&&!conns.length&&!paths.length,penMode?DRAW[drawTool]+'farbe':'Linie')}</div>`;
  const wl=penMode?WIDTHS[drawTool]:(cur.type==='path'?WIDTHS[cur.tool||'pen']:WIDTHS.shape);
  let near=0; wl.forEach((v,i)=>{ if(Math.abs(v-cur.sw)<Math.abs(wl[near]-cur.sw)) near=i; });
  if(!onlyText) h+=`<div class="pg"><b>Stärke</b>${md('sw','Stärke',wl.map((v,i)=>`<button class="pb wbtn" data-act="sw" data-val="${v}" aria-pressed="${i===near}" title="Stärke ${i+1} von 5"><i class="lw" style="height:${1.5+i*2.5}px"></i></button>`).join(''),`<span class="lw mlw" style="height:${1.5+near*2.5}px"></span>`)}</div>`;
  if(penMode||paths.length){ const tip=(paths[0]||ps).tip||'round';
    h+=`<div class="pg"><b>Pinselform</b>`+[['round','Rund'],['flat','Flach'],['calli','Schräg']].map(([v,t])=>`<button class="pb" data-act="tip" data-val="${v}" aria-pressed="${tip===v}">${t}</button>`).join('')+`</div>`; }
  if(conns.length){ const c=conns[0];
    h+=`<div class="pg"><b>Pfeil</b><button class="pb" data-act="style" aria-pressed="${c.style==='straight'}">Gerade</button><button class="pb" data-act="dash" aria-pressed="${!!c.dash}" >Gestrichelt</button></div><div class="pg"><b>Spitze</b><button class="pb" data-act="head" title="Pfeilspitze wechseln">${HEADS.find(x=>x[0]===headOf(c))[1]}</button></div>`; }
  if(items.length===1&&items[0].kind==='table') h+=`<div class="pg"><b>Tabelle</b><button class="pb" data-act="addcol" title="Neue Spalte rechts neben der markierten Zelle">+ Spalte</button><button class="pb" data-act="delcol" title="Spalte der markierten Zelle löschen">− Spalte</button><button class="pb" data-act="addrow" title="Neue Zeile unter der markierten Zelle">+ Zeile</button><button class="pb" data-act="delrow" title="Zeile der markierten Zelle löschen">− Zeile</button></div>`;
  if(items.length===1&&items[0].kind==='frame'){ const fr=frames(), fi=fr.indexOf(items[0]);
    h+=`<div class="pg"><b>Folie ${fi+1} von ${fr.length}</b><button class="pb" data-act="play" title="Präsentation mit dieser Folie beginnen">▶ Zeigen</button><button class="pb" data-act="frup" title="In der Reihenfolge nach vorn"${fi<=0?' disabled':''}>Früher</button><button class="pb" data-act="frdown" title="In der Reihenfolge nach hinten"${fi>=fr.length-1?' disabled':''}>Später</button></div>`;
    const inF=doc.items.filter(i=>i.fr===items[0].id&&i.kind!=='frame'); if(inF.length) h+=`<div class="pg"><b>Einblenden</b><button class="pb" data-act="apall" aria-pressed="${inF.every(i=>i.ap)}" title="Elemente dieser Folie in der Präsentation nacheinander zeigen, von oben nach unten">Alles nacheinander</button></div>`; }
  const apIts=items.filter(i=>i.fr&&i.kind!=='frame');
  if(apIts.length&&apIts.length===items.length){ const on=apIts.every(i=>i.ap);
    let n=''; if(on){ const f=apIts[0].fr, st=[...new Set(doc.items.filter(i=>i.ap&&i.fr===f).map(i=>i.ap))].sort((a,b)=>a-b); n=`<button class="pb" data-act="apdn" title="Früher einblenden" aria-label="Früher einblenden">−</button><span class="apNo">Schritt ${st.indexOf(apIts[0].ap)+1}</span><button class="pb" data-act="apup" title="Später einblenden" aria-label="Später einblenden">+</button>`; }
    h+=`<div class="pg"><b>Einblenden</b><button class="pb" data-act="apon" aria-pressed="${on}" title="In der Präsentation erst auf Klick zeigen">Nacheinander</button>${n}</div>`; }
  const nUnits=items.length>1?selUnits().length:0;
  if(nUnits>=2){ const AL=[['l','Links ausrichten','M3 2v16M6 5h10v3H6zM6 12h6v3H6z'],['c','Waagerecht zentrieren','M10 2v16M4 5h12v3H4zM6.5 12h7v3h-7z'],['r','Rechts ausrichten','M17 2v16M4 5h10v3H4zM8 12h6v3H8z'],['t','Oben ausrichten','M2 3h16M5 6h3v10H5zM12 6h3v6h-3z'],['m','Senkrecht zentrieren','M2 10h16M5 4h3v12H5zM12 6.5h3v7h-3z'],['b','Unten ausrichten','M2 17h16M5 4h3v10H5zM12 8h3v6h-3z']];
    const ab=([v,t,d])=>`<button class="pb" data-act="al" data-val="${v}" title="${t}" aria-label="${t}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="${d}"/></svg></button>`;
    h+=`<div class="pg"><b>Ausrichten</b>${md('al','Ausrichten',`<div class="sws three">`+AL.map(ab).join('')+`</div>`+(nUnits>=3?`<div class="sws two">`+[['dh','Waagerecht gleichmäßig verteilen','M3 2v16M17 2v16M8 6h4v8H8z'],['dv','Senkrecht gleichmäßig verteilen','M2 3h16M2 17h16M6 8h8v4H6z']].map(ab).join('')+`</div>`:''),`<svg viewBox="0 0 20 20" aria-hidden="true" style="fill:none;stroke:currentColor;stroke-width:1.600"><path d="${AL[0][2]}"/></svg>`)}</div>`; }
  if(items.length>1||items.some(i=>i.g)) h+=`<div class="pg"><b>Gruppe</b>`+(items.length>1?`<button class="pb" data-act="group" title="Strg+G">Gruppieren</button>`:'')+(items.some(i=>i.g)?`<button class="pb" data-act="ungroup" title="Strg+Umschalt+G">Gruppe lösen</button>`:'')+`</div>`;
  if(items.length) h+=`<div class="pg"><b>Element</b>${md('elem','Element',`<button class="pb" data-act="front">Nach vorn</button><button class="pb" data-act="back">Nach hinten</button><button class="pb" data-act="dup">Duplizieren</button><button class="pb" data-act="copy" title="Strg+C">Kopieren</button><button class="pb" data-act="lock" aria-pressed="${items.every(i=>i.lock)}" title="Gesperrte Elemente lassen sich nicht verschieben, ändern oder löschen">${items.every(i=>i.lock)?'Entsperren':'Sperren'}</button>`+(hasClip()?`<button class="pb" data-act="paste" title="Strg+V">Einfügen</button>`:'')+`<button class="pb danger" data-act="del">Löschen</button>`,'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="4.500" cy="10" r="1.600"/><circle cx="10" cy="10" r="1.600"/><circle cx="15.500" cy="10" r="1.600"/></svg>')}</div>`;
  propsEl.innerHTML=h; refreshPop();
}
const CDROP={}; let paraSel=null;   /* zuletzt markierte Absätze (Fett/Aufzählung) */
function allF(i,f){ if(paraSel&&paraSel.id===i.id){ const R=[]; for(let k=paraSel.i0;k<=paraSel.i1;k++) R.push(pfOf(i,k)[f]); return R.every(Boolean); } if(!i.pf) return f==='b'?!!i.bold:!!i.list; return String(i.text||'').split('\n').every((_,k)=>pfOf(i,k)[f]); }
function refreshPop(){ const p=$('colorPop'); if(!p||p.hidden) return; const info=CDROP[p.dataset.for]; if(!info||!$('props').querySelector(`[data-drop="${p.dataset.for}"]`)){ closeColorPop(); return; } p.classList.toggle('menu',!!info.menu); p.innerHTML=`<div class="mh">${esc(info.lab)}</div>`+info.html; }
function closeColorPop(){ paraSel=null; const p=$('colorPop'); if(p&&!p.hidden){ p.hidden=true; p.innerHTML=''; } }
propsEl.addEventListener('click',e=>{
  const d=e.target.closest('[data-drop]');
  if(d){ e.stopPropagation(); const p=$('colorPop'), info=CDROP[d.dataset.drop]; if(!info) return;
    if(!p.hidden&&p.dataset.for===d.dataset.drop){ closeColorPop(); return; }
    p.dataset.for=d.dataset.drop; p.hidden=false; refreshPop();
    const r=d.getBoundingClientRect(), z=uiCfg.scale, w=p.offsetWidth*z; p.style.left=Math.max(6,Math.min(innerWidth-w-6,r.left+r.width/2-w/2))/z+'px'; p.style.top=(r.bottom+6)/z+'px'; return; }
  const b=e.target.closest('[data-act]'); if(b) propsAct(b);
});
$('colorPop').addEventListener('click',e=>{ e.stopPropagation(); const b=e.target.closest('[data-act]'); if(!b||b.disabled) return;
  const keep=['fsup','fsdown','bold','list','txal','front','back','lock'].includes(b.dataset.act);   /* Formatieren: Feld bleibt offen */
  if(!keep) closeColorPop(); propsAct(b); if(keep) refreshPop(); });
document.addEventListener('pointerdown',e=>{ if(!e.target.closest('#colorPop,[data-drop]')) closeColorPop(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!$('colorPop').hidden){ e.preventDefault(); e.stopImmediatePropagation(); closeColorPop(); } },true);
function propsAct(b){
  const act=b.dataset.act,val=b.dataset.val,items=[...sel].map(byId).filter(Boolean);
  /* Fett/Aufzählung beim Schreiben: nur für die markierten Absätze. Danach ist das Ergebnis sichtbar,
     und weitere Klicks im offenen Textfeld gelten weiter für dieselben Absätze. */
  const pt=editing!=null?byId(editing):(paraSel&&sel.size===1&&sel.has(paraSel.id)&&!$('colorPop').hidden?byId(paraSel.id):null);
  if(pt&&(act==='bold'||act==='list')&&pt.kind!=='table'&&!pt.lock&&(act==='bold'||canList(pt))){
    let i0,i1; if(editing!=null){ [i0,i1]=editParas(); pt.text=editor.value; finishEdit(); sel=new Set([pt.id]); } else ({i0,i1}=paraSel);
    setParaFmt(pt,pt.text||'',i0,i1,act==='bold'?'b':'l'); paraSel={id:pt.id,i0,i1};
    if(pt.kind==='text') pt.fresh=true; autosize(pt); commit(); render(); return; }
  if(editing!=null&&!['edit','del','dup','copy','paste'].includes(act)) setTimeout(backToEdit,0);
  if(act==='front') return reorder(true);
  if(act==='back') return reorder(false);
  if(act==='dup') return duplicateSel();
  if(act==='del') return deleteSel();
  if(act==='copy') return copySel(false);
  if(act==='paste') return pasteClip();
  if(act==='group') return groupSel();
  if(act==='ungroup') return ungroupSel();
  if(act==='branch') return addBranch(items[0]&&items[0].id);
  if(act==='al') return alignSel(val);
  if(act==='txal'){ items.forEach(i=>{ if(i.type==='shape'&&!i.lock&&i.kind!=='pool'&&i.kind!=='frame'){ i.al=val; if(i.kind==='table') delete i.align; } }); commit(); render(); if(editing) placeEditor(); return; }
  if(act==='play') return startPres(items[0]&&items[0].id);
  if(act==='qok'){ const on=!items.every(i=>i.ok); items.forEach(i=>{ if(on) i.ok=true; else delete i.ok; }); commit(); render(); return; }
  if(act==='apon'||act==='apup'||act==='apdn'||act==='apall') return apAct(act,items);
  if(act==='frup'||act==='frdown'){ if(items[0]) moveFrame(items[0].id,act==='frup'?-1:1); return; }
  if(act==='lock'){ const on=!items.every(i=>i.lock); items.forEach(i=>{ if(on) i.lock=true; else delete i.lock; }); commit(); render(); return; }
  if(items.length&&items.every(i=>i.lock)&&act!=='edit'){ toast('Das Element ist gesperrt. Erst unter „Element“ entsperren.'); return; }
  if(act==='edit'){ const it=items[0]; if(it) startEdit(it.id,lastCell&&lastCell.id===it.id?lastCell.cell:null); return; }
  if(!items.length){ const ps=penStyles[drawTool]; if(act==='stroke') ps.stroke=val; if(act==='sw') ps.sw=+val; if(act==='tip') ps.tip=val; penTs=Date.now(); penPush(); updateProps(); return; }
  const tb=items[0];
  if(tb.kind==='table'){
    /* Bezug ist die zuletzt angeklickte Zelle; ohne Klick die letzte Spalte bzw. Zeile */
    const lc=lastCell&&lastCell.id===tb.id?lastCell.cell:null, ci=lc?Math.min(lc.c,tb.colW.length-1):tb.colW.length-1, ri=lc?Math.min(lc.r,tb.rowH.length-1):tb.rowH.length-1;
    if(act==='addcol'){ tb.colW.splice(ci+1,0,tb.colW[ci]); tb.cells.forEach(row=>row.splice(ci+1,0,'')); }
    if(act==='delcol'&&tb.colW.length>1){ tb.colW.splice(ci,1); tb.cells.forEach(row=>row.splice(ci,1)); }
    if(act==='addrow'){ tb.rowH.splice(ri+1,0,ri===0&&tb.rowH.length>1?tb.rowH[1]:tb.rowH[ri]); tb.cells.splice(ri+1,0,tb.colW.map(()=>'')); }
    if(act==='delrow'&&tb.rowH.length>1){ tb.rowH.splice(ri,1); tb.cells.splice(ri,1); }
    tb.w=sum(tb.colW); tb.h=sum(tb.rowH);
  }
  const listOn=act==='list'&&!items.filter(canList).every(i=>i.pf?i.pf.length&&String(i.text).split('\n').every((_,k)=>pfOf(i,k).l):i.list);
  for(const it of items){ if(it.lock) continue;
    if(act==='list'&&canList(it)&&it.pf){ const n=String(it.text||'').split('\n').length-1; if(listOn!==String(it.text||'').split('\n').every((_,k)=>pfOf(it,k).l)) setParaFmt(it,it.text||'',0,n,'l'); autosize(it); }
    else if(act==='list'&&canList(it)){ if(listOn){ it.list=true; if(it.kind==='text') it.fresh=true;   /* Breite neu: Platz für die Aufzählungspunkte */ if(it.text) it.text=it.text.split('\n').map(l=>l.replace(/^\s*[•\-–]\s+/,'')).join('\n'); } else delete it.list; autosize(it); }
    if(it.type!=='path'&&(act==='fsup'||act==='fsdown'||act==='bold')){
      if(act==='bold'){ if(it.pf){ const n=String(it.text||'').split('\n').length-1; setParaFmt(it,it.text||'',0,n,'b'); } else it.bold=!it.bold; } else it.fs=clamp((it.fs||14)+(act==='fsup'?2:-2),10,40);
      if(it.kind==='text') it.fresh=true; autosize(it); }
    if(act==='fill'&&it.type==='shape') it.fill=val;
    if(act==='stroke'&&(val!=='none'||it.type==='shape')) it.stroke=val;
    if(act==='tip'&&it.type==='path') it.tip=val;
    if(act==='tc'&&it.type!=='path') it.tc=val;
    if(act==='sw') it.sw=+val;
    if(it.type==='conn'){ if(act==='style') it.style=it.style==='straight'?'ortho':'straight'; if(act==='dash') it.dash=!it.dash; if(act==='head'){ const i=HEADS.findIndex(x=>x[0]===headOf(it)); it.head=HEADS[(i+1)%HEADS.length][0]; delete it.arrow; } }
  }
  commit(); render();
}


/* Nacheinander einblenden: Schritt-Nummern (ap) je Folie verwalten */
function apAct(act,items){
  if(liveRO()) return;
  if(act==='apall'){ const f=items[0]; if(!f) return; const its=doc.items.filter(i=>i.fr===f.id&&i.kind!=='frame');
    if(its.every(i=>i.ap)) its.forEach(i=>delete i.ap);
    else { const bx=new Map(its.map(i=>[i.id,bbox(i)])), key=i=>{ const b=bx.get(i.id); return [Math.round(b.y/40),b.x]; };
      its.sort((a,b)=>{ const A=key(a),B=key(b); return A[0]-B[0]||A[1]-B[1]; });
      let n=0; const grp=new Map(); for(const i of its){ if(i.g&&grp.has(i.g)){ i.ap=grp.get(i.g); continue; } i.ap=++n; if(i.g) grp.set(i.g,n); } }
    commit(); render(); return; }
  const its=items.filter(i=>i.fr&&i.kind!=='frame'); if(!its.length) return;
  if(act==='apon'){
    if(its.every(i=>i.ap)) its.forEach(i=>delete i.ap);
    else { const byF=new Map(); for(const i of its){ if(!byF.has(i.fr)) byF.set(i.fr,1+Math.max(0,...doc.items.filter(x=>x.fr===i.fr&&x.ap&&!sel.has(x.id)).map(x=>x.ap))); i.ap=byF.get(i.fr); } }
  } else {   /* Schritt früher/später: allein im Schritt → mit dem Nachbarn tauschen, sonst eigenen Schritt davor/danach */
    const f=its[0].fr, cur=its[0].ap; if(!cur) return; const all=doc.items.filter(i=>i.ap&&i.fr===f), st=[...new Set(all.map(i=>i.ap))].sort((a,b)=>a-b), k=st.indexOf(cur), d=act==='apdn'?-1:1;
    const mine=its.filter(i=>i.fr===f), others=all.filter(i=>i.ap===cur&&!sel.has(i.id));
    if(others.length) mine.forEach(i=>i.ap=cur+d*0.5);
    else { const nb=st[k+d]; if(nb==null) return; all.filter(i=>i.ap===nb).forEach(i=>i.ap=cur); mine.forEach(i=>i.ap=nb); }
    const st2=[...new Set(all.map(i=>i.ap))].sort((a,b)=>a-b); all.forEach(i=>i.ap=st2.indexOf(i.ap)+1);
  }
  commit(); render();
}
