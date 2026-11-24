import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Ordner für Boards: anlegen, Boards hineinlegen (Boards verwalten), auf- und zuklappen, umbenennen, auflösen,
Abgleich mit dem Konto auf ein zweites Gerät, und Verhalten ohne Ordner-Spalte in Supabase."""
import json,urllib.request
from playwright.sync_api import sync_playwright
SB='http://127.0.0.1:8767'
def state(): return json.load(urllib.request.urlopen(SB+'/__state'))
srv=server(); mock=subprocess.Popen([sys.executable,os.path.join(HIER,'supabase_attrappe.py')]); time.sleep(1); errs=[]
def warte(fn,sek=8):
    t=time.time()
    while time.time()-t<sek:
        try:
            v=fn()
            if v: return v
        except Exception: pass
        time.sleep(0.25)
    return fn()
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
  def geraet():
      ctx=br.new_context(viewport={'width':1300,'height':850}); pg=ctx.new_page()
      pg.on('pageerror',lambda e: errs.append(str(e)))
      pg.goto(URL); pg.wait_for_timeout(500); pg.evaluate("u=>localStorage.setItem('skizix-test-sb',u)",SB); pg.reload(); pg.wait_for_timeout(600); return ctx,pg
  def boards(pg): return pg.evaluate("()=>JSON.parse(localStorage.getItem('blackboard-boards')).list")
  def idx(pg): return pg.evaluate("()=>JSON.parse(localStorage.getItem('blackboard-boards'))")
  def menu(pg,m): openFile(pg); pg.click(f'#menu [data-m="{m}"]'); pg.wait_for_timeout(200)
  def login(pg):
      pg.click('#ktBtn'); pg.wait_for_timeout(150); pg.fill('#ktMail','ich@test.de'); pg.fill('#ktPw','geheim123'); pg.click('#ktGo'); pg.wait_for_timeout(700)
  def sync(pg): pg.evaluate("()=>window.dispatchEvent(new Event('focus'))"); pg.wait_for_timeout(1000)
  def neuerOrdner(pg,name):
      openFile(pg); pg.click('#newFolder'); pg.wait_for_timeout(100); pg.keyboard.type(name); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
  def verschiebe(pg,namen,wert):
      openFile(pg); pg.click('#manageBtn'); pg.wait_for_timeout(200)
      for b in boards(pg):
          if b['name'] in namen: pg.check(f'#bmList input[data-id="{b["id"]}"]')
      pg.select_option('#bmMove',wert); pg.wait_for_timeout(200); msg=pg.inner_text('#bmMsg'); pg.click('#bmClose'); return msg

  A_ctx,A=geraet()
  menu(A,'new'); menu(A,'new'); pg=A
  check('Drei Boards, ohne Ordner flache Liste',len(boards(A))==3 and A.locator('#boardList .fh').count()==0 and A.locator('#boardList .fRest').count()==0)
  neuerOrdner(A,'Kurs Netzwerk')
  check('Ordner angelegt und gespeichert',idx(A).get('folders')==['Kurs Netzwerk'] and A.locator('#boardList .fh').count()==1)
  check('Leerer Ordner zeigt Hinweis',A.locator('#boardList .fEmpty').count()==1)
  check('Boards ohne Ordner unter „Ohne Ordner“',A.locator('#boardList .fRest').count()==1)
  msg=verschiebe(A,['Board 1','Board 2'],'f:Kurs Netzwerk')
  check('Zwei Boards in den Ordner verschoben','Kurs Netzwerk' in msg and sum(1 for b in boards(A) if b.get('f')=='Kurs Netzwerk')==2,msg)
  openFile(A)
  inner=A.evaluate("()=>[...document.querySelectorAll('#boardList .fIn [data-b]')].length")
  check('Ordner zeigt seine Boards',inner==2)
  check('Ordner zeigt Anzahl',A.inner_text('#boardList .fhT small')=='2')
  A.click('#boardList .fhT'); A.wait_for_timeout(150)
  check('Ordner zuklappbar',A.locator('#boardList .fIn').count()==0 and A.get_attribute('#boardList .fhT','aria-expanded')=='false')
  A.reload(); A.wait_for_timeout(700); openFile(A)
  check('Zugeklappt bleibt nach Neuladen',A.locator('#boardList .fIn').count()==0)
  A.click('#boardList .fhT'); A.wait_for_timeout(150)
  b1=[b for b in boards(A) if b['name']=='Board 1'][0]['id']
  A.click(f'#boardList [data-b="{b1}"]'); A.wait_for_timeout(300)
  check('Board aus dem Ordner öffnen',idx(A)['cur']==b1)
  # neuer Ordner über „Boards verwalten“, dann zurück nach „Ohne Ordner“
  A.on('dialog',lambda d: d.accept('Familie'))
  msg=verschiebe(A,['Board 3'],'new')
  check('Neuer Ordner direkt beim Verschieben','Familie' in msg and [b for b in boards(A) if b['name']=='Board 3'][0].get('f')=='Familie')
  check('Ordner-Reihenfolge',idx(A)['folders']==['Kurs Netzwerk','Familie'])
  msg=verschiebe(A,['Board 2'],'none')
  check('Zurück nach „Ohne Ordner“',[b for b in boards(A) if b['name']=='Board 2'][0].get('f')=='')
  # umbenennen
  openFile(A); A.click('#boardList .fhM >> nth=0'); A.wait_for_timeout(100); A.click('#boardList [data-fren]'); A.wait_for_timeout(100)
  A.fill('#boardList .fNew input','Netzwerk B'); A.keyboard.press('Enter'); A.wait_for_timeout(200)
  check('Ordner umbenannt, Boards gehen mit',idx(A)['folders'][0]=='Netzwerk B' and [b for b in boards(A) if b['name']=='Board 1'][0].get('f')=='Netzwerk B')
  # Escape bricht Neuanlage ab
  openFile(A); A.click('#newFolder'); A.keyboard.type('Weg'); A.keyboard.press('Escape'); A.wait_for_timeout(150)
  check('Escape bricht ab',idx(A)['folders']==['Netzwerk B','Familie'])

  # Konto: Ordner kommen auf Gerät B an
  login(A); warte(lambda: len(state()['konto'])==3)
  sync(A)
  st=state(); fo={r['name']:r.get('folder','') for r in st['konto']}
  check('Ordner im Konto gespeichert',fo.get('Board 1')=='Netzwerk B' and fo.get('Board 3')=='Familie' and fo.get('Board 2')=='',str(fo))
  B_ctx,B=geraet(); login(B); warte(lambda: len(boards(B))>=4); sync(B)
  bf={b['name']:b.get('f','') for b in boards(B)}
  check('Gerät B: Boards liegen im selben Ordner',bf.get('Board 1')=='Netzwerk B' and bf.get('Board 3')=='Familie',str(bf))
  # Änderung auf B kommt auf A an
  verschiebe(B,['Board 3'],'f:Netzwerk B'); sync(B); sync(A)
  check('Verschieben auf B kommt auf A an',warte(lambda:[b for b in boards(A) if b['name']=='Board 3'][0].get('f')=='Netzwerk B'),str(boards(A)))
  # auflösen
  openFile(A); A.click('#boardList .fhM >> nth=0'); A.wait_for_timeout(100); A.click('#boardList [data-fdel]'); A.click('#boardList [data-fdel]'); A.wait_for_timeout(200)
  check('Ordner aufgelöst, Boards bleiben',all(not b.get('f') for b in boards(A)) and len(boards(A))>=3)
  sync(A); sync(B)
  check('Auflösen kommt auf B an',warte(lambda: all(not b.get('f') for b in boards(B))),str(boards(B)))

  # Supabase ohne Ordner-Spalte: kein Fehler, Hinweis, Ordner bleiben lokal
  urllib.request.urlopen(SB+'/__nofolder')
  C_ctx,C=geraet(); neuerOrdner(C,'Lokal'); login(C); sync(C)
  check('Ohne Spalte: Anmeldung klappt trotzdem',warte(lambda:'ich@test.de' in C.evaluate("()=>document.getElementById('ktBtn').title")))
  check('Ohne Spalte: Ordner bleibt lokal',idx(C).get('folders')==['Lokal'])

  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally:
  srv.terminate(); mock.terminate()
