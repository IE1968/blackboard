import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
from playwright.sync_api import sync_playwright
srv=server()
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME); pg=br.new_page(viewport={'width':1200,'height':800}); errs=[]
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(300)
  pg.evaluate(LOAD,{'items':[{'id':'a','type':'shape','kind':'rect','x':300,'y':200,'w':220,'h':120,'text':''}],'conns':[]}); pg.reload(); pg.wait_for_timeout(500)
  bb=pg.evaluate("()=>{const r=document.querySelector('[data-id=\"a\"]').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}")
  pg.mouse.dblclick(*bb); pg.wait_for_timeout(200)
  pg.keyboard.type('Erster'); pg.keyboard.press('Enter'); pg.keyboard.type('Zweiter')
  check('Enter beendet das Schreiben nicht',pg.is_visible('#editor'))
  pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
  t=[i for i in pg.evaluate(READ)['items'] if i['id']=='a'][0]['text']
  check('Absatz gespeichert, Esc übernimmt',t=='Erster\nZweiter',repr(t))
  pg.mouse.dblclick(*bb); pg.wait_for_timeout(200); pg.keyboard.press('End'); pg.keyboard.press('Control+End'); pg.keyboard.type('!'); pg.keyboard.press('Control+Enter'); pg.wait_for_timeout(300)
  t=[i for i in pg.evaluate(READ)['items'] if i['id']=='a'][0]['text']
  check('Strg+Enter beendet',not pg.is_visible('#editor') and t=='Erster\nZweiter!',repr(t))
  # freier Text mit dem Text-Werkzeug
  pg.keyboard.press('Escape'); pg.keyboard.press('t'); pg.mouse.click(700,550); pg.wait_for_timeout(200)
  pg.keyboard.type('Zeile 1'); pg.keyboard.press('Enter'); pg.keyboard.type('Zeile 2'); pg.mouse.click(150,700); pg.wait_for_timeout(300)
  check('Freier Text mit Absatz',any(i.get('text')=='Zeile 1\nZeile 2' for i in pg.evaluate(READ)['items']))
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
