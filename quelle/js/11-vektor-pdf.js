/* ---------- Vektor-PDF: Formen bleiben scharf, Text ist echter, durchsuchbarer Text (alle Board-Schriften eingebettet) ---------- */
const PDFX={fonts:null,cc:new Map()};
const pdN=v=>{ const t=Math.round(v*100)/100; return Object.is(t,-0)?'0':String(t); };
async function pdPipe(u8,st){ return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(st)).arrayBuffer()); }
async function pdDeflate(u8){ if(typeof CompressionStream==='undefined') return null; try{ return await pdPipe(u8,new CompressionStream('deflate')); }catch(e){ return null; } }
async function woffToSfnt(w){
  const dv=new DataView(w.buffer,w.byteOffset,w.byteLength); if(dv.getUint32(0)!==0x774F4646) throw 'woff';
  const nt=dv.getUint16(12), tabs=[];
  for(let i=0;i<nt;i++){ const o=44+i*20; tabs.push({tag:dv.getUint32(o),off:dv.getUint32(o+4),comp:dv.getUint32(o+8),orig:dv.getUint32(o+12),ck:dv.getUint32(o+16)}); }
  for(const t of tabs){ const raw=w.subarray(t.off,t.off+t.comp); t.data=t.comp<t.orig?await pdPipe(raw,new DecompressionStream('deflate')):raw; }
  let size=12+16*nt; for(const t of tabs) size+=(t.orig+3)&~3;
  const out=new Uint8Array(size), ov=new DataView(out.buffer); let es=0; while((1<<(es+1))<=nt) es++;
  ov.setUint32(0,dv.getUint32(4)); ov.setUint16(4,nt); ov.setUint16(6,16<<es); ov.setUint16(8,es); ov.setUint16(10,nt*16-(16<<es));
  let p=12+16*nt; tabs.forEach((t,i)=>{ const o=12+i*16; ov.setUint32(o,t.tag); ov.setUint32(o+4,t.ck); ov.setUint32(o+8,p); ov.setUint32(o+12,t.orig); out.set(t.data.subarray(0,t.orig),p); p+=(t.orig+3)&~3; });
  return out;
}
function ttInfo(b){
  const dv=new DataView(b.buffer,b.byteOffset,b.byteLength), nt=dv.getUint16(4), T={};
  for(let i=0;i<nt;i++){ const o=12+i*16; T[String.fromCharCode(b[o],b[o+1],b[o+2],b[o+3])]=dv.getUint32(o+8); }
  const upm=dv.getUint16(T.head+18), bb=[0,1,2,3].map(i=>dv.getInt16(T.head+36+i*2)), asc=dv.getInt16(T.hhea+4), desc=dv.getInt16(T.hhea+6), nhm=dv.getUint16(T.hhea+34);
  const cm=new Map(), c0=T.cmap, n=dv.getUint16(c0+2); let f4=-1, f12=-1;
  for(let i=0;i<n;i++){ const pid=dv.getUint16(c0+4+i*8), eid=dv.getUint16(c0+6+i*8), off=c0+dv.getUint32(c0+8+i*8), f=dv.getUint16(off);
    if(f===12) f12=off; else if(f===4&&(pid===0||(pid===3&&eid===1))) f4=off; }
  if(f12>=0){ const ng=dv.getUint32(f12+12); for(let i=0;i<ng;i++){ const o=f12+16+i*12, a=dv.getUint32(o), e=dv.getUint32(o+4), g=dv.getUint32(o+8); for(let c=a;c<=e;c++) cm.set(c,g+c-a); } }
  else if(f4>=0){ const sx=dv.getUint16(f4+6), ends=f4+14, starts=ends+sx+2, dels=starts+sx, ros=dels+sx;
    for(let i=0;i<sx/2;i++){ const e=dv.getUint16(ends+i*2), a=dv.getUint16(starts+i*2), d=dv.getInt16(dels+i*2), ro=dv.getUint16(ros+i*2);
      for(let c=a;c<=e&&c!==0xFFFF;c++){ let g; if(!ro) g=(c+d)&0xFFFF; else { g=dv.getUint16(ros+i*2+ro+(c-a)*2); if(g) g=(g+d)&0xFFFF; } if(g) cm.set(c,g); } } }
  const gA=cm.get(65)||0, adv=dv.getUint16(T.hmtx+Math.min(gA,nhm-1)*4);
  const aw=g=>dv.getUint16(T.hmtx+Math.min(g,nhm-1)*4);   /* Vorschubbreite je Glyphe (proportionale Schriften) */
  return {bytes:b,upm,bb,asc,desc,adv,cm,aw};
}
async function pdfFonts(){   /* alle eingebetteten Board-Schriften: Familie → Gewicht → Schriftdaten */
  if(PDFX.fonts) return PDFX.fonts;
  const F={};
  for(const id of ['fontBoard','fontHand','fontPlus']){ const el=$(id); if(!el) continue;
    for(const m of el.textContent.matchAll(/@font-face\{font-family:'([^']+)';[^}]*?font-weight:(\d+);[^}]*?base64,([A-Za-z0-9+\/=]+)/g)){
      const bin=atob(m[3]), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
      try{ (F[m[1]]||(F[m[1]]={}))[m[2]]=ttInfo(await woffToSfnt(u)); }catch(e){} } }
  if(!F['Roboto Mono']||!F['Roboto Mono']['400']) throw 'font';
  return PDFX.fonts=F;
}
const pdCtx=document.createElement('canvas').getContext('2d');
function pdCol(c){
  if(!c||c==='none'||c==='transparent') return null;
  if(PDFX.cc.has(c)) return PDFX.cc.get(c);
  pdCtx.fillStyle='#000'; pdCtx.fillStyle=c; const v=pdCtx.fillStyle; let res;
  if(v[0]==='#') res=[parseInt(v.slice(1,3),16)/255,parseInt(v.slice(3,5),16)/255,parseInt(v.slice(5,7),16)/255,1];
  else { const m=(v.match(/[\d.]+/g)||[0,0,0]).map(Number); res=[m[0]/255,m[1]/255,m[2]/255,m.length>3?m[3]:1]; }
  if(res[3]<=0) res=null; PDFX.cc.set(c,res); return res;
}
const PDNUM=/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;
function pdTf(t){
  let M=[1,0,0,1,0,0]; const mul=N=>{ M=[M[0]*N[0]+M[2]*N[1],M[1]*N[0]+M[3]*N[1],M[0]*N[2]+M[2]*N[3],M[1]*N[2]+M[3]*N[3],M[0]*N[4]+M[2]*N[5]+M[4],M[1]*N[4]+M[3]*N[5]+M[5]]; };
  for(const m of t.matchAll(/(\w+)\s*\(([^)]*)\)/g)){ const a=(m[2].match(PDNUM)||[]).map(Number);
    if(m[1]==='translate') mul([1,0,0,1,a[0]||0,a[1]||0]);
    else if(m[1]==='scale') mul([a[0]??1,0,0,a[1]??a[0]??1,0,0]);
    else if(m[1]==='rotate'){ const q=(a[0]||0)*Math.PI/180, c=Math.cos(q), sn=Math.sin(q); if(a.length>2) mul([1,0,0,1,a[1],a[2]]); mul([c,sn,-sn,c,0,0]); if(a.length>2) mul([1,0,0,1,-a[1],-a[2]]); }
    else if(m[1]==='matrix'&&a.length===6) mul(a); }
  return M;
}
function pdArc(x1,y1,rx,ry,phi,fa,fs,x2,y2,o){
  rx=Math.abs(rx); ry=Math.abs(ry); if(x1===x2&&y1===y2) return; if(!rx||!ry){ o.push(pdN(x2)+' '+pdN(y2)+' l'); return; }
  const p=phi*Math.PI/180, cs=Math.cos(p), sn=Math.sin(p), dx=(x1-x2)/2, dy=(y1-y2)/2, xp=cs*dx+sn*dy, yp=-sn*dx+cs*dy;
  let L=xp*xp/(rx*rx)+yp*yp/(ry*ry); if(L>1){ L=Math.sqrt(L); rx*=L; ry*=L; }
  const num=rx*rx*ry*ry-rx*rx*yp*yp-ry*ry*xp*xp, den=rx*rx*yp*yp+ry*ry*xp*xp; let co=den?Math.sqrt(Math.max(0,num/den)):0; if(fa===fs) co=-co;
  const cxp=co*rx*yp/ry, cyp=-co*ry*xp/rx, cx=cs*cxp-sn*cyp+(x1+x2)/2, cy=sn*cxp+cs*cyp+(y1+y2)/2;
  const ang=(ux,uy,vx,vy)=>Math.atan2(ux*vy-uy*vx,ux*vx+uy*vy);
  const t1=ang(1,0,(xp-cxp)/rx,(yp-cyp)/ry); let dt=ang((xp-cxp)/rx,(yp-cyp)/ry,(-xp-cxp)/rx,(-yp-cyp)/ry);
  if(!fs&&dt>0) dt-=2*Math.PI; else if(fs&&dt<0) dt+=2*Math.PI;
  const segs=Math.max(1,Math.ceil(Math.abs(dt)/(Math.PI/2)-1e-9)), d=dt/segs, k=4/3*Math.tan(d/4);
  const P=(ex,ey)=>pdN(cx+rx*ex*cs-ry*ey*sn)+' '+pdN(cy+rx*ex*sn+ry*ey*cs);
  for(let i=0;i<segs;i++){ const a=t1+i*d, b=a+d, ca=Math.cos(a), sa=Math.sin(a), cb=Math.cos(b), sb=Math.sin(b);
    o.push(P(ca-k*sa,sa+k*ca)+' '+P(cb+k*sb,sb-k*cb)+' '+P(cb,sb)+' c'); }
}
function pdPath(d,o){
  const tk=d.match(/[a-df-zA-DF-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi)||[]; let i=0, cmd='', x=0,y=0, sx=0,sy=0, cx=0,cy=0, qx=0,qy=0, last='';
  const n=()=>+tk[i++], has=k=>i+k<=tk.length&&tk.slice(i,i+k).every(t=>!/^[a-zA-Z]$/.test(t)), P=(a,b)=>pdN(a)+' '+pdN(b);
  while(i<tk.length){
    if(/^[a-zA-Z]$/.test(tk[i])) cmd=tk[i++]; else if(!cmd){ i++; continue; }
    const rel=cmd!==cmd.toUpperCase(), U=cmd.toUpperCase(), bx=rel?x:0, by=rel?y:0;
    if(U==='Z'){ o.push('h'); x=sx; y=sy; last='Z'; continue; }
    const need={M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7}[U]; if(!need||!has(need)){ i++; continue; }
    if(U==='M'){ x=bx+n(); y=by+n(); sx=x; sy=y; o.push(P(x,y)+' m'); cmd=rel?'l':'L'; }
    else if(U==='L'){ x=bx+n(); y=by+n(); o.push(P(x,y)+' l'); }
    else if(U==='H'){ x=bx+n(); o.push(P(x,y)+' l'); }
    else if(U==='V'){ y=by+n(); o.push(P(x,y)+' l'); }
    else if(U==='C'||U==='S'){ let x1,y1; if(U==='C'){ x1=bx+n(); y1=by+n(); } else if(last==='C'||last==='S'){ x1=2*x-cx; y1=2*y-cy; } else { x1=x; y1=y; }
      cx=bx+n(); cy=by+n(); x=bx+n(); y=by+n(); o.push(P(x1,y1)+' '+P(cx,cy)+' '+P(x,y)+' c'); }
    else if(U==='Q'||U==='T'){ if(U==='Q'){ qx=bx+n(); qy=by+n(); } else if(last==='Q'||last==='T'){ qx=2*x-qx; qy=2*y-qy; } else { qx=x; qy=y; }
      const ex=bx+n(), ey=by+n(); o.push(P(x+2/3*(qx-x),y+2/3*(qy-y))+' '+P(ex+2/3*(qx-ex),ey+2/3*(qy-ey))+' '+P(ex,ey)+' c'); x=ex; y=ey; }
    else if(U==='A'){ const rx=n(), ry=n(), ph=n(), fa=n(), fs=n(), ex=bx+n(), ey=by+n(); pdArc(x,y,rx,ry,ph,!!fa,!!fs,ex,ey,o); x=ex; y=ey; }
    last=U;
  }
}
function pdEll(cx,cy,rx,ry,o){ const k=0.5522847, P=(a,b)=>pdN(a)+' '+pdN(b);
  o.push(P(cx+rx,cy)+' m',P(cx+rx,cy+ry*k)+' '+P(cx+rx*k,cy+ry)+' '+P(cx,cy+ry)+' c',P(cx-rx*k,cy+ry)+' '+P(cx-rx,cy+ry*k)+' '+P(cx-rx,cy)+' c',
    P(cx-rx,cy-ry*k)+' '+P(cx-rx*k,cy-ry)+' '+P(cx,cy-ry)+' c',P(cx+rx*k,cy-ry)+' '+P(cx+rx,cy-ry*k)+' '+P(cx+rx,cy)+' c','h'); }
const PD_INH=['fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray','fill-opacity','stroke-opacity','font-size','font-weight','text-anchor','text-decoration','font-style'];
function pdSty(el,st){ const o=Object.assign({},st); for(const a of PD_INH){ const v=el.getAttribute(a); if(v!=null&&v!=='inherit') o[a]=v; }
  const op=el.getAttribute('opacity'); if(op!=null) o.op=(o.op??1)*(+op||0); return o; }
async function pdfVector(boxes){
  const F=await pdfFonts(), objs=[], enc=new TextEncoder(), alloc=()=>{ objs.push(null); return objs.length; };
  const gsK=new Map(), imgs=new Map(), usedF={}, fontUse={};
  const gs=(ca,CA)=>{ const k=pdN(ca)+'/'+pdN(CA); if(!gsK.has(k)) gsK.set(k,'G'+gsK.size); return '/'+gsK.get(k)+' gs'; };
  const fam1=f=>{ const m=/^\s*['"]?([^'",]+)/.exec(f||''); return m&&F[m[1].trim()]?m[1].trim():'Roboto Mono'; };
  /* passender Schnitt: gewünschtes Gewicht oder das nächstliegende; fehlt Fett, wird es nachgeahmt (wie im Browser) */
  const pick=(fam,st)=>{ const w=String(st['font-weight']||'400'), v=w==='bold'?700:parseInt(w)||400, W=Object.keys(F[fam]).map(Number).sort((a,b)=>a-b);
    const k=String(W.reduce((b,x)=>Math.abs(x-v)<Math.abs(b-v)?x:b,W[0])); return {key:fam+'|'+k,fo:F[fam][k],fake:v>=550&&+k<550}; };
  async function img(key,make){ if(!imgs.has(key)) imgs.set(key,Object.assign({name:'I'+imgs.size},await make())); return imgs.get(key); }
  const decode=src=>new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; });
  function rgba(cv){ const {width:w,height:h}=cv, d=cv.getContext('2d').getImageData(0,0,w,h).data, rgb=new Uint8Array(w*h*3), al=new Uint8Array(w*h); let A=false;
    for(let i=0,j=0;i<d.length;i+=4,j++){ rgb[j*3]=d[i]; rgb[j*3+1]=d[i+1]; rgb[j*3+2]=d[i+2]; al[j]=d[i+3]; if(d[i+3]<255) A=true; }
    return {w,h,rgb,al:A?al:null}; }
  async function imgOf(src){ return img(src,async()=>{ const im=await decode(src), w=im.naturalWidth, h=im.naturalHeight;
    if(/^data:image\/jpeg;base64,/.test(src)){ const bin=atob(src.slice(src.indexOf(',')+1)), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return {w,h,jpg:u}; }
    const cv=document.createElement('canvas'); cv.width=w; cv.height=h; cv.getContext('2d').drawImage(im,0,0); return rgba(cv); }); }
  function rasterText(txt,fs,wt,col,fam,ital){   /* Zeichen, die die eingebettete Schrift nicht kennt (Pfeile, Emojis) – und andere Schriftarten: als Bild */
    const S=4, c=document.createElement('canvas'), g=c.getContext('2d'), font=`${ital?'italic ':''}${wt} ${fs*S}px ${fam||FONT}`; g.font=font;
    const w=Math.max(1,Math.ceil(g.measureText(txt).width)); c.width=w; c.height=Math.ceil(fs*1.5*S);
    g.font=font; g.fillStyle=`rgba(${Math.round(col[0]*255)},${Math.round(col[1]*255)},${Math.round(col[2]*255)},${col[3]})`; g.textBaseline='alphabetic'; g.fillText(txt,0,fs*1.15*S);
    return {w:w/S,h:c.height/S,asc:fs*1.15,data:rgba(c)}; }
  function paint(o,st,path){
    const f=pdCol(st.fill==null?'#000':st.fill), s=pdCol(st.stroke), sw=+(st['stroke-width']??1);
    const fa=f?f[3]*(st['fill-opacity']!=null?+st['fill-opacity']:1)*(st.op??1):0, sa=s&&sw>0?s[3]*(st['stroke-opacity']!=null?+st['stroke-opacity']:1)*(st.op??1):0;
    if(fa<=0.003&&sa<=0.003) return;
    o.push('q'); if(fa<1||sa<1) o.push(gs(Math.max(0,Math.min(1,fa)),Math.max(0,Math.min(1,sa))));
    if(fa>0.003) o.push(`${pdN(f[0])} ${pdN(f[1])} ${pdN(f[2])} rg`);
    if(sa>0.003){ o.push(`${pdN(s[0])} ${pdN(s[1])} ${pdN(s[2])} RG`,pdN(sw)+' w',({round:1,square:2}[st['stroke-linecap']]||0)+' J',({round:1,bevel:2}[st['stroke-linejoin']]||0)+' j');
      const da=st['stroke-dasharray']; if(da&&da!=='none'){ const v=(da.match(PDNUM)||[]).map(Number); if(v.length&&v.some(x=>x>0)) o.push('['+v.map(pdN).join(' ')+'] 0 d'); } }
    o.push(...path, fa>0.003&&sa>0.003?'B':fa>0.003?'f':'S','Q');
  }
  async function text(el,st,o){
    let px=+(el.getAttribute('x')||0), py=+(el.getAttribute('y')||0);
    const runs=[]; for(const ch of el.childNodes){ if(ch.nodeType===3) runs.push([ch.data,st,null,null]); else if(ch.tagName==='tspan') runs.push([ch.textContent,pdSty(ch,st),ch.getAttribute('x'),ch.getAttribute('y')]); }
    for(const [raw,s2,ax,ay] of runs){
      if(ax!=null) px=+ax; if(ay!=null) py=+ay;
      const txt=raw.replace(/\s+/g,' ').trim(); if(!txt) continue;
      const col=pdCol(s2.fill==null?'#000':s2.fill); if(!col) continue;
      const fs=+(s2['font-size']||16), fam=fam1(el.getAttribute('font-family')), P=pick(fam,s2), fo=P.fo, al=col[3]*(s2.op??1), anc=s2['text-anchor']||'start';
      const ital=(s2['font-style']||el.getAttribute('font-style'))==='italic', sk=ital?0.25:0;   /* Kursiv: schräg gestellt wie im Browser */
      const segs=[]; for(const c of txt){ const ok=fo.cm.has(c.codePointAt(0)), L=segs[segs.length-1]; if(L&&L.ok===ok) L.t+=c; else segs.push({t:c,ok}); }
      for(const g of segs){ if(g.ok){ let a=0; for(const c of g.t) a+=fo.aw(fo.cm.get(c.codePointAt(0))); g.w=a*fs/fo.upm; } else { g.R=rasterText(g.t,fs,P.key.split('|')[1],col,fam==='Roboto Mono'?null:el.getAttribute('font-family'),ital); g.w=g.R.w; } }
      const w=segs.reduce((a,g)=>a+g.w,0); let x0=anc==='middle'?px-w/2:anc==='end'?px-w:px, cx=x0;
      for(const g of segs){
        if(g.R){ const R=g.R, im=await img('t'+imgs.size,async()=>R.data); o.push('q',...(al<1?[gs(al,al)]:[]),`${pdN(R.w)} 0 0 ${pdN(-R.h)} ${pdN(cx)} ${pdN(py-R.asc+R.h)} cm /${im.name} Do`,'Q'); }
        else { const U=usedF[P.key]||(usedF[P.key]={fo,fam,wt:P.key.split('|')[1],n:Object.keys(usedF).length,g:new Map()}); let hex='';
          for(const c of g.t){ const cp=c.codePointAt(0), gi=fo.cm.get(cp); U.g.set(gi,cp); hex+=gi.toString(16).padStart(4,'0'); }
          o.push('q'); if(al<1) o.push(gs(al,al));
          const rgb=`${pdN(col[0])} ${pdN(col[1])} ${pdN(col[2])}`;
          o.push(`${rgb} rg`,`BT /F${U.n} ${pdN(fs)} Tf 1 0 ${pdN(sk)} -1 ${pdN(cx)} ${pdN(py)} Tm <${hex}> Tj ET`,'Q'); }
        cx+=g.w; }
      if(/underline/.test(s2['text-decoration']||'')) paint(o,{fill:s2.fill,op:s2.op},[`${pdN(x0)} ${pdN(py+fs*0.12)} ${pdN(w)} ${pdN(Math.max(0.8,fs*0.07))} re`]);
      if(/line-through/.test(s2['text-decoration']||'')) paint(o,{fill:s2.fill,op:s2.op},[`${pdN(x0)} ${pdN(py-fs*0.32)} ${pdN(w)} ${pdN(Math.max(0.8,fs*0.07))} re`]);
      px=x0+w;
    }
  }
  async function walk(el,st,o){
    const tag=el.tagName; if(tag==='style'||tag==='defs'||tag==='title'||tag==='clipPath'||tag==='pattern') return;
    if(el.getAttribute('display')==='none'||el.getAttribute('visibility')==='hidden') return;
    const s2=pdSty(el,st), tf=el.getAttribute('transform'); let pushed=false;
    if(tf&&tag!=='svg'){ const M=pdTf(tf); o.push('q',M.map(pdN).join(' ')+' cm'); pushed=true; }
    const A=k=>+(el.getAttribute(k)||0);
    if(tag==='svg'||tag==='g'||tag==='a'){ for(const c of el.children) await walk(c,s2,o); }
    else if(tag==='rect'){ const x=A('x'),y=A('y'),w=A('width'),h=A('height'); if(w>0&&h>0){
        let rx=el.getAttribute('rx'), ry=el.getAttribute('ry'); rx=rx!=null?+rx:ry!=null?+ry:0; ry=ry!=null?+ry:rx; rx=Math.min(rx,w/2); ry=Math.min(ry,h/2);
        const p=[]; if(rx>0&&ry>0){ pdPath(`M${x+rx} ${y}H${x+w-rx}A${rx} ${ry} 0 0 1 ${x+w} ${y+ry}V${y+h-ry}A${rx} ${ry} 0 0 1 ${x+w-rx} ${y+h}H${x+rx}A${rx} ${ry} 0 0 1 ${x} ${y+h-ry}V${y+ry}A${rx} ${ry} 0 0 1 ${x+rx} ${y}Z`,p); }
        else p.push(`${pdN(x)} ${pdN(y)} ${pdN(w)} ${pdN(h)} re`); paint(o,s2,p); } }
    else if(tag==='circle'){ const p=[]; pdEll(A('cx'),A('cy'),A('r'),A('r'),p); if(A('r')>0) paint(o,s2,p); }
    else if(tag==='ellipse'){ const p=[]; pdEll(A('cx'),A('cy'),A('rx'),A('ry'),p); if(A('rx')>0&&A('ry')>0) paint(o,s2,p); }
    else if(tag==='path'){ const p=[]; pdPath(el.getAttribute('d')||'',p); if(p.length) paint(o,s2,p); }
    else if(tag==='line'){ paint(o,Object.assign({},s2,{fill:'none'}),[`${pdN(A('x1'))} ${pdN(A('y1'))} m`,`${pdN(A('x2'))} ${pdN(A('y2'))} l`]); }
    else if(tag==='polygon'||tag==='polyline'){ const v=((el.getAttribute('points')||'').match(PDNUM)||[]).map(Number), p=[];
      for(let i=0;i+1<v.length;i+=2) p.push(`${pdN(v[i])} ${pdN(v[i+1])} ${i?'l':'m'}`); if(tag==='polygon') p.push('h'); if(p.length>1) paint(o,tag==='polyline'?Object.assign({},s2,{fill:s2.fill??'none'}):s2,p); }
    else if(tag==='text') await text(el,s2,o);
    else if(tag==='image'){ const src=el.getAttribute('href')||el.getAttribute('xlink:href')||'', w=A('width'), h=A('height');
      if(/^data:image\//.test(src)&&w>0&&h>0){ try{ const im=await imgOf(src); o.push('q',...((s2.op??1)<1?[gs(s2.op,s2.op)]:[]),`${pdN(w)} 0 0 ${pdN(-h)} ${pdN(A('x'))} ${pdN(A('y')+h)} cm /${im.name} Do`,'Q'); }catch(e){} } }
    if(pushed) o.push('Q');
  }
  /* Seiten */
  const pages=[], cat=alloc(), pagesN=alloc(), resN=alloc();
  for(const box of boxes){
    const sv=buildSVG(box); if(!sv) continue;
    const root=new DOMParser().parseFromString(sv.svg,'image/svg+xml').documentElement; if(!root||root.tagName!=='svg') throw 'parse';
    const bw=box?box.w:sv.w, bh=box?box.h:sv.h, vb=(root.getAttribute('viewBox')||'0 0 1 1').split(/\s+/).map(Number), bx=vb[0], by=vb[1];
    const land=bw>=bh, PW=land?841.89:595.28, PH=land?595.28:841.89, Mg=28, sc=Math.min((PW-2*Mg)/bw,(PH-2*Mg)/bh), w=bw*sc, h=bh*sc, px=(PW-w)/2, py=(PH-h)/2;
    const o=[`q ${sc.toFixed(6)} 0 0 ${(-sc).toFixed(6)} ${(px-bx*sc).toFixed(3)} ${(py+h+by*sc).toFixed(3)} cm`,`${pdN(bx)} ${pdN(by)} ${pdN(bw)} ${pdN(bh)} re W n`];
    await walk(root,{},o); o.push('Q');
    pages.push({PW,PH,data:enc.encode(o.join('\n'))});
  }
  if(!pages.length) throw 'empty';
  const out=[]; const put=(n,s)=>{ objs[n-1]=s; };
  async function stream(n,dict,data,noZ){ let z=noZ?null:await pdDeflate(data); if(z&&z.length>=data.length) z=null;
    objs[n-1]=[`<< ${dict}${z?' /Filter /FlateDecode':''} /Length ${(z||data).length} >>\nstream\n`,z||data,'\nendstream']; }
  const kids=[];
  for(const pg of pages){ const pn=alloc(), cn=alloc(); kids.push(pn);
    put(pn,`<< /Type /Page /Parent ${pagesN} 0 R /MediaBox [0 0 ${pg.PW} ${pg.PH}] /Resources ${resN} 0 R /Contents ${cn} 0 R >>`); await stream(cn,'',pg.data); }
  put(cat,`<< /Type /Catalog /Pages ${pagesN} 0 R >>`); put(pagesN,`<< /Type /Pages /Kids [${kids.map(k=>k+' 0 R').join(' ')}] /Count ${kids.length} >>`);
  const fontRes=[];
  for(const U of Object.values(usedF)){ const fo=U.fo, u=U.g, K=1000/fo.upm, nm='/'+String.fromCharCode(65+U.n%26).repeat(6)+'+'+U.fam.replace(/[^A-Za-z0-9]/g,'')+'-'+U.wt;
    const t0=alloc(), cid=alloc(), fd=alloc(), ff=alloc(), tu=alloc(); fontRes.push(`/F${U.n} ${t0} 0 R`);
    const Wd=[...u.keys()].sort((a,b)=>a-b).map(g=>`${g} [${Math.round(fo.aw(g)*K)}]`).join(' ');
    put(t0,`<< /Type /Font /Subtype /Type0 /BaseFont ${nm} /Encoding /Identity-H /DescendantFonts [${cid} 0 R] /ToUnicode ${tu} 0 R >>`);
    put(cid,`<< /Type /Font /Subtype /CIDFontType2 /BaseFont ${nm} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${fd} 0 R /DW ${Math.round(fo.adv*K)} /W [${Wd}] /CIDToGIDMap /Identity >>`);
    put(fd,`<< /Type /FontDescriptor /FontName ${nm} /Flags ${U.fam==='Roboto Mono'?33:32} /FontBBox [${fo.bb.map(v=>Math.round(v*K)).join(' ')}] /ItalicAngle 0 /Ascent ${Math.round(fo.asc*K)} /Descent ${Math.round(fo.desc*K)} /CapHeight ${Math.round(fo.asc*K*0.7)} /StemV ${+U.wt>=550?120:80} /FontFile2 ${ff} 0 R >>`);
    await stream(ff,`/Length1 ${fo.bytes.length}`,fo.bytes);
    const ent=[...u].map(([g,cp])=>{ const s=String.fromCodePoint(cp); let h=''; for(let i=0;i<s.length;i++) h+=s.charCodeAt(i).toString(16).padStart(4,'0'); return `<${g.toString(16).padStart(4,'0')}> <${h}>`; });
    let cm='/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n';
    for(let i=0;i<ent.length;i+=100){ const b=ent.slice(i,i+100); cm+=`${b.length} beginbfchar\n${b.join('\n')}\nendbfchar\n`; }
    cm+='endcmap\nCMapName currentdict /CMapResource defineresource pop\nend\nend';
    await stream(tu,'',enc.encode(cm)); }
  const xo=[];
  for(const im of imgs.values()){ const n=alloc(); xo.push(`/${im.name} ${n} 0 R`);
    if(im.jpg){ await stream(n,`/Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,im.jpg,true); continue; }
    let sm=''; if(im.al){ const m=alloc(); await stream(m,`/Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceGray /BitsPerComponent 8`,im.al); sm=` /SMask ${m} 0 R`; }
    await stream(n,`/Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8${sm}`,im.rgb); }
  const gsd=[...gsK].map(([k,nm])=>{ const [ca,CA]=k.split('/'); return `/${nm} << /ca ${ca} /CA ${CA} >>`; });
  put(resN,`<< /ProcSet [/PDF /Text /ImageB /ImageC] /Font << ${fontRes.join(' ')} >> /XObject << ${xo.join(' ')} >> /ExtGState << ${gsd.join(' ')} >> >>`);
  /* zusammensetzen */
  const parts=[], offs=[]; let len=0; const add=p=>{ const b=typeof p==='string'?enc.encode(p):p; parts.push(b); len+=b.length; };
  add('%PDF-1.5\n'); add(new Uint8Array([37,226,227,207,211,10]));
  objs.forEach((ob,i)=>{ offs[i+1]=len; add(`${i+1} 0 obj\n`); if(Array.isArray(ob)) ob.forEach(add); else add(ob); add('\nendobj\n'); });
  const xref=len, N=objs.length+1; let t=`xref\n0 ${N}\n0000000000 65535 f \n`; for(let i=1;i<N;i++) t+=String(offs[i]).padStart(10,'0')+' 00000 n \n';
  add(t+`trailer\n<< /Size ${N} /Root ${cat} 0 R /Info << /Producer (Skizix) /Title (${String(doc.name||fileBase()).replace(/[^\x20-\x7e]/g,'').replace(/[()\\]/g,'')}) >> >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts,{type:'application/pdf'});
}
