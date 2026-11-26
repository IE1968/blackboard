"""Notizblatt: Papier mit Linien, Text sitzt auf den Linien, Papierarten, Vorlage „Notizseite“."""
import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
from playwright.sync_api import sync_playwright
srv=server()
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME); pg=br.new_page(viewport={'width':1440,'height':900},accept_downloads=True); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(700); leeren(pg); pg.keyboard.press('Escape')
  pg.evaluate("()=>{for(const h of document.querySelectorAll('.gh')) if(h.getAttribute('aria-expanded')==='false') h.click()}")
  pg.click('.pal[data-kind="paper"]'); pg.wait_for_timeout(300)
  it=pg.evaluate(READ)['items'][0]; check('Notizblatt aus der Formenleiste',it['kind']=='paper' and it.get('fs')==20)
  bb=pg.locator('#items > [data-id]').first.bounding_box(); pg.mouse.dblclick(bb['x']+bb['width']/2,bb['y']+bb['height']/2); pg.wait_for_timeout(200)
  pg.keyboard.type('Erste Zeile'); pg.keyboard.press('Enter'); pg.keyboard.type('Zweite Zeile'); pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
  # Grundlinie der Schrift liegt knapp über einer Papierlinie
  r=pg.evaluate("""()=>{const g=document.querySelector('#items > [data-id]'); const ys=[...g.querySelectorAll('path')].map(p=>/^M6 ([\\d.]+)H/.exec(p.getAttribute('d'))).filter(Boolean).map(m=>+m[1]);
     const ts=[...g.querySelectorAll('tspan')].map(t=>+t.getAttribute('y')); return {ys:ys.slice(0,4),ts}}""")
  ok=len(r['ts'])==2 and all(any(0<y-t<8 for y in r['ys']) for t in r['ts'])
  check('Text sitzt auf den Linien, oben beginnend',ok and r['ts'][0]<60,str(r))
  pg.mouse.click(bb['x']+bb['width']/2,bb['y']+bb['height']-40); pg.wait_for_timeout(200)
  pg.click('#props [data-drop="paper"]'); pg.click('#colorPop [data-act="pp"][data-val="grid"]'); pg.wait_for_timeout(150)
  check('Papierart Kariert',pg.evaluate(READ)['items'][0].get('pp')=='grid')
  pg.click('#props [data-drop="paper"]'); pg.click('#colorPop [data-act="pp"][data-val="linen"]'); pg.wait_for_timeout(500)
  pg.reload(); pg.wait_for_timeout(700)
  it=pg.evaluate(READ)['items'][0]; check('Leinen bleibt nach Neuladen',it.get('pp')=='linen' and it['fill']=='#f1ebdd',str(it))
  with pg.expect_download(timeout=30000) as d: exportiere(pg,'pdf')
  check('PDF-Export mit Notizblatt',os.path.getsize(d.value.path())>2000)
  openFile(pg) if False else None
  pg.evaluate("()=>document.querySelector('.pal[data-tpl]').click()"); pg.wait_for_timeout(300)
  pg.evaluate("()=>[...document.querySelectorAll('#tplGrid .tc')].find(b=>b.textContent.includes('Notizseite')).click()"); pg.wait_for_timeout(400)
  ps=[i for i in pg.evaluate(READ)['items'] if i.get('kind')=='paper']
  check('Vorlage „Notizseite“: zwei Blätter mit Titel',len(ps)==3 and any(i['text'].startswith('Notizen\n') for i in ps))
  # Inhalt wandert mit: Text und Stiftstrich auf dem Blatt, Form daneben bleibt
  pg.evaluate(LOAD,{'items':[{'id':'x','type':'shape','kind':'rect','x':-300,'y':0,'w':80,'h':60,'text':'','fill':'#fff','stroke':'#1c2a2e','sw':2},
     {'id':'p','type':'shape','kind':'paper','x':0,'y':0,'w':300,'h':400,'text':'','fill':'#fdfcf6','stroke':'#1c2a2e','sw':2,'fs':20},
     {'id':'t','type':'shape','kind':'text','x':40,'y':60,'w':200,'h':40,'text':'Darauf','fill':'none','stroke':'#1c2a2e','sw':2,'fs':20},
     {'id':'s','type':'path','pts':[[50,200],[120,240],[200,210]],'stroke':'#1c2a2e','sw':3,'tool':'pen','tip':'round'}],'n':9,'fmt':2})
  pg.reload(); pg.wait_for_timeout(700); pg.keyboard.press('Shift+Digit1'); pg.wait_for_timeout(300)
  b=pg.locator('#items > [data-id="p"]').bounding_box(); x,y=b['x']+b['width']*0.8,b['y']+b['height']*0.9
  pg.mouse.move(x,y); pg.mouse.down(); pg.mouse.move(x+120,y+40,steps=8); pg.mouse.up(); pg.wait_for_timeout(300)
  d={i['id']:i for i in pg.evaluate(READ)['items']}
  dx=d['p']['x']
  check('Blatt verschoben, Text und Strich darauf wandern mit',dx>20 and d['t']['x']==40+dx and abs(d['s']['pts'][0][0]-(50+dx))<0.01,str((dx,d['t']['x'],d['s']['pts'][0])))
  check('Form neben dem Blatt bleibt liegen',d['x']['x']==-300)
  # Löschen: Blatt weg -> Text und Strich darauf auch weg, Form daneben bleibt
  b=pg.locator('#items > [data-id="p"]').bounding_box(); pg.mouse.click(b['x']+b['width']*0.8,b['y']+b['height']*0.9); pg.wait_for_timeout(200)
  pg.keyboard.press('Delete'); pg.wait_for_timeout(300)
  ids={i['id'] for i in pg.evaluate(READ)['items']}
  check('Blatt gelöscht, Inhalt darauf mit gelöscht, Rest bleibt',ids=={'x'},str(ids))
  pg.keyboard.press('Control+z'); pg.wait_for_timeout(300)
  check('Rückgängig bringt Blatt mit Inhalt zurück',{i['id'] for i in pg.evaluate(READ)['items']}=={'x','p','t','s'})
  check('Keine Fehler',not errs,str(errs))
  br.close()
finally: srv.terminate()
