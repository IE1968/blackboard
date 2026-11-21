import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
import json,subprocess,time,sys
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','--directory',DIST],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(0.8)
errs=[]; res=[]
def ok(name,cond,extra=''):
    res.append((name,bool(cond),extra)); print(('PASS ' if cond else 'FAIL ')+name,extra)
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':1400,'height':900},accept_downloads=True); pg=ctx.new_page()
    pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None); pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(600)
    def doc(): return pg.evaluate("async()=>{await new Promise(r=>setTimeout(r,400));const b=JSON.parse(localStorage.getItem('blackboard-boards'));const db=await new Promise(r=>{const q=indexedDB.open('blackboard',1);q.onsuccess=()=>r(q.result)});const v=await new Promise(r=>{const q=db.transaction('docs').objectStore('docs').get(b.cur);q.onsuccess=()=>r(q.result)});db.close();return JSON.parse(v)}")
    def view(): 
        t=pg.evaluate("()=>document.getElementById('world').getAttribute('transform')"); import re
        m=re.match(r'translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)',t); return float(m[1]),float(m[2]),float(m[3])
    def scr(x,y):
        vx,vy,k=view(); rc=pg.evaluate("()=>{const r=document.getElementById('board').getBoundingClientRect();return [r.left,r.top]}")
        return rc[0]+vx+x*k, rc[1]+vy+y*k
    def menu(m):
        pg.click('#menuBtn'); pg.click(f'#menu [data-m="{m}"]'); pg.wait_for_timeout(150)
    def add(kind):
        pg.evaluate("(k)=>{const g=[...document.querySelectorAll('.gh')];for(const h of g){if(h.getAttribute('aria-expanded')==='false')h.click()}}",kind)
        pg.focus(f'.pal[data-kind="{kind}"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(120)
    def drag(x1,y1,x2,y2,steps=12,hold=None,before_up=None):
        pg.mouse.move(x1,y1); pg.mouse.down()
        for i in range(1,steps+1): pg.mouse.move(x1+(x2-x1)*i/steps,y1+(y2-y1)*i/steps)
        r=before_up() if before_up else None
        pg.mouse.up(); pg.wait_for_timeout(120); return r
    menu('clear'); 
    # zoom 100% origin known
    add('rect'); add('rect')
    d=doc(); A,B=[i for i in d['items'] if i['type']=='shape']
    # move B far right/down
    bx,by=scr(B['x']+B['w']/2,B['y']+B['h']/2); drag(bx,by,bx+300,by+157)
    d=doc(); A,B=[i for i in d['items'] if i['type']=='shape']
    ok('B verschoben',B['x']!=A['x'],f"A={A['x']},{A['y']} B={B['x']},{B['y']}")
    # --- Hilfslinien: B so ziehen, dass Oberkante 4px neben A-Oberkante liegt
    bx,by=scr(B['x']+B['w']/2,B['y']+B['h']/2)
    ty=by-(B['y']-A['y'])+4
    g=drag(bx,by,bx,ty,before_up=lambda: pg.evaluate("()=>document.getElementById('overlay').innerHTML.includes('#ff3d81')"))
    d=doc(); A,B=[i for i in d['items'] if i['type']=='shape']
    ok('Einrasten an Oberkante',abs(B['y']-A['y'])<0.01,f"A.y={A['y']} B.y={B['y']}")
    ok('Hilfslinie sichtbar',g)
    # Einrasten aus -> frei
    pg.click('#viewBtn'); pg.click('#snapBtn'); pg.keyboard.press('Escape')
    bx,by=scr(B['x']+B['w']/2,B['y']+B['h']/2); drag(bx,by,bx+3,by+137)
    d=doc(); A,B=[i for i in d['items'] if i['type']=='shape']
    ok('Einrasten aus: freie Position',abs(B['y']-A['y']-137)<0.01 and (B['x']%10)!=0 ,f"B={B['x']},{B['y']}")
    pg.click('#viewBtn'); pg.click('#snapBtn'); pg.keyboard.press('Escape')
    # --- Andocken
    add('lineArrow'); d=doc(); C=[i for i in d['items'] if i['type']=='conn'][0]
    ex,ey=scr(C['p2']['x'],C['p2']['y'])
    tx,ty=scr(B['x']-6,B['y']+B['h']/2+3)   # knapp links neben B, nahe Seitenmitte
    dots=drag(ex,ey,tx,ty,before_up=lambda: pg.evaluate("()=>document.getElementById('overlay').querySelectorAll('circle[pointer-events=none]').length"))
    d=doc(); C=[i for i in d['items'] if i['type']=='conn'][0]
    ok('Ende b dockt magnetisch an B, Seite w',C['to']==B['id'] and C.get('ta')=='w',json.dumps({k:C.get(k) for k in('from','to','fa','ta')}))
    ok('Andockpunkte angezeigt',dots>=4,str(dots))
    ex,ey=scr(C['p1']['x'],C['p1']['y'])
    tx,ty=scr(A['x']+A['w']/2,A['y']+A['h']/2)
    drag(ex,ey,tx,ty)
    d=doc(); C=[i for i in d['items'] if i['type']=='conn'][0]
    ok('Ende a dockt an A (Mitte = automatisch)',C['from']==A['id'] and 'fa' not in C,json.dumps({k:C.get(k) for k in('from','to','fa','ta')}))
    # B bewegen -> Pfeil folgt (Pfad ändert sich)
    p1=pg.evaluate("(id)=>document.querySelector('#items [data-id=\"'+id+'\"] path').getAttribute('d')",C['id'])
    pg.keyboard.press('Escape')
    bx,by=scr(B['x']+B['w']/2,B['y']+B['h']/2); drag(bx,by,bx+100,by+60)
    p2=pg.evaluate("(id)=>document.querySelector('#items [data-id=\"'+id+'\"] path').getAttribute('d')",C['id'])
    ok('Pfeil folgt der Form',p1!=p2)
    # Ende wieder lösen
    pg.click('#board',position={'x':5,'y':5}); 
    d=doc(); A,B=[i for i in d['items'] if i['type']=='shape']; 
    # select conn by clicking its middle
    pts=pg.evaluate("(id)=>{const p=document.querySelector('#items [data-id=\"'+id+'\"] path');const l=p.getTotalLength();const q=p.getPointAtLength(l/2);return [q.x,q.y]}",C['id'])
    sx,sy=scr(pts[0],pts[1]); pg.mouse.click(sx,sy); pg.wait_for_timeout(100)
    hb=pg.evaluate("()=>{const c=document.querySelectorAll('#overlay [data-h=\"ce:b\"]')[1];return [+c.getAttribute('cx'),+c.getAttribute('cy')]}")
    ex,ey=scr(hb[0],hb[1]); drag(ex,ey,ex-150,ey+200)
    d=doc(); C=[i for i in d['items'] if i['type']=='conn'][0]
    ok('Ende b wieder gelöst',C['to'] is None and 'ta' not in C,json.dumps({k:C.get(k) for k in('from','to','fa','ta')}))
    # --- Sperren
    pg.keyboard.press('Escape'); ax,ay=scr(A['x']+10,A['y']+10); pg.mouse.click(ax,ay); pg.wait_for_timeout(80)
    pg.click('#props [data-act="lock"]'); pg.wait_for_timeout(80)
    drag(ax,ay,ax+200,ay+100); d=doc(); A2=[i for i in d['items'] if i['id']==A['id']][0]
    ok('Gesperrt: nicht verschiebbar',A2.get('lock') and A2['x']==A['x'] and A2['y']==A['y'])
    pg.mouse.click(ax,ay); pg.keyboard.press('Delete'); pg.wait_for_timeout(80); d=doc()
    ok('Gesperrt: nicht löschbar',any(i['id']==A['id'] for i in d['items']))
    pg.wait_for_timeout(600); pg.mouse.click(ax,ay); pg.wait_for_timeout(80); pg.click('#props [data-act="lock"]'); d=doc(); A2=[i for i in d['items'] if i['id']==A['id']][0]
    ok('Entsperren',not A2.get('lock'))
    # --- Gruppe skalieren
    pg.keyboard.press('Escape'); pg.keyboard.press('Control+a'); pg.wait_for_timeout(80)
    h=pg.evaluate("()=>{const c=document.querySelectorAll('#overlay [data-h=\"gs:se\"]')[1];return [+c.getAttribute('x')+ +c.getAttribute('width')/2,+c.getAttribute('y')+ +c.getAttribute('height')/2]}")
    before=doc(); hx,hy=scr(h[0],h[1]); drag(hx,hy,hx+200,hy+200); after=doc()
    b0=[i for i in before['items'] if i['id']==B['id']][0]; b1=[i for i in after['items'] if i['id']==B['id']][0]
    ok('Gruppe skaliert',b1['w']>b0['w']*1.1 and abs(b1['w']/b0['w']-b1['h']/b0['h'])<0.02,f"{b0['w']}x{b0['h']} -> {b1['w']}x{b1['h']}")
    pg.keyboard.press('Control+z'); pg.wait_for_timeout(80)
    # --- Tabelle
    pg.keyboard.press('Escape'); add('table'); d=doc(); T=[i for i in d['items'] if i.get('kind')=='table'][0]
    pg.keyboard.press('Escape')
    cx,cy=scr(T['x']+T['colW'][0]/2,T['y']+T['rowH'][0]+T['rowH'][1]/2); pg.mouse.click(cx,cy); pg.wait_for_timeout(500)
    pg.click('#props [data-act="addcol"]'); d=doc(); T2=[i for i in d['items'] if i.get('kind')=='table'][0]
    ok('Spalte nach Zelle eingefügt',len(T2['colW'])==4)
    hh=pg.evaluate("()=>{const c=document.querySelectorAll('#overlay [data-h=\"tc:0\"]')[1];return [+c.getAttribute('x')+ +c.getAttribute('width')/2,+c.getAttribute('y')+ +c.getAttribute('height')/2]}")
    hx,hy=scr(hh[0],hh[1]); drag(hx,hy,hx+60,hy); d=doc(); T3=[i for i in d['items'] if i.get('kind')=='table'][0]
    ok('Spaltenbreite einzeln geändert',T3['colW'][0]==T2['colW'][0]+60 and T3['colW'][1]==T2['colW'][1],str(T3['colW']))
    # --- Folien + Präsentation
    pg.keyboard.press('Escape'); add('frame'); add('frame'); d=doc(); F=[i for i in d['items'] if i.get('kind')=='frame']
    ok('Zwei Folien mit Reihenfolge',len(F)==2 and sorted(f['ord'] for f in F)==[1,2])
    lab=pg.evaluate("()=>[...document.querySelectorAll('#items text')].map(t=>t.textContent).filter(t=>t.startsWith('Folie'))")
    ok('Folien beschriftet',sorted(lab)==['Folie 1','Folie 2'],str(lab))
    pg.keyboard.press('Escape'); menu('play')
    vis=pg.evaluate("()=>!document.getElementById('pres').hidden"); vb1=pg.evaluate("()=>document.getElementById('presSvg').getAttribute('viewBox')")
    ok('Präsentation gestartet',vis,vb1)
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(700)
    vb2=pg.evaluate("()=>document.getElementById('presSvg').getAttribute('viewBox')"); no=pg.inner_text('#presNo')
    ok('Weiterblättern',vb1!=vb2 and no.strip()=='2 / 2',f'{vb2} {no}')
    pg.keyboard.press('l'); pg.mouse.move(600,400); pg.mouse.move(650,420); pg.wait_for_timeout(60)
    ok('Laserpointer',pg.evaluate("()=>!document.getElementById('laser').hidden"))
    pg.screenshot(path='/tmp/bb-tests/pres.png')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    ok('Präsentation beendet',pg.evaluate("()=>document.getElementById('pres').hidden"))
    pg.screenshot(path='/tmp/bb-tests/board.png')
    # --- PDF je Folie
    with pg.expect_download(timeout=15000) as dl:
        menu('pdf')
    path=dl.value.path(); data=open(path,'rb').read()
    ok('PDF mit 2 Seiten',data.startswith(b'%PDF') and b'/Count 2' in data,str(len(data)))
    open('/tmp/bb-tests/out.pdf','wb').write(data)
    with pg.expect_download(timeout=15000) as dl: menu('png')
    ok('PNG-Export',dl.value.path() is not None)
    # reload -> Daten bleiben gültig (cleanDoc)
    n0=len(doc()['items']); pg.reload(); pg.wait_for_timeout(500); 
    n1=pg.evaluate("()=>document.querySelectorAll('#items > g').length")
    ok('Neu laden erhält alles',n0==n1,f'{n0} {n1}')
    b.close()
finally:
    srv.terminate()
print('ERRORS:',errs)
print('RESULT',sum(1 for r in res if r[1]),'/',len(res))
