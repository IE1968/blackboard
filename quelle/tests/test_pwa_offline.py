import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
import subprocess,time
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,'-m','http.server','8766','--directory',PWA],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(0.8)
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
    ctx=b.new_context(); pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8766/'); pg.wait_for_timeout(1500)
    check('Service Worker aktiv',pg.evaluate("async()=>{const r=await navigator.serviceWorker.getRegistration();return !!(r&&r.active)}"))
    pg.reload(); pg.wait_for_timeout(800)
    print('Titel nach Neuladen über SW:',pg.title(), 'kontrolliert:',pg.evaluate("()=>!!navigator.serviceWorker.controller"))
    check('Läuft über Service Worker',pg.evaluate("()=>!!navigator.serviceWorker.controller"))
    ctx.set_offline(True); pg.reload(); pg.wait_for_timeout(800); check('Offline startbar',pg.title()=='Skizix',pg.title())
    check('keine Fehler',not errs,str(errs)); b.close()
finally: srv.terminate()
