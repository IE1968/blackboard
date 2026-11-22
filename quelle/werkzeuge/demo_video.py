"""Skizix: nimmt ein kurzes Vorführvideo für die Website auf.
Ablauf: mit dem Stift „Agenda“ schreiben, dasselbe als Text (groß, fett, Aufzählung), drei Folien mit Formen
und Kanban-Vorlage bauen, Tafeln ausprobieren, präsentieren, danach „Danke für Ihre Aufmerksamkeit!“ schreiben.
Aufruf:  python3 quelle/werkzeuge/demo_video.py   → website/bilder/skizix-demo.mp4 und .webm
"""
import os, sys, math, glob, shutil, subprocess, time
HIER=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,os.path.join(HIER,'..','tests')); sys.path.insert(0,HIER)
from hilfe import *
from playwright.sync_api import sync_playwright

W,H=1440,856
ZIEL=os.path.join(DIST,'website','bilder')
ROH='/tmp/skizix-demo'
START=[1.2]   # Sekunde im Rohvideo, ab der die Vorführung beginnt

CURSOR="""
(()=>{ const mk=()=>{ if(document.getElementById('fakeCur')) return;
  const c=document.createElement('div'); c.id='fakeCur';
  c.innerHTML='<svg width="26" height="30" viewBox="0 0 26 30"><path d="M3 2l0 22 6-5.5 4 9 4-1.8-4-8.7 8.2-.5z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg><i></i><b><svg width="34" height="34" viewBox="0 0 34 34"><path d="M4 30l2.500-8.500L24 4l6 6L12.500 27.500z" fill="#ffd54a" stroke="#111" stroke-width="1.600" stroke-linejoin="round"/><path d="M21 7l6 6" stroke="#111" stroke-width="1.600"/><path d="M4 30l2.500-8.500 6 6z" fill="#f3d6b0" stroke="#111" stroke-width="1.400" stroke-linejoin="round"/><path d="M4 30l1-3.400 2.400 2.400z" fill="#111"/></svg></b>';
  const st=document.createElement('style'); st.textContent='#fakeCur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}#fakeCur svg{position:absolute;left:-3px;top:-2px;transition:transform .12s}#fakeCur.down svg{transform:scale(.86)}#fakeCur b{position:absolute;left:-4px;top:-30px;display:none}#fakeCur.stift b{display:block}#fakeCur.stift svg:first-child{display:none}#fakeCur.stift i{display:none}#fakeCur i{position:absolute;left:-16px;top:-16px;width:32px;height:32px;border-radius:50%;background:rgba(77,159,255,.45);transform:scale(0);opacity:0}#fakeCur.down i{animation:rip .5s ease-out}@keyframes rip{0%{transform:scale(.2);opacity:1}100%{transform:scale(1.4);opacity:0}}';
  document.head.appendChild(st); document.body.appendChild(c);
  addEventListener('pointermove',e=>{ c.style.transform=`translate(${e.clientX}px,${e.clientY}px)`; const s=document.getElementById('board'); c.classList.toggle('stift',!!(s&&/t-(pen|brush|marker)/.test(s.getAttribute('class')||'')&&e.target.closest&&e.target.closest('#board'))); },true);
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

def w2s(pg,wx,wy):
    return pg.evaluate("""([wx,wy])=>{ const t=document.getElementById('world').getAttribute('transform'), m=/translate\\(([-\\d.]+) ([-\\d.]+)\\) scale\\(([-\\d.]+)\\)/.exec(t), r=document.getElementById('board').getBoundingClientRect();
      return [r.left+(+m[1])+wx*(+m[3]), r.top+(+m[2])+wy*(+m[3])]; }""",[wx,wy])
def griff(pg,name):
    b=pg.locator(f'#overlay [data-h="{name}"]').last.bounding_box(); return (b['x']+b['width']/2,b['y']+b['height']/2)

def schreiben(pg,m,linien,ms_je=3):
    """Handschrift: jede Linie mit kurzem Anflug, dann fein unterteilt gezeichnet."""
    for L in linien:
        m.zu(*L[0],ms=70,stufen=3); pg.mouse.down()
        for (x0,y0),(x1,y1) in zip(L,L[1:]):
            n=max(1,int(math.hypot(x1-x0,y1-y0)/9))
            for i in range(1,n+1): pg.mouse.move(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n); pg.wait_for_timeout(ms_je)
        m.x,m.y=L[-1]; pg.mouse.up()

def aufnehmen():
    from handschrift_caveat import strokes
    import beispiel_boards
    shutil.rmtree(ROH,ignore_errors=True); os.makedirs(ROH); beispiel_boards.schreiben(ROH+'/bsp')
    srv=server()
    try:
        with sync_playwright() as p:
            br=p.chromium.launch(executable_path=CHROME)
            ctx=br.new_context(accept_downloads=True,viewport={'width':W,'height':H},record_video_dir=ROH,record_video_size={'width':W,'height':H})
            ctx.add_init_script("localStorage.setItem('skizix-test-opts','1')"); ctx.add_init_script(CURSOR)
            t0=time.time(); pg=ctx.new_page(); pg.goto(URL); pg.wait_for_timeout(1200)
            # ---- Vorbereitung (wird abgeschnitten): drei fertige Boards, dann ein leeres Workshop-Board
            def name(n): pg.fill('#boardName',n); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
            pg.set_input_files('#file',ROH+'/bsp/netzwerk.json'); pg.wait_for_timeout(600); name('Firmennetz')
            pg.click('#menu [data-m="new"]'); pg.wait_for_timeout(400); pg.set_input_files('#file',ROH+'/bsp/bpmn.json'); pg.wait_for_timeout(600); name('IT-Störung (BPMN)')
            pg.click('#menu [data-m="new"]'); pg.wait_for_timeout(400)
            pg.evaluate("()=>document.querySelector('[data-tpl]').click()"); pg.wait_for_timeout(300)
            tn=pg.evaluate("()=>[...document.querySelectorAll('#tplGrid .tc b')].map(b=>b.textContent)")
            pg.click(f'#tplGrid [data-t="{[i for i,t in enumerate(tn) if t.startswith('Ishikawa')][0]}"]'); pg.wait_for_timeout(400); pg.keyboard.press('Escape')
            pg.click('#viewBtn'); pg.click('#vpSurf [data-s="slate"]'); pg.keyboard.press('Escape'); pg.keyboard.press('Shift+Digit1'); name('Ursachenanalyse')
            pg.click('#menu [data-m="new"]'); pg.wait_for_timeout(400); name('Workshop')
            pg.click('#viewBtn'); pg.click('#vpSurf [data-s="white"]'); pg.keyboard.press('Escape')
            pg.click('#propsToggle'); pg.keyboard.press('0'); pg.wait_for_timeout(5200)
            bx=pg.evaluate("()=>{const r=document.getElementById('board').getBoundingClientRect();return [r.left,r.top,r.width,r.height]}")
            L,T,BW,BH=bx
            m=Maus(pg); m.x,m.y=L+BW*0.5,T+BH*0.6; pg.mouse.move(m.x,m.y); pg.wait_for_timeout(300)
            weg=lambda: m.klick(L+BW-30,T+BH-25,warten=200)
            START[0]=time.time()-t0
            pg.wait_for_timeout(500)
            # 1) Stift: Hallo
            m.klick(*mitte(pg,'#tools [data-tool="pen"]'),warten=200)
            schreiben(pg,m,strokes('Hallo',L+60,T+120,85))
            # 2) Text: Agenda groß und fett, Punkte als Aufzählung
            m.klick(*mitte(pg,'#tools [data-tool="text"]'),warten=150)
            m.klick(L+430,T+75,warten=250); pg.keyboard.type('Agenda',delay=45); pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
            m.klick(*mitte(pg,'#tools [data-tool="text"]'),warten=150)
            m.klick(L+430,T+150,warten=250)
            for i,t in enumerate(['Scrum-Board','Mindmap','Präsentation']):
                if i: pg.keyboard.press('Enter')
                pg.keyboard.type(t,delay=35)
            pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
            m.klick(*textpos(pg,'Agenda'),warten=200)
            m.klick(*mitte(pg,'#props [data-drop="text"]'),warten=200)
            for _ in range(6): m.klick(*mitte(pg,'#colorPop [data-act="fsup"]'),warten=90)
            m.klick(*mitte(pg,'#colorPop [data-act="bold"]'),warten=250)
            m.klick(*textpos(pg,'Mindmap'),warten=200)
            m.klick(*mitte(pg,'#props [data-drop="text"]'),warten=200)
            m.klick(*mitte(pg,'#colorPop [data-act="list"]'),warten=200)
            for _ in range(3): m.klick(*mitte(pg,'#colorPop [data-act="fsup"]'),warten=90)
            weg()
            # 3) Kanban-Vorlage dazu
            for _ in range(4): m.klick(*mitte(pg,'#zoomOut'),warten=110)
            m.klick(*mitte(pg,'.gh[data-g="Allgemein"]'),warten=150)
            m.klick(*mitte(pg,'.gh[data-g="Vorlagen"]'),warten=200)
            sx,sy=mitte(pg,'.pal[data-kind="kanban"]'); m.ziehen(sx,sy,*w2s(pg,1120,230),ms=700,warten=350)
            weg()
            # 4) Zwei Folien darüberlegen
            m.klick(*mitte(pg,'.gh[data-g="Präsentation"]'),warten=200)
            def huelle(texte):
                return pg.evaluate("""T=>{let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9; for(const s of document.querySelectorAll('#items [data-id]')){ if(![...s.querySelectorAll('tspan,text')].some(e=>T.includes(e.textContent))) continue; const r=s.getBoundingClientRect(); x1=Math.min(x1,r.left);y1=Math.min(y1,r.top);x2=Math.max(x2,r.right);y2=Math.max(y2,r.bottom);} return [x1,y1,x2,y2]}""",texte)
            def folie(texte,rand):
                h=huelle(texte); cx,cy=(h[0]+h[2])/2,(h[1]+h[3])/2
                sx,sy=mitte(pg,'.pal[data-kind="frame"]'); m.ziehen(sx,sy,cx,cy,ms=650,warten=250)
                pg.keyboard.down('Shift')
                x,y=griff(pg,'rs:nw'); m.ziehen(x,y,h[0]-rand,h[1]-rand,ms=320,warten=100)
                x,y=griff(pg,'rs:se'); m.ziehen(x,y,h[2]+rand,h[3]+rand,ms=320,warten=100)
                pg.keyboard.up('Shift'); weg()
            folie(['Agenda','Scrum-Board'],22)
            folie(['To Do'],16)
            # 5) Tafel wählen
            m.klick(*mitte(pg,'#viewBtn'),warten=250)
            m.klick(*mitte(pg,'#vpSurf [data-s="slate"]'),warten=450)
            weg()
            # 6) Präsentieren
            m.klick(*mitte(pg,'#playBtn'),warten=200)
            m.klick(*mitte(pg,'#presPop [data-m="play"]'),warten=1700)
            m.klick(*mitte(pg,'#presNext'),warten=1700)
            m.klick(*mitte(pg,'#presClose'),warten=600)
            # 7) Als Bild speichern
            m.klick(*mitte(pg,'#expBtn'),warten=300)
            m.klick(*mitte(pg,'#expPop [data-m="png"]'),warten=900)
            # 8) Fertige Boards zeigen
            m.klick(*mitte(pg,'#propsToggle'),warten=400)
            for n in ('Firmennetz','IT-Störung (BPMN)','Ursachenanalyse'):
                b=pg.locator('#boardList button',has_text=n).first.bounding_box()
                m.klick(b['x']+b['width']/2,b['y']+b['height']/2,warten=3600)
            # 9) Neues Board: Danke! und ein Smiley
            m.klick(*mitte(pg,'#menu [data-m="new"]'),warten=700)
            bx=pg.evaluate("()=>{const r=document.getElementById('board').getBoundingClientRect();return [r.left,r.top,r.width,r.height]}"); L,T,BW,BH=bx
            m.klick(*mitte(pg,'#tools [data-tool="pen"]'),warten=200)
            schreiben(pg,m,strokes('Danke!',L+BW*0.16,T+BH*0.58,130))
            m.klick(*mitte(pg,'#props [data-drop="stroke"]'),warten=200)
            m.klick(*mitte(pg,'#colorPop [data-val="#d97a00"]'),warten=200)
            m.klick(*mitte(pg,'#props [data-drop="sw"]'),warten=200)
            m.klick(*pg.evaluate("()=>{const b=[...document.querySelectorAll('#colorPop .wbtn')][2].getBoundingClientRect();return [b.left+b.width/2,b.top+b.height/2]}"),warten=200)
            cx,cy,r=L+BW*0.72,T+BH*0.46,95
            schreiben(pg,m,[[(cx+math.cos(math.radians(a))*r,cy+math.sin(math.radians(a))*r*1.02) for a in range(-80,300,8)]])
            schreiben(pg,m,[[(cx-32,cy-28),(cx-31,cy-20),(cx-32,cy-12)],[(cx+32,cy-28),(cx+31,cy-20),(cx+32,cy-12)]])
            schreiben(pg,m,[[(cx+math.cos(math.radians(a))*55,cy+10+math.sin(math.radians(a))*40) for a in range(20,165,8)]])
            m.klick(*mitte(pg,'#tools [data-tool="select"]'),warten=200)
            m.zu(L+BW-140,T+BH-90,ms=500); pg.wait_for_timeout(1800)
            vid=pg.video.path(); ctx.close(); br.close()
            return vid
    finally: srv.terminate()

def umwandeln(roh):   # 1,4-fach beschleunigt, damit das Video kurz bleibt
    os.makedirs(ZIEL,exist_ok=True)
    mp4=os.path.join(ZIEL,'skizix-demo.mp4'); webm=os.path.join(ZIEL,'skizix-demo.webm'); poster=os.path.join(ZIEL,'skizix-demo.jpg')
    start=str(round(START[0],2))   # Vorbereitung abschneiden
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',start,'-i',roh,'-vf','setpts=0.5*PTS','-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart','-an',mp4],check=True)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',start,'-i',roh,'-vf','setpts=0.5*PTS','-c:v','libvpx-vp9','-b:v','0','-crf','36','-row-mt','1','-deadline','good','-cpu-used','4','-an',webm],check=True)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-sseof','-0.6','-i',mp4,'-frames:v','1','-q:v','3',poster],check=True)   # Standbild: letztes Bild mit allem und „Danke“
    return mp4,webm,poster

if __name__=='__main__':
    roh=aufnehmen(); print('Rohvideo',roh)
    for f in umwandeln(roh): print(f, os.path.getsize(f)//1024,'KB')
