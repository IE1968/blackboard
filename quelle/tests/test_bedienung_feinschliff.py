import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Feinschliff aus dem Design-Review: Lostippen ersetzt den Text, Meldung unten mit „Rückgängig“, Kontraste, Tippflächen auf Touch-Geräten."""
from playwright.sync_api import sync_playwright
S=lambda id,kind,x,y,w,h,text='': dict(id=id,type='shape',kind=kind,x=x,y=y,w=w,h=h,text=text,fill='#cfe8ff',stroke='#1c2a2e',sw=2)
srv=server(); errs=[]
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox']); pg=br.new_page(viewport={'width':1400,'height':860})
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(900)
  pg.evaluate(LOAD,{'items':[S('a','rect',100,100,160,80,'Alt')],'n':5}); pg.reload(); pg.wait_for_timeout(800); einpassen(pg); pg.wait_for_timeout(200)
  b=pg.locator('#items [data-id="a"]').bounding_box(); pg.mouse.click(b['x']+20,b['y']+20); pg.wait_for_timeout(150)
  pg.keyboard.type('Neu'); pg.wait_for_timeout(100)
  check('Lostippen öffnet das Schreiben',pg.is_visible('#editor') and pg.input_value('#editor')=='Neu',pg.input_value('#editor'))
  pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
  check('… und ersetzt den Text',[i for i in pg.evaluate(READ)['items'] if i['id']=='a'][0]['text']=='Neu')
  check('Werkzeug unverändert (kein Radierer o. Ä.)',pg.get_attribute('#board','class')=='t-select')
  pg.keyboard.press('Escape'); pg.keyboard.press('p'); pg.wait_for_timeout(50)
  check('Ohne Auswahl bleiben die Kürzel',pg.get_attribute('#board','class')=='t-pen'); pg.keyboard.press('v')
  leeren(pg); pg.wait_for_timeout(200)
  tb=pg.locator('#toast').bounding_box()
  check('Meldung unten',tb['y']>860*0.75,str(tb))
  check('Meldung mit „Rückgängig“',pg.locator('#toast [data-t="undo"]').count()==1)
  pg.click('#toast [data-t="undo"]'); pg.wait_for_timeout(300)
  check('Rückgängig holt das Board zurück',len(pg.evaluate(READ)['items'])==1 and pg.is_hidden('#toast'))
  bg=pg.evaluate("()=>getComputedStyle(document.querySelector('#menu [data-m=\"new\"]')).backgroundColor")
  check('Hauptknopf in #3B6FE8 (Kontrast 4,5 : 1)',bg=='rgb(59, 111, 232)',bg)
  pg.keyboard.press('Escape')
  # Touch-Gerät
  ctx=br.new_context(viewport={'width':1180,'height':820},has_touch=True,is_mobile=True); t=ctx.new_page(); t.goto(URL); t.wait_for_timeout(900)
  sz=t.evaluate("()=>[...document.querySelectorAll('#tools .tb')].filter(b=>b.offsetParent).map(b=>{const r=b.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)]})")
  check('Touch: Werkzeugknöpfe mind. 44 × 44 px',sz and all(w>=44 and h>=44 for w,h in sz),str(sz[:4]))
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
