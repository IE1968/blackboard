import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
import subprocess,time
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','--directory',DIST],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(0.8)
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':1500,'height':900}); pg=ctx.new_page(); pg.goto(URL); pg.wait_for_timeout(500)
    leeren(pg); pg.wait_for_timeout(500)
    pg2=ctx.new_page(); pg2.goto(URL); pg2.wait_for_timeout(600)
    cnt=lambda q: q.evaluate("()=>document.querySelectorAll('#items > g').length")
    print('start',cnt(pg),cnt(pg2))
    pg.focus('.pal[data-kind="ellipse"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(900); print('nach W1',cnt(pg),cnt(pg2))
    pg2.bring_to_front(); pg2.focus('.pal[data-kind="note"]'); print('fokus',pg2.evaluate("()=>document.activeElement.dataset.kind")); pg2.keyboard.press('Enter'); pg2.wait_for_timeout(300); print('W2 direkt',cnt(pg2), pg2.evaluate("()=>document.activeElement.className"))
    pg2.wait_for_timeout(900); check('Beide Fenster zeigen beide Formen',cnt(pg)==2 and cnt(pg2)==2,f'{cnt(pg)} {cnt(pg2)}')
    b.close()
finally: srv.terminate()
