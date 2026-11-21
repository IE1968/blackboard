import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
import subprocess,time
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','--directory',DIST],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(0.8)
S=lambda id,kind,x,y,w,h,text,**o: dict(dict(id=id,type='shape',kind=kind,x=x,y=y,w=w,h=h,text=text,fill='#fff3b0',stroke='#1c2a2e',sw=2,fs=16),**o)
doc={'items':[S('a','note',0,0,240,160,'Punkt eins\nPunkt zwei ist etwas länger und bricht um\n• Punkt drei'),S('b','rect',300,0,260,120,'Erster\nZweiter Punkt mit Umbruch',fill='#cfe8ff',list=True),S('c','text',0,220,360,90,'Ohne Liste\nZweite Zeile',fill='none')],'n':5}
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':1300,'height':800}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('skizix-test-opts','1')")
    pg.goto(URL); pg.wait_for_timeout(300)
    pg.evaluate("(d)=>{const b=JSON.parse(localStorage.getItem('blackboard-boards'));localStorage.setItem('blackboard-b-'+b.cur,JSON.stringify(d));}",doc)
    pg.reload(); pg.wait_for_timeout(500); pg.click('#zoomLabel'); pg.wait_for_timeout(200); pg.keyboard.press('Escape')
    for id in ['a','c']:
        bb=pg.evaluate("(id)=>{const r=document.querySelector('#items [data-id=\"'+id+'\"]').getBoundingClientRect();return [r.left+12,r.top+12]}",id)
        pg.mouse.click(*bb); pg.wait_for_timeout(450); pact(pg,'[data-act="list"]'); pg.wait_for_timeout(150); pg.keyboard.press('Escape')
    d=pg.evaluate("async()=>{await new Promise(r=>setTimeout(r,400));const b=JSON.parse(localStorage.getItem('blackboard-boards'));const db=await new Promise(r=>{const q=indexedDB.open('blackboard',1);q.onsuccess=()=>r(q.result)});const v=await new Promise(r=>{const q=db.transaction('docs').objectStore('docs').get(b.cur);q.onsuccess=()=>r(q.result)});db.close();return JSON.parse(v)}")
    L={i['id']:i for i in d['items']}
    check('Aufzählung an allen drei',all(L[k].get('list') for k in 'abc'))
    check('Vorhandener Punkt • wird übernommen',L['a']['text']=='Punkt eins\nPunkt zwei ist etwas länger und bricht um\nPunkt drei',repr(L['a']['text']))
    check('Aufzählungspunkte gezeichnet',pg.evaluate("()=>[...document.querySelectorAll('#items tspan')].filter(t=>t.textContent==='•').length")>=7)
    pg.screenshot(path='/tmp/bb-tests/li2.png'); check('keine Fehler',not errs,str(errs)); b.close()
finally: srv.terminate()
