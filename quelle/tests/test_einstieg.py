"""Design-Review Stufe 2: beschriftete Kopfleiste, Startbereich auf leerem Board, Vorlagen im Menü mit Filter, neue Folie umschließt Inhalt."""
import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
from playwright.sync_api import sync_playwright
srv=server()
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME)
  for w,h in ((1180,820),(1440,900),(1920,1080)):
    pg=br.new_page(viewport={'width':w,'height':h}); pg.goto(URL); pg.wait_for_timeout(500)
    r=pg.evaluate("()=>[document.body.classList.contains('nolabels'),getComputedStyle(document.querySelector('#playBtn span')).display,document.querySelector('#ktBtn').getBoundingClientRect().right<=innerWidth+.5]")
    check(f'Kopfleiste {w} px mit Beschriftung',r[0] is False and r[1]!='none' and r[2],str(r)); pg.close()
  pg=br.new_page(viewport={'width':1440,'height':900}); pg.goto(URL); pg.wait_for_timeout(500)
  check('Startbereich nicht auf dem Beispiel-Board',pg.is_hidden('#startArea'))
  pg.evaluate("()=>localStorage.setItem('skizix-test-start','1')"); openFile(pg); pg.click('#menu [data-m="new"]'); pg.wait_for_timeout(400)
  check('Startbereich auf neuem, leerem Board',pg.is_visible('#startArea .saCard[data-sa="tpl"]') and pg.locator('#startArea .saTpl').count()==4)
  pg.click('#startArea .saCard[data-sa="pen"]'); pg.wait_for_timeout(150)
  check('„Frei zeichnen“ wählt den Stift',pg.evaluate("document.querySelector('[data-tool=pen]').getAttribute('aria-pressed')")=='true' and pg.is_hidden('#startArea'))
  pg.mouse.move(700,500); pg.mouse.down(); pg.mouse.move(760,540,steps=5); pg.mouse.up(); pg.wait_for_timeout(200)
  check('Nach dem ersten Strich bleibt er weg',pg.is_hidden('#startArea') and len(pg.evaluate(READ)['items'])==1)
  pg.keyboard.press('Control+z'); pg.wait_for_timeout(250)
  check('Wieder leer: Startbereich zurück',pg.is_visible('#startArea'))
  pg.click('#startArea .saTpl >> nth=0'); pg.wait_for_timeout(400)
  d=pg.evaluate(READ); check('Beliebte Vorlage antippen fügt sie ein',len(d['items'])>5 and pg.is_hidden('#startArea'))
  # Vorlagen im Menü, Filter, ✕
  pg.keyboard.press('Control+z'); pg.wait_for_timeout(300); pg.click('#startArea .saLink[data-sa="tpl"]'); pg.wait_for_timeout(300)
  check('Vorlagen-Galerie mit Filtern',pg.is_visible('#tplDlg') and pg.locator('#tplFilt .chip').count()==4)
  pg.click('#tplFilt [data-k="Alltag"]'); n=pg.locator('#tplGrid .tc:visible').count()
  check('Filter „Alltag“ zeigt nur Alltag',n==4,str(n))
  pg.click('#tplFilt [data-k="*"]'); check('Filter „Alle“',pg.locator('#tplGrid .tc:visible').count()>20)
  pg.click('#tplX'); check('✕ schließt die Galerie',pg.is_hidden('#tplDlg'))
  # neue Folie umschließt die Auswahl
  pg.evaluate(LOAD,{'items':[{'id':'a','type':'shape','kind':'rect','x':100,'y':100,'w':200,'h':100,'text':'A'},{'id':'b','type':'shape','kind':'rect','x':500,'y':260,'w':200,'h':100,'text':'B'}],'n':2,'fmt':2})
  pg.reload(); pg.wait_for_timeout(600); pg.keyboard.press('Control+a') if False else None
  pg.evaluate("()=>{document.getElementById('board').focus()}"); pg.keyboard.press('Control+a'); pg.wait_for_timeout(100)
  pg.click('#playBtn'); pg.click('#presPop [data-m="slides"]'); pg.wait_for_timeout(200); pg.click('#slAdd'); pg.wait_for_timeout(300)
  f=[i for i in pg.evaluate(READ)['items'] if i.get('kind')=='frame']
  ok=len(f)==1 and f[0]['x']<=100 and f[0]['y']<=100 and f[0]['x']+f[0]['w']>=700 and f[0]['y']+f[0]['h']>=360 and abs(f[0]['w']/f[0]['h']-16/9)<0.05
  check('„+ Folie“ umschließt die Auswahl (16:9, mit Rand)',ok,str(f))
  check('Keine Warnung, wenn nichts abgeschnitten wird',pg.locator('.slWarn').count()==0)
  pg.evaluate(LOAD,{'items':[{'id':'f','type':'shape','kind':'frame','x':0,'y':0,'w':640,'h':360,'text':'','fill':'none','ord':1},{'id':'a','type':'shape','kind':'rect','x':560,'y':100,'w':200,'h':100,'text':'A'}],'n':2,'fmt':2})
  pg.reload(); pg.wait_for_timeout(600); pg.click('#playBtn'); pg.click('#presPop [data-m="slides"]'); pg.wait_for_timeout(500)
  check('Folienübersicht warnt „schneidet 1 ab“',pg.locator('.slWarn').count()==1 and '1' in pg.locator('.slWarn').inner_text())
  pg.screenshot(path=OUT+'/einstieg.png')
  br.close()
finally: srv.terminate()
