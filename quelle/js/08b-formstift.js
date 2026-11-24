/* ---------- Formstift: gezeichnete Linien und Formen werden sauber ----------
   Erkennt gerade Linien, Kreise/Ellipsen, Rechtecke, Dreiecke und Rauten. Was nicht sicher erkannt wird,
   bleibt ein normaler Strich. Erkannte Formen sind echte Formen (beschriften, verbinden, ändern). */
function fsResample(P,n){
  const d=[0]; for(let i=1;i<P.length;i++) d.push(d[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));
  const L=d[d.length-1]; if(!L) return P.slice(); const out=[]; let j=0;
  for(let k=0;k<n;k++){ const t=L*k/(n-1); while(j<d.length-2&&d[j+1]<t) j++;
    const s=d[j+1]-d[j]||1, f=(t-d[j])/s; out.push([P[j][0]+(P[j+1][0]-P[j][0])*f,P[j][1]+(P[j+1][1]-P[j][1])*f]); }
  return out;
}
function fsRdp(P,eps){
  if(P.length<3) return P.slice();
  const a=P[0],b=P[P.length-1], dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy);
  let im=0,dm=0;
  for(let i=1;i<P.length-1;i++){ const d=L?Math.abs(dy*P[i][0]-dx*P[i][1]+b[0]*a[1]-b[1]*a[0])/L:Math.hypot(P[i][0]-a[0],P[i][1]-a[1]); if(d>dm){ dm=d; im=i; } }
  if(dm>eps) return fsRdp(P.slice(0,im+1),eps).slice(0,-1).concat(fsRdp(P.slice(im),eps));
  return [a,b];
}
function fsErkenne(raw){
  if(!raw||raw.length<4) return null;
  const P=fsResample(raw,64);
  let L=0; for(let i=1;i<P.length;i++) L+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);
  const xs=P.map(p=>p[0]), ys=P.map(p=>p[1]), x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys);
  const w=x1-x0, h=y1-y0, diag=Math.hypot(w,h); if(diag<14) return null;
  const a=P[0], b=P[P.length-1], se=Math.hypot(b[0]-a[0],b[1]-a[1]);
  /* gerade Linie: Anfang–Ende fast so lang wie der ganze Strich */
  if(se/L>0.94) return {typ:'linie',p1:{x:a[0],y:a[1]},p2:{x:b[0],y:b[1]}};
  /* geschlossene Form? */
  if(se>Math.max(18,0.25*diag)) return null;
  if(Math.min(w,h)<0.12*Math.max(w,h)) return null;
  const cx=(x0+x1)/2, cy=(y0+y1)/2, rx=w/2||1, ry=h/2||1;
  const eErr=P.reduce((s,p)=>s+Math.abs(Math.hypot((p[0]-cx)/rx,(p[1]-cy)/ry)-1),0)/P.length;
  /* Ecken: Strich vereinfachen und Punkte am Anfang/Ende zusammenlegen */
  let C=fsRdp(P,0.075*diag); if(C.length>2&&Math.hypot(C[0][0]-C[C.length-1][0],C[0][1]-C[C.length-1][1])<0.2*diag) C=C.slice(0,-1);
  /* Nachbarn, die fast auf einer Linie liegen, sind keine Ecke */
  for(let ch=true;ch&&C.length>3;){ ch=false;
    for(let i=0;i<C.length;i++){ const p=C[(i+C.length-1)%C.length], q=C[i], r=C[(i+1)%C.length];
      const v1=[q[0]-p[0],q[1]-p[1]], v2=[r[0]-q[0],r[1]-q[1]], cos=(v1[0]*v2[0]+v1[1]*v2[1])/((Math.hypot(...v1)*Math.hypot(...v2))||1);
      if(cos>0.92){ C.splice(i,1); ch=true; break; } } }
  const box={x:x0,y:y0,w,h};
  if(eErr<0.075&&C.length>4) return {typ:'form',kind:'ellipse',box};
  if(C.length===3) { const top=C.reduce((m,p)=>p[1]<m[1]?p:m), bot=C.reduce((m,p)=>p[1]>m[1]?p:m);
    const nTop=C.filter(p=>p[1]<y0+0.3*h).length, nBot=C.filter(p=>p[1]>y1-0.3*h).length;
    return {typ:'form',kind:'tri',box,rot:nTop===1&&nBot===2?0:nBot===1&&nTop===2?180:0}; }
  if(C.length===4){
    const corners=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]], mids=[[cx,y0],[x1,cy],[cx,y1],[x0,cy]];
    const near=(T)=>C.reduce((s,p)=>s+Math.min(...T.map(t=>Math.hypot(t[0]-p[0],t[1]-p[1]))),0)/4;
    const dc=near(corners), dm=near(mids);
    if(dc<0.16*diag&&dc<dm) return {typ:'form',kind:'rect',box};
    if(dm<0.16*diag&&dm<dc) return {typ:'form',kind:'diamond',box};
  }
  if(eErr<0.13) return {typ:'form',kind:'ellipse',box};
  return null;
}
function formstift(pts){
  const r=fsErkenne(pts); if(!r) return false;
  const ps=penStyles.smart;
  if(r.typ==='linie'){
    let {p1,p2}=r; const ang=Math.atan2(p2.y-p1.y,p2.x-p1.x)*180/Math.PI, len=Math.hypot(p2.x-p1.x,p2.y-p1.y);
    const st=Math.round(ang/45)*45; if(Math.abs(ang-st)<7){ const t=st*Math.PI/180; p2={x:p1.x+Math.cos(t)*len,y:p1.y+Math.sin(t)*len}; }   /* fast waagerecht/senkrecht/diagonal: einrasten */
    doc.items.push({id:nid(),type:'conn',from:null,to:null,p1:{x:r2(p1.x),y:r2(p1.y)},p2:{x:r2(p2.x),y:r2(p2.y)},text:'',stroke:ps.stroke,sw:ps.sw,style:'straight',dash:false,head:'none'});
  } else {
    const b=r.box; let w=b.w, h=b.h;
    if(r.kind==='ellipse'&&Math.abs(w-h)<0.18*Math.max(w,h)) w=h=(w+h)/2;   /* fast rund: Kreis */
    if(r.kind==='rect'&&Math.abs(w-h)<0.1*Math.max(w,h)) w=h=(w+h)/2;      /* fast quadratisch: Quadrat */
    const s=mkShape(r.kind,0,0); Object.assign(s,{x:r2(b.x+b.w/2-w/2),y:r2(b.y+b.h/2-h/2),w:r2(Math.max(20,w)),h:r2(Math.max(20,h)),fill:'none',stroke:ps.stroke,sw:Math.max(2,ps.sw)});
    if(r.rot) s.rot=r.rot;
    doc.items.push(s);
  }
  commit(); render();
  say(r.typ==='linie'?'Linie begradigt.':({ellipse:'Kreis',rect:'Rechteck',tri:'Dreieck',diamond:'Raute'}[r.kind]||'Form')+' erkannt.');
  return true;
}
