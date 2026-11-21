/* ---------- Verbinder ---------- */
function anchor(c,end){
  const s=byId(end==='a'?c.from:c.to);
  if(s&&s.type==='shape') return {x:s.x,y:s.y,w:s.w,h:s.h,kind:s.kind};
  const p=end==='a'?c.p1:c.p2; return {x:p.x,y:p.y,w:0,h:0,kind:'pt'};
}
function clip(A,to){
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
function sidePt(A,sd){ const v=SIDES[sd]; return {x:A.x+A.w/2+v[0]*A.w/2,y:A.y+A.h/2+v[1]*A.h/2}; }
function autoSide(A,to){ const dx=to.x-(A.x+A.w/2),dy=to.y-(A.y+A.h/2); return Math.abs(dx)*(A.h||1)>=Math.abs(dy)*(A.w||1)?(dx>=0?'e':'w'):(dy>=0?'s':'n'); }
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
  if(c.style==='straight'){ const qa=fa?sidePt(A,fa):null, qb=fb?sidePt(B,fb):null; return [qa||clip(A,qb||bc),qb||clip(B,qa||ac)]; }
  if(fa||fb){ const sa=fa||autoSide(A,fb?sidePt(B,fb):bc), p1=sidePt(A,sa), sb=fb||autoSide(B,p1); return orth(p1,sa,sidePt(B,sb),sb); }
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
      `<text text-anchor="middle" font-family="${FONT}" font-size="${FS}"${BOLD?' font-weight="600"':''} fill="${c.tc?mapC(c.tc):tink()}" pointer-events="none">`+
      ls.map((l,i)=>`<tspan x="${r(m.x)}" y="${r(m.y-(ls.length-1)*LH/2+FS*0.35+i*LH)}">${esc(l)}</tspan>`).join('')+`</text>`; }
  return o+'</g>';
}
function pathD(pts){
  if(pts.length<2) return `M${pts[0][0]} ${pts[0][1]}l0.01 0`;
  let d=`M${pts[0][0]} ${pts[0][1]}`;
  for(let i=1;i<pts.length-1;i++){ const p=pts[i],q=pts[i+1]; d+=`Q${p[0]} ${p[1]} ${r((p[0]+q[0])/2)} ${r((p[1]+q[1])/2)}`; }
  const l=pts[pts.length-1]; return d+`L${l[0]} ${l[1]}`;
}
function strokeSVG(it){
  const pts=it.pts, tl=it.tool||'pen', tip=it.tip||'round', col=mapC(it.stroke), n=pts.length;
  let o='';
  if(n<2){ const q=it.sw/2; o=tip==='round'?`<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="${q}" fill="${col}"/>`:`<rect x="${pts[0][0]-q}" y="${pts[0][1]-q}" width="${it.sw}" height="${it.sw}" fill="${col}"/>`; }
  else if(tl!=='brush'&&tip!=='calli'){
    o=`<path d="${pathD(pts)}" fill="none" stroke="${col}" stroke-width="${it.sw}" stroke-linecap="${tip==='flat'?'square':'round'}" stroke-linejoin="${tip==='flat'?'bevel':'round'}"/>`;
  } else {
    const L=[],B=[], ws=it.ws||[], hwAt=i=>it.sw*(tl==='brush'&&ws[i]!=null?ws[i]:1)/2;
    for(let i=0;i<n;i++){ const p=pts[i], hw=hwAt(i); let ox,oy;
      if(tip==='calli'){ ox=hw*0.7071; oy=-hw*0.7071; }
      else { const a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)], dx=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dx,dy)||1; ox=-dy/l*hw; oy=dx/l*hw; }
      L.push(r(p[0]+ox)+' '+r(p[1]+oy)); B.unshift(r(p[0]-ox)+' '+r(p[1]-oy)); }
    o=`<path d="M${L.concat(B).join('L')}Z" fill="${col}" stroke="${col}" stroke-width="${tip==='calli'?Math.max(1,it.sw*0.12):0.8}" stroke-linejoin="round"/>`;
    if(tip==='round') o+=`<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="${r(hwAt(0))}" fill="${col}"/><circle cx="${pts[n-1][0]}" cy="${pts[n-1][1]}" r="${r(hwAt(n-1))}" fill="${col}"/>`;
  }
  return tl==='marker'?`<g opacity="0.45">${o}</g>`:o;
}
function itemSVG(it){
  if(it.type==='shape'&&!BODY_KINDS.has(it.kind)) return `<g class="it" data-id="${it.id}" transform="translate(${r(it.x)} ${r(it.y)})"><rect width="${r(it.w)}" height="${r(it.h)}" rx="6" fill="rgba(128,128,128,.12)" stroke="#888" stroke-width="1.500" stroke-dasharray="6 4"/><text x="${r(it.w/2)}" y="${r(it.h/2+4)}" text-anchor="middle" font-family="${FONT}" font-size="11" fill="#888" pointer-events="none">Neuere Version nötig</text></g>`;
  if(it.type==='shape') return `<g class="it" data-id="${it.id}" transform="translate(${r(it.x)} ${r(it.y)})">${shapeBody(vis(it))}${shapeText(it)}</g>`;
  if(it.type==='path')
    return `<g class="it" data-id="${it.id}"><path d="${pathD(it.pts)}" fill="none" stroke="transparent" stroke-width="${Math.max(16,it.sw+8)}" stroke-linecap="round" pointer-events="stroke"/>${strokeSVG(it)}</g>`;
  return connSVG(it);
}
function bbox(it){
  if(it.type==='shape') return {x:it.x,y:it.y,w:it.w,h:it.h};
  const pts=it.type==='path'?it.pts.map(p=>({x:p[0],y:p[1]})):route(it);
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);
  return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};
}

