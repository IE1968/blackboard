import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
import subprocess,time,json
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','--directory',DIST],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(0.8)
S=lambda id,kind,x,y,w,h,text='',**o: dict(dict(id=id,type='shape',kind=kind,x=x,y=y,w=w,h=h,text=text,fill='#cfe8ff',stroke='#1c2a2e',sw=2),**o)
out=[]
def say(*a): out.append(' '.join(str(x) for x in a))
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':1500,'height':900},accept_downloads=True); pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('skizix-test-opts','1')")
    pg.goto(URL); pg.wait_for_timeout(400)
    doc=lambda: pg.evaluate("async()=>{await new Promise(r=>setTimeout(r,400));const b=JSON.parse(localStorage.getItem('blackboard-boards'));const db=await new Promise(r=>{const q=indexedDB.open('blackboard',1);q.onsuccess=()=>r(q.result)});const v=await new Promise(r=>{const q=db.transaction('docs').objectStore('docs').get(b.cur);q.onsuccess=()=>r(q.result)});db.close();return JSON.parse(v)}")
    def load(items):
        pg.evaluate("(d)=>{const b=JSON.parse(localStorage.getItem('blackboard-boards'));localStorage.setItem('blackboard-b-'+b.cur,JSON.stringify(d));}",{'items':items,'n':100})
        pg.reload(); pg.wait_for_timeout(400); einpassen(pg); pg.wait_for_timeout(150); pg.keyboard.press('Escape')
    import re
    def clickW(x,y):
        t=pg.evaluate("()=>document.getElementById('world').getAttribute('transform')"); m=re.match(r'translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)',t)
        rc=pg.evaluate("()=>{const r=document.getElementById('board').getBoundingClientRect();return [r.left,r.top]}")
        pg.mouse.click(rc[0]+float(m[1])+x*float(m[3]), rc[1]+float(m[2])+y*float(m[3])); pg.wait_for_timeout(450)
    def click(id,dx=0.5,dy=0.5):
        bb=pg.evaluate("([id,dx,dy])=>{const r=document.querySelector('#items [data-id=\"'+id+'\"]').getBoundingClientRect();return [r.left+r.width*dx,r.top+r.height*dy]}",[id,dx,dy]); pg.mouse.click(*bb); pg.wait_for_timeout(450)
    # 1 Folie duplizieren: Inhalt?
    load([S('f','frame',0,0,640,360,fill='none',ord=1),S('a','rect',100,100,140,80,'Inhalt'),S('t','text',100,40,300,40,'Titel',fill='none')])
    clickW(320,0)
    sel=pg.evaluate("()=>document.querySelector('#props').textContent.includes('Folie')")
    pact(pg,'[data-act="dup"]'); pg.wait_for_timeout(150); d=doc()
    check('Folie duplizieren kopiert Inhalt mit',sum(1 for i in d['items'] if i.get('kind')=='frame')==2 and len(d['items'])>=6)
    # 2 Folie löschen: Inhalt?
    load([S('f','frame',0,0,640,360,fill='none',ord=1),S('a','rect',100,100,140,80,'Inhalt')])
    clickW(320,0); pg.keyboard.press('Delete'); pg.wait_for_timeout(150); d=doc()
    check('Folie löschen',not any(i['kind']=='frame' for i in d['items']),str([i['kind'] for i in d['items']]))
    # 3 Kopieren/Einfügen Folie
    load([S('f','frame',0,0,640,360,fill='none',ord=1),S('a','rect',100,100,140,80,'Inhalt')])
    clickW(320,0); pg.keyboard.press('Control+c'); pg.keyboard.press('Control+v'); pg.wait_for_timeout(200); d=doc()
    check('Folie kopieren und einfügen',len(d['items'])==4,str([i['kind'] for i in d['items']]))
    # 4 Gruppe aus Folie + Form
    # 5 Langes Wort in Mindmap-Knoten / Tabelle
    load([S('n','round',0,0,130,50,'Donaudampfschifffahrtsgesellschaftskapitän',mm='node'),dict(S('t','table',300,0,240,72),colW=[120,120],rowH=[36,36],cells=[['Kopf','Kopf'],['Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz','x']])])
    pg.screenshot(path='/tmp/bb-tests/longword.png',clip={'x':100,'y':60,'width':1300,'height':800})
    # 6 Zwei Fenster gleichzeitig
    load([S('a','rect',0,0,140,80,'A')])
    pg2=ctx.new_page(); pg2.add_init_script("localStorage.setItem('skizix-test-opts','1')"); pg2.goto(URL); pg2.wait_for_timeout(400)
    pg.focus('.pal[data-kind="rect"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(150)   # Fenster 1: +1
    pg2.evaluate("()=>{for(const h of document.querySelectorAll('.gh')) if(h.dataset.g==='Allgemein'&&h.getAttribute('aria-expanded')==='false') h.click();}")
    pg2.focus('.pal[data-kind="ellipse"]'); pg2.keyboard.press('Enter'); pg2.wait_for_timeout(150)  # Fenster 2: +1 (auf altem Stand)
    d=doc(); check('Zwei Fenster: beide Änderungen bleiben',len(d['items'])==3,str([i['kind'] for i in d['items']]))
    pg2.close()
    # 7 Unbekannte Elemente / Datei aus Zukunft
    load([S('a','rect',0,0,140,80,'A'),S('x','zukunftsform',200,0,100,100,'Neu')])
    check('Unbekannte Form bleibt erhalten',[i['kind'] for i in doc()['items']]==['rect','zukunftsform'])
    # 8 Esc während Ziehen
    load([S('a','rect',0,0,140,80,'A')])
    bb=pg.evaluate("()=>{const r=document.querySelector('#items [data-id=\"a\"]').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}")
    pg.mouse.move(*bb); pg.mouse.down(); pg.mouse.move(bb[0]+200,bb[1]+100,steps=5); pg.keyboard.press('Escape'); pg.mouse.up(); pg.wait_for_timeout(100)
    check('Esc beim Ziehen bricht ab',doc()['items'][0]['x']==0)
    # 9 Undo-Tiefe
    load([S('a','rect',0,0,140,80,'A')])
    click('a')
    for i in range(160): pg.keyboard.press('ArrowRight')
    for i in range(200): pg.keyboard.press('Control+z')
    x=doc()['items'][0]['x']; check('Rückgängig über 160 Schritte',x==0,str(x))
    # 10 Leeres Board präsentieren / exportieren
    load([])
    starte(pg); pg.wait_for_timeout(200); t=pg.evaluate("()=>document.getElementById('toast').textContent"); check('Leeres Board: Hinweis statt Präsentation','leer' in t,t)
    # 11 Board-Namen sehr lang / Sonderzeichen in Dateiname
    pg.fill('#boardName','Test: Q1/Q2 <Plan> "neu"?'); pg.keyboard.press('Enter')
    with pg.expect_download(timeout=20000) as dl:
        exportiere(pg,'json')
    check('Dateiname ohne Sonderzeichen',dl.value.suggested_filename=='Test-Q1Q2-Plan-neu.json',dl.value.suggested_filename)
    # 12 Tastatur: Tab-Reihenfolge Anfang
    pg.reload(); pg.wait_for_timeout(400); seq=[]
    for i in range(14):
        pg.keyboard.press('Tab'); seq.append(pg.evaluate("()=>{const e=document.activeElement;return (e.getAttribute('aria-label')||e.title||e.textContent||e.id||e.tagName).trim().slice(0,22)}"))
    check('Tab-Reihenfolge beginnt mit Board-Name',seq[0].startswith('Name des Boards'),' > '.join(seq))
    # 13 Hilfe / Tastenkürzel-Übersicht
    pg.keyboard.press('Escape'); pg.keyboard.press('?'); pg.wait_for_timeout(150)
    check('Hilfe mit ?',pg.evaluate("()=>!!document.querySelector('[role=dialog]:not([hidden])')"))
    check('keine Fehler',not errs,str(errs))
    b.close()
finally: srv.terminate()
print('\n'.join(out))
