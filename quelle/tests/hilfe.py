"""Skizix: gemeinsame Einstellungen für alle Tests (Pfade, Browser, Hilfsfunktionen)."""
import os,sys,subprocess,time,json
HIER=os.path.dirname(os.path.abspath(__file__))
QUELLE=os.path.dirname(HIER)
DIST=os.environ.get('BB_DIST',os.path.dirname(QUELLE))   # Hauptordner des Repos: dort liegt die gebaute index.html
PWA=DIST
DATEN=os.path.join(HIER,'daten')
OUT=os.environ.get('BB_OUT','/tmp/bb-tests'); os.makedirs(OUT,exist_ok=True)   # Bildschirmfotos und Downloads
CHROME=os.environ.get('BB_CHROME','/usr/bin/google-chrome')
URL='http://localhost:8765/index.html'
READ="async()=>{await new Promise(r=>setTimeout(r,400));const b=JSON.parse(localStorage.getItem('blackboard-boards'));const db=await new Promise(r=>{const q=indexedDB.open('blackboard',1);q.onsuccess=()=>r(q.result)});const v=await new Promise(r=>{const q=db.transaction('docs').objectStore('docs').get(b.cur);q.onsuccess=()=>r(q.result)});db.close();return JSON.parse(v)}"
LOAD="(d)=>{const b=JSON.parse(localStorage.getItem('blackboard-boards'));localStorage.setItem('blackboard-b-'+b.cur,JSON.stringify(d))}"
def server(directory=None,port=8765):
    p=subprocess.Popen([sys.executable,'-m','http.server',str(port),'--directory',directory or DIST],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(0.8); return p
def check(name,cond,extra=''):
    print(('PASS ' if cond else 'FAIL ')+name,extra); return cond

def openFile(pg):
    """Datei-Leiste rechts öffnen (falls sie zu ist)."""
    pg.evaluate("()=>{ if(document.querySelector('main').classList.contains('props-closed')) document.getElementById('menuBtn').click() }"); pg.wait_for_timeout(120)

def pact(pg,sel):
    """Knopf in der Optionsleiste klicken; liegt er in einem Aufklappfeld (Text, Element), dieses vorher öffnen."""
    loc=pg.locator('#props '+sel)
    if loc.count() and loc.first.is_visible(): loc.first.click(); return
    for i in range(pg.locator('#props .mdrop').count()):
        if pg.locator('#colorPop:not([hidden]) '+sel).count()==0:
            pg.evaluate("()=>{const p=document.getElementById('colorPop'); p.hidden=true; p.innerHTML=''}")
            pg.locator('#props .mdrop').nth(i).click(); pg.wait_for_timeout(80)
        if pg.locator('#colorPop:not([hidden]) '+sel).count(): pg.locator('#colorPop '+sel).first.click(); return
    raise AssertionError('Knopf nicht gefunden: '+sel)
