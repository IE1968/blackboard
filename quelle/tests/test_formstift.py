"""Formstift (Linien und Formen werden sauber) und Schriftart Handschrift."""
import sys,os,math,random; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
from playwright.sync_api import sync_playwright
random.seed(7)
def j(p,a=4): return (p[0]+random.uniform(-a,a),p[1]+random.uniform(-a,a))
def poly(c,n=12):
    out=[]
    for i in range(len(c)):
        a,b=c[i],c[(i+1)%len(c)]
        for k in range(n): t=k/n; out.append(j((a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)))
    out.append(j(c[0])); return out
def strich(pg,pts):
    pg.mouse.move(*pts[0]); pg.mouse.down()
    for p in pts[1:]: pg.mouse.move(*p,steps=3)
    pg.mouse.up(); pg.wait_for_timeout(150)
srv=server()
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME); pg=br.new_page(viewport={'width':1440,'height':900},accept_downloads=True); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(700); leeren(pg); pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
  pg.evaluate("()=>{ if(!document.querySelector('main').classList.contains('props-closed')) document.getElementById('propsToggle').click() }")
  pg.click('#tools [data-tool="smart"]'); check('Formstift in der Werkzeugleiste',pg.get_attribute('#tools [data-tool="smart"]','aria-pressed')=='true')
  strich(pg,[j((350+i*15,200+i*1.5),2) for i in range(20)])
  strich(pg,[j((560+80*math.cos(t/40*2*math.pi),280+50*math.sin(t/40*2*math.pi)),3) for t in range(42)])
  strich(pg,poly([(720,180),(880,180),(880,300),(720,300)]))
  strich(pg,poly([(1040,180),(1120,320),(960,320)]))
  strich(pg,poly([(450,430),(540,490),(450,550),(360,490)]))
  strich(pg,[(700+i*10,460+40*math.sin(i/3)) for i in range(30)])
  it=pg.evaluate(READ)['items']; k=[(i.get('type'),i.get('kind')) for i in it]
  check('Linie begradigt (waagerecht eingerastet)',k[0]==('conn',None) and abs(it[0]['p1']['y']-it[0]['p2']['y'])<0.5,str(it[0].get('p1'))+str(it[0].get('p2')))
  check('Ellipse erkannt',k[1]==('shape','ellipse'),str(k))
  check('Rechteck erkannt',k[2]==('shape','rect'),str(k))
  check('Dreieck erkannt',k[3]==('shape','tri'),str(k))
  check('Raute erkannt',k[4]==('shape','diamond'),str(k))
  check('Welle bleibt ein Strich',k[5]==('path',None),str(k))
  check('Formen ohne Füllung, Werkzeug bleibt Formstift',it[2]['fill']=='none' and pg.get_attribute('#tools [data-tool="smart"]','aria-pressed')=='true')
  pg.keyboard.press('Control+z'); pg.wait_for_timeout(200)
  check('Rückgängig nimmt die letzte Erkennung zurück',len(pg.evaluate(READ)['items'])==5)
  pg.keyboard.press('s') if False else None
  # Handschrift
  pg.click('#tools [data-tool="select"]'); pg.click('#tools [data-tool="text"]'); pg.mouse.click(600,700); pg.keyboard.type('Hallo Welt'); pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
  tx=[i for i in pg.evaluate(READ)['items'] if i.get('kind')=='text'][0]
  b=pg.locator(f'#items > [data-id="{tx["id"]}"]').bounding_box(); pg.mouse.click(b['x']+b['width']/2,b['y']+b['height']/2); pg.wait_for_timeout(200)
  pg.click('#props [data-drop="text"]'); pg.click('#colorPop [data-act="ff"][data-val="hand"]'); pg.wait_for_timeout(300)
  tx=[i for i in pg.evaluate(READ)['items'] if i.get('kind')=='text'][0]
  fam=pg.evaluate(f"()=>document.querySelector('#items > [data-id=\"{tx['id']}\"] text').getAttribute('font-family')")
  check('Schriftart Handschrift gesetzt und angezeigt',tx.get('ff')=='hand' and 'Caveat' in fam,fam)
  pg.reload(); pg.wait_for_timeout(700)
  check('Handschrift bleibt nach Neuladen',[i for i in pg.evaluate(READ)['items'] if i.get('kind')=='text'][0].get('ff')=='hand')
  with pg.expect_download() as d: exportiere(pg,'svg')
  svg=open(d.value.path(),encoding='utf-8').read()
  check('SVG-Export bettet die Handschrift ein',"font-family:'Caveat'" in svg and 'Caveat' in svg)
  with pg.expect_download(timeout=30000) as d: exportiere(pg,'pdf')
  check('PDF-Export mit Handschrift klappt',os.path.getsize(d.value.path())>2000)
  check('Keine Fehler',not errs,str(errs))
  br.close()
finally: srv.terminate()
