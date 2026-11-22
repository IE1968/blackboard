import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
from playwright.sync_api import sync_playwright
srv=server()
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME); pg=br.new_page(viewport={'width':1200,'height':800}); errs=[]
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.add_init_script("localStorage.setItem('skizix-test-opts','1')"); pg.goto(URL); pg.wait_for_timeout(300)
  pg.evaluate(LOAD,{'items':[{'id':'a','type':'shape','kind':'rect','x':300,'y':200,'w':260,'h':160,'text':'Titel\nPunkt eins\nPunkt zwei\nSchluss'}],'conns':[]}); pg.reload(); pg.wait_for_timeout(500)
  it=lambda: [i for i in pg.evaluate(READ)['items'] if i['id']=='a'][0]
  bb=pg.evaluate("()=>{const r=document.querySelector('[data-id=\"a\"]').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}")
  pg.mouse.dblclick(*bb); pg.wait_for_timeout(200)
  pg.evaluate("()=>{const e=document.getElementById('editor'); e.setSelectionRange(0,3)}")   # im ersten Absatz
  pg.click('#props [data-drop="text"]'); pg.wait_for_timeout(120)
  check('Markierung bleibt beim Öffnen des Textfelds',pg.evaluate("()=>{const e=document.getElementById('editor');return !e.hidden&&e.selectionStart===0&&e.selectionEnd===3}"))
  pg.click('#colorPop [data-act="bold"]'); pg.wait_for_timeout(250)
  d=it(); check('Nur Absatz 1 fett',d.get('pf',[''])[0]=='b' and not any('b' in v for v in d['pf'][1:]) and not d.get('bold'),str(d.get('pf')))
  check('Fett ist sofort sichtbar',pg.evaluate("()=>[...document.querySelectorAll('[data-id=\"a\"] tspan')].filter(t=>t.getAttribute('font-weight')==='600').map(t=>t.textContent).join('|')")=='Titel')
  check('Textfeld bleibt offen, Fett gedrückt',pg.is_visible('#colorPop') and pg.get_attribute('#colorPop [data-act="bold"]','aria-pressed')=='true')
  # Absätze 2 und 3 als Aufzählung
  pg.mouse.dblclick(*bb); pg.wait_for_timeout(200)
  pg.evaluate("()=>{const e=document.getElementById('editor'); const v=e.value; e.setSelectionRange(v.indexOf('Punkt eins')+2,v.indexOf('Punkt zwei')+3)}")
  pg.click('#props [data-drop="text"]'); pg.wait_for_timeout(120); pg.click('#colorPop [data-act="list"]'); pg.wait_for_timeout(250)
  d=it(); check('Absätze 2 und 3 als Aufzählung',d['pf']==['b','l','l',''],str(d['pf']))
  bul=pg.evaluate("()=>[...document.querySelectorAll('[data-id=\"a\"] tspan')].filter(t=>t.textContent==='•').length")
  check('Zwei Aufzählungspunkte sichtbar',bul==2,str(bul))
  # Enter am Ende eines Listenpunkts: neuer Absatz ist auch Listenpunkt
  pg.mouse.dblclick(*bb); pg.wait_for_timeout(200)
  pg.evaluate("()=>{const e=document.getElementById('editor'); const v=e.value, p=v.indexOf('Punkt zwei')+10; e.setSelectionRange(p,p)}")
  pg.keyboard.press('Enter'); pg.keyboard.type('Punkt drei'); pg.keyboard.press('Escape'); pg.wait_for_timeout(250)
  d=it(); check('Neuer Absatz erbt die Aufzählung',d['text'].split('\n')==['Titel','Punkt eins','Punkt zwei','Punkt drei','Schluss'] and d['pf']==['b','l','l','l',''],str(d['pf']))
  # bleibt nach dem Neuladen
  pg.reload(); pg.wait_for_timeout(500); check('Absatzformate bleiben gespeichert',it()['pf']==['b','l','l','l',''])
  pg.screenshot(path=OUT+'/absatzformat.png')
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
