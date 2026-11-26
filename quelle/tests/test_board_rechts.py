import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Rechte Leiste: Board leeren, Board verschieben (auch in neuen Ordner) und Board löschen mit Rückfrage."""
srv=server(); errs=[]
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
  pg=br.new_page(viewport={'width':1024,'height':768}); pg.on('pageerror',lambda e: errs.append(str(e))); pg.goto(URL); pg.wait_for_timeout(800)
  idx=lambda: pg.evaluate("()=>JSON.parse(localStorage.getItem('blackboard-boards'))")
  openFile(pg); pg.click('#menu [data-m="new"]'); pg.wait_for_timeout(200)
  openFile(pg); pg.click('#newFolder'); pg.keyboard.type('Kurs'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
  openFile(pg); pg.click('#curMove'); pg.wait_for_timeout(150)
  pg.click('#curFold [data-cto="f:Kurs"]'); pg.wait_for_timeout(200)
  x=idx(); cur=[b for b in x['list'] if b['id']==x['cur']][0]; check('verschoben',cur.get('f')=='Kurs',str(cur))
  openFile(pg); pg.click('#curMove'); pg.click('#curFold [data-cto="new"]'); pg.keyboard.type('Neu'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
  x=idx(); cur=[b for b in x['list'] if b['id']==x['cur']][0]; check('neuer ordner',cur.get('f')=='Neu',str(cur))
  n=len(idx()['list']); openFile(pg); pg.click('#delBoard'); check('rückfrage','Wirklich' in pg.inner_text('#delBoard'))
  pg.click('#delBoard'); pg.wait_for_timeout(300); check('gelöscht',len(idx()['list'])==n-1)
  openFile(pg); check('knopf zurück',pg.inner_text('#delBoard')=='Board löschen')
  pg.click('#delBoard'); pg.click('#delBoard'); pg.wait_for_timeout(300); check('letztes löschen → neues leeres',len(idx()['list'])==1)
  openFile(pg); pg.click('#menu [data-m="clear"]'); pg.wait_for_timeout(200); check('leeren ok',not errs,str(errs))
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
