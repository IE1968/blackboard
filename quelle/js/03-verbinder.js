/* ---------- Verbinder ---------- */
function anchor(c,end){
  const s=byId(end==='a'?c.from:c.to);
  if(s&&s.type==='shape') return {x:s.x,y:s.y,w:s.w,h:s.h,kind:s.kind,rot:s.rot||0};
  const p=end==='a'?c.p1:c.p2; return {x:p.x,y:p.y,w:0,h:0,kind:'pt'};
}
function rotP(p,c,deg){ if(!deg) return p; const a=deg*Math.PI/180, co=Math.cos(a), si=Math.sin(a), dx=p.x-c.x, dy=p.y-c.y; return {x:c.x+dx*co-dy*si,y:c.y+dx*si+dy*co}; }
function clip(A,to){
  if(A.rot){ const c={x:A.x+A.w/2,y:A.y+A.h/2}; return rotP(clip(Object.assign({},A,{rot:0}),rotP(to,c,-A.rot)),c,A.rot); }
  const cx=A.x+A.w/2,cy=A.y+A.h/2; if(A.kind==='pt'||!A.w||!A.h) return {x:cx,y:cy};
  const dx=to.x-cx,dy=to.y-cy; if(!dx&&!dy) return {x:cx,y:cy};
  const a=A.w/2,b=A.h/2; let t;
  if(A.kind==='ellipse'||A.kind==='erkey'||A.kind.startsWith('ev')) t=1/Math.hypot(dx/a,dy/b);
  else if(A.kind==='diamond'||A.kind.startsWith('gw')) t=1/(Math.abs(dx)/a+Math.abs(dy)/b);
  else t=Math.min(dx?a/Math.abs(dx):Infinity,dy?b/Math.abs(dy):Infinity);
  return {x:cx+dx*t,y:cy+dy*t};
}
/* Andockpunkte: Mitte jeder Seite. Ein Pfeilende merkt sich die Seite (fa/ta); ohne Seite sucht sich der Pfeil selbst den kürzesten Weg. */
const SIDES={n:[0,-1],e:[1,0],s:[0,1],w:[-1,0]};
function sidePt(A,sd){ const v=SIDES[sd], p={x:A.x+A.w/2+v[0]*A.w/2,y:A.y+A.h/2+v[1]*A.h/2}; return A.rot?rotP(p,{x:A.x+A.w/2,y:A.y+A.h/2},A.rot):p; }
/* Seite einer gedrehten Form, wie sie auf der Tafel liegt (für die rechtwinklige Pfeilführung) */
function effSide(A,sd){ if(!A.rot) return sd; const v=SIDES[sd], a=A.rot*Math.PI/180, x=v[0]*Math.cos(a)-v[1]*Math.sin(a), y=v[0]*Math.sin(a)+v[1]*Math.cos(a);
  return Math.abs(x)>=Math.abs(y)?(x>0?'e':'w'):(y>0?'s':'n'); }
function autoSide(A,to){ if(A.rot){ const c={x:A.x+A.w/2,y:A.y+A.h/2}; to=rotP(to,c,-A.rot); } const dx=to.x-(A.x+A.w/2),dy=to.y-(A.y+A.h/2); return Math.abs(dx)*(A.h||1)>=Math.abs(dy)*(A.w||1)?(dx>=0?'e':'w'):(dy>=0?'s':'n'); }
function tidy(p){ const o=[p[0]];
  for(let i=1;i<p.length;i++){ const a=o[o.length-1],b=p[i],c=p[i+1];
    if(c&&Math.abs(a.x-b.x)<0.5&&Math.abs(a.y-b.y)<0.5) continue;
    if(c&&((Math.abs(a.x-b.x)<0.5&&Math.abs(b.x-c.x)<0.5&&(b.y-a.y)*(c.y-b.y)>=0)||(Math.abs(a.y-b.y)<0.5&&Math.abs(b.y-c.y)<0.5&&(b.x-a.x)*(c.x-b.x)>=0))) continue;
    o.push(b); }
  return o; }
function orth(p1,sa,p2,sb){
  const S=16,va=SIDES[sa],vb=SIDES[sb],a1={x:p1.x+va[0]*S,y:p1.y+va[1]*S},b1={x:p2.x+vb[0]*S,y:p2.y+vb[1]*S},ha=!!va[0],hb=!!vb[0]; let mid;
  if(ha!==hb) mid=ha?[{x:b1.x,y:a1.y}]:[{x:a1.x,y:b1.y}];
  else { const P=ha?'x':'y',Q=ha?'y':'x',d=ha?va[0]:va[1],e=ha?vb[0]:vb[1], mk=(pv,qv)=>ha?{x:pv,y:qv}:{x:qv,y:pv};
    if(d===e){ const m=d>0?Math.max(a1[P],b1[P]):Math.min(a1[P],b1[P]); mid=[mk(m,a1[Q]),mk(m,b1[Q])]; }
    else if((b1[P]-a1[P])*d>=0){ const m=(a1[P]+b1[P])/2; mid=[mk(m,a1[Q]),mk(m,b1[Q])]; }
    else { const m=(a1[Q]+b1[Q])/2; mid=[mk(a1[P],m),mk(b1[P],m)]; } }
  return tidy([p1,a1].concat(mid,[b1,p2]));
}
function route(c){
  const A=anchor(c,'a'),B=anchor(c,'b');
  const ac={x:A.x+A.w/2,y:A.y+A.h/2}, bc={x:B.x+B.w/2,y:B.y+B.h/2};
  const fa=A.kind!=='pt'&&SIDES[c.fa]?c.fa:null, fb=B.kind!=='pt'&&SIDES[c.ta]?c.ta:null;
  const skew=x=>x.rot&&x.rot%90!==0;   /* schräg gedrehte Form: gerade Verbindung statt rechtwinkliger Führung */
  if(c.style==='straight'||skew(A)||skew(B)){ const qa=fa?sidePt(A,fa):null, qb=fb?sidePt(B,fb):null; return [qa||clip(A,qb||bc),qb||clip(B,qa||ac)]; }
  if(fa||fb||A.rot||B.rot){   /* nur noch um 90°, 180°, 270° gedreht */ const sa=fa||autoSide(A,fb?sidePt(B,fb):bc), p1=sidePt(A,sa), sb=fb||autoSide(B,p1); return orth(p1,effSide(A,sa),sidePt(B,sb),effSide(B,sb)); }
  const dx=bc.x-ac.x,dy=bc.y-ac.y;
  const gapX=dx>=0?B.x-(A.x+A.w):A.x-(B.x+B.w);
  const gapY=dy>=0?B.y-(A.y+A.h):A.y-(B.y+B.h);
  if(gapX>=gapY){
    const s=dx>=0?1:-1, p1={x:ac.x+s*A.w/2,y:ac.y}, p2={x:bc.x-s*B.w/2,y:bc.y};
    if(Math.abs(p1.y-p2.y)<1) return [p1,p2];
    const mx=(p1.x+p2.x)/2; return [p1,{x:mx,y:p1.y},{x:mx,y:p2.y},p2];
  }
  const s=dy>=0?1:-1, p1={x:ac.x,y:ac.y+s*A.h/2}, p2={x:bc.x,y:bc.y-s*B.h/2};
  if(Math.abs(p1.x-p2.x)<1) return [p1,p2];
  const my=(p1.y+p2.y)/2; return [p1,{x:p1.x,y:my},{x:p2.x,y:my},p2];
}
const HEADS=[['arrow','Pfeil'],['msg','Nachricht'],['tri','Vererbung'],['dia','Aggregation'],['diaf','Komposition'],['none','keine']];
function headOf(c){ return c.head||(c.arrow===false?'none':'arrow'); }
function connMid(pts){ const i=Math.floor((pts.length-1)/2); return {x:(pts[i].x+pts[i+1].x)/2,y:(pts[i].y+pts[i+1].y)/2}; }
function connSVG(c){
  useFont(c); const cs=mapC(c.stroke);
  const pts=route(c),n=pts.length,a=pts[n-2],b=pts[n-1];
  const ang=Math.atan2(b.y-a.y,b.x-a.x), ux=Math.cos(ang), uy=Math.sin(ang), head=headOf(c);
  const al=head==='none'?0:head==='arrow'?8+c.sw*2:(head==='tri'||head==='msg')?13+c.sw:18+c.sw, cut=head==='arrow'?al*0.8:al;
  const P=pts.slice(0,n-1).concat([al?{x:b.x-ux*cut,y:b.y-uy*cut}:b]);
  const d='M'+P.map(p=>r(p.x)+' '+r(p.y)).join('L');
  let o=`<g class="it conn" data-id="${c.id}"><path d="${d}" fill="none" stroke="transparent" stroke-width="18" pointer-events="stroke"/>`+
    `<path d="${d}" fill="none" stroke="${cs}" stroke-width="${c.sw}" stroke-linejoin="round" stroke-linecap="round"${c.dash?` stroke-dasharray="${c.sw*3.5} ${c.sw*3}"`:''}/>`;
  if(al){ const hw=head==='arrow'?al*0.45:(head==='tri'||head==='msg')?al*0.55:al*0.3, bx=b.x-ux*al, by=b.y-uy*al, px=-uy*hw, py=ux*hw;
    const pp=head==='dia'||head==='diaf'
      ? [[b.x,b.y],[(b.x+bx)/2+px,(b.y+by)/2+py],[bx,by],[(b.x+bx)/2-px,(b.y+by)/2-py]]
      : [[b.x,b.y],[bx+px,by+py],[bx-px,by-py]];
    o+=`<polygon points="${pp.map(q=>r(q[0])+','+r(q[1])).join(' ')}" fill="${head==='arrow'||head==='diaf'?cs:paper()}" stroke="${cs}" stroke-width="${head==='arrow'?0:c.sw}" stroke-linejoin="round"/>`; }
  if(head==='msg') o+=`<circle cx="${r(pts[0].x)}" cy="${r(pts[0].y)}" r="${4+c.sw*0.5}" fill="${paper()}" stroke="${cs}" stroke-width="${c.sw}"/>`;
  if(c.text&&editing!==c.id&&!noText){ const m=connMid(pts),ls=wrap(c.text,170),tw=Math.max(...ls.map(measure))+10,th=ls.length*LH+4;
    o+=`<rect x="${r(m.x-tw/2)}" y="${r(m.y-th/2)}" width="${r(tw)}" height="${th}" rx="3" fill="${paper()}"/>`+
      `<text text-anchor="middle" font-family="${FAM}"${FX} font-size="${FS}"${BOLD?' font-weight="600"':''} fill="${c.tc?mapC(c.tc):tink()}" pointer-events="none">`+
      ls.map((l,i)=>`<tspan x="${r(m.x)}" y="${r(m.y-(ls.length-1)*LH/2+FS*0.35+i*LH)}">${esc(l)}</tspan>`).join('')+`</text>`; }
  return o+'</g>';
}
function pathD(pts){
  if(pts.length<2) return `M${pts[0][0]} ${pts[0][1]}l0.01 0`;
  let d=`M${pts[0][0]} ${pts[0][1]}`;
  for(let i=1;i<pts.length-1;i++){ const p=pts[i],q=pts[i+1]; d+=`Q${p[0]} ${p[1]} ${r((p[0]+q[0])/2)} ${r((p[1]+q[1])/2)}`; }
  const l=pts[pts.length-1]; return d+`L${l[0]} ${l[1]}`;
}
/* Punkte und Breiten glätten: verhindert perlenartige, zittrige Ränder bei schnellen, dichten Stiftdaten */
function smoothStroke(pts,ws){
  let p=[], w=[]; const minD=0.6;
  for(let i=0;i<pts.length;i++){ const q=pts[i]; if(p.length&&i<pts.length-1&&Math.hypot(q[0]-p[p.length-1][0],q[1]-p[p.length-1][1])<minD) continue; p.push([q[0],q[1]]); w.push(ws&&ws[i]!=null?ws[i]:1); }
  if(p.length<3) return {p,w};
  for(let k=0;k<2;k++){ const np=p.map(x=>x.slice()); for(let i=1;i<p.length-1;i++){ np[i][0]=(p[i-1][0]+2*p[i][0]+p[i+1][0])/4; np[i][1]=(p[i-1][1]+2*p[i][1]+p[i+1][1])/4; } p=np; }
  for(let k=0;k<3;k++){ const nw=w.slice(); for(let i=1;i<w.length-1;i++) nw[i]=(w[i-1]+2*w[i]+w[i+1])/4; w=nw; }
  return {p,w};
}
/* Umriss als weiche Kurve (quadratische Bögen durch die Mittelpunkte) */
function smoothOutline(Q){
  const n=Q.length; if(n<3) return 'M'+Q.map(q=>r(q[0])+' '+r(q[1])).join('L')+'Z';
  let d='M'+r((Q[0][0]+Q[1][0])/2)+' '+r((Q[0][1]+Q[1][1])/2);
  for(let i=1;i<=n;i++){ const a=Q[i%n], b=Q[(i+1)%n]; d+='Q'+r(a[0])+' '+r(a[1])+' '+r((a[0]+b[0])/2)+' '+r((a[1]+b[1])/2); }
  return d+'Z';
}
/* ---------- Striche: Stifte und Pinsel ---------- */
function strRng(pts){ let h=2166136261; for(const q of pts.slice(0,3)){ h=Math.imul(h^Math.round(q[0]*7),16777619); h=Math.imul(h^Math.round(q[1]*7),16777619); }
  let x=h>>>0||9; return ()=>{ x^=x<<13; x>>>=0; x^=x>>>17; x^=x<<5; x>>>=0; return x/4294967296; }; }   /* gleicher Strich, gleiche Zufallswerte */
function mixC(c,to,t){ const m=/^#([0-9a-f]{6})$/i.exec(c||''); if(!m) return c; const v=parseInt(m[1],16), w=to==='w'?255:0;
  return '#'+[16,8,0].map(k=>Math.round(((v>>k)&255)*(1-t)+w*t).toString(16).padStart(2,'0')).join(''); }
function strDir(P,i){ const m=P.length, a=P[Math.max(0,i-2)], b=P[Math.min(m-1,i+2)], dx=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dx,dy)||1; return [dx/l,dy/l]; }
function strOutline(P,hw,calli){   /* Umriss aus Mittellinie und halber Breite je Punkt */
  const L=[],B=[], m=P.length;
  for(let i=0;i<m;i++){ const p=P[i], h=hw(i); let ox,oy;
    if(calli){ ox=h*0.7071; oy=-h*0.7071; } else { const [dx,dy]=strDir(P,i); ox=-dy*h; oy=dx*h; }
    L.push([p[0]+ox,p[1]+oy]); B.unshift([p[0]-ox,p[1]-oy]); }
  return smoothOutline(L.concat(B)); }
function strOffset(P,f){   /* Linie parallel zur Mittellinie, Abstand f(i) */
  let d=''; for(let i=0;i<P.length;i++){ const [dx,dy]=strDir(P,i), o=f(i); d+=(i?'L':'M')+r(P[i][0]-dy*o)+' '+r(P[i][1]+dx*o); } return d; }
function strDash(rnd,a,b,n){ const v=[]; for(let i=0;i<(n||6);i++) v.push(r(a+rnd()*(b-a))); return v.join(' '); }
function strTaper(P){   /* Anfang und Ende spitz zulaufen lassen (Kalligrafie) */
  const m=P.length, acc=[0]; for(let i=1;i<m;i++) acc.push(acc[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));
  const T=acc[m-1]||1, e=Math.min(T*0.25,40); return i=>Math.min(1,0.25+0.75*Math.min(acc[i],T-acc[i])/(e||1)); }
function strokeSVG(it){
  const pts=it.pts, tl=it.tool||'pen', tip=it.tip||'round', col=mapC(it.stroke), n=pts.length, sw=it.sw;
  let o='';
  if(n<2){ const q=sw/2; o=tl==='spray'?'':tip==='round'||tl!=='bristle'&&tl!=='brush'&&tl!=='marker'?`<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="${q}" fill="${col}"${tl==='water'?' opacity=".35"':''}/>`:`<rect x="${pts[0][0]-q}" y="${pts[0][1]-q}" width="${sw}" height="${sw}" fill="${col}"/>`;
    if(tl!=='spray') return tl==='marker'?`<g opacity="0.45">${o}</g>`:o; }
  const ws=it.ws&&it.ws.length===n?it.ws:null, rnd=strRng(pts);
  if(tl==='pencil'){   /* Bleistift: Graphit, leicht körnig; fester Druck macht dunkler */
    const S=smoothStroke(pts,ws), P=S.p, avg=ws?S.w.reduce((a,b)=>a+b,0)/S.w.length:1, op=clamp(0.55+0.35*avg,0.6,1);
    o=ws?`<path d="${strOutline(P,i=>sw*S.w[i]/2)}" fill="${col}" opacity="${r2(op*0.75)}"/>`:`<path d="${pathD(pts)}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${r2(op*0.75)}"/>`;
    for(const k of [-0.28,0,0.28]) o+=`<path d="${strOffset(P,()=>k*sw)}" fill="none" stroke="${col}" stroke-width="${r2(sw*0.42)}" stroke-linecap="round" stroke-dasharray="${strDash(rnd,0.5,3*Math.max(1,sw/2))}" opacity="${r2(op*0.8)}"/>`;
    return o; }
  if(tl==='chalk'){   /* Kreide: rau, mit kleinen Lücken und körnigen Rändern */
    const P=smoothStroke(pts,null).p;
    o=`<path d="${pathD(pts)}" fill="none" stroke="${col}" stroke-width="${r2(sw*0.8)}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${strDash(rnd,sw*0.6,sw*2.4,4)} ${r2(sw*0.3)}" opacity=".78"/>`;
    for(const k of [-0.42,-0.2,0.05,0.25,0.44]) o+=`<path d="${strOffset(P,()=>k*sw)}" fill="none" stroke="${col}" stroke-width="${r2(sw*0.22)}" stroke-linecap="round" stroke-dasharray="${strDash(rnd,0.3,sw*0.5,8)}" opacity=".7"/>`;
    return o; }
  if(tl==='spray'){   /* Sprühpinsel: viele feine Tröpfchen, zur Mitte hin dichter */
    const R=sw/2, D=[[],[]]; let cnt=0;   /* Tröpfchen je Punkt plus je Wegstück */
    for(let i=0;i<n&&cnt<4000;i++){ const p=pts[i], q=pts[Math.max(0,i-1)], k=Math.round(4+Math.hypot(p[0]-q[0],p[1]-q[1])*sw*0.08);
      for(let j=0;j<k;j++,cnt++){ const a=rnd()*6.2832, d=R*Math.pow(rnd(),0.75); D[rnd()<0.3?1:0].push(`M${r(p[0]+Math.cos(a)*d)} ${r(p[1]+Math.sin(a)*d)}h.01`); } }
    return `<g fill="none" stroke="${col}" stroke-linecap="round" opacity=".85"><path d="${D[0].join('')}" stroke-width="${r2(Math.max(1.4,sw*0.065))}"/><path d="${D[1].join('')}" stroke-width="${r2(Math.max(2.2,sw*0.11))}"/></g>`; }
  if(tl==='water'){   /* Aquarell: durchscheinend, weicher Rand, dunklere Kante; Überlagerungen werden kräftiger */
    const S=smoothStroke(pts,ws), P=S.p, hw=i=>sw*S.w[i]/2;
    const j=()=>{ const a=rnd()*6.28, b=0.85+rnd()*0.3; return i=>hw(i)*(b+0.12*Math.sin(i*0.21+a)); };   /* unregelmäßige Ränder wie verlaufene Farbe */
    return `<g fill="${col}"><path d="${strOutline(P,j())}" opacity=".16"/><path d="${strOutline(P,j())}" opacity=".16"/><path d="${strOutline(P,i=>hw(i)*0.7)}" opacity=".14"/><path d="${strOutline(P,hw)}" fill="none" stroke="${col}" stroke-width="${r2(Math.max(0.8,sw*0.05))}" opacity=".4"/></g>`; }
  if(tl==='callig'||tl==='fountain'){   /* Kalligrafie und Füller: schräge Feder, Abstriche breiter als Querstriche */
    const S=smoothStroke(pts,ws), P=S.p, nib=-0.7854, lo=tl==='callig'?0.12:0.25, tp=tl==='callig'?strTaper(P):()=>1;
    const hw=i=>{ const [dx,dy]=strDir(P,i), sn=Math.abs(Math.sin(Math.atan2(dy,dx)-nib)); return sw/2*(lo+(1-lo)*sn)*S.w[i]*tp(i); };
    return `<path d="${strOutline(P,hw)}" fill="${col}" stroke="${col}" stroke-width="0.4" stroke-linejoin="round"/>`; }
  if(tl==='bristle'){   /* Borstenpinsel: deckend, feine Borstenspuren im Strich */
    const S=smoothStroke(pts,ws), P=S.p, m=P.length, hw=i=>sw*S.w[i]/2;
    o=`<path d="${strOutline(P,hw,tip==='calli')}" fill="${col}" stroke="${col}" stroke-width="${tip==='calli'?Math.max(1,sw*0.12):0.5}" stroke-linejoin="round"/>`;
    if(tip==='round') o+=`<circle cx="${r(P[0][0])}" cy="${r(P[0][1])}" r="${r(hw(0))}" fill="${col}"/><circle cx="${r(P[m-1][0])}" cy="${r(P[m-1][1])}" r="${r(hw(m-1))}" fill="${col}"/>`;
    if(tip!=='calli'){ const k=clamp(Math.round(sw/2.5),3,9), dk=mixC(col,'b',0.35), lt=mixC(col,'w',0.35);
      for(let j=0;j<k;j++){ const f=-0.78+1.56*(j+0.5)/k+(rnd()-0.5)*0.08;
        o+=`<path d="${strOffset(P,i=>f*hw(i))}" fill="none" stroke="${j%2?lt:dk}" stroke-width="${r2(Math.max(0.5,sw*0.06))}" stroke-dasharray="${strDash(rnd,sw*2,sw*7,4)} ${r2(sw*0.6)}" stroke-dashoffset="${r(rnd()*sw*4)}" opacity=".45"/>`; } }
    return o; }
  if(tl!=='brush'&&tip!=='calli'&&!(tl==='pen'&&ws)){
    o=`<path d="${pathD(pts)}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="${tip==='flat'?'square':'round'}" stroke-linejoin="${tip==='flat'?'bevel':'round'}"/>`;
  } else {
    const S=smoothStroke(pts,ws&&tl!=='marker'?ws:null), P=S.p, m=P.length, hwAt=i=>sw*S.w[i]/2;
    o=`<path d="${strOutline(P,hwAt,tip==='calli')}" fill="${col}" stroke="${col}" stroke-width="${tip==='calli'?Math.max(1,sw*0.12):0.5}" stroke-linejoin="round"/>`;
    if(tip==='round') o+=`<circle cx="${r(P[0][0])}" cy="${r(P[0][1])}" r="${r(hwAt(0))}" fill="${col}"/><circle cx="${r(P[m-1][0])}" cy="${r(P[m-1][1])}" r="${r(hwAt(m-1))}" fill="${col}"/>`;
  }
  return tl==='marker'?`<g opacity="0.45">${o}</g>`:o;
}
function itemSVG(it){
  if(it.type==='shape'&&!BODY_KINDS.has(it.kind)) return `<g class="it" data-id="${it.id}" transform="translate(${r(it.x)} ${r(it.y)})"><rect width="${r(it.w)}" height="${r(it.h)}" rx="6" fill="rgba(128,128,128,.12)" stroke="#888" stroke-width="1.500" stroke-dasharray="6 4"/><text x="${r(it.w/2)}" y="${r(it.h/2+4)}" text-anchor="middle" font-family="${FONT}" font-size="11" fill="#888" pointer-events="none">Neuere Version nötig</text></g>`;
  if(it.type==='shape') return `<g class="it" data-id="${it.id}" transform="translate(${r(it.x)} ${r(it.y)})${it.rot?` rotate(${it.rot} ${r(it.w/2)} ${r(it.h/2)})`:''}">${shapeBody(vis(it))}${shapeText(it)}</g>`;
  if(it.type==='path')
    return `<g class="it" data-id="${it.id}"><path d="${pathD(it.pts)}" fill="none" stroke="transparent" stroke-width="${Math.max(16,it.sw+8)}" stroke-linecap="round" pointer-events="stroke"/>${strokeSVG(it)}</g>`;
  return connSVG(it);
}
function bbox(it){
  if(it.type==='shape'){ if(!it.rot) return {x:it.x,y:it.y,w:it.w,h:it.h};
    const a=it.rot*Math.PI/180, c=Math.abs(Math.cos(a)), s=Math.abs(Math.sin(a)), W=it.w*c+it.h*s, H=it.w*s+it.h*c;
    return {x:it.x+it.w/2-W/2,y:it.y+it.h/2-H/2,w:W,h:H}; }
  const pts=it.type==='path'?it.pts.map(p=>({x:p[0],y:p[1]})):route(it);
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);
  return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};
}

