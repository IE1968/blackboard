import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Folienübergänge: Zoom (Standard), Gleiten, Keiner – pro Board gespeichert, ≤ 400 ms, bei „Bewegung reduzieren“ immer sofort."""
from playwright.sync_api import sync_playwright
srv=server(); errs=[]
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox']); pg=br.new_page(viewport={'width':1500,'height':900})
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(900)
  leeren(pg); pg.wait_for_timeout(100)
  def add(kind):
    pg.evaluate("()=>{for(let i=0;i<12;i++){const h=[...document.querySelectorAll('.gh')].find(h=>h.getAttribute('aria-expanded')==='false'); if(!h) break; h.click();}}")
    pg.focus(f'.pal[data-kind="{kind}"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(150)
  add('frame'); pg.keyboard.press('Escape'); add('frame'); pg.keyboard.press('Escape')
  vb=lambda: pg.evaluate("()=>document.getElementById('presSvg').getAttribute('viewBox')")
  old=lambda: pg.evaluate("()=>!!document.getElementById('presOld')")
  def tr(v): pg.click('#playBtn'); pg.click(f'#trRow [data-tr="{v}"]'); pg.wait_for_timeout(80)
  def go():
    starte(pg); pg.wait_for_timeout(250); a=vb(); pg.click('#presNext'); return a
  pg.click('#playBtn'); pg.wait_for_timeout(150)
  check('Menü zeigt drei Übergänge',pg.locator('#trRow button').count()==3)
  check('Standard ist Zoom',pg.get_attribute('#trRow [data-tr="zoom"]','aria-pressed')=='true')
  pg.keyboard.press('Escape')
  a=go(); pg.wait_for_timeout(120); mid=vb(); pg.wait_for_timeout(450); end=vb()
  check('Zoom: Kamerafahrt, nach 400 ms am Ziel',len({a,mid,end})==3 and not old(),f'{a} | {mid} | {end}')
  pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
  tr('glide')
  check('Gleiten gewählt, Menü bleibt offen',pg.get_attribute('#trRow [data-tr="glide"]','aria-pressed')=='true' and pg.is_visible('#presPop'))
  pg.keyboard.press('Escape')
  check('Übergang im Board gespeichert',pg.evaluate(READ).get('tr')=='glide')
  go(); pg.wait_for_timeout(40)
  check('Gleiten: alte Folie schiebt hinaus, neue ist schon am Ziel',old() and vb()==end,vb())
  check('Kopie hat eigene IDs',pg.evaluate("()=>document.querySelectorAll('#presClip').length===1&&document.querySelectorAll('#presBody').length===1"))
  pg.wait_for_timeout(500)
  check('Nach dem Gleiten aufgeräumt',pg.evaluate("()=>!document.getElementById('presOld')&&!document.getElementById('presSvg').style.transform"))
  pg.click('#presPrev'); pg.wait_for_timeout(40); pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
  check('Beenden räumt Kopie weg',not old())
  tr('none'); pg.keyboard.press('Escape')
  go(); pg.wait_for_timeout(20)
  check('Keiner: sofort am Ziel',vb()==end and not old())
  pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
  pg.keyboard.press('Control+z'); check('Rückgängig nimmt Übergang zurück',pg.evaluate(READ).get('tr')=='glide')
  pg.emulate_media(reduced_motion='reduce')
  go(); pg.wait_for_timeout(20)
  check('Bewegung reduzieren: kein Übergang',vb()==end and not old())
  pg.keyboard.press('Escape')
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
