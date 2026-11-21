import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Optionsleiste oben (je nach Werkzeug, zuklappbar), Werkzeug Form (nur Formen), Datei-Leiste rechts, Grunge-Fläche."""
from playwright.sync_api import sync_playwright
srv=server(); errs=[]
S=lambda id,kind,x,y,w,h,text='': dict(id=id,type='shape',kind=kind,x=x,y=y,w=w,h=h,text=text,fill='#cfe8ff',stroke='#1c2a2e',sw=2)
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox']); pg=br.new_page(viewport={'width':1400,'height':900})
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(600)
  pg.evaluate(LOAD,{'items':[S('a','rect',0,0,160,90,'Form'),{'id':'p','type':'path','pts':[[0,150],[80,170],[160,150]],'stroke':'#1c2a2e','sw':3,'tool':'pen'}],'n':5}); pg.reload(); pg.wait_for_timeout(800)
  pg.click('#zoomLabel'); pg.wait_for_timeout(200)
  w=pg.evaluate("()=>[document.getElementById('palette').getBoundingClientRect().width,document.getElementById('menu').getBoundingClientRect().width]")
  check('Rechte Leiste so breit wie die linke',abs(w[0]-w[1])<1.5,str(w))
  check('Rechts: Datei-Inhalte',pg.locator('main #menu #boardList').count()==1 and pg.locator('main #menu [data-m="pdf"]').count()==1)
  # Optionsleiste je Werkzeug
  pg.click('#tools [data-tool="pen"]'); pg.wait_for_timeout(150)
  check('Stift: Farbe, Stärke, Pinselform oben',pg.locator('#props .pg>b').all_inner_texts()[:3]==['STIFTFARBE','STÄRKE','PINSELFORM'] or [t.upper() for t in pg.locator('#props .pg>b').all_inner_texts()][:3]==['STIFTFARBE','STÄRKE','PINSELFORM'])
  pg.click('#tools [data-tool="shape"]'); pg.wait_for_timeout(150)
  check('Form ohne Auswahl: Hinweis',pg.locator('#props .optHint').count()==1)
  # Werkzeug Form wählt nur Formen
  pg.keyboard.press('Control+a') if False else None
  b=pg.evaluate("()=>{const r=document.getElementById('board').getBoundingClientRect();return [r.left,r.top,r.width,r.height]}")
  pg.mouse.move(b[0]+5,b[1]+5); pg.mouse.down(); pg.mouse.move(b[0]+b[2]-5,b[1]+b[3]-5,steps=8); pg.mouse.up(); pg.wait_for_timeout(200)
  ids=pg.evaluate("()=>[...document.querySelectorAll('#overlay [data-sel]')].map(e=>e.dataset.sel)")
  heads=[t.upper() for t in pg.locator('#props .pg>b').all_inner_texts()]
  check('Form: Auswahlrahmen nimmt nur Formen',('ELEMENT' in heads) and ('PINSELFORM' not in heads),str(heads))
  check('Form: Nach vorn und Gruppe-Optionen oben',pg.locator('#props [data-act="front"]').count()==1)
  # Höhe bleibt gleich (kein Springen der Tafel)
  h1=pg.evaluate("()=>document.getElementById('board').getBoundingClientRect().top"); pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
  h2=pg.evaluate("()=>document.getElementById('board').getBoundingClientRect().top")
  check('Tafel springt nicht beim Auswählen',abs(h1-h2)<0.5,f'{h1} {h2}')
  pg.click('#optsToggle'); pg.wait_for_timeout(150)
  check('Optionsleiste zuklappbar',not pg.is_visible('#props') and pg.evaluate("()=>JSON.parse(localStorage.getItem('blackboard-pal')).optsClosed")==True)
  pg.click('#optsToggle'); pg.wait_for_timeout(150); check('… und wieder auf',pg.is_visible('#props'))
  # Datei-Knopf klappt die rechte Leiste
  pg.click('#menuBtn'); pg.wait_for_timeout(150); c1=pg.evaluate("()=>document.querySelector('main').classList.contains('props-closed')")
  pg.click('#menuBtn'); pg.wait_for_timeout(150); c2=pg.evaluate("()=>document.querySelector('main').classList.contains('props-closed')")
  check('Datei klappt die rechte Leiste auf und zu',c1!=c2)
  # Grunge
  pg.click('#viewBtn'); pg.click('#vpSurf [data-s="grunge"]'); pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
  check('Grunge grau wählbar',pg.evaluate("()=>document.getElementById('stage').dataset.surf")=='grunge')
  pg.screenshot(path=OUT+'/leisten.png')
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
