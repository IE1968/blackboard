import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
import subprocess,time,json
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','--directory',DIST],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(0.8)
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':1500,'height':900},accept_downloads=True); pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('skizix-test-opts','1')")
    pg.goto(URL); pg.wait_for_timeout(400)
    leeren(pg); pg.wait_for_timeout(100)
    pg.evaluate("()=>{for(let i=0;i<14;i++){const h=[...document.querySelectorAll('.gh')].find(h=>h.getAttribute('aria-expanded')==='false'); if(!h) break; h.click();}}")
    for k in ['quiz']:
        pg.focus(f'.pal[data-kind="{k}"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(120); pg.keyboard.press('Escape')
    d=pg.evaluate("async()=>{await new Promise(r=>setTimeout(r,400));const b=JSON.parse(localStorage.getItem('blackboard-boards'));const db=await new Promise(r=>{const q=indexedDB.open('blackboard',1);q.onsuccess=()=>r(q.result)});const v=await new Promise(r=>{const q=db.transaction('docs').objectStore('docs').get(b.cur);q.onsuccess=()=>r(q.result)});db.close();return JSON.parse(v)}")
    k=[i.get('kind') for i in d['items']]; check('Quizfolie mit 3 Antworten',k.count('check')==3 and 'frame' in k,str(k))
    einpassen(pg); pg.wait_for_timeout(200); pg.keyboard.press('Escape')
    # Antwort auswählen und "Richtig" setzen
    cid=[i['id'] for i in d['items'] if i.get('kind')=='check'][0]
    bb=pg.evaluate("(id)=>{const r=document.querySelector('#items [data-id=\"'+id+'\"]').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}",cid)
    pg.mouse.click(*bb); pg.wait_for_timeout(500); pg.click('#props [data-act="qok"]'); pg.wait_for_timeout(100)
    d=pg.evaluate("async()=>{await new Promise(r=>setTimeout(r,400));const b=JSON.parse(localStorage.getItem('blackboard-boards'));const db=await new Promise(r=>{const q=indexedDB.open('blackboard',1);q.onsuccess=()=>r(q.result)});const v=await new Promise(r=>{const q=db.transaction('docs').objectStore('docs').get(b.cur);q.onsuccess=()=>r(q.result)});db.close();return JSON.parse(v)}")
    check('Richtige Antwort markiert',[bool(i.get('ok')) for i in d['items'] if i.get('kind')=='check']==[True,False,False])
    pg.screenshot(path='/tmp/bb-tests/ed.png')
    leeren(pg); pg.wait_for_timeout(100)
    for k in ['poollanes','gwev','taskuser','evterm','bgroup','datastore','flowmsg','evendmsg','callact']:
        pg.focus(f'.pal[data-kind="{k}"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(120); pg.keyboard.press('Escape')
        pg.evaluate("(k)=>{const b=JSON.parse(localStorage.getItem('blackboard-boards'));}",k)
    pg.screenshot(path='/tmp/bb-tests/ed2.png')
    pg.evaluate("()=>document.getElementById('palette').scrollTop=99999"); pg.screenshot(path='/tmp/bb-tests/pal.png',clip={'x':0,'y':60,'width':110,'height':840})
    n=pg.evaluate("()=>document.querySelectorAll('#items > g').length"); check('BPMN-Formen eingefügt',n>=9,str(n))
    check('keine Fehler',not errs,str(errs)); b.close()
finally: srv.terminate()
