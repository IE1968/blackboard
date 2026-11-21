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
  check('Element-Knöpfe im Aufklappfeld',pg.locator('#props [data-drop="elem"]').count()==1 and pg.locator('#props [data-act="front"]').count()==0)
  check('Text-Knöpfe im Aufklappfeld',pg.locator('#props [data-drop="text"]').count()==1 and pg.locator('#props [data-act="fsup"]').count()==0)
  pg.click('#props [data-drop="text"]'); pg.wait_for_timeout(120)
  check('Textfeld klappt auf',pg.is_visible('#colorPop [data-act="fsup"]') and pg.is_visible('#colorPop [data-act="bold"]'))
  pg.click('#colorPop [data-act="bold"]'); pg.wait_for_timeout(200)
  check('Fett gesetzt, Feld bleibt offen und zeigt es',[i for i in pg.evaluate(READ)['items'] if i['id']=='a'][0].get('bold') and pg.is_visible('#colorPop') and pg.get_attribute('#colorPop [data-act="bold"]','aria-pressed')=='true')
  pg.click('#colorPop [data-act="bold"]'); pg.wait_for_timeout(150); pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
  check('Esc schließt das Feld',not pg.is_visible('#colorPop'))
  # Farbe als Aufklappfeld
  check('Farben als Aufklappfeld statt Farbraster',pg.locator('#props .cdrop').count()>=2 and pg.locator('#props .sw').count()==0)
  pg.click('#props [data-drop="fill"]'); pg.wait_for_timeout(150)
  check('Farbfeld klappt auf',pg.is_visible('#colorPop') and pg.locator('#colorPop .sw').count()>=15)
  pg.click('#colorPop [data-act="fill"][data-val="#ffd9c7"]'); pg.wait_for_timeout(250)
  fill=[i for i in pg.evaluate(READ)['items'] if i['id']=='a'][0]['fill']
  check('Farbe gewählt und Feld zu',fill=='#ffd9c7' and not pg.is_visible('#colorPop'),fill)
  check('Kein Abschnitt „Ablage“ mehr',not any(t.upper()=='ABLAGE' for t in pg.locator('#props .pg>b').all_inner_texts()))
  pact(pg,'[data-act="copy"]'); pg.wait_for_timeout(150)
  pg.click('#props [data-drop="elem"]'); pg.wait_for_timeout(120)
  check('Einfügen steht bei Kopieren und Duplizieren',pg.locator('#colorPop [data-act="copy"]').count()==1 and pg.locator('#colorPop [data-act="paste"]').count()==1)
  check('Löschen ist der letzte Eintrag',pg.evaluate("()=>[...document.querySelectorAll('#colorPop [data-act]')].pop().dataset.act")=='del')
  pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
  gap=pg.evaluate("()=>{const p=document.getElementById('props').getBoundingClientRect();let t=1e9,b=0;document.querySelectorAll('#props .pg').forEach(g=>{const q=g.getBoundingClientRect();t=Math.min(t,q.top);b=Math.max(b,q.bottom)});return [t-p.top,p.bottom-b]}")
  check('Leiste oben: Abstand unten wie oben',abs(gap[0]-gap[1])<3,str(gap))
  ok_c=pg.evaluate("()=>[...document.querySelectorAll('#props .pg')].every(g=>{const b=g.querySelector(':scope>b'); if(!b) return true; const kids=[...g.children].filter(x=>x!==b); const L=Math.min(...kids.map(k=>k.getBoundingClientRect().left)), R=Math.max(...kids.map(k=>k.getBoundingClientRect().right)), br=b.getBoundingClientRect(); const tw=b.scrollWidth; return Math.abs((L+R)/2-(br.left+br.right)/2)<2; })")
  check('Überschriften mittig über ihren Knöpfen',ok_c)
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
