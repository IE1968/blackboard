"""Skizix: nimmt ein kurzes Vorführvideo für die Website auf.
Ein künstlicher Mauszeiger zieht Vorlagen herein, bearbeitet Karten, öffnet ein neues Board und zeichnet.
Aufruf:  python3 quelle/werkzeuge/demo_video.py   → website/bilder/skizix-demo.mp4 und .webm
"""
import os, sys, math, glob, shutil, subprocess, time
HIER=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,os.path.join(HIER,'..','tests'))
from hilfe import *
from playwright.sync_api import sync_playwright

W,H=1280,760
ZIEL=os.path.join(DIST,'website','bilder')
ROH='/tmp/skizix-demo'

CURSOR="""
(()=>{ const mk=()=>{ if(document.getElementById('fakeCur')) return;
  const c=document.createElement('div'); c.id='fakeCur';
  c.innerHTML='<svg width="26" height="30" viewBox="0 0 26 30"><path d="M3 2l0 22 6-5.5 4 9 4-1.8-4-8.7 8.2-.5z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg><i></i>';
  const st=document.createElement('style'); st.textContent='#fakeCur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}#fakeCur svg{position:absolute;left:-3px;top:-2px;transition:transform .12s}#fakeCur.down svg{transform:scale(.86)}#fakeCur i{position:absolute;left:-16px;top:-16px;width:32px;height:32px;border-radius:50%;background:rgba(77,159,255,.45);transform:scale(0);opacity:0}#fakeCur.down i{animation:rip .5s ease-out}@keyframes rip{0%{transform:scale(.2);opacity:1}100%{transform:scale(1.4);opacity:0}}';
  document.head.appendChild(st); document.body.appendChild(c);
  addEventListener('pointermove',e=>{ c.style.transform=`translate(${e.clientX}px,${e.clientY}px)`; },true);
  addEventListener('pointerdown',e=>{ c.classList.remove('down'); void c.offsetWidth; c.classList.add('down'); c.style.transform=`translate(${e.clientX}px,${e.clientY}px)`; },true);
  addEventListener('pointerup',()=>setTimeout(()=>c.classList.remove('down'),160),true); };
  if(document.body) mk(); else addEventListener('DOMContentLoaded',mk); })();
"""

class Maus:
    def __init__(s,pg): s.pg=pg; s.x=W/2; s.y=H/2
    def zu(s,x,y,ms=None,stufen=None):
        d=math.hypot(x-s.x,y-s.y); ms=ms or max(260,min(900,d*1.4)); n=stufen or max(8,int(ms/16))
        x0,y0=s.x,s.y
        for i in range(1,n+1):
            t=i/n; t=t*t*(3-2*t)
            s.pg.mouse.move(x0+(x-x0)*t,y0+(y-y0)*t); s.pg.wait_for_timeout(ms/n)
        s.x,s.y=x,y
    def klick(s,x,y,warten=350):
        s.zu(x,y); s.pg.wait_for_timeout(120); s.pg.mouse.down(); s.pg.wait_for_timeout(90); s.pg.mouse.up(); s.pg.wait_for_timeout(warten)
    def doppel(s,x,y,warten=400):
        s.zu(x,y); s.pg.wait_for_timeout(150); s.pg.mouse.dblclick(x,y); s.pg.wait_for_timeout(warten)
    def ziehen(s,x0,y0,x1,y1,ms=None,warten=400):
        s.zu(x0,y0); s.pg.wait_for_timeout(150); s.pg.mouse.down(); s.pg.wait_for_timeout(120)
        s.zu(x1,y1,ms); s.pg.wait_for_timeout(120); s.pg.mouse.up(); s.pg.wait_for_timeout(warten)
    def pfad(s,punkte,ms_je=22):
        s.zu(*punkte[0]); s.pg.wait_for_timeout(120); s.pg.mouse.down()
        for (x,y) in punkte[1:]: s.pg.mouse.move(x,y); s.pg.wait_for_timeout(ms_je)
        s.x,s.y=punkte[-1]; s.pg.mouse.up(); s.pg.wait_for_timeout(300)

def mitte(pg,sel):
    b=pg.locator(sel).first.bounding_box(); return (b['x']+b['width']/2,b['y']+b['height']/2)
def textpos(pg,text):
    return pg.evaluate("""t=>{ for(const s of document.querySelectorAll('#items [data-id]')){ if([...s.querySelectorAll('tspan,text')].some(e=>e.textContent===t)){ const r=s.getBoundingClientRect(); return [r.left+r.width/2,r.top+r.height/2]; } } return null }""",text)

def aufnehmen():
    shutil.rmtree(ROH,ignore_errors=True); os.makedirs(ROH)
    srv=server()
    try:
        with sync_playwright() as p:
            br=p.chromium.launch(executable_path=CHROME)
            ctx=br.new_context(viewport={'width':W,'height':H},record_video_dir=ROH,record_video_size={'width':W,'height':H})
            ctx.add_init_script("localStorage.setItem('skizix-test-opts','1')"); ctx.add_init_script(CURSOR)
            pg=ctx.new_page(); pg.goto(URL); pg.wait_for_timeout(1200)
            m=Maus(pg); pg.mouse.move(m.x,m.y)
            pg.keyboard.press('Shift+Digit1'); pg.wait_for_timeout(1400)
            # 1) neues Board
            m.klick(*mitte(pg,'#menu [data-m="new"]'),warten=700)
            # 2) Formenleiste: Allgemein zu, Vorlagen auf
            m.klick(*mitte(pg,'.gh[data-g="Allgemein"]'),warten=250)
            m.klick(*mitte(pg,'.gh[data-g="Vorlagen"]'),warten=350)
            # 3) Scrum-Board hereinziehen
            bx=pg.evaluate("()=>{const r=document.getElementById('board').getBoundingClientRect();return [r.left,r.top,r.width,r.height]}")
            sx,sy=mitte(pg,'.pal[data-kind="scrum"]')
            m.ziehen(sx,sy,bx[0]+bx[2]/2,bx[1]+bx[3]*0.48,ms=1100,warten=700)
            m.klick(bx[0]+bx[2]-40,bx[1]+bx[3]-30,warten=300)   # Auswahl aufheben
            # 4) Karte umbenennen
            x,y=textpos(pg,'Task A'); m.doppel(x,y)
            pg.keyboard.press('Control+a'); pg.keyboard.type('Login bauen',delay=85); pg.wait_for_timeout(250); pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
            # 5) Karte in die nächste Spalte ziehen
            x,y=textpos(pg,'Login bauen'); m.ziehen(x,y,x+170,y+85,ms=900,warten=500)
            # 6) Farbe der Karte ändern
            m.klick(*mitte(pg,'#props [data-drop="fill"]'),warten=350)
            m.klick(*mitte(pg,'#colorPop [data-val="#d3f0dc"]'),warten=450)
            m.klick(bx[0]+bx[2]-40,bx[1]+bx[3]-30,warten=600)
            # 7) noch ein neues Board mit Mindmap
            m.klick(*mitte(pg,'#menu [data-m="new"]'),warten=700)
            sx,sy=mitte(pg,'.pal[data-kind="mindmap"]')
            m.ziehen(sx,sy,bx[0]+bx[2]/2,bx[1]+bx[3]*0.5,ms=1000,warten=700)
            m.klick(bx[0]+bx[2]-40,bx[1]+bx[3]-30,warten=300)
            x,y=textpos(pg,'Thema'); m.doppel(x,y)
            pg.keyboard.press('Control+a'); pg.keyboard.type('Projekt',delay=90); pg.keyboard.press('Escape'); pg.wait_for_timeout(350)
            x,y=textpos(pg,'Idee 2'); m.klick(x,y,warten=350)
            m.klick(*mitte(pg,'#props [data-act="branch"]'),warten=350)
            pg.keyboard.type('Termin',delay=90); pg.keyboard.press('Enter'); pg.wait_for_timeout(500)
            m.klick(bx[0]+bx[2]-40,bx[1]+bx[3]-30,warten=300)
            # 8) Tafel Schiefer
            m.klick(*mitte(pg,'#viewBtn'),warten=400)
            m.klick(*mitte(pg,'#vpSurf [data-s="slate"]'),warten=500)
            m.klick(bx[0]+bx[2]-40,bx[1]+bx[3]-30,warten=300)
            # 9) Stift: Projekt einkreisen und Haken
            m.klick(*mitte(pg,'#tools [data-tool="pen"]'),warten=300)
            m.klick(*mitte(pg,'#props [data-drop="stroke"]'),warten=300)
            m.klick(*mitte(pg,'#colorPop [data-val="#f2c200"]'),warten=300)
            cx,cy=textpos(pg,'Projekt')
            kreis=[(cx+math.cos(a)*118,cy+math.sin(a)*62) for a in [i/48*2*math.pi*1.08-0.5 for i in range(49)]]
            m.pfad(kreis,ms_je=20)
            x,y=textpos(pg,'Termin'); x+=80
            m.pfad([(x-12,y+2),(x-4,y+10),(x+3,y+16),(x+12,y+2),(x+22,y-12),(x+30,y-22)],ms_je=45)
            m.klick(*mitte(pg,'#tools [data-tool="select"]'),warten=300)
            m.zu(bx[0]+bx[2]-120,bx[1]+bx[3]-80,ms=600); pg.wait_for_timeout(1800)
            vid=pg.video.path(); ctx.close(); br.close()
            return vid
    finally: srv.terminate()

def umwandeln(roh):   # 1,4-fach beschleunigt, damit das Video kurz bleibt
    os.makedirs(ZIEL,exist_ok=True)
    mp4=os.path.join(ZIEL,'skizix-demo.mp4'); webm=os.path.join(ZIEL,'skizix-demo.webm'); poster=os.path.join(ZIEL,'skizix-demo.jpg')
    start='1.2'   # die ersten Ladesekunden abschneiden
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',start,'-i',roh,'-vf','setpts=0.7*PTS','-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart','-an',mp4],check=True)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',start,'-i',roh,'-vf','setpts=0.7*PTS','-c:v','libvpx-vp9','-b:v','0','-crf','36','-row-mt','1','-deadline','good','-cpu-used','4','-an',webm],check=True)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss','8','-i',mp4,'-frames:v','1','-q:v','3',poster],check=True)
    return mp4,webm,poster

if __name__=='__main__':
    roh=aufnehmen(); print('Rohvideo',roh)
    for f in umwandeln(roh): print(f, os.path.getsize(f)//1024,'KB')
