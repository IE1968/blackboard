"""Skizix: Werkzeug für die Anleitungs-Videos.
Nimmt die echte App im Browser auf (Playwright), mit sichtbarem Mauszeiger, Klick-Kreisen,
Einblendungen unten und Tasten-Anzeige. Ergebnis: website/videos/<name>.mp4 und <name>.jpg."""
import os, sys, time, subprocess, shutil, glob
HIER=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,os.path.join(HIER,'..','..','tests'))
from hilfe import server, CHROME, URL, openFile, LOAD
from playwright.sync_api import sync_playwright
ZIEL=os.path.abspath(os.path.join(HIER,'..','..','..','website','videos'))
W,H=1440,900

OVERLAY=r"""
(()=>{ if(window.__film) return; window.__film=1;
 const st=document.createElement('style'); st.textContent=`
 #fCur{position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;transform:translate(-3px,-2px);filter:drop-shadow(0 2px 3px rgba(0,0,0,.5));transition:opacity .2s}
 .fRing{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #FFD54A;z-index:2147483646;pointer-events:none;animation:fRing .55s ease-out forwards}
 @keyframes fRing{from{transform:scale(.3);opacity:1}to{transform:scale(1.25);opacity:0}}
 #fCap{position:fixed;left:50%;bottom:30px;transform:translateX(-50%) translateY(12px);opacity:0;z-index:2147483645;pointer-events:none;background:rgba(16,16,18,.92);color:#fff;font:600 26px/1.3 'Plus Jakarta Sans',system-ui,sans-serif;padding:14px 26px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.12);max-width:80vw;text-align:center;transition:opacity .25s,transform .25s}
 #fCap.on{opacity:1;transform:translateX(-50%)}
 #fCap b{color:#8FB0FF}
 .fZeig{position:fixed;z-index:2147483644;pointer-events:none;border:3px solid #FFD54A;border-radius:12px;box-shadow:0 0 0 4px rgba(255,213,74,.25),0 0 24px rgba(255,213,74,.45);animation:fZeig 1s ease-in-out infinite}
 @keyframes fZeig{50%{box-shadow:0 0 0 8px rgba(255,213,74,.12),0 0 30px rgba(255,213,74,.6)}}
 #fKey{position:fixed;right:28px;bottom:28px;z-index:2147483645;pointer-events:none;display:flex;gap:6px;opacity:0;transition:opacity .2s}
 #fKey.on{opacity:1}
 #fKey span{background:#F2F2F0;color:#18181A;font:700 22px/1 'Plus Jakarta Sans',system-ui,sans-serif;padding:9px 13px;border-radius:9px;box-shadow:0 3px 0 #9a9aa0,0 8px 20px rgba(0,0,0,.4)}
 `; document.head.appendChild(st);
 const c=document.createElement('div'); c.id='fCur'; c.innerHTML='<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l15 11.5-6.6 1.2 3.9 7.6-3 1.5-3.9-7.7L4 21z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>'; document.body.appendChild(c);
 const cap=document.createElement('div'); cap.id='fCap'; document.body.appendChild(cap);
 const key=document.createElement('div'); key.id='fKey'; document.body.appendChild(key);
 const mv=e=>{ c.style.left=e.clientX+'px'; c.style.top=e.clientY+'px'; };
 window.addEventListener('pointermove',mv,true); window.addEventListener('mousemove',mv,true);
 window.addEventListener('pointerdown',e=>{ mv(e); const r=document.createElement('div'); r.className='fRing'; r.style.left=e.clientX+'px'; r.style.top=e.clientY+'px'; document.body.appendChild(r); setTimeout(()=>r.remove(),600); },true);
 window.__cap=t=>{ if(!t){ cap.classList.remove('on'); return; } cap.innerHTML=t; cap.classList.add('on'); };
 window.__key=t=>{ if(!t){ key.classList.remove('on'); return; } key.innerHTML=t.split('+').map(x=>'<span>'+x.trim()+'</span>').join(''); key.classList.add('on'); };
 window.__zeig=(r)=>{ document.querySelectorAll('.fZeig').forEach(e=>e.remove()); if(!r) return; const d=document.createElement('div'); d.className='fZeig'; d.style.left=(r.x-6)+'px'; d.style.top=(r.y-6)+'px'; d.style.width=(r.width+12)+'px'; d.style.height=(r.height+12)+'px'; document.body.appendChild(d); };
 window.__curPos=(x,y)=>{ c.style.left=x+'px'; c.style.top=y+'px'; };
})()"""

class Film:
    def __init__(self,name,setup=None,viewport=(W,H)):
        self.name=name; self.setup=setup; self.vp=viewport
    def __enter__(self):
        self.tmp='/tmp/film-'+self.name; shutil.rmtree(self.tmp,ignore_errors=True); os.makedirs(self.tmp)
        self.srv=server(); self.pw=sync_playwright().start(); self.br=self.pw.chromium.launch(executable_path=CHROME)
        self.ctx=self.br.new_context(viewport={'width':self.vp[0],'height':self.vp[1]},
            accept_downloads=True,record_video_dir=self.tmp,record_video_size={'width':self.vp[0],'height':self.vp[1]})
        self.t0=time.time(); self.pg=self.ctx.new_page(); self.pg.goto(URL); self.pg.wait_for_timeout(1000)
        if self.setup: self.setup(self.pg)
        self.pg.wait_for_timeout(500)
        self.pg.evaluate(OVERLAY); self.x,self.y=self.vp[0]*0.62,self.vp[1]*0.55
        self.pg.mouse.move(self.x,self.y); self.start=time.time()-self.t0
        self.pause(500); return self
    # ---- Bausteine
    def pause(self,ms): self.pg.wait_for_timeout(ms)
    def cap(self,t,ms=0):
        self.pg.evaluate('t=>window.__cap(t)',t); 
        if ms: self.pause(ms)
    def ort(self,ziel):
        if isinstance(ziel,str):
            b=self.pg.locator(ziel).first.bounding_box(); return b['x']+b['width']/2,b['y']+b['height']/2
        return ziel
    def gehe(self,ziel,ms=550):
        x,y=self.ort(ziel); n=max(8,int(ms/16)); x0,y0=self.x,self.y
        for i in range(1,n+1):
            t=i/n; e=t*t*(3-2*t); self.pg.mouse.move(x0+(x-x0)*e,y0+(y-y0)*e); self.pg.wait_for_timeout(14)
        self.x,self.y=x,y
    def klick(self,ziel,ms=550,danach=350,doppelt=False):
        self.gehe(ziel,ms); self.pause(120)
        if doppelt: self.pg.mouse.dblclick(self.x,self.y)
        else: self.pg.mouse.click(self.x,self.y)
        self.pause(danach)
    def ziehe(self,von,nach,ms=900,danach=350):
        self.gehe(von); self.pause(120); self.pg.mouse.down(); self.pause(120)
        x,y=self.ort(nach); n=max(10,int(ms/16)); x0,y0=self.x,self.y
        for i in range(1,n+1):
            t=i/n; e=t*t*(3-2*t); self.pg.mouse.move(x0+(x-x0)*e,y0+(y-y0)*e); self.pg.wait_for_timeout(14)
        self.x,self.y=x,y; self.pause(120); self.pg.mouse.up(); self.pause(danach)
    def pfad(self,punkte,ms=1200,danach=300):
        """Freihand-Strich durch mehrere Punkte."""
        self.gehe(punkte[0]); self.pg.mouse.down(); n=max(20,int(ms/16)); pts=punkte
        seg=[(pts[i],pts[i+1]) for i in range(len(pts)-1)]
        per=max(2,n//len(seg))
        for (a,b) in seg:
            for i in range(1,per+1):
                t=i/per; self.pg.mouse.move(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t); self.pg.wait_for_timeout(14)
        self.x,self.y=pts[-1]; self.pg.mouse.up(); self.pause(danach)
    def zeige(self,sel,ms=1600):
        """Zeigt, wo geklickt wird – ohne zu klicken (leuchtender Rahmen um das Ziel)."""
        self.gehe(sel,600); b=self.pg.locator(sel).first.bounding_box()
        self.pg.evaluate('r=>window.__zeig(r)',b); self.pause(ms); self.pg.evaluate('()=>window.__zeig(null)')
    def tippe(self,text,ms=55): self.pg.keyboard.type(text,delay=ms)
    def taste(self,taste,anzeige=None,ms=700):
        self.pg.evaluate('t=>window.__key(t)',anzeige or taste); self.pause(250); self.pg.keyboard.press(taste); self.pause(ms); self.pg.evaluate('()=>window.__key(null)')
    def __exit__(self,*a):
        self.cap(None); self.pause(500); ende=time.time()-self.t0
        v=self.pg.video; self.ctx.close(); src=v.path(); self.br.close(); self.pw.stop(); self.srv.terminate()
        if a[0]: return False
        os.makedirs(ZIEL,exist_ok=True); mp4=os.path.join(ZIEL,self.name+'.mp4'); jpg=os.path.join(ZIEL,self.name+'.jpg')
        ss=max(0,self.start-0.05)
        subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',f'{ss:.2f}','-i',src,'-t',f'{ende-ss:.2f}','-r','25','-c:v','libx264','-preset','veryfast','-crf','26','-pix_fmt','yuv420p','-movflags','+faststart','-an',mp4],check=True)
        subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',str(self.poster if hasattr(self,'poster') else 1.5),'-i',mp4,'-frames:v','1','-q:v','4',jpg],check=True)
        print(self.name, f'{ende-ss:.1f}s', os.path.getsize(mp4)//1024,'KB')
    def bild(self):
        """Merkt die aktuelle Stelle als Vorschaubild."""
        self.poster=max(0.1,time.time()-self.t0-self.start)

def leeren_board(pg):
    """Leeres Board, Formenleiste offen, Datei-Leiste zu."""
    from hilfe import leeren
    leeren(pg); pg.wait_for_timeout(200); pg.keyboard.press('Escape')
    pg.evaluate("()=>{ if(!document.querySelector('main').classList.contains('props-closed')) document.getElementById('propsToggle').click(); if(document.querySelector('main').classList.contains('pal-closed')) document.getElementById('palHandle').click(); }")
    pg.mouse.click(760,500); pg.wait_for_timeout(200); pg.keyboard.press('Digit0'); pg.wait_for_timeout(200)
    pg.evaluate("()=>{const t=document.getElementById('toast'); if(t) t.hidden=true}")

def zoom(pg,n):
    for _ in range(n): pg.click('#zoomIn'); pg.wait_for_timeout(60)
def lade(items,n=None,zoomstufen=0,datei_zu=True):
    """Setup: Board mit diesen Elementen laden."""
    def s(pg):
        pg.evaluate(LOAD,{'items':items,'n':n or len(items)+1,'fmt':2}); pg.reload(); pg.wait_for_timeout(900)
        pg.evaluate("()=>{ if(!document.querySelector('main').classList.contains('props-closed')) document.getElementById('propsToggle').click(); if(document.querySelector('main').classList.contains('pal-closed')) document.getElementById('palHandle').click(); }")
        pg.focus('#board'); pg.wait_for_timeout(100); pg.keyboard.press('Shift+Digit1'); pg.wait_for_timeout(400)
        if zoomstufen: zoom(pg,zoomstufen)
        pg.mouse.click(1400,880); pg.wait_for_timeout(200)
    return s
def leer(zoomstufen=4):
    def s(pg):
        leeren_board(pg); zoom(pg,zoomstufen); pg.wait_for_timeout(200)
    return s
