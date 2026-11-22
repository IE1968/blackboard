import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
from playwright.sync_api import sync_playwright
srv=server()
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME); pg=br.new_page(viewport={'width':1000,'height':600}); errs=[]
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(300)
  pg.evaluate(LOAD,{'items':[{'id':'f','type':'shape','kind':'frame','x':0,'y':0,'w':640,'h':360,'text':'Folie'},{'id':'a','type':'shape','kind':'rect','x':100,'y':100,'w':200,'h':100,'text':'Hallo'}],'conns':[],'bg':{'s':'usedd','p':'grid'}}); pg.reload(); pg.wait_for_timeout(600)
  starte(pg); pg.wait_for_timeout(700)
  st=pg.evaluate("()=>{const a=getComputedStyle(document.getElementById('stage')),b=getComputedStyle(document.getElementById('pres'));return [a.backgroundColor===b.backgroundColor,a.backgroundImage===b.backgroundImage&&b.backgroundImage!=='none']}")
  check('Präsentation: Tafelfarbe wie auf dem Board',st[0])
  check('Präsentation: Struktur wie auf dem Board',st[1])
  check('Präsentation: Muster (Karos) wie auf dem Board',pg.locator('#presGrid path').count()==1 and pg.locator('#presSvg rect[fill="url(#presGrid)"]').count()==1)
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
