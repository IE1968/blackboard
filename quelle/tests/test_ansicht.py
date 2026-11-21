import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Ansicht: Fläche und Muster pro Board, Farbthema pro Gerät, Größe und Schalter, Konto- und Live-Knopf in der Leiste."""
from playwright.sync_api import sync_playwright
srv=server(); errs=[]
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox']); pg=br.new_page(viewport={'width':1400,'height':900})
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(800)
  def view(sel): 
      if not pg.is_visible('#viewPop'): pg.click('#viewBtn'); pg.wait_for_timeout(150)
      pg.click(sel); pg.wait_for_timeout(200)
  stage=lambda: pg.evaluate("()=>{const s=document.getElementById('stage');return [s.dataset.surf,s.style.getPropertyValue('--paper'),document.getElementById('grid').dataset.p,s.classList.contains('dark')]}")
  check('Kein Abschnitt „Anzeige“ mehr im Menü',pg.locator('#menu #uiRow').count()==0 and pg.locator('#viewPop #uiRow').count()==1)
  check('Kein eigener Hell/Dunkel-Knopf mehr',pg.locator('#bgBtn').count()==0)
  order=pg.evaluate("()=>[...document.querySelector('.bar').children].map(e=>e.id||e.className)")
  check('Kein Datei-Knopf mehr, rechts Live und Konto',pg.locator('#menuBtn').count()==0 and order[-2:]==['liveBadge','ktBtn'],str(order[-4:]))
  check('Export-Knopf links von Zeigen',order.index('expBtn')==order.index('playBtn')-1,str(order))
  check('Ansicht rechts neben Zeigen',order.index('viewBtn')==order.index('playBtn')+1,str(order))
  view('#vpSurf [data-s="usedd"]'); check('13 Flächen, Vintage dunkel wählbar',pg.locator('#vpSurf .vpSw').count()==13 and stage()[0]=='usedd' and stage()[3])
  check('Struktur liegt auf der Fläche',pg.evaluate("()=>getComputedStyle(document.getElementById('stage')).backgroundImage.includes('feTurbulence')"))
  view('#vpSurf [data-s="chalk"]'); s=stage()
  check('Tafelgrün gewählt',s[0]=='chalk' and s[1]=='#26392e' and s[3],str(s))
  view('#vpPat [data-p="grid"]'); check('Muster kariert',stage()[2]=='grid' and pg.locator('#grid path').count()==1)
  view('#vpPat [data-p="none"]'); check('Muster leer blendet Raster aus',pg.evaluate("()=>document.getElementById('gridRect').style.display")=='none')
  d=pg.evaluate(READ); check('Fläche im Board gespeichert',d.get('bg')=={'s':'chalk','p':'none'},str(d.get('bg')))
  pg.keyboard.press('Escape'); pg.keyboard.press('Control+z'); pg.wait_for_timeout(300)
  check('Rückgängig nimmt Muster zurück',stage()[2]=='grid',str(stage()))
  # anderes Board: eigene Fläche
  openFile(pg); pg.click('#menu [data-m="new"]'); pg.wait_for_timeout(300)
  view('#vpSurf [data-s="paper"]'); check('Neues Board: Papier',stage()[0]=='paper' and not stage()[3])
  pg.keyboard.press('Escape')
  first=pg.evaluate("()=>JSON.parse(localStorage.getItem('blackboard-boards')).list[0].id")
  openFile(pg); pg.click(f'#boardList [data-b="{first}"]'); pg.wait_for_timeout(300)
  check('Erstes Board behält Tafelgrün',stage()[0]=='chalk',str(stage()))
  check('Keine Auswahl „Farbe der Oberfläche“ mehr',pg.locator('#vpTheme').count()==0)
  check('Auswahlfarbe blau',pg.evaluate("()=>document.body.style.getPropertyValue('--sel')") in ('#4d9fff','#1763cf'))
  pg.click('#viewBtn')
  view('#uiRow [data-v="1"]'); check('Größe 100 %',pg.evaluate("()=>document.documentElement.style.getPropertyValue('--ui')")=='1')
  view('#hcBtn'); check('Hoher Kontrast schaltbar',pg.evaluate("()=>document.body.classList.contains('hc')") and pg.get_attribute('#hcBtn','aria-pressed')=='true')
  pg.screenshot(path=OUT+'/ansicht.png')
  pg.reload(); pg.wait_for_timeout(900)
  check('Nach Neuladen: Fläche bleibt',stage()[0]=='chalk')
  # PDF/Export nutzt die Fläche
  check('Export-Hintergrund ist die Tafelfarbe',pg.evaluate("()=>document.getElementById('stage').style.getPropertyValue('--paper')")=='#26392e')
  # Konto-Knopf
  pg.click('#ktBtn'); pg.wait_for_timeout(200); check('Konto-Knopf öffnet Anmeldung',pg.is_visible('#ktDlg')); pg.click('#ktClose')
  pg.set_viewport_size({'width':390,'height':844}); pg.wait_for_timeout(400)
  bx=pg.evaluate("()=>['brand','ktBtn','expBtn','viewBtn'].map(i=>{const e=i==='brand'?document.querySelector('.brand'):document.getElementById(i);return Math.round(e.getBoundingClientRect().top)})")
  check('Handy: Konto, Export und Ansicht in der ersten Zeile',max(bx)-min(bx)<20,str(bx))
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
