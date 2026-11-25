"""Content-Security-Policy: die App läuft ohne Verstöße (Laden, Zeichnen, Vorlagen, Export, Teilen-Dialog, Präsentation)."""
import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
from playwright.sync_api import sync_playwright
srv=server()
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME); pg=br.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
  v=[]; pg.on('console',lambda m: v.append(m.text) if 'Content Security Policy' in m.text or 'Content-Security-Policy' in m.text else None)
  errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(900)
  check('CSP ist gesetzt',pg.evaluate("()=>!!document.querySelector('meta[http-equiv=\"Content-Security-Policy\"]')"))
  pg.click('#tools [data-tool="pen"]'); pg.mouse.move(500,400); pg.mouse.down(); pg.mouse.move(650,450,steps=8); pg.mouse.up()
  pg.click('.pal[data-kind="rect"]'); pg.keyboard.press('Escape')
  for f in ('png','svg','pdf'):
    with pg.expect_download(timeout=30000) as d: exportiere(pg,f)
  pg.click('#liveBtn'); pg.click('#liveStartBtn'); pg.wait_for_timeout(500); pg.keyboard.press('Escape')
  pg.click('#playBtn'); pg.click('#presPop [data-m="play"]'); pg.wait_for_timeout(500); pg.keyboard.press('Escape')
  pg.evaluate("()=>navigator.serviceWorker&&navigator.serviceWorker.getRegistrations()"); pg.wait_for_timeout(300)
  check('Keine CSP-Verstöße',not v,str(v[:3]))
  check('Keine Fehler',not errs,str(errs))
  br.close()
finally: srv.terminate()
