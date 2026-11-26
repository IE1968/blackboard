"""Text-Optionen: Schriftarten, Größen, Kursiv/Unterstrichen/Durchgestrichen, Zeilenabstand; größere Standardschrift."""
import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
from playwright.sync_api import sync_playwright
srv=server()
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME); pg=br.new_page(viewport={'width':1440,'height':900},accept_downloads=True); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(700); leeren(pg); pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
  pg.click('#tools [data-tool="text"]'); pg.mouse.click(500,300); pg.keyboard.type('Hallo Welt'); pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
  t=pg.evaluate(READ)['items'][0]; check('Neuer Text startet mit 24 px',t.get('fs')==24,str(t.get('fs')))
  pg.click('.pal[data-kind="rect"]'); pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
  check('Neue Form startet mit 18 px',pg.evaluate(READ)['items'][1].get('fs')==18)
  def waehle():
    bb=pg.locator('#items > [data-id]').first.bounding_box(); pg.mouse.click(bb['x']+bb['width']/2,bb['y']+bb['height']/2); pg.wait_for_timeout(150)
    if pg.is_hidden('#colorPop'): pg.click('#props [data-drop="text"]'); pg.wait_for_timeout(150)
  waehle()
  check('Feld „Aa“: 6 Schriftarten, Größen, Stil, Zeilenabstand',pg.locator('#colorPop [data-act="ff"]').count()==6 and pg.locator('#colorPop [data-act="fs"]').count()==8 and pg.locator('#colorPop [data-act="lh"]').count()==4)
  for k,fam in (('serif','Lora'),('school','Andika'),('display','Archivo Black'),('sans','Skizix Klar')):
    pg.click(f'#colorPop [data-act="ff"][data-val="{k}"]'); pg.wait_for_timeout(100)
    f=pg.evaluate("()=>document.querySelector('#items > [data-id] text').getAttribute('font-family')")
    check(f'Schriftart {k} wird angezeigt',fam in f and pg.evaluate(f"()=>document.fonts.check(\"16px '{fam}'\")"),f)
  pg.click('#colorPop [data-act="ff"][data-val="serif"]')
  pg.click('#colorPop [data-act="fs"][data-val="48"]'); pg.click('#colorPop [data-act="fsup"]'); pg.click('#colorPop [data-act="ital"]'); pg.click('#colorPop [data-act="ul"]'); pg.click('#colorPop [data-act="lh"][data-val="2"]'); pg.wait_for_timeout(150)
  t=pg.evaluate(READ)['items'][0]
  check('Größe 48, dann A+ → 64',t.get('fs')==64,str(t.get('fs')))
  check('Kursiv, unterstrichen, Zeilenabstand 2,0',t.get('it') and t.get('ul') and t.get('lh')==2,str(t))
  a=pg.evaluate("()=>{const e=document.querySelector('#items > [data-id] text');return [e.getAttribute('font-style'),e.getAttribute('text-decoration')]}")
  check('SVG zeigt kursiv und unterstrichen',a==['italic','underline'],str(a))
  pg.click('#colorPop [data-act="ul"]'); pg.click('#colorPop [data-act="strike"]'); pg.wait_for_timeout(100)
  check('Durchgestrichen statt unterstrichen',pg.evaluate("()=>document.querySelector('#items > [data-id] text').getAttribute('text-decoration')")=='line-through')
  pg.keyboard.press('Escape'); pg.wait_for_timeout(700); pg.reload(); pg.wait_for_timeout(800)
  t=pg.evaluate(READ)['items'][0]
  check('Alles bleibt nach Neuladen',t.get('ff')=='serif' and t.get('fs')==64 and t.get('it') and t.get('st') and t.get('lh')==2,str(t))
  with pg.expect_download() as d: exportiere(pg,'svg')
  svg=open(d.value.path(),encoding='utf-8').read()
  check('SVG-Export bettet Lora ein',"font-family:'Lora'" in svg)
  with pg.expect_download(timeout=30000) as d: exportiere(pg,'pdf')
  check('PDF-Export klappt',os.path.getsize(d.value.path())>2000)
  check('Keine Fehler',not errs,str(errs))
  br.close()
finally: srv.terminate()
