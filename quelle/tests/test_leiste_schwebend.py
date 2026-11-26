import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Optionsleiste schwebend über der Auswahl: erscheint über dem gewählten Element, wandert beim Verschieben der Tafel mit,
steht beim Stift oben in der Mitte, ist ohne Auswahl weg; in der Ansicht auf „Oben fest“ umschaltbar."""
from playwright.sync_api import sync_playwright
srv=server(); errs=[]
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox']); pg=br.new_page(viewport={'width':1600,'height':900})
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(900)
  box=lambda s: pg.evaluate(f"()=>{{const r=document.querySelector('{s}').getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]}}")
  shown=lambda: pg.evaluate("()=>{const p=document.getElementById('props');return document.body.classList.contains('floatbar')&&!p.classList.contains('fhide')&&getComputedStyle(p).visibility!=='hidden'}")
  check('Standard: schwebende Leiste',pg.evaluate("()=>document.body.classList.contains('floatbar')"))
  pg.keyboard.press('Escape'); pg.mouse.click(300,700); pg.wait_for_timeout(150)
  check('Ohne Auswahl ausgeblendet',not shown())
  el=pg.locator('#items .it').first; eb=el.bounding_box(); pg.mouse.click(eb['x']+eb['width']/2,eb['y']+eb['height']/2); pg.wait_for_timeout(200)
  pb=box('#props'); ob=box('#overlay'); sb={'x':ob[0],'y':ob[1],'width':ob[2]-ob[0],'height':ob[3]-ob[1]}
  check('Mit Auswahl sichtbar',shown())
  check('Steht über (oder unter) dem Element',pb[3]<=sb['y']+2 or pb[1]>=sb['y']+sb['height']-2,f'{pb} {sb}')
  check('Waagerecht beim Element',abs((pb[0]+pb[2])/2-(sb['x']+sb['width']/2))<max(60,(pb[2]-pb[0])/2+5),f'{pb} {sb}')
  check('Bleibt in der Tafel',pb[0]>=box('#stage')[0]-1 and pb[2]<=box('#stage')[2]+1)
  y0=box('#props')[1]; pg.mouse.wheel(0,120); pg.wait_for_timeout(250); y1=box('#props')[1]
  check('Wandert beim Verschieben der Tafel mit',abs(y1-y0)>5,f'{y0} {y1}')
  pg.keyboard.press('Escape'); pg.wait_for_timeout(100); pg.click('#tools [data-tool="stifte"]'); pg.wait_for_timeout(200)
  pb=box('#props'); st=box('#stage')
  check('Stift: Leiste oben in der Mitte der Tafel',shown() and abs(pb[1]-st[1])<30 and abs((pb[0]+pb[2])/2-(st[0]+st[2])/2)<4,f'{pb} {st}')
  pg.click('#tools [data-tool="select"]'); pg.wait_for_timeout(150)
  pg.set_viewport_size({'width':1100,'height':800}); pg.wait_for_timeout(200)
  pg.mouse.click(600,500); pg.keyboard.press('Control+a'); pg.wait_for_timeout(250)
  pb=box('#props'); st=box('#stage')
  check('Schmale Tafel, viele Optionen: Leiste bleibt ganz in der Tafel',shown() and pb[0]>=st[0]-1 and pb[2]<=st[2]+1,f'{pb} {st}')
  check('… und bricht dafür um',pb[3]-pb[1]>90,f'{pb}')
  pg.keyboard.press('Escape'); pg.set_viewport_size({'width':1600,'height':900}); pg.wait_for_timeout(200)
  pg.click('#viewBtn'); pg.click('#viewPop [data-vt=\"geraet\"]'); pg.click('#barRow [data-bar="top"]'); pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
  check('Umschaltbar auf „Oben fest“',not pg.evaluate("()=>document.body.classList.contains('floatbar')") and pg.evaluate("()=>JSON.parse(localStorage.getItem('blackboard-ui')).bar")=='top')
  pg.click('#viewBtn'); pg.click('#viewPop [data-vt=\"geraet\"]'); pg.click('#barRow [data-bar="float"]'); pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
  check('Und zurück auf schwebend',pg.evaluate("()=>document.body.classList.contains('floatbar')"))
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
