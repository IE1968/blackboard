import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
import subprocess,time,json,re
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','--directory',DIST],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(0.8)
S=lambda id,kind,x,y,w,h,**o: dict(dict(id=id,type='shape',kind=kind,x=x,y=y,w=w,h=h,text='',fill='#ffffff',stroke='#1c2a2e',sw=2),**o)
items=[S('i1','frame',0,0,640,360,fill='none',ord=1),S('i2','frame',720,0,640,360,fill='none',ord=2),S('i3','rect',100,100,140,80),S('i4','ellipse',300,200,120,80),S('i5','rect',900,100,140,80),S('i6','rect',300,500,140,80),
 {'id':'i7','type':'path','pts':[[950,250],[1000,280],[1050,260]],'stroke':'#c8321f','sw':3,'tool':'pen','tip':'round'}]
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':1500,'height':900}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(400)
    pg.evaluate("(d)=>{const b=JSON.parse(localStorage.getItem('blackboard-boards'));localStorage.setItem('blackboard-b-'+b.cur,JSON.stringify(d));}",{'items':items,'n':20})
    pg.reload(); pg.wait_for_timeout(500); pg.click('#menuBtn'); pg.click('#menu [data-m="fit"]'); pg.wait_for_timeout(200)
    doc=lambda: {i['id']:i for i in pg.evaluate("async()=>{await new Promise(r=>setTimeout(r,400));const b=JSON.parse(localStorage.getItem('blackboard-boards'));const db=await new Promise(r=>{const q=indexedDB.open('blackboard',1);q.onsuccess=()=>r(q.result)});const v=await new Promise(r=>{const q=db.transaction('docs').objectStore('docs').get(b.cur);q.onsuccess=()=>r(q.result)});db.close();return JSON.parse(v)}")['items']}
    def scr(x,y):
        t=pg.evaluate("()=>document.getElementById('world').getAttribute('transform')"); m=re.match(r'translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)',t)
        rc=pg.evaluate("()=>{const r=document.getElementById('board').getBoundingClientRect();return [r.left,r.top]}"); return rc[0]+float(m[1])+x*float(m[3]), rc[1]+float(m[2])+y*float(m[3])
    def dragw(x1,y1,x2,y2):
        a=scr(x1,y1); c=scr(x2,y2); pg.mouse.move(*a); pg.mouse.down()
        for i in range(1,11): pg.mouse.move(a[0]+(c[0]-a[0])*i/10,a[1]+(c[1]-a[1])*i/10)
        pg.mouse.up(); pg.wait_for_timeout(150)
    ok=lambda n,c,x='': print(('PASS ' if c else 'FAIL ')+n,x)
    # 1) Folie 2 genau über Folie 1 schieben
    dragw(750,-18,30,-18); d=doc()
    ok('Folie 2 über Folie 1: eigene Formen kommen mit',d['i5']['x']==180 and d['i7']['pts'][0][0]==230,f"{d['i2']['x']} {d['i5']['x']}")
    ok('Formen von Folie 1 bleiben',d['i3']['x']==100 and d['i4']['x']==300)
    # 2) Folie 2 wieder wegziehen (oben liegt jetzt Folie 2? Rand gleich -> ziehen am Etikett geht an die oberste). Auswahl per Reihenfolge prüfen
    dragw(30,-18,30,-518); d=doc()
    moved='i2' if d['i2']['y']!=0 else 'i1'
    mine=['i5','i7'] if moved=='i2' else ['i3','i4']; other=['i3','i4'] if moved=='i2' else ['i5','i7']
    gy=lambda i: d[i]['y'] if 'y' in d[i] else d[i]['pts'][0][1]
    ok('Wegziehen nimmt nur die eigenen Formen mit ('+moved+')', all(gy(i)<0 for i in mine) and all(gy(i)>=0 for i in other), str({i:gy(i) for i in mine+other}))
    ok('Freie Form außerhalb bleibt',d['i6']['x']==300 and d['i6']['y']==500)
    # 3) Folie über freie Form legen und weiterziehen -> freie Form gehört dann dazu
    # 4) Form aus Folie herausziehen -> gehört nicht mehr dazu
    fid='i1' if moved=='i2' else 'i2'; 
    dragw(d['i3']['x']+70 if fid=='i1' else d['i5']['x']+70,(d['i3'] if fid=='i1' else d['i5'])['y']+40,300,640); d=doc()
    sh='i3' if fid=='i1' else 'i5'; ok('Herausgezogene Form hat keine Folie mehr','fr' not in d[sh],str(d[sh].get('fr')))
    f=d[fid]; y0=d[sh]['y']; dragw(f['x']+30,f['y']-18,f['x']+230,f['y']-18); d=doc()
    ok('Folie verschieben lässt sie liegen',d[sh]['y']==y0 and abs(d[sh]['x']-(300-70))<=20,f"{d[sh]['x']},{d[sh]['y']}")
    # Quadrat
    pg.keyboard.press('Escape'); pg.focus('.pal[data-kind="gSquare"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(150); d=doc(); q=[v for v in d.values() if v.get('kind')=='rect' and v['w']==v['h']]
    ok('Quadrat',len(q)==1,str(q[:1])[:80]); pg.screenshot(path='/tmp/bb-tests/sq.png',clip={'x':0,'y':60,'width':110,'height':420})
    print('ERR',errs); b.close()
finally: srv.terminate()
