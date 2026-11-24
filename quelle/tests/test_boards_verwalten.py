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
  def menu(m): openFile(pg); pg.click(f'#menu [data-m="{m}"]'); pg.wait_for_timeout(250)
  for nm in ['Alpha','Beta','Alpha','Gamma']: menu('new'); pg.fill('#boardName',nm); pg.wait_for_timeout(150)
  n0=len(boards()); check('5 Boards angelegt',n0==5,str(n0))
  order=pg.evaluate("()=>[...document.getElementById('menu').children].slice(0,3).map(e=>e.id||e.className||e.textContent)")
  check('„+ Neues Board“ ganz oben, darunter „Boards verwalten“',order[1]=='manageBtn',str(order))
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
  # Dasselbe Board von zwei Geräten: gleiche Texte, aber andere Kennungen und leicht andere Größen → gilt als doppelt
  pg.evaluate("""()=>{ const x=JSON.parse(localStorage.getItem('blackboard-boards'));
    const mk=(id,dx)=>({items:[{id:'a'+dx,type:'shape',kind:'text',x:10+dx,y:10,w:200+dx,h:40,text:'Willkommen',fill:'none',stroke:'#1c2a2e',sw:2},{id:'b'+dx,type:'shape',kind:'rect',x:0,y:80,w:100,h:50,text:'Idee',fill:'#ffffff',stroke:'#1c2a2e',sw:2}],n:3});
    x.list.push({id:'g1',name:'Board 1',updated:1},{id:'g2',name:'Board 1',updated:5},{id:'g3',name:'Board 1',updated:3});
    localStorage.setItem('blackboard-b-g1',JSON.stringify(mk('g1',0))); localStorage.setItem('blackboard-b-g2',JSON.stringify(mk('g2',4)));
    const o=mk('g3',0); o.items[1].text='Anders'; localStorage.setItem('blackboard-b-g3',JSON.stringify(o));
    localStorage.setItem('blackboard-boards',JSON.stringify(x)); }""")
  pg.reload(); pg.wait_for_timeout(800); menu('manage'); pg.click('#bmSame')
  sel=[x.get_attribute('data-id') for x in pg.locator('#bmList .bmRow input:checked').all()]
  check('Doppelte von zwei Geräten werden erkannt (älteres angekreuzt)',sel==['g1'],str(sel)+' '+pg.inner_text('#bmMsg'))
  check('Gleicher Name, anderer Inhalt wird gemeldet','anderen Inhalt' in pg.inner_text('#bmMsg'),pg.inner_text('#bmMsg'))
  pg.click('#bmClose')
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
