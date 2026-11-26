"""Stifte und Pinsel: Auswahl unter den Knöpfen, Tasten S und P, alle Werkzeuge zeichnen, speichern und exportieren."""
import sys,os,math; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
from playwright.sync_api import sync_playwright
srv=server()
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME); pg=br.new_page(viewport={'width':1440,'height':900},accept_downloads=True); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(700); leeren(pg); pg.keyboard.press('Escape')
  check('Formstift hat keinen eigenen Knopf mehr',pg.locator('#tools [data-tool="smart"]').count()==0)
  pg.click('#tools [data-tool="stifte"]'); pg.wait_for_timeout(150)
  names=pg.locator('#drawPop [data-var] span').all_inner_texts()
  check('Stift: Auswahl Bleistift, Kugelschreiber, Füller, Formstift',names==['Bleistift','Kugelschreiber','Füller','Formstift'],str(names))
  pg.click('#tools [data-tool="pinsel"]'); pg.wait_for_timeout(150)
  names=pg.locator('#drawPop [data-var] span').all_inner_texts()
  check('Pinsel: Auswahl Aquarell, Borstenpinsel, Kreide, Kalligrafie, Sprühpinsel',names==['Aquarell','Borstenpinsel','Kreide','Kalligrafie','Sprühpinsel'],str(names))
  pg.keyboard.press('Escape'); pg.wait_for_timeout(100); check('Esc schließt die Auswahl',pg.is_hidden('#drawPop'))
  T={'pencil':'stifte','pen':'stifte','fountain':'stifte','water':'pinsel','bristle':'pinsel','chalk':'pinsel','callig':'pinsel','spray':'pinsel'}
  for i,(t,g) in enumerate(T.items()):
    pg.click(f'#tools [data-tool="{g}"]'); pg.wait_for_timeout(80)
    if pg.is_hidden('#drawPop'): pg.click(f'#tools [data-tool="{g}"]'); pg.wait_for_timeout(80)
    pg.click(f'#drawPop [data-var="{t}"]'); pg.wait_for_timeout(80)
    y=150+i*80; pg.mouse.move(400,y); pg.mouse.down()
    for k in range(1,30): pg.mouse.move(400+k*12,y+math.sin(k/4)*20); pg.wait_for_timeout(5)
    pg.mouse.up(); pg.wait_for_timeout(80)
    if i==0: check('Zeichnen schließt die Auswahl',pg.is_hidden('#drawPop'))
  its=pg.evaluate(READ)['items']
  check('Jedes Werkzeug zeichnet mit eigener Art',[i.get('tool') for i in its]==list(T),str([i.get('tool') for i in its]))
  check('Startfarben: Füller blau, Sprühpinsel rot',its[2]['stroke']=='#1e63d0' and its[7]['stroke']=='#c8321f')
  n=pg.evaluate("()=>[...document.querySelectorAll('#items > [data-id]')].map(g=>g.querySelectorAll('path,circle').length)")
  check('Bleistift, Kreide, Borsten, Sprühpinsel mit Struktur',n[0]>=4 and n[5]>=5 and n[4]>=4 and n[7]>=3,str(n))
  check('Knöpfe zeigen den gewählten Stift und Pinsel',pg.get_attribute('#tools [data-tool="stifte"]','aria-label')=='Stift: Füller' and pg.get_attribute('#tools [data-tool="pinsel"]','aria-label')=='Pinsel: Sprühpinsel')
  pg.reload(); pg.wait_for_timeout(700)
  check('Striche und Werkzeugwahl bleiben nach Neuladen',[i.get('tool') for i in pg.evaluate(READ)['items']]==list(T) and pg.get_attribute('#tools [data-tool="pinsel"]','aria-label')=='Pinsel: Sprühpinsel')
  pg.keyboard.press('Escape'); pg.keyboard.press('s'); pg.wait_for_timeout(50); a=pg.get_attribute('#board','class')
  pg.keyboard.press('s'); pg.wait_for_timeout(50); b=pg.get_attribute('#board','class')
  check('Taste S: Stifte, nochmal S: nächster Stift',a=='t-fountain t-stifte' and b=='t-smart t-stifte',a+' / '+b)
  pg.keyboard.press('p'); pg.wait_for_timeout(50); c=pg.get_attribute('#board','class')
  check('Taste P: Pinsel',c=='t-spray t-pinsel',c)
  with pg.expect_download(timeout=30000) as d: exportiere(pg,'pdf')
  check('PDF-Export mit allen Stiften und Pinseln',os.path.getsize(d.value.path())>3000)
  check('Keine Fehler',not errs,str(errs))
  br.close()
finally: srv.terminate()
