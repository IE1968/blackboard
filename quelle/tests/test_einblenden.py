import sys,os,re; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Nacheinander einblenden: Elemente einer Folie erscheinen in der Präsentation Schritt für Schritt."""
from playwright.sync_api import sync_playwright
srv=server(); errs=[]
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox']); pg=br.new_page(viewport={'width':1600,'height':900})
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.evaluate("()=>0"); pg.goto(URL); pg.wait_for_timeout(900)
  pg.evaluate("()=>localStorage.setItem('skizix-test-bartop','1')"); pg.reload(); pg.wait_for_timeout(900)
  openFile(pg); pg.click('#menu [data-m="clear"]'); pg.wait_for_timeout(100)
  def add(kind):
    pg.evaluate("()=>{for(let i=0;i<12;i++){const h=[...document.querySelectorAll('.gh')].find(h=>h.getAttribute('aria-expanded')==='false'); if(!h) break; h.click();}}")
    pg.focus(f'.pal[data-kind="{kind}"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(150)
  add('frame'); add('rect'); add('ellipse'); pg.keyboard.press('Escape'); add('frame'); pg.keyboard.press('Escape')
  d=pg.evaluate(READ); F=sorted([i for i in d['items'] if i.get('kind')=='frame'],key=lambda f:f['ord'])
  R=[i for i in d['items'] if i.get('kind')=='rect'][0]; E=[i for i in d['items'] if i.get('kind')=='ellipse'][0]
  check('Formen liegen in Folie 1',R.get('fr')==F[0]['id'] and E.get('fr')==F[0]['id'],f"{R.get('fr')} {E.get('fr')} {F[0]['id']}")
  def scr(x,y):
    t=pg.evaluate("()=>document.getElementById('world').getAttribute('transform')"); m=re.match(r'translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)',t)
    rc=pg.evaluate("()=>{const r=document.getElementById('board').getBoundingClientRect();return [r.left,r.top]}"); return rc[0]+float(m[1])+x*float(m[3]), rc[1]+float(m[2])+y*float(m[3])
  def pick(it): x,y=scr(it['x']+6,it['y']+6); pg.keyboard.press('Escape'); pg.mouse.click(x,y); pg.wait_for_timeout(150)
  einpassen(pg); pg.wait_for_timeout(250)
  if pg.evaluate("()=>document.body.classList.contains('opts-closed')"): pg.click('#optsToggle'); pg.wait_for_timeout(150)
  x,y=scr(F[0]['x']+F[0]['w']/2,F[0]['y']); pg.mouse.click(x,y+1); pg.wait_for_timeout(150)
  check('Folie gewählt: Knopf „Alles nacheinander“',pg.locator('#props [data-act="apall"]').count()==1)
  pact(pg,'[data-act="apall"]'); pg.wait_for_timeout(150)
  d=pg.evaluate(READ); ap={i['kind']:i.get('ap') for i in d['items'] if i.get('kind') in('rect','ellipse')}
  check('Alle Elemente bekommen Schritte',sorted(ap.values())==[1,2],str(ap))
  check('Nummern auf dem Board',pg.locator('#overlay .apBadge').count()==2)
  first=min(ap,key=ap.get); second=max(ap,key=ap.get)
  # Präsentation
  vis=lambda k: pg.locator(f'#presBody .it[data-id="{(R if k=="rect" else E)["id"]}"]').count()
  starte(pg); pg.wait_for_timeout(300)
  check('Start: beide noch verborgen',vis('rect')==0 and vis('ellipse')==0)
  pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(50)
  check('Schritt 1 erscheint (mit Einblenden)',vis(first)==1 and vis(second)==0 and pg.locator('#presBody .apIn').count()==1)
  pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(50)
  check('Schritt 2 erscheint',vis(first)==1 and vis(second)==1)
  check('Weiter-Knopf noch aktiv',not pg.is_disabled('#presNext'))
  pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(500)
  check('Dann nächste Folie',pg.text_content('#presNo').startswith('2'))
  pg.keyboard.press('ArrowLeft'); pg.wait_for_timeout(500)
  check('Zurück: Folie 1 vollständig',pg.text_content('#presNo').startswith('1') and vis(first)==1 and vis(second)==1)
  pg.keyboard.press('ArrowLeft'); pg.wait_for_timeout(50)
  check('Zurück: Schritt wieder verborgen',vis(first)==1 and vis(second)==0)
  pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
  # Reihenfolge ändern
  pick(R); check('Element gewählt: Schritt angezeigt',pg.locator('#props .apNo').count()==1)
  pact(pg,'[data-act="apup"]' if ap['rect']==1 else '[data-act="apdn"]'); pg.wait_for_timeout(150)
  d=pg.evaluate(READ); ap2={i['kind']:i.get('ap') for i in d['items'] if i.get('kind') in('rect','ellipse')}
  check('Schritte getauscht',ap2['rect']==ap['ellipse'] and ap2['ellipse']==ap['rect'],str(ap2))
  pact(pg,'[data-act="apon"]'); pg.wait_for_timeout(150)
  d=pg.evaluate(READ); check('Ausschalten entfernt den Schritt',not [i for i in d['items'] if i.get('kind')=='rect'][0].get('ap'))
  pact(pg,'[data-act="apon"]'); pg.wait_for_timeout(150)
  d=pg.evaluate(READ); ap3={i['kind']:i.get('ap') for i in d['items'] if i.get('kind') in('rect','ellipse')}
  check('Einschalten hängt hinten an',ap3['rect']>ap3['ellipse'],str(ap3))
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
