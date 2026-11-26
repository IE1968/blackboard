/* ---------- Formen ---------- */
function shapeBody(s){
  const w=s.w,h=s.h,sw=s.sw,cx=w/2,cy=h/2;
  const F=wd=>`fill="${s.fill}" stroke="${s.stroke}" stroke-width="${wd}" stroke-linejoin="round"`, f=F(sw);
  const LN=wd=>`fill="none" stroke="${s.stroke}" stroke-width="${wd}" stroke-linecap="round" stroke-linejoin="round"`, ln=LN(sw);
  const dia=`<polygon points="${cx},0 ${w},${cy} ${cx},${h} 0,${cy}" ${f}/>`;
  const ell=`<ellipse cx="${cx}" cy="${cy}" rx="${cx}" ry="${cy}" ${f}/>`;
  const m=Math.min(w,h);
  switch(s.kind){
    case 'rect': return `<rect width="${w}" height="${h}" ${f}/>`;
    case 'round': return `<rect width="${w}" height="${h}" rx="${Math.min(12,m*0.2)}" ${f}/>`;
    case 'subproc': { const b=Math.min(14,m*0.3);
      return `<rect width="${w}" height="${h}" rx="${Math.min(12,m*0.2)}" ${f}/><rect x="${cx-b/2}" y="${h-b-3}" width="${b}" height="${b}" ${ln}/><path d="M${cx-b/4} ${h-b/2-3}h${b/2}M${cx} ${h-b*0.75-3}v${b/2}" ${ln}/>`; }
    case 'ellipse': case 'evstart': case 'erkey': return ell;
    case 'term': return `<rect width="${w}" height="${h}" rx="${h/2}" ${f}/>`;
    case 'diamond': return dia;
    case 'gwx': { const d=m*0.17; return dia+`<path d="M${cx-d} ${cy-d}L${cx+d} ${cy+d}M${cx+d} ${cy-d}L${cx-d} ${cy+d}" ${LN(sw*1.6)}/>`; }
    case 'gwplus': { const d=m*0.23; return dia+`<path d="M${cx-d} ${cy}H${cx+d}M${cx} ${cy-d}V${cy+d}" ${LN(sw*1.6)}/>`; }
    case 'gwo': return dia+`<circle cx="${cx}" cy="${cy}" r="${m*0.2}" ${LN(sw*1.4)}/>`;
    case 'trap': { const d=Math.min(w*0.22,h*0.6); return `<polygon points="${d},0 ${w-d},0 ${w},${h} 0,${h}" ${f}/>`; }
    case 'para':
    case 'io': { const d=Math.min(w*0.2,h*0.4); return `<polygon points="${d},0 ${w},0 ${w-d},${h} 0,${h}" ${f}/>`; }
    case 'doc': { const a=h*0.12; return `<path d="M0 0H${w}V${h-a}Q${w*0.75} ${h-3*a} ${cx} ${h-a}T0 ${h-a}Z" ${f}/>`; }
    case 'db': { const ry=Math.min(h*0.15,14); return `<path d="M0 ${ry}A${cx} ${ry} 0 0 1 ${w} ${ry}V${h-ry}A${cx} ${ry} 0 0 1 0 ${h-ry}Z" ${f}/><path d="M0 ${ry}A${cx} ${ry} 0 0 0 ${w} ${ry}" ${ln}/>`; }
    case 'evmid': return ell+`<ellipse cx="${cx}" cy="${cy}" rx="${Math.max(1,cx-m*0.1)}" ry="${Math.max(1,cy-m*0.1)}" ${ln}/>`;
    case 'evend': return `<ellipse cx="${cx}" cy="${cy}" rx="${cx}" ry="${cy}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${Math.max(sw*2.4,m*0.1)}"/>`;
    case 'evmsg': { const ew=w*0.5,eh=h*0.34,ex=(w-ew)/2,ey=(h-eh)/2;
      return ell+`<rect x="${ex}" y="${ey}" width="${ew}" height="${eh}" ${LN(sw*0.8)}/><path d="M${ex} ${ey}L${cx} ${ey+eh*0.55}L${ex+ew} ${ey}" ${LN(sw*0.8)}/>`; }
    case 'evmidmsg': case 'evmidtimer': case 'evendmsg': case 'evterm': case 'everr': {
      const k=s.kind, thick=`<ellipse cx="${cx}" cy="${cy}" rx="${cx}" ry="${cy}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${Math.max(sw*2.4,m*0.1)}"/>`;
      const ring=ell+`<ellipse cx="${cx}" cy="${cy}" rx="${Math.max(1,cx-m*0.1)}" ry="${Math.max(1,cy-m*0.1)}" ${ln}/>`;
      const ew=w*0.46,eh=h*0.3,ex=(w-ew)/2,ey=(h-eh)/2, env=full=>`<rect x="${ex}" y="${ey}" width="${ew}" height="${eh}" fill="${full?s.stroke:'none'}" stroke="${s.stroke}" stroke-width="${sw*0.8}" stroke-linejoin="round"/><path d="M${ex} ${ey}L${cx} ${ey+eh*0.55}L${ex+ew} ${ey}" fill="none" stroke="${full?(s.fill==='none'?'#ffffff':s.fill):s.stroke}" stroke-width="${sw*0.8}" stroke-linejoin="round"/>`;
      if(k==='evmidmsg') return ring+env(false);
      if(k==='evmidtimer'){ const q=m*0.24; return ring+`<circle cx="${cx}" cy="${cy}" r="${q}" ${LN(sw*0.8)}/><path d="M${cx} ${cy-q*0.7}V${cy}H${cx+q*0.55}" ${LN(sw*0.8)}/>`; }
      if(k==='evendmsg') return thick+env(true);
      if(k==='evterm') return thick+`<circle cx="${cx}" cy="${cy}" r="${m*0.25}" fill="${s.stroke}"/>`;
      const q=m*0.24; return thick+`<path d="M${cx-q} ${cy+q}L${cx-q*0.35} ${cy-q}L${cx+q*0.3} ${cy+q*0.25}L${cx+q} ${cy-q}L${cx+q*0.35} ${cy+q}L${cx-q*0.3} ${cy-q*0.25}Z" ${LN(sw*0.8)}/>`; }
    case 'taskuser': case 'tasksvc': case 'tasksend': case 'taskrecv': { const k=s.kind, b=`<rect width="${w}" height="${h}" rx="${Math.min(12,m*0.2)}" ${f}/>`, t=LN(1.4); let ic;
      if(k==='taskuser') ic=`<circle cx="16" cy="12" r="4" ${t}/><path d="M8 24c0-5 3.500-7 8-7s8 2 8 7" ${t}/>`;
      else if(k==='tasksvc') ic=`<circle cx="16" cy="16" r="3" ${t}/><path d="M16 7v3M16 22v3M7 16h3M22 16h3M9.600 9.600l2.200 2.200M20.200 20.200l2.200 2.200M22.400 9.600l-2.200 2.200M11.800 20.200l-2.200 2.200" ${t}/><circle cx="16" cy="16" r="6.500" ${t}/>`;
      else ic=`<rect x="7" y="9" width="18" height="12" fill="${k==='tasksend'?s.stroke:'none'}" stroke="${s.stroke}" stroke-width="1.4" stroke-linejoin="round"/><path d="M7 9l9 7 9-7" fill="none" stroke="${k==='tasksend'?(s.fill==='none'?'#ffffff':s.fill):s.stroke}" stroke-width="1.4" stroke-linejoin="round"/>`;
      return b+ic; }
    case 'callact': return `<rect width="${w}" height="${h}" rx="${Math.min(12,m*0.2)}" ${F(Math.max(sw*2.4,5))}/>`;
    case 'gwev': { const q=m*0.11, pg=[0,1,2,3,4].map(i=>{ const a=-Math.PI/2+i*2*Math.PI/5; return r(cx+Math.cos(a)*q)+','+r(cy+Math.sin(a)*q); }).join(' ');
      return dia+`<circle cx="${cx}" cy="${cy}" r="${m*0.25}" ${LN(sw*0.7)}/><circle cx="${cx}" cy="${cy}" r="${m*0.19}" ${LN(sw*0.7)}/><polygon points="${pg}" ${LN(sw*0.7)}/>`; }
    case 'bgroup': return `<rect width="${w}" height="${h}" rx="10" fill="none" stroke="#000" stroke-opacity="0" stroke-width="18" pointer-events="stroke"/><rect width="${w}" height="${h}" rx="10" fill="none" stroke="${s.stroke}" stroke-width="${sw}" stroke-dasharray="14 5 3 5" pointer-events="none"/>`;
    case 'check': {   /* Antwort mit Kästchen: im Editor zeigt ein grüner Haken die richtige Antwort; in der Präsentation wird angekreuzt und auf Wunsch aufgelöst */
      const b=Math.min(28,h-8), by=(h-b)/2, P=presLive, on=P?P.ticks.has(s.id):false, show=P&&(P.shown.has('*')||P.shown.has(s.fr)), G='#1f9d55', R='#e0452f';
      const tick=(c,wd)=>`<path d="M${r(4+b*0.2)} ${r(by+b*0.52)}l${r(b*0.22)} ${r(b*0.24)}l${r(b*0.4)} ${r(-b*0.5)}" fill="none" stroke="${c}" stroke-width="${wd}" stroke-linecap="round" stroke-linejoin="round"/>`;
      let o=`<rect width="${w}" height="${h}" rx="6" fill="${s.fill==='none'?'transparent':s.fill}"/>`, bs=s.stroke, bf='none', mark='';
      if(show){ if(s.ok){ bs=G; bf=G; mark=tick('#ffffff',3.2); o+=`<rect x="-4" y="-2" width="${w+8}" height="${h+4}" rx="8" fill="${G}" fill-opacity=".16" stroke="${G}" stroke-width="2"/>`; }
        else if(on){ bs=R; mark=`<path d="M${r(4+b*0.25)} ${r(by+b*0.25)}l${r(b*0.5)} ${r(b*0.5)}M${r(4+b*0.75)} ${r(by+b*0.25)}l${r(-b*0.5)} ${r(b*0.5)}" fill="none" stroke="${R}" stroke-width="3.200" stroke-linecap="round"/>`; } }
      else if(P){ if(on) mark=tick(s.stroke,3.2); }
      else if(s.ok&&!plainOut) mark=tick(G,3.2);
      return o+`<rect x="4" y="${r(by)}" width="${b}" height="${b}" rx="5" fill="${bf}" stroke="${bs}" stroke-width="${Math.max(2,sw)}"/>`+mark; }
    case 'evtimer': { const q=m*0.3; return ell+`<circle cx="${cx}" cy="${cy}" r="${q}" ${LN(sw*0.8)}/><path d="M${cx} ${cy-q*0.7}V${cy}H${cx+q*0.55}" ${LN(sw*0.8)}/>`; }
    case 'data': { const c=m*0.28; return `<path d="M0 0H${w-c}L${w} ${c}V${h}H0Z" ${f}/><path d="M${w-c} 0V${c}H${w}" ${ln}/>`; }
    case 'pool': { const hd=Math.min(30,w*0.2);
      return `<rect width="${w}" height="${h}" fill="none" stroke="${s.stroke}" stroke-width="${sw}" pointer-events="stroke"/><rect width="${hd}" height="${h}" fill="${s.fill==='none'?'transparent':s.fill}" stroke="${s.stroke}" stroke-width="${sw}"/>`; }
    case 'annot': return `<rect width="${w}" height="${h}" fill="${s.fill==='none'?'transparent':s.fill}"/><path d="M${Math.min(10,w*0.25)} 0H0V${h}H${Math.min(10,w*0.25)}" ${ln}/>`;
    case 'paper': { useFont(s); const pp=s.pp||'lined', bg=s.fill==='none'?'transparent':s.fill, top=paperTop(s), lm=Math.max(36,w*0.12);
      let o=`<rect width="${w}" height="${h}" rx="3" fill="${bg}" stroke="rgba(0,0,0,.14)" stroke-width="1"/>`;
      const base=top+LH/2+FS*0.35+FS*0.2, ink=pp==='kraft'?'rgba(90,70,40,.28)':'rgba(70,110,190,.32)';
      if(pp==='lined'){ for(let y=base;y<h-6;y+=LH) o+=`<path fill="none" d="M6 ${r(y)}H${w-6}" stroke="${ink}" stroke-width="1"/>`;
        o+=`<path fill="none" d="M${r(lm)} 4V${h-4}" stroke="rgba(220,70,70,.45)" stroke-width="1.2"/>`; }
      if(pp==='grid'){ const q=Math.max(10,LH/2); for(let y=base%q;y<h;y+=q) o+=`<path fill="none" d="M0 ${r(y)}H${w}" stroke="${ink}" stroke-width=".7"/>`; for(let x=q*0.5;x<w;x+=q) o+=`<path fill="none" d="M${r(x)} 0V${h}" stroke="${ink}" stroke-width=".7"/>`; }
      if(pp==='dots'){ const q=Math.max(12,LH/2); let d=''; for(let y=base%q;y<h;y+=q) for(let x=q;x<w-2;x+=q) d+=`M${r(x)} ${r(y)}h.01`; o+=`<path fill="none" d="${d}" stroke="rgba(60,60,70,.35)" stroke-width="2.4" stroke-linecap="round"/>`; }
      if(pp==='linen'||pp==='kraft'){ let d=''; for(let y=2;y<h;y+=3) d+=`M0 ${y}H${w}`; let e=''; for(let x=2;x<w;x+=3) e+=`M${x} 0V${h}`;
        o+=`<path fill="none" d="${d}" stroke="rgba(120,100,60,.07)" stroke-width="1"/><path fill="none" d="${e}" stroke="rgba(120,100,60,.06)" stroke-width="1"/>`;
        if(pp==='kraft') for(let i=0;i<Math.round(w*h/2500);i++){ const x=(i*97.13)%w, y=(i*53.71+i*i*.37)%h; o+=`<circle cx="${r(x)}" cy="${r(y)}" r="${.6+(i%3)*.35}" fill="rgba(80,60,30,.18)"/>`; } }
      return o; }
    case 'note': { const c=Math.min(16,m*0.25); return `<rect width="${w}" height="${h}" fill="${s.fill==='none'?'transparent':s.fill}"/><path d="M${w-c} ${h}H${w}V${h-c}Z" fill="rgba(0,0,0,.16)"/>`; }
    case 'text': return `<rect width="${w}" height="${h}" fill="${s.fill==='none'?'transparent':s.fill}"/>`;
    case 'tri': return `<polygon points="${cx},0 ${w},${h} 0,${h}" ${f}/>`;
    case 'hex': { const d=Math.min(w*0.25,h*0.5); return `<polygon points="${d},0 ${w-d},0 ${w},${cy} ${w-d},${h} ${d},${h} 0,${cy}" ${f}/>`; }
    case 'star': { let pts=[]; for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, q=i%2?0.42:1; pts.push(r(cx+Math.cos(a)*cx*q)+','+r(cy+Math.sin(a)*cy*q)); } return `<polygon points="${pts.join(' ')}" ${f}/>`; }
    case 'arrowr': { const d=Math.min(w*0.4,h*0.7); return `<polygon points="0,${h*0.28} ${w-d},${h*0.28} ${w-d},0 ${w},${cy} ${w-d},${h} ${w-d},${h*0.72} 0,${h*0.72}" ${f}/>`; }
    case 'arrowlr': { const d=Math.min(w*0.3,h*0.7); return `<polygon points="0,${cy} ${d},0 ${d},${h*0.28} ${w-d},${h*0.28} ${w-d},0 ${w},${cy} ${w-d},${h} ${w-d},${h*0.72} ${d},${h*0.72} ${d},${h}" ${f}/>`; }
    case 'bubble': { const b=h*0.78, q=Math.min(14,m*0.2);
      return `<path d="M${q} 0H${w-q}Q${w} 0 ${w} ${q}V${b-q}Q${w} ${b} ${w-q} ${b}H${w*0.42}L${w*0.2} ${h}L${w*0.24} ${b}H${q}Q0 ${b} 0 ${b-q}V${q}Q0 0 ${q} 0Z" ${f}/>`; }
    case 'cloud': return `<path d="M${w*0.25} ${h*0.88}C${-w*0.04} ${h*0.9} ${-w*0.02} ${h*0.44} ${w*0.17} ${h*0.42}C${w*0.14} ${h*0.08} ${w*0.5} ${-h*0.04} ${w*0.58} ${h*0.24}C${w*0.74} ${h*0.03} ${w*1.02} ${h*0.2} ${w*0.88} ${h*0.48}C${w*1.04} ${h*0.6} ${w*0.97} ${h*0.9} ${w*0.75} ${h*0.88}Z" ${f}/>`;
    case 'cross': { const a=w/3,b=h/3; return `<polygon points="${a},0 ${2*a},0 ${2*a},${b} ${w},${b} ${w},${2*b} ${2*a},${2*b} ${2*a},${h} ${a},${h} ${a},${2*b} 0,${2*b} 0,${b} ${a},${b}" ${f}/>`; }
    case 'netrouter': { const a=m*0.09, qx=cx*0.62, qy=cy*0.62;
      return ell+`<path d="M${cx} ${cy-qy}V${cy+qy}M${cx-qx} ${cy}H${cx+qx}M${cx-a} ${cy-qy+a}L${cx} ${cy-qy}L${cx+a} ${cy-qy+a}M${cx-a} ${cy+qy-a}L${cx} ${cy+qy}L${cx+a} ${cy+qy-a}M${cx-qx+a} ${cy-a}L${cx-qx} ${cy}L${cx-qx+a} ${cy+a}M${cx+qx-a} ${cy-a}L${cx+qx} ${cy}L${cx+qx-a} ${cy+a}" ${ln}/>`; }
    case 'netswitch': { const a=h*0.13, y1=h*0.34, y2=h*0.66;
      return `<rect width="${w}" height="${h}" rx="${m*0.12}" ${f}/><path d="M${w*0.2} ${y1}H${w*0.8}M${w*0.8-a} ${y1-a}L${w*0.8} ${y1}L${w*0.8-a} ${y1+a}M${w*0.8} ${y2}H${w*0.2}M${w*0.2+a} ${y2-a}L${w*0.2} ${y2}L${w*0.2+a} ${y2+a}" ${ln}/>`; }
    case 'netfw': return `<rect width="${w}" height="${h}" ${f}/><path d="M0 ${h/3}H${w}M0 ${2*h/3}H${w}M${cx} 0V${h/3}M${w/4} ${h/3}V${2*h/3}M${3*w/4} ${h/3}V${2*h/3}M${cx} ${2*h/3}V${h}" ${LN(Math.max(1,sw*0.7))}/>`;
    case 'netserver': return `<rect width="${w}" height="${h}" rx="${m*0.08}" ${f}/><path d="M${w*0.2} ${h*0.2}H${w*0.8}M${w*0.2} ${h*0.38}H${w*0.8}M${w*0.2} ${h*0.56}H${w*0.8}" ${ln}/><circle cx="${w*0.3}" cy="${h*0.82}" r="${m*0.06}" fill="${s.stroke}"/>`;
    case 'netpc': return `<rect width="${w}" height="${h}" fill="transparent"/><rect width="${w}" height="${h*0.68}" rx="${m*0.06}" ${f}/><path d="M${cx} ${h*0.68}V${h*0.92}M${w*0.25} ${h*0.96}H${w*0.75}" ${LN(sw*1.4)}/>`;
    case 'netlaptop': return `<rect x="${w*0.15}" width="${w*0.7}" height="${h*0.74}" rx="${m*0.06}" ${f}/><polygon points="0,${h} ${w},${h} ${w*0.87},${h*0.78} ${w*0.13},${h*0.78}" ${f}/>`;
    case 'netprinter': return `<rect x="${w*0.25}" width="${w*0.5}" height="${h*0.32}" ${f}/><rect x="${w*0.2}" y="${h*0.62}" width="${w*0.6}" height="${h*0.38}" ${f}/><rect y="${h*0.28}" width="${w}" height="${h*0.45}" rx="${m*0.07}" ${f}/>`;
    case 'netap': { const y=h*0.56; let d=''; [0.2,0.36,0.52].forEach(q=>{ const rr=m*q, o=rr*0.7071; d+=`M${cx-o} ${y-o}A${rr} ${rr} 0 0 1 ${cx+o} ${y-o}`; });
      return `<rect width="${w}" height="${h}" fill="transparent"/><path d="${d}" ${ln}/><rect x="${w*0.1}" y="${h*0.64}" width="${w*0.8}" height="${h*0.36}" rx="${m*0.07}" ${f}/><circle cx="${cx}" cy="${y}" r="${m*0.05}" fill="${s.stroke}"/>`; }
    case 'netphone': return `<rect width="${w}" height="${h}" rx="${m*0.18}" ${f}/><path d="M${w*0.35} ${h*0.9}H${w*0.65}" ${ln}/>`;
    case 'erweak': return `<rect width="${w}" height="${h}" ${f}/><rect x="${m*0.08}" y="${m*0.08}" width="${w-m*0.16}" height="${h-m*0.16}" ${ln}/>`;
    case 'umlactor': { const q=h*0.14;
      return `<rect width="${w}" height="${h}" fill="transparent"/><circle cx="${cx}" cy="${q+1}" r="${q}" ${f}/><path d="M${cx} ${2*q+1}V${h*0.62}M${w*0.08} ${h*0.4}H${w*0.92}M${cx} ${h*0.62}L${w*0.12} ${h}M${cx} ${h*0.62}L${w*0.88} ${h}" ${ln}/>`; }
    case 'umlpkg': { const t=Math.min(18,h*0.25); return `<rect width="${w*0.4}" height="${t}" ${f}/><rect y="${t}" width="${w}" height="${h-t}" ${f}/>`; }
    case 'umlnote': { const c=Math.min(14,m*0.28); return `<path d="M0 0H${w-c}L${w} ${c}V${h}H0Z" ${f}/><path d="M${w-c} 0V${c}H${w}" ${ln}/>`; }
    case 'umllife': { const t=Math.min(40,h*0.3);
      return `<path d="M${cx} ${t}V${h}" fill="none" stroke="transparent" stroke-width="16"/><path d="M${cx} ${t}V${h}" ${ln} stroke-dasharray="${sw*3.5} ${sw*3}"/><rect width="${w}" height="${t}" ${f}/>`; }
    case 'nsif': return `<rect width="${w}" height="${h}" ${f}/><path d="M0 0L${cx} ${h}L${w} 0" ${ln}/>`+
      (h>=40?`<text font-family="${FONT}" font-size="12" fill="${s.fill==='none'?tink():(isDark(s.fill)?'#ffffff':INK)}" pointer-events="none"><tspan x="6" y="${h-6}">J</tspan><tspan x="${w-6}" y="${h-6}" text-anchor="end">N</tspan></text>`:'');
    case 'nsloop': { const t=Math.min(36,h*0.4),b=Math.min(24,w*0.2); return `<polygon points="0,0 ${w},0 ${w},${t} ${b},${t} ${b},${h} 0,${h}" ${f}/>`; }
    case 'nsloopf': { const t=Math.min(36,h*0.4),b=Math.min(24,w*0.2); return `<polygon points="0,0 ${b},0 ${b},${h-t} ${w},${h-t} ${w},${h} 0,${h}" ${f}/>`; }
    case 'nscall': { const b=Math.min(10,w*0.1); return `<rect width="${w}" height="${h}" ${f}/><path d="M${b} 0V${h}M${w-b} 0V${h}" ${ln}/>`; }
    case 'frame': { const c=SEL, no=s.id?frameNo(s.id):0, lab=(no?'Folie '+no:'Folie')+(s.text?' · '+String(s.text).replace(/\s+/g,' ').slice(0,40):'');
      mctx.font='600 15px '+FONT; const lw=Math.round(mctx.measureText(lab).width+24), gw=coarse?40:26;   /* unsichtbarer breiter Rand zum Anfassen */
      return `<rect width="${w}" height="${h}" fill="none" stroke="#000" stroke-opacity="0" stroke-width="${gw}" pointer-events="stroke"/><rect width="${w}" height="${h}" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="12 6" pointer-events="none"/><rect y="-34" width="${lw}" height="32" rx="6" fill="${c}"/><text x="12" y="-12.5" font-family="${FONT}" font-size="15" font-weight="600" fill="${darkBoard?'#031a3a':'#ffffff'}" pointer-events="none">${esc(lab)}</text>`; }
    case 'image': return s.src?`<image href="${s.src}" width="${w}" height="${h}" preserveAspectRatio="none"/>`+(sw>0?`<rect width="${w}" height="${h}" fill="none" stroke="${s.stroke}" stroke-width="${sw}"/>`:''):`<rect width="${w}" height="${h}" fill="rgba(128,128,128,.15)" stroke="#888" stroke-dasharray="6 4"/>`;
    case 'card': return `<rect width="${w}" height="${h}" rx="${Math.min(6,m*0.2)}" ${F(Math.min(sw,1.5))}/>`;
    case 'table': { let d='',x=0,y=0;
      for(let i=0;i<s.colW.length-1;i++){ x+=s.colW[i]; d+=`M${r(x)} 0V${h}`; }
      for(let i=0;i<s.rowH.length-1;i++){ y+=s.rowH[i]; d+=`M0 ${r(y)}H${w}`; }
      return `<rect width="${w}" height="${h}" fill="${s.fill==='none'?'transparent':s.fill}"/><rect width="${w}" height="${r(s.rowH[0])}" fill="${isDark(s.fill)?'rgba(255,255,255,.12)':'rgba(28,42,46,.1)'}"/><path d="${d}" ${LN(Math.max(1,sw*0.6))}/><rect width="${w}" height="${h}" ${ln}/>`; }
  }
  return '';
}
/* Mitte der ersten Textzeile; beim Notizblatt beginnt der Text oben auf der ersten Linie */
function paperTop(s){ return Math.round(LH*1.15); }
function yMid(s,tb,n){ return tb.top!=null?tb.top+LH/2:s.h/2+(tb.dy||0)-(n-1)*LH/2; }
function textBox(s){
  const k=s.kind;
  if(k==='pool') return {mode:'pool',maxW:Math.max(40,s.h-12)};
  if(k==='frame') return {mode:'frame',maxW:400};
  if(k==='check'){ const b=Math.min(28,s.h-8); return {mode:'left',maxW:s.w-b-26,pad:b+16}; }
  if(k==='bgroup') return {mode:'center',maxW:s.w-20,dy:-(s.h/2-16)};
  if(k==='taskuser'||k==='tasksvc'||k==='tasksend'||k==='taskrecv') return {mode:'center',maxW:s.w-20,dy:6};
  if(isSq(k)||k==='data'||k==='umlactor'||k.startsWith('net')) return {mode:'below',maxW:Math.max(s.w+70,130)};
  if(k==='diamond') return {mode:'center',maxW:s.w*0.62,grow:1.7};
  if(k==='ellipse'||k==='erkey') return {mode:'center',maxW:s.w*0.76,grow:1.35};
  if(k==='io') return {mode:'center',maxW:s.w*0.7};
  if(k==='annot') return {mode:'left',maxW:s.w-22,pad:16};
  if(k==='text') return {mode:'left',maxW:s.w-15,pad:8};
  if(k==='paper'){ const lm=s.pp==='lined'||!s.pp?Math.max(36,s.w*0.12):22; return {mode:'left',maxW:s.w-lm-18,pad:lm+6,top:paperTop(s)}; }
  if(k==='tri') return {mode:'center',maxW:s.w*0.5,dy:s.h*0.16,grow:1.4};
  if(k==='hex') return {mode:'center',maxW:s.w*0.7};
  if(k==='star') return {mode:'center',maxW:s.w*0.4,dy:s.h*0.04};
  if(k==='arrowr') return {mode:'center',maxW:s.w*0.68};
  if(k==='arrowlr') return {mode:'center',maxW:s.w*0.6};
  if(k==='bubble') return {mode:'center',maxW:s.w-18,dy:-s.h*0.11};
  if(k==='cloud') return {mode:'center',maxW:s.w*0.62,dy:s.h*0.06};
  if(k==='cross') return {mode:'center',maxW:s.w-12};
  if(k==='nsif') return {mode:'center',maxW:s.w*0.5,dy:-s.h*0.22};
  if(k==='nsloop') return {mode:'center',maxW:s.w-16,dy:-(s.h/2-Math.min(36,s.h*0.4)/2)};
  if(k==='nsloopf') return {mode:'center',maxW:s.w-16,dy:s.h/2-Math.min(36,s.h*0.4)/2};
  if(k==='nscall') return {mode:'center',maxW:s.w-36};
  if(k==='umllife') return {mode:'center',maxW:s.w-12,dy:-(s.h/2-Math.min(40,s.h*0.3)/2)};
  if(k==='umlpkg') return {mode:'center',maxW:s.w-16,dy:Math.min(18,s.h*0.25)/2};
  if(k==='erweak') return {mode:'center',maxW:s.w-28};
  if(k==='db') return {mode:'center',maxW:s.w-16,dy:Math.min(s.h*0.15,14)/2};
  if(k==='doc') return {mode:'center',maxW:s.w-16,dy:-s.h*0.06};
  if(k==='subproc') return {mode:'center',maxW:s.w-16,dy:-6};
  return {mode:'center',maxW:s.w-16};
}
function cellRect(s,rr,cc){ return {x:sum(s.colW.slice(0,cc)),y:sum(s.rowH.slice(0,rr)),w:s.colW[cc],h:s.rowH[rr]}; }
function cellAt(s,w){ let c=0,rr=0,x=w.x-s.x,y=w.y-s.y;
  while(c<s.colW.length-1&&x>s.colW[c]){ x-=s.colW[c]; c++; }
  while(rr<s.rowH.length-1&&y>s.rowH[rr]){ y-=s.rowH[rr]; rr++; }
  return {r:rr,c}; }
function tableText(s){
  if(noText) return '';
  let o=''; const fill=s.tc?mapC(s.tc):onFill(s.fill);
  s.cells.forEach((row,rr)=>row.forEach((t,cc)=>{
    if(!t||(editing===s.id&&editCell&&editCell.r===rr&&editCell.c===cc)) return;
    const R=cellRect(s,rr,cc), ls=wrap(t,R.w-14), y0=R.y+R.h/2-(ls.length-1)*LH/2+FS*0.35;
    const a=rr>0||s.al?alOf(s):'center', tx=a==='left'?R.x+8:a==='right'?R.x+R.w-8:R.x+R.w/2;
    o+=`<text text-anchor="${a==='left'?'start':a==='right'?'end':'middle'}" font-family="${FAM}"${FX} font-size="${FS}"${rr===0||BOLD?' font-weight="600"':''} fill="${fill}" pointer-events="none">`+
      ls.map((l,i)=>`<tspan x="${r(tx)}" y="${r(y0+i*LH)}">${esc(l)}</tspan>`).join('')+`</text>`; }));
  return o;
}
const BUL='•', canList=it=>it.type==='shape'&&!['table','frame','check','pool','quiz'].includes(it.kind);
function listLines(text,maxW){   /* jeder Absatz bekommt ein Aufzählungszeichen, Folgezeilen rücken ein */
  const ind=Math.round(FS*1.25), out=[];
  for(const para of String(text).split('\n')){
    if(!para.trim()){ out.push({t:'',b:false}); continue; }
    wrap(para.replace(/^\s*[•\-–]\s+/,''),Math.max(20,maxW-ind)).forEach((t,i)=>out.push({t,b:i===0})); }
  return {ind,out};
}
/* Absatzformate: s.pf = je Absatz 'b' (fett), 'i' (kursiv), 'n' (unterstrichen), 's' (durchgestrichen)
   und eins von 'l' (Aufzählung), 'c' (Kästchen zum Abhaken), 'x' (abgehakt).
   Ohne pf gelten bold/it/ul/st/list für den ganzen Text. l = eingerückt (Punkt oder Kästchen), u = Aufzählungspunkt. */
function pfOf(s,i){ const g={i:!!s.it,n:!!s.ul,s:!!s.st};
  if(s.pf){ const v=s.pf[i]||'', ok=canList(s), c=ok&&/[cx]/.test(v), u=ok&&v.includes('l'); return {b:v.includes('b')||!!s.bold,i:g.i||v.includes('i'),n:g.n||v.includes('n'),s:g.s||v.includes('s'),l:u||c,u,c,x:c&&v.includes('x')}; }
  const u=!!s.list&&canList(s); return {b:!!s.bold,...g,l:u,u,c:false,x:false}; }
function pfStr(f){ return (f.b?'b':'')+(f.i?'i':'')+(f.n?'n':'')+(f.s?'s':'')+(f.x?'x':f.c?'c':f.u?'l':''); }
function paraLines(s,text,maxW){
  const ind=Math.round(FS*1.25), out=[], B0=BOLD, I0=ITAL; let anyL=false;
  String(text).split('\n').forEach((para,pi)=>{ const f=pfOf(s,pi); BOLD=f.b; ITAL=f.i; if(f.l) anyL=true; const o={w:f.b,i:f.i,n:f.n,s:f.s,c:f.c,x:f.x,pi};
    if(f.l&&para.trim()) wrap(para.replace(/^\s*[•\-–]\s+/,''),Math.max(20,maxW-ind)).forEach((t,i)=>out.push({...o,t,bul:i===0,l:true}));
    else wrap(para,maxW).forEach(t=>out.push({...o,t,bul:false,l:f.l})); });
  BOLD=B0; ITAL=I0; return {ind,out,anyL};
}
function lineCount(s,T,W){ return s.pf?paraLines(s,T,W).out.length:(s.list?listLines(T,W).out:wrap(T,W)).length; }
function remapPf(oldT,newT,pf){   /* Absatzformate beim Bearbeiten mitführen: neue Absätze erben vom Absatz davor */
  const O=String(oldT).split('\n'), N=String(newT).split('\n'); let k=0; while(k<O.length&&k<N.length&&O[k]===N[k]) k++;
  let m=0; while(m<O.length-k&&m<N.length-k&&O[O.length-1-m]===N[N.length-1-m]) m++;
  const res=pf.slice(0,k).map(v=>v||''), oldMid=O.length-m-k;
  for(let j=0;j<N.length-m-k;j++) res.push(j<oldMid?(pf[k+j]||''):(k>0?pf[k-1]||'':pf[k]||'').replace('x','c'));   /* neue Zeile in der Checkliste: noch nicht abgehakt */
  for(let i=O.length-m;i<O.length;i++) res.push(pf[i]||'');
  return res;
}
function setParaFmt(it,text,i0,i1,flag){   /* flag 'b' (fett), 'i' (kursiv), 'n' (unterstrichen), 's' (durchgestrichen), 'l' (Aufzählung) oder 'c' (Checkliste) für die Absätze i0..i1 umschalten */
  const P=String(text).split('\n'); i1=Math.min(i1,P.length-1);
  const F=P.map((_,i)=>pfOf(it,i)), key=flag==='l'?'u':flag;
  const on=!F.slice(i0,i1+1).every(f=>f[key]);
  for(let i=i0;i<=i1;i++){ const f=F[i];
    if('bins'.includes(flag)) f[flag]=on;
    else if(flag==='l'){ f.u=on; if(on){ f.c=f.x=false; } }
    else { f.c=on; f.x=on&&f.x; if(on) f.u=false; } }
  const pf=F.map(pfStr);
  delete it.bold; delete it.list; delete it.it; delete it.ul; delete it.st;
  if(pf.some(v=>v)) it.pf=pf; else delete it.pf;
  if(flag!=='b'&&on) it.text=P.map((l,i)=>i>=i0&&i<=i1?l.replace(/^\s*(?:[•\-–]|\[[ xX]?\])\s+/,''):l).join('\n');
}
/* Kästchen einer Checkliste antippen: Absatz pi umschalten (abgehakt ↔ offen) */
function toggleCheckPara(it,pi){ const pf=String(it.text||'').split('\n').map((_,i)=>pfStr(pfOf(it,i))), f=pfOf(it,pi); if(!f.c) return false;
  pf[pi]=pfStr(Object.assign(f,{x:!f.x})); delete it.bold; delete it.list; delete it.it; delete it.ul; delete it.st; it.pf=pf; return true; }
/* Welcher Absatz hat an der Stelle w (Weltkoordinaten) sein Kästchen? -1 = keins. Getroffen wird das Kästchen samt etwas Rand. */
function checkHit(s,w){
  if(!s||s.type!=='shape'||!s.pf||!s.pf.some(v=>/[cx]/.test(v))||!canList(s)) return -1;
  const tb=textBox(s); if(tb.mode==='pool'||tb.mode==='below') return -1;
  let p=w; if(s.rot) p=rotP(w,{x:s.x+s.w/2,y:s.y+s.h/2},-s.rot);
  const lx=p.x-s.x, ly=p.y-s.y; useFont(s);
  const Q=paraLines(s,s.text,tb.maxW), n=Q.out.length, y0=yMid(s,tb,n), x0=tb.mode==='left'?tb.pad:Math.max(6,s.w/2-tb.maxW/2);
  for(let i=0;i<n;i++){ const o=Q.out[i]; if(!o.bul||!o.c) continue; const cy=y0+i*LH;
    if(Math.abs(ly-cy)<=Math.max(LH/2,11)&&lx>=x0-8&&lx<=x0+Q.ind+2) return o.pi; }
  return -1;
}
function alOf(s){ if(s.al) return s.al; if(s.kind==='table') return s.align==='left'?'left':'center'; const m=textBox(s).mode; return m==='left'?'left':'center'; }
let edMarks=false;   /* true: nur Marker (•, Kästchen), keinen Text ausgeben */
function inlineEd(s){ return s&&s.type==='shape'&&!['table','frame','pool'].includes(s.kind)&&textBox(s).mode!=='pool'; }
function shapeText(s){
  if(noText) return '';
  useFont(s);
  if(s.kind==='table') return tableText(s);
  if(editing===s.id&&!s._ed){   /* beim Schreiben: nur Aufzählungspunkte und Kästchen zeichnen, den Text zeigt das Eingabefeld darüber */
    if(!s._ed&&(edMarks||!inlineEd(s)||!(s.pf||s.list))) return '';
    const T=editor.value, s2=Object.assign({},s,{text:T}); if(s.pf) s2.pf=remapPf(s.text||'',T,s.pf);
    if(!(s2.pf?s2.pf.some(v=>/[lcx]/.test(v)):s.list)||textBox(s).mode==='below') return '';
    edMarks=true; try{ return shapeText(Object.assign(s2,{_ed:1})); } finally{ edMarks=false; } }
  if(!s.text||s.kind==='frame') return '';
  const tb=textBox(s), L=s.list&&canList(s)&&tb.mode!=='pool'&&tb.mode!=='below'?listLines(s.text,tb.maxW):null, lines=L?L.out.map(o=>o.t):wrap(s.text,tb.maxW), n=lines.length;
  let x=s.w/2,y0,anchor='middle',fill=tink(),extra='';
  if(tb.mode==='below'){ y0=s.h+LH; }
  else if(tb.mode==='pool'){ const hd=Math.min(30,s.w*0.2); x=0; y0=-(n-1)*LH/2+FS*0.35; extra=` transform="translate(${hd/2} ${s.h/2}) rotate(-90)"`; fill=onFill(s.fill); }
  else { y0=yMid(s,tb,n)+FS*0.35;
    if(tb.mode==='left'){ x=tb.pad; anchor='start'; }
    fill=onFill(s.fill);
    if(s.kind==='text') fill=s.stroke==='none'?onFill(s.fill):mapC(s.stroke); }
  if(s.tc) fill=mapC(s.tc);
  if(!L&&s.al&&tb.mode!=='pool'){   /* eigene Ausrichtung: links, mittig oder rechts im Textbereich der Form */
    const x0=tb.mode==='left'?tb.pad:s.w/2-tb.maxW/2, x1=tb.mode==='left'?Math.min(s.w-6,tb.pad+tb.maxW):s.w/2+tb.maxW/2;
    if(s.al==='left'){ x=x0; anchor='start'; } else if(s.al==='right'){ x=x1; anchor='end'; } else { x=(x0+x1)/2; anchor='middle'; } }
  if(s.pf&&tb.mode!=='pool'&&tb.mode!=='below'){   /* einzelne Absätze fett oder als Aufzählung */
    const Q=paraLines(s,s.text,tb.maxW), n2=Q.out.length; y0=yMid(s,tb,n2)+FS*0.35;
    const fwB=o=>o.w?' font-weight="600"':'', dc=o=>[o.n&&'underline',(o.s||o.x)&&'line-through'].filter(Boolean).join(' ');
    const fw=o=>fwB(o)+(o.i?' font-style="italic"':'')+(dc(o)?` text-decoration="${dc(o)}"`:'');
    if(Q.anyL){ const x0=tb.mode==='left'?tb.pad:Math.max(6,s.w/2-tb.maxW/2), bx=Math.round(FS*0.9);
      const box=Q.out.map((o,i)=>{ if(!o.bul||!o.c) return ''; const by=y0+i*LH-FS*0.35-bx/2+FS*0.02;
        return o.x?`<rect class="ckBox" x="${r(x0)}" y="${r(by)}" width="${bx}" height="${bx}" rx="${r(bx*0.22)}" fill="#22a88c"/><path d="M${r(x0+bx*0.24)} ${r(by+bx*0.52)}l${r(bx*0.18)} ${r(bx*0.18)}l${r(bx*0.36)} -${r(bx*0.4)}" fill="none" stroke="#fff" stroke-width="${r(Math.max(1.6,bx*0.14))}" stroke-linecap="round" stroke-linejoin="round"/>`
          :`<rect class="ckBox" x="${r(x0+0.75)}" y="${r(by+0.75)}" width="${bx-1.5}" height="${bx-1.5}" rx="${r(bx*0.22)}" fill="none" stroke="${fill}" stroke-width="1.5"/>`; }).join('');
      const dec=o=>o.x?' opacity=".55"':'';
      return `<g pointer-events="none">${box}<text font-family="${FAM}"${FX} font-size="${FS}" fill="${fill}">`+
        Q.out.map((o,i)=>(o.bul&&!o.c?`<tspan x="${r(x0)}" y="${r(y0+i*LH)}"${fwB(o)}>${BUL}</tspan>`:'')+(o.t&&!edMarks?`<tspan x="${r(x0+(o.l?Q.ind:0))}" y="${r(y0+i*LH)}"${fw(o)}${dec(o)}>${esc(o.t)}</tspan>`:'')).join('')+`</text></g>`; }
    return `<text${s.kind==='erkey'?' text-decoration="underline"':''} text-anchor="${anchor}" font-family="${FAM}"${FX} font-size="${FS}" fill="${fill}" pointer-events="none">`+
      Q.out.map((o,i)=>`<tspan x="${r(x)}" y="${r(y0+i*LH)}"${fw(o)}>${esc(o.t)}</tspan>`).join('')+`</text>`; }
  if(L){ const x0=tb.mode==='left'?tb.pad:Math.max(6,s.w/2-tb.maxW/2);
    return `<text${BOLD?' font-weight="600"':''} font-family="${FAM}"${FX} font-size="${FS}" fill="${fill}" pointer-events="none">`+
      L.out.map((o,i)=>(o.b?`<tspan x="${r(x0)}" y="${r(y0+i*LH)}">${BUL}</tspan>`:'')+(o.t&&!edMarks?`<tspan x="${r(x0+L.ind)}" y="${r(y0+i*LH)}">${esc(o.t)}</tspan>`:'')).join('')+`</text>`; }
  return `<text${extra}${BOLD?' font-weight="600"':''}${s.kind==='erkey'?' text-decoration="underline"':''} text-anchor="${anchor}" font-family="${FAM}"${FX} font-size="${FS}" fill="${fill}" pointer-events="none">`+
    lines.map((l,i)=>`<tspan x="${r(x)}" y="${r(y0+i*LH)}">${esc(l)}</tspan>`).join('')+`</text>`;
}
function fitTexts(){   /* nach dem Laden: Formen, aus denen Text herausragt, so weit vergrößern, dass er passt */
  let ch=false;
  for(const s of doc.items){ if(s.type!=='shape'||s.kind==='frame'||!BODY_KINDS.has(s.kind)||(!s.text&&s.kind!=='table')) continue;
    const before=s.h+'|'+(s.rowH||'');
    if(s.kind==='text'){ useFont(s); const need=up10(lineCount(s,s.text,s.w-15)*LH+10); if(need>s.h) s.h=need; }
    else autosize(s);
    if(before!==s.h+'|'+(s.rowH||'')) ch=true; }
  return ch;
}
function autosize(s){
  if(s.type!=='shape') return;
  useFont(s);
  if(s.kind==='table'){
    s.rowH=s.rowH.map((hh,rr)=>Math.max(hh,...s.cells[rr].map((t,cc)=>t?wrap(t,s.colW[cc]-14).length*LH+12:0)));
    s.w=sum(s.colW); s.h=sum(s.rowH); return; }
  const tb=textBox(s);
  if(s.kind==='text'){
    if(s.fresh){ let mw=0; const B0=BOLD;   /* Breite nach dem längsten Absatz, mit Fett und Platz für Aufzählungspunkte */
      (s.text||' ').split('\n').forEach((para,pi)=>{ const f=pfOf(s,pi); BOLD=f.b; for(const l of wrap(para,320)) mw=Math.max(mw,measure(l)+(f.l?Math.round(FS*1.25):0)); });
      BOLD=B0; s.w=Math.max(60,up10(mw+16)); delete s.fresh; }
    s.h=Math.max(30,up10(lineCount(s,s.text||' ',s.w-15)*LH+10));
  } else if(tb.mode==='center'||tb.mode==='left'){
    const need=tb.top!=null?lineCount(s,s.text||'',tb.maxW)*LH+tb.top*2:(lineCount(s,s.text||'',tb.maxW)*LH+14)*(tb.grow||1)+Math.abs(tb.dy||0)*2;
    if(need>s.h) s.h=up10(need);
  }
}

