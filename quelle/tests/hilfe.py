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
