/* ---------- QR-Code (Byte-Modus, Fehlerkorrektur M, Version 1–9) als SVG – ohne fremde Bibliothek ---------- */
const QR=(()=>{
  const EXP=new Uint8Array(512), LOG=new Uint8Array(256);
  for(let i=0,x=1;i<255;i++){ EXP[i]=x; LOG[x]=i; x<<=1; if(x&256) x^=0x11d; }
  for(let i=255;i<512;i++) EXP[i]=EXP[i-255];
  const mul=(a,b)=>a&&b?EXP[LOG[a]+LOG[b]]:0;
  function rsRem(data,n){
    let g=[1]; for(let i=0;i<n;i++){ const ng=new Array(g.length+1).fill(0); for(let j=0;j<g.length;j++){ ng[j]^=g[j]; ng[j+1]^=mul(g[j],EXP[i]); } g=ng; }
    const r=new Array(n).fill(0); for(const d of data){ const f=d^r[0]; r.shift(); r.push(0); for(let j=0;j<n;j++) r[j]^=mul(g[j+1],f); } return r;
  }
  /* je Version: Korrekturbytes pro Block, Blöcke [Anzahl, Datenbytes] */
  const SPEC=[null,[10,[[1,16]]],[16,[[1,28]]],[26,[[1,44]]],[18,[[2,32]]],[24,[[2,43]]],[16,[[4,27]]],[18,[[4,31]]],[22,[[2,38],[2,39]]],[22,[[3,36],[2,37]]]];
  const ALIGN=[null,[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46]];
  const MASK=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
  function matrix(text){
    const bytes=[...new TextEncoder().encode(text)]; let v=1, cap=0;
    for(;v<=9;v++){ cap=SPEC[v][1].reduce((s,[c,d])=>s+c*d,0); if(12+bytes.length*8<=cap*8) break; }
    if(v>9) return null;
    const spec=SPEC[v], bits=[], put=(val,n)=>{ for(let i=n-1;i>=0;i--) bits.push((val>>>i)&1); };
    put(4,4); put(bytes.length,8); bytes.forEach(b=>put(b,8)); put(0,Math.min(4,cap*8-bits.length)); while(bits.length%8) bits.push(0);
    const data=[]; for(let i=0;i<bits.length;i+=8){ let b=0; for(let j=0;j<8;j++) b=b<<1|bits[i+j]; data.push(b); }
    for(let p=0;data.length<cap;p++) data.push(p%2?0x11:0xEC);
    const blocks=[], ecs=[]; let k=0;
    for(const [c,d] of spec[1]) for(let i=0;i<c;i++){ const b=data.slice(k,k+d); k+=d; blocks.push(b); ecs.push(rsRem(b,spec[0])); }
    const cw=[], maxD=Math.max(...blocks.map(b=>b.length));
    for(let i=0;i<maxD;i++) for(const b of blocks) if(i<b.length) cw.push(b[i]);
    for(let i=0;i<spec[0];i++) for(const e of ecs) cw.push(e[i]);
    const N=17+4*v, M=[...Array(N)].map(()=>new Array(N).fill(0)), F=[...Array(N)].map(()=>new Array(N).fill(false));
    const set=(x,y,d)=>{ M[y][x]=d?1:0; F[y][x]=true; };
    const finder=(cx,cy)=>{ for(let dy=-4;dy<=4;dy++) for(let dx=-4;dx<=4;dx++){ const x=cx+dx, y=cy+dy; if(x<0||y<0||x>=N||y>=N) continue; const d=Math.max(Math.abs(dx),Math.abs(dy)); set(x,y,d!==2&&d!==4); } };
    finder(3,3); finder(N-4,3); finder(3,N-4);
    for(let i=0;i<N;i++){ if(!F[6][i]) set(i,6,i%2===0); if(!F[i][6]) set(6,i,i%2===0); }
    const A=ALIGN[v]; for(const ay of A) for(const ax of A){ if((ax===6&&ay===6)||(ax===6&&ay===N-7)||(ax===N-7&&ay===6)) continue;
      for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) set(ax+dx,ay+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1); }
    const fmt=mask=>{ const d=mask; let rem=d; for(let i=0;i<10;i++) rem=(rem<<1)^((rem>>>9)*0x537); const b=((d<<10)|rem)^0x5412, g=i=>(b>>>i)&1;   /* Stufe M = 00 */
      for(let i=0;i<=5;i++) set(8,i,g(i)); set(8,7,g(6)); set(8,8,g(7)); set(7,8,g(8)); for(let i=9;i<15;i++) set(14-i,8,g(i));
      for(let i=0;i<8;i++) set(N-1-i,8,g(i)); for(let i=8;i<15;i++) set(8,N-15+i,g(i)); set(8,N-8,1); };
    fmt(0);
    if(v>=7){ let rem=v; for(let i=0;i<12;i++) rem=(rem<<1)^((rem>>>11)*0x1F25); const b=v<<12|rem;
      for(let i=0;i<18;i++){ const c=(b>>>i)&1, a=N-11+i%3, bb=Math.floor(i/3); set(a,bb,c); set(bb,a,c); } }
    let i=0;
    for(let right=N-1;right>=1;right-=2){ if(right===6) right=5;
      for(let vert=0;vert<N;vert++) for(let j=0;j<2;j++){ const x=right-j, up=((right+1)&2)===0, y=up?N-1-vert:vert;
        if(!F[y][x]&&i<cw.length*8){ M[y][x]=(cw[i>>>3]>>>(7-(i&7)))&1; i++; } } }
    /* Maske mit der geringsten Strafpunktzahl wählen (Regeln: Reihen gleicher Farbe, 2×2-Blöcke, Verhältnis hell/dunkel) */
    let best=null, bestP=Infinity;
    for(let m=0;m<8;m++){
      const T=M.map((row,y)=>row.map((c,x)=>F[y][x]?c:(MASK[m](x,y)?c^1:c)));
      const S=T; fmtInto(S,F,N,m);
      let p=0;
      for(let a=0;a<N;a++){ let rx=1, ry=1; for(let b=1;b<N;b++){
        if(S[a][b]===S[a][b-1]){ rx++; if(rx===5) p+=3; else if(rx>5) p++; } else rx=1;
        if(S[b][a]===S[b-1][a]){ ry++; if(ry===5) p+=3; else if(ry>5) p++; } else ry=1; } }
      for(let y=0;y<N-1;y++) for(let x=0;x<N-1;x++){ const c=S[y][x]; if(c===S[y][x+1]&&c===S[y+1][x]&&c===S[y+1][x+1]) p+=3; }
      let dark=0; for(const row of S) for(const c of row) dark+=c; p+=Math.floor(Math.abs(dark*20-N*N*10)/(N*N))*10;
      if(p<bestP){ bestP=p; best=S; }
    }
    return best;
  }
  function fmtInto(S,F,N,mask){
    let rem=mask; for(let i=0;i<10;i++) rem=(rem<<1)^((rem>>>9)*0x537); const b=((mask<<10)|rem)^0x5412, g=i=>(b>>>i)&1, set=(x,y,d)=>{ S[y][x]=d; };
    for(let i=0;i<=5;i++) set(8,i,g(i)); set(8,7,g(6)); set(8,8,g(7)); set(7,8,g(8)); for(let i=9;i<15;i++) set(14-i,8,g(i));
    for(let i=0;i<8;i++) set(N-1-i,8,g(i)); for(let i=8;i<15;i++) set(8,N-15+i,g(i)); set(8,N-8,1);
  }
  /* SVG mit 4 Modulen Ruhezone; dunkel auf weiß */
  function svg(text){
    const S=matrix(text); if(!S) return ''; const N=S.length, q=4; let d='';
    for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(S[y][x]) d+=`M${x+q} ${y+q}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N+2*q} ${N+2*q}" shape-rendering="crispEdges" role="img" aria-label="QR-Code"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }
  return {matrix,svg};
})();
