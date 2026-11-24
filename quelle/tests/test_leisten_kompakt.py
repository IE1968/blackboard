"""Design-Review Stufe 3: kompakte Optionsleiste, „⋯“ je Board, Ansicht mit Reitern, Hilfe mit „Erste Schritte“, Teilen-Menü."""
import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
from playwright.sync_api import sync_playwright
srv=server()
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME); pg=br.new_page(viewport={'width':1440,'height':900}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(700)
  # Optionsleiste (schwebend): einzeilig, ohne sichtbare Überschriften, Duplizieren/Löschen direkt
  el=pg.locator('#items [data-id]').nth(2); bb=el.bounding_box(); pg.mouse.click(bb['x']+bb['width']/2,bb['y']+bb['height']/2); pg.wait_for_timeout(250)
  r=pg.evaluate("()=>{const p=document.getElementById('props');return [p.getBoundingClientRect().height,getComputedStyle(p.querySelector('.pg>b')).position,p.querySelectorAll('.pgQuick [data-act]').length]}")
  check('Optionsleiste einzeilig und flach',r[0]<64 and r[1]=='absolute' and r[2]==2,str(r))
  n0=len(pg.evaluate(READ)['items']); pg.click('#props .pgQuick [data-act="dup"]'); pg.wait_for_timeout(200)
  check('Duplizieren direkt',len(pg.evaluate(READ)['items'])==n0+1)
  pg.click('#props .pgQuick [data-act="del"]'); pg.wait_for_timeout(200)
  check('Löschen direkt',len(pg.evaluate(READ)['items'])==n0)
  # Leiste weicht der Folienübersicht aus
  pg.click('#playBtn'); pg.click('#presPop [data-m="slides"]'); pg.wait_for_timeout(200)
  el=pg.locator('#items [data-id]').nth(2); bb=el.bounding_box(); pg.mouse.click(bb['x']+bb['width']/2,bb['y']+bb['height']/2); pg.wait_for_timeout(250)
  ov=pg.evaluate("()=>{const a=document.getElementById('props'),b=document.getElementById('slides').getBoundingClientRect(),r=a.getBoundingClientRect();return a.classList.contains('fhide')||!(r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top)}")
  check('Optionsleiste überdeckt die Folienübersicht nicht',ov)
  pg.keyboard.press('Escape'); pg.click('#slides [aria-label], #slides .sh button:last-child') if False else None
  pg.evaluate("()=>document.getElementById('slides').hidden=true")
  # Boards: „⋯“
  openFile(pg); pg.click('#boardList .bM'); pg.wait_for_timeout(100)
  check('„⋯“ zeigt Umbenennen, Ordner, Duplizieren, Leeren, Löschen',all(pg.locator(f'#boardList {s}').count()==1 for s in ['[data-bact="ren"]','[data-bact="fold"]','[data-bact="dup"]','[data-m="clear"]','[data-bact="del"]']))
  pg.click('#boardList [data-bact="dup"]'); pg.wait_for_timeout(300)
  names=pg.evaluate("()=>JSON.parse(localStorage.getItem('blackboard-boards')).list.map(b=>b.name)")
  check('Duplizieren legt „(Kopie)“ an',len(names)==2 and names[1].endswith('(Kopie)'),str(names))
  pg.click('#newFolder'); pg.keyboard.type('Klasse 7b'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
  pg.locator('#boardList .bM').last.click(); pg.click('#boardList [data-bact="fold"]'); pg.click('#boardList [data-bto="Klasse 7b"]'); pg.wait_for_timeout(200)
  fs=pg.evaluate("()=>JSON.parse(localStorage.getItem('blackboard-boards')).list.map(b=>b.f||'')")
  check('In Ordner verschieben',fs.count('Klasse 7b')==1,str(fs))
  pg.locator('#boardList .fIn .bM').first.click(); pg.click('#boardList [data-bact="del"]')
  check('Löschen fragt nach',len(pg.evaluate("()=>JSON.parse(localStorage.getItem('blackboard-boards')).list"))==2 and 'Wirklich' in pg.inner_text('#boardList [data-bact="del"]'))
  pg.click('#boardList [data-bact="del"]'); pg.wait_for_timeout(300)
  check('… und löscht',len(pg.evaluate("()=>JSON.parse(localStorage.getItem('blackboard-boards')).list"))==1)
  pg.click('#boardList .bM'); pg.click('#boardList [data-bact="ren"]'); pg.wait_for_timeout(100)
  check('Umbenennen setzt den Fokus ins Namensfeld',pg.evaluate("document.activeElement.id")=='boardName')
  pg.keyboard.type('Projektwoche'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
  check('… neuer Name gespeichert',pg.evaluate("()=>JSON.parse(localStorage.getItem('blackboard-boards')).list[0].name")=='Projektwoche')
  # Ansicht mit Reitern
  pg.click('#viewBtn'); pg.wait_for_timeout(150)
  check('Ansicht öffnet mit Reiter „Tafel“',pg.is_visible('#vpSurf') and not pg.is_visible('#appRow'))
  pg.click('#viewPop [data-vt="geraet"]'); check('Reiter „Einstellungen“ zeigt Gerätesachen',pg.is_visible('#appRow') and pg.is_visible('#pressRow') and not pg.is_visible('#vpSurf'))
  pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
  # Hilfe
  pg.click('#keysBtn'); pg.wait_for_timeout(150)
  check('Hilfe öffnet „Erste Schritte“',pg.is_visible('#helpStart .hs') and pg.locator('#helpStart .hs').count()>=6 and 'Doppelklick' in pg.inner_text('#helpStart'))
  pg.click('#keysBox [data-kt="keys"]'); check('Reiter Tastenkürzel',pg.is_visible('#keysBox kbd') and not pg.is_visible('#helpStart'))
  pg.click('#keysX'); check('✕ schließt die Hilfe',pg.is_hidden('#keysDlg'))
  pg.evaluate("()=>document.getElementById('board').focus()"); pg.keyboard.press('Shift+?'); pg.wait_for_timeout(150)
  check('„?“ öffnet direkt die Tastenkürzel',pg.is_visible('#keysBox kbd')); pg.keyboard.press('Escape')
  # Teilen-Menü: ein Feld für Link oder Quiz-Code
  pg.click('#liveBtn'); pg.wait_for_timeout(120)
  check('Teilen-Menü: zwei Bereiche',pg.is_visible('#livePop .liveH2') and pg.text_content('#liveBtn span')=='Teilen')
  pg.fill('#liveJoinIn','abc-def'); pg.click('#liveJoinForm button'); pg.wait_for_timeout(300)
  check('Quiz-Code im selben Feld öffnet das Quiz',pg.locator('#qzPlay').count()==1 and pg.is_visible('#qzPlay'))
  check('Keine Fehler',not errs,str(errs))
  br.close()
finally: srv.terminate()
