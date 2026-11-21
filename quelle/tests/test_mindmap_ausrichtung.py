import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
import subprocess,time,json
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','--directory',DIST],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(0.8)
S=lambda id,kind,x,y,w,h,text='',**o: dict(dict(id=id,type='shape',kind=kind,x=x,y=y,w=w,h=h,text=text,fill='#cfe8ff',stroke='#1c2a2e',sw=2),**o)
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':1500,'height':900}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(400)
    doc=lambda: pg.evaluate("async()=>{await new Promise(r=>setTimeout(r,400));const b=JSON.parse(localStorage.getItem('blackboard-boards'));const db=await new Promise(r=>{const q=indexedDB.open('blackboard',1);q.onsuccess=()=>r(q.result)});const v=await new Promise(r=>{const q=db.transaction('docs').objectStore('docs').get(b.cur);q.onsuccess=()=>r(q.result)});db.close();return JSON.parse(v)}")
    openFile(pg); pg.click('#menu [data-m="clear"]'); pg.wait_for_timeout(100)
    pg.evaluate("()=>{for(let i=0;i<14;i++){const h=[...document.querySelectorAll('.gh')].find(h=>h.getAttribute('aria-expanded')==='false'); if(!h) break; h.click();}}")
    pg.focus('.pal[data-kind="mindmap"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    d=doc(); check('Mindmap angelegt',sum(1 for i in d['items'] if i.get('mm')=='node')>=4); print('Mindmap:',sum(1 for i in d['items'] if i.get('mm')=='node'),'Zweige,',sum(1 for i in d['items'] if i['type']=='conn'),'Linien')
    # Zweig am Thema
    pg.click('#props [data-act="branch"]'); pg.wait_for_timeout(200); pg.keyboard.type('Neu am Thema'); pg.keyboard.press('Enter'); pg.wait_for_timeout(150)
    # Zweig an Idee 1 (zweimal)
    d=doc(); n1=[i for i in d['items'] if i.get('text')=='Idee 2'][0]
    for t in ['Unterpunkt a','Unterpunkt b']:
        pg.evaluate("(id)=>{}",n1['id'])
        bb=pg.evaluate("(id)=>{const r=document.querySelector('#items [data-id=\"'+id+'\"]').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}",n1['id'])
        pg.mouse.click(*bb); pg.wait_for_timeout(450); pg.click('#props [data-act="branch"]'); pg.wait_for_timeout(200); pg.keyboard.type(t); pg.keyboard.press('Enter'); pg.wait_for_timeout(150)
    pg.keyboard.press('Tab'); pg.wait_for_timeout(100)
    d=doc(); tx=[i['text'] for i in d['items'] if i.get('mm')=='node']; check('Zweige hinzugefügt','Neu am Thema' in tx and 'Unterpunkt a' in tx and 'Unterpunkt b' in tx); print('nach Zweigen:',sum(1 for i in d['items'] if i.get('mm')),'Knoten', [i['text'] for i in d['items'] if i.get('mm')=='node'][-3:])
    pg.click('#zoomLabel'); pg.wait_for_timeout(200); pg.keyboard.press('Escape')
    pg.screenshot(path='/tmp/bb-tests/mm.png')
    # Ausrichtung
    openFile(pg); pg.click('#menu [data-m="clear"]'); pg.wait_for_timeout(100)
    items=[S('a','text',0,0,300,90,'Linksbündig ist Standard\nkurz',fill='none'),S('b','round',0,120,300,90,'Rechts ausgerichteter Text\nkurz',al='right'),S('c','text',0,240,300,90,'Zentriert\nlängere Zeile hier',fill='none',al='center'),S('d','rect',360,0,240,110,'Links in der Form\nkurz',al='left'),
      dict(S('t','table',360,140,300,108),colW=[150,150],rowH=[36,36,36],cells=[['Kopf','Kopf 2'],['1','zwei'],['drei','4']],al='right')]
    pg.evaluate("(d)=>{const b=JSON.parse(localStorage.getItem('blackboard-boards'));localStorage.setItem('blackboard-b-'+b.cur,JSON.stringify(d));}",{'items':items,'n':10})
    pg.reload(); pg.wait_for_timeout(500); pg.click('#zoomLabel'); pg.wait_for_timeout(200); pg.keyboard.press('Escape')
    bb=pg.evaluate("()=>{const r=document.querySelector('#items [data-id=\"a\"]').getBoundingClientRect();return [r.left+20,r.top+20]}")
    pg.mouse.click(*bb); pg.wait_for_timeout(450); pg.click('#props [data-act="txal"][data-val="right"]'); pg.wait_for_timeout(150)
    check('Ausrichtung rechts gesetzt',[i.get('al') for i in doc()['items'] if i['id']=='a']==['right'])
    pg.screenshot(path='/tmp/bb-tests/al.png')
    pg.mouse.dblclick(*bb); pg.wait_for_timeout(200); check('Editor übernimmt Ausrichtung',pg.evaluate("()=>document.getElementById('editor').style.textAlign")=='right'); pg.keyboard.press('Escape')
    pg.reload(); pg.wait_for_timeout(300); al=dict((i['id'],i.get('al')) for i in doc()['items']); check('Ausrichtungen nach Neuladen',al=={'a':'right','b':'right','c':'center','d':'left','t':'right'},str(al))
    check('keine Fehler',not errs,str(errs)); b.close()
finally: srv.terminate()
