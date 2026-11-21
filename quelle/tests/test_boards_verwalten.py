import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Dialog „Boards verwalten“: mehrere Boards ankreuzen und auf einmal löschen, doppelte Namen werden markiert."""
from playwright.sync_api import sync_playwright
srv=server(); errs=[]
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox']); pg=br.new_page(viewport={'width':1300,'height':850})
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(700)
  boards=lambda: pg.evaluate("()=>JSON.parse(localStorage.getItem('blackboard-boards')).list")
  def menu(m): pg.click('#menuBtn'); pg.click(f'#menu [data-m="{m}"]'); pg.wait_for_timeout(250)
  for nm in ['Alpha','Beta','Alpha','Gamma']: menu('new'); pg.fill('#boardName',nm); pg.wait_for_timeout(150)
  n0=len(boards()); check('5 Boards angelegt',n0==5,str(n0))
  menu('manage'); check('Dialog offen',pg.is_visible('#bmDlg'))
  names=pg.eval_on_selector_all('#bmList .bmRow b',"e=>e.map(x=>x.textContent)")
  check('Sortiert, gleiche Namen untereinander',names[:2]==['Alpha','Alpha'],str(names))
  check('Doppelte markiert',pg.locator('#bmList .bmRow.dup').count()==2)
  check('Löschen ohne Auswahl gesperrt',pg.is_disabled('#bmDel'))
  pg.screenshot(path=OUT+'/boards_verwalten.png')
  pg.click('#bmSame')
  sel=[x.get_attribute('data-id') for x in pg.locator('#bmList .bmRow input:checked').all()]
  check('„Gleiche ankreuzen“: von zwei leeren „Alpha“ wird eins angekreuzt',len(sel)==1 and 'Gleich' not in pg.inner_text('#bmMsg') and '1 Board' in pg.inner_text('#bmMsg'),pg.inner_text('#bmMsg'))
  pg.uncheck('#bmAll') if pg.is_checked('#bmAll') else None
  pg.locator('#bmList .bmRow input:checked').first.uncheck()
  rows=pg.locator('#bmList .bmRow input'); rows.nth(0).check(); rows.nth(2).check()
  check('Knopf zählt mit',pg.inner_text('#bmDel')=='2 Boards löschen')
  pg.click('#bmDel'); check('Erst Rückfrage','Wirklich' in pg.inner_text('#bmDel'))
  pg.click('#bmDel'); pg.wait_for_timeout(300)
  check('Zwei Boards gelöscht',len(boards())==n0-2,str([b['name'] for b in boards()]))
  check('Liste im Dialog aktualisiert',pg.locator('#bmList .bmRow').count()==n0-2)
  pg.check('#bmAll'); pg.click('#bmDel'); pg.click('#bmDel'); pg.wait_for_timeout(300)
  b=boards(); check('Alle gelöscht: ein leeres Board bleibt',len(b)==1 and b[0]['name']=='Board 1',str(b))
  pg.click('#bmClose'); check('Dialog schließt',not pg.is_visible('#bmDlg'))
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
