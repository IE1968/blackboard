import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Checkliste: Zeilen mit Kästchen, Antippen hakt ab; Knopf in der Optionsleiste; Vorlagen Einkaufsliste, Wochenplaner, To-do-Liste."""
from playwright.sync_api import sync_playwright
srv=server(); errs=[]
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox']); pg=br.new_page(viewport={'width':1500,'height':900})
  pg.add_init_script("localStorage.setItem('skizix-test-bartop','1')")
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(900)
  openFile(pg); pg.click('#menu [data-m="clear"]'); pg.wait_for_timeout(100)
  pg.evaluate("()=>{for(let i=0;i<14;i++){const h=[...document.querySelectorAll('.gh')].find(h=>h.getAttribute('aria-expanded')==='false'); if(!h) break; h.click();}}")
  check('Checkliste in der Formenleiste',pg.locator('.pal[data-kind="checklist"]').count()==1)
  pg.focus('.pal[data-kind="checklist"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200); pg.keyboard.press('Escape'); pg.keyboard.press('Escape')
  it=lambda: [i for i in pg.evaluate(READ)['items'] if i.get('pf')][0]
  check('Drei offene Kästchen',it().get('pf')==['c','c','c'] and pg.locator('#items .ckBox').count()==3,str(it().get('pf')))
  def box(n): b=pg.locator('#items .ckBox').nth(n).bounding_box(); return b['x']+b['width']/2,b['y']+b['height']/2
  pg.mouse.click(*box(1)); pg.wait_for_timeout(150)
  check('Antippen hakt ab',it()['pf']==['c','x','c'],str(it()['pf']))
  check('Abgehakt: grünes Kästchen, Text durchgestrichen',pg.locator('#items tspan[text-decoration="line-through"]').count()==1)
  check('Antippen wählt nicht aus',pg.locator('#props [data-act="chk"]').count()==0 or pg.evaluate("()=>document.querySelectorAll('#overlay [data-h]').length")==0)
  pg.mouse.click(*box(1)); pg.wait_for_timeout(150)
  check('Nochmal antippen: wieder offen',it()['pf']==['c','c','c'])
  pg.mouse.click(*box(2)); pg.wait_for_timeout(100); pg.keyboard.press('Control+z'); pg.wait_for_timeout(150)
  check('Rückgängig nimmt das Häkchen zurück',it()['pf']==['c','c','c'])
  x,y=box(0); pg.mouse.click(x+120,y); pg.wait_for_timeout(150)
  if pg.evaluate("()=>document.body.classList.contains('opts-closed')"): pg.click('#optsToggle'); pg.wait_for_timeout(150)
  check('Klick auf den Text wählt aus statt abzuhaken',it()['pf']==['c','c','c'] and pg.locator('#props .mdrop').count()>0)
  pg.locator('#props .mdrop').first.click(); pg.wait_for_timeout(100)
  check('Knopf „Checkliste“ im Feld Text, gedrückt',pg.get_attribute('#colorPop [data-act="chk"]','aria-pressed')=='true')
  pg.evaluate("()=>{const p=document.getElementById('colorPop'); p.hidden=true; p.innerHTML=''}")
  pact(pg,'[data-act="list"]'); pg.wait_for_timeout(150)
  check('Aufzählung ersetzt die Kästchen',it()['pf']==['l','l','l'] and pg.locator('#items .ckBox').count()==0,str(it().get('pf')))
  pact(pg,'[data-act="chk"]'); pg.wait_for_timeout(150)
  check('Checkliste wieder an',it()['pf']==['c','c','c'])
  pact(pg,'[data-act="chk"]'); pg.wait_for_timeout(150)
  check('Checkliste aus',not [i for i in pg.evaluate(READ)['items'] if i.get('pf')])
  # Beim Schreiben: Feld durchsichtig, Kästchen bleiben sichtbar und wachsen mit
  pg.keyboard.press('Escape'); openFile(pg); pg.click('#menu [data-m="clear"]'); pg.wait_for_timeout(100)
  pg.focus('.pal[data-kind="checklist"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200); pg.keyboard.press('Escape'); pg.keyboard.press('Escape')
  t=pg.locator('#items text').first.bounding_box(); pg.mouse.dblclick(t['x']+80,t['y']+10); pg.wait_for_timeout(200)
  check('Beim Schreiben: kein weißes Feld',pg.evaluate("()=>getComputedStyle(document.getElementById('editor')).backgroundColor")=='rgba(0, 0, 0, 0)')
  check('Beim Schreiben: Kästchen sichtbar',pg.locator('#items .ckBox').count()==3)
  pg.keyboard.press('Control+End'); pg.keyboard.press('Enter'); pg.keyboard.type('Neu'); pg.wait_for_timeout(150)
  check('Neue Zeile bekommt sofort ein Kästchen',pg.locator('#items .ckBox').count()==4)
  check('Text nicht doppelt (nur im Eingabefeld)',pg.locator('#items tspan',has_text='Erste').count()==0)
  pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
  check('Fertig: vier Zeilen mit Kästchen',it()['pf']==['c','c','c','c'] and it()['text'].endswith('Neu'))
  # Vorlagen
  pg.keyboard.press('Escape'); openFile(pg); pg.click('#menu [data-m="clear"]'); pg.wait_for_timeout(100)
  pg.evaluate("()=>document.querySelector('[data-tpl]').click()"); pg.wait_for_timeout(300)
  names=pg.locator('#tplGrid .tc b').all_text_contents()
  check('Vorlagen Alltag vorne',names[:3]==['Einkaufsliste','Wochenplaner','To-do-Liste'],str(names[:4]))
  for i,n in enumerate(['Einkaufsliste','Wochenplaner','To-do-Liste']):
      if i: pg.evaluate("()=>document.querySelector('[data-tpl]').click()"); pg.wait_for_timeout(300)
      before={x['id'] for x in pg.evaluate(READ)['items']}
      pg.click(f'#tplGrid [data-t="{i}"]'); pg.wait_for_timeout(300)
      new=[x for x in pg.evaluate(READ)['items'] if x['id'] not in before]
      boxes=[x for x in new if x.get('kind') in ('rect','table')]; tops=sorted([x for x in new if x.get('kind')=='text'],key=lambda x:x['y'])[:2]
      R=max(x['x']+x['w'] for x in boxes)
      check(f'{n}: rechts bündig',all(abs(x['x']+x['w']-R)<1 for x in tops) and sum(1 for x in boxes if abs(x['x']+x['w']-R)<1)>=1 and max(x['x']+x['w'] for x in new)<=R+1,str([x['x']+x['w'] for x in tops+boxes]))
      if i==0: pg.screenshot(path=OUT+'/vorlage_einkauf.png')
  its=pg.evaluate(READ)['items']; pf=[v for i in its for v in i.get('pf',[])]
  check('Vorlagen bringen offene und abgehakte Zeilen mit',pf.count('x')>=3 and pf.count('c')>=20,f"{pf.count('x')} {pf.count('c')}")
  check('Wochenplaner-Tabelle mit Mo–So',any(i.get('kind')=='table' and i['cells'][0][1:]==['Mo','Di','Mi','Do','Fr','Sa','So'] for i in its))
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
