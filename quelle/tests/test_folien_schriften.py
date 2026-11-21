import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
import subprocess,time,json
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','--directory',DIST],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(0.8)
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':1500,'height':900}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(600)
    doc=lambda: pg.evaluate("async()=>{await new Promise(r=>setTimeout(r,400));const b=JSON.parse(localStorage.getItem('blackboard-boards'));const db=await new Promise(r=>{const q=indexedDB.open('blackboard',1);q.onsuccess=()=>r(q.result)});const v=await new Promise(r=>{const q=db.transaction('docs').objectStore('docs').get(b.cur);q.onsuccess=()=>r(q.result)});db.close();return JSON.parse(v)}")
    pg.click('#menuBtn'); pg.click('#menu [data-m="clear"]'); pg.wait_for_timeout(100)
    def add(kind):
        pg.evaluate("()=>{for(let i=0;i<12;i++){const h=[...document.querySelectorAll('.gh')].find(h=>h.getAttribute('aria-expanded')==='false'); if(!h) break; h.click();}}")
        pg.focus(f'.pal[data-kind="{kind}"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(150)
    add('frame'); add('rect'); pg.keyboard.press('Escape'); add('frame'); add('frame')
    d=doc(); F=sorted([i for i in d['items'] if i.get('kind')=='frame'],key=lambda f:f['ord']); R=[i for i in d['items'] if i.get('kind')=='rect'][0]
    print('Folien:',[(f['x'],f['y'],f['w'],f['h']) for f in F],'rect',R['x'],R['y'])
    ov=any(a['x']<b2['x']+b2['w'] and a['x']+a['w']>b2['x'] and a['y']<b2['y']+b2['h'] and a['y']+a['h']>b2['y'] for i,a in enumerate(F) for b2 in F[i+1:])
    print('PASS keine Überlappung' if not ov else 'FAIL Überlappung')
    # Folie 2 über Folie 1 ziehen und wieder weg: rect darf nicht mitgehen
    import re
    def scr(x,y):
        t=pg.evaluate("()=>document.getElementById('world').getAttribute('transform')"); m=re.match(r'translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)',t)
        rc=pg.evaluate("()=>{const r=document.getElementById('board').getBoundingClientRect();return [r.left,r.top]}"); return rc[0]+float(m[1])+x*float(m[3]), rc[1]+float(m[2])+y*float(m[3])
    def drag(x1,y1,x2,y2):
        pg.mouse.move(x1,y1); pg.mouse.down()
        for i in range(1,11): pg.mouse.move(x1+(x2-x1)*i/10,y1+(y2-y1)*i/10)
        pg.mouse.up(); pg.wait_for_timeout(120)
    pg.keyboard.press('Escape'); pg.click('#menuBtn'); pg.click('#menu [data-m="fit"]'); pg.wait_for_timeout(200)
    f2=F[1]; x,y=scr(f2['x']+f2['w']/2,f2['y']); tx,ty=scr(F[0]['x']+F[0]['w']/2+40,F[0]['y']+20); drag(x,y,tx,ty)
    d=doc(); f2b=[i for i in d['items'] if i['id']==f2['id']][0]; x,y=scr(f2b['x']+f2b['w']/2,f2b['y']); drag(x,y,x+300,y+500)
    d=doc(); R2=[i for i in d['items'] if i.get('kind')=='rect'][0]; f2c=[i for i in d['items'] if i['id']==f2['id']][0]
    print('PASS Form bleibt in ihrer Folie' if (R2['x'],R2['y'])==(R['x'],R['y']) and f2c['y']!=f2['y'] else 'FAIL Form wurde mitgenommen',R2['x'],R2['y'],f2c['x'],f2c['y'])
    # eigene Folie nimmt eigene Form mit
    f1=F[0]; x,y=scr(f1['x']+f1['w']/2,f1['y']); drag(x,y,x,y-200); d=doc(); R3=[i for i in d['items'] if i.get('kind')=='rect'][0]
    print('PASS eigene Form geht mit' if R3['y']<R['y'] else 'FAIL eigene Form bleibt',R3['y'])
    # Schriften prüfen
    pg.click('#menuBtn'); pg.wait_for_timeout(150)
    bad=pg.evaluate("""()=>{const out=new Set();for(const e of document.querySelectorAll('header *,#palette *,#props *,#menu *,#presBar *,#syncForm *,#toast,#hint')){ if(!e.childNodes.length||![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())) continue; const f=getComputedStyle(e).fontFamily; if(!/^("?Roboto Mono|"?Doto)/.test(f)) out.add(e.tagName+'#'+e.id+'.'+e.className+' -> '+f.slice(0,40)); } return [...out]}""")
    print('Fremde Schriften:',bad)
    pg.screenshot(path='/tmp/bb-tests/blue_menu.png'); pg.keyboard.press('Escape')
    pg.click('#playBtn'); pg.keyboard.press('l'); pg.mouse.move(500,400); pg.mouse.move(600,430,steps=4); pg.screenshot(path='/tmp/bb-tests/blue_laser.png',clip={'x':350,'y':300,'width':400,'height':250}); pg.keyboard.press('Escape')
    print('ERR',errs); b.close()
finally: srv.terminate()
