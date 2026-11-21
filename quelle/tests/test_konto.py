import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Konto: Anmelden mit E-Mail und Passwort, alle eigenen Boards auf zwei Geräten, Umbenennen, Löschen, Abmelden.
Supabase wird durch tests/supabase_attrappe.py ersetzt; es geht nichts ins Internet."""
import json,urllib.request
from playwright.sync_api import sync_playwright
SB='http://127.0.0.1:8767'
def state(): return json.load(urllib.request.urlopen(SB+'/__state'))
S=lambda id,kind,x,y,w,h,text='': dict(id=id,type='shape',kind=kind,x=x,y=y,w=w,h=h,text=text,fill='#cfe8ff',stroke='#1c2a2e',sw=2)
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
      pg.goto(URL); pg.wait_for_timeout(500); pg.evaluate("u=>localStorage.setItem('skizix-test-sb',u)",SB); return ctx,pg
  def boards(pg): return pg.evaluate("()=>JSON.parse(localStorage.getItem('blackboard-boards')).list")
  def menu(pg,m): openFile(pg); pg.click(f'#menu [data-m="{m}"]'); pg.wait_for_timeout(200)
  def login(pg,pw='geheim123',keep=True):
      pg.click('#ktBtn'); pg.wait_for_timeout(150); pg.fill('#ktMail','ich@test.de'); pg.fill('#ktPw',pw)
      if not keep: pg.uncheck('#ktKeep')
      pg.click('#ktGo'); pg.wait_for_timeout(600)
  def sync(pg): pg.evaluate("()=>window.dispatchEvent(new Event('focus'))"); pg.wait_for_timeout(900)
  def info(pg): return pg.evaluate("()=>document.getElementById('ktBtn').title")

  # Gerät A mit einem Board voller Inhalt
  A_ctx,A=geraet()
  A.evaluate(LOAD,{'items':[S('a','rect',0,0,160,80,'Vom PC')],'n':5}); A.reload(); A.wait_for_timeout(800)
  check('Abgemeldet: Konto-Knopf bietet Anmelden an',info(A).startswith('Anmelden') and A.is_visible('#ktBtn'))
  check('Kein Konto-Abschnitt mehr im Menü Datei',A.locator('#menu #ktSec').count()==0)
  login(A,'falsch')
  check('Falsches Passwort wird gemeldet','stimmt nicht' in A.inner_text('#ktMsg'),A.inner_text('#ktMsg'))
  A.click('#ktClose')
  login(A)
  check('Angemeldet',warte(lambda:'ich@test.de' in info(A)),info(A))
  st=warte(lambda: state() if state()['konto'] else None)
  check('Board im Konto eingetragen',len(st['konto'])==1,str(st['konto']))
  k=st['konto'][0]['key']
  check('Inhalt hochgeladen',st['boards'].get(k,{}).get('doc',{}).get('items',[{}])[0].get('text')=='Vom PC')
  check('Angemeldet bleiben: in localStorage',A.evaluate("()=>!!localStorage.getItem('skizix-konto')"))

  # Doppelter Schlüssel auf einem Gerät (z. B. durch den alten GitHub-Abgleich) wird zusammengeführt
  A.evaluate("k=>{const x=JSON.parse(localStorage.getItem('blackboard-boards')); x.list.push({id:'dupl1',name:'Kopie',live:k}); localStorage.setItem('blackboard-boards',JSON.stringify(x))}",k)
  A.evaluate("()=>localStorage.setItem('blackboard-sync',JSON.stringify({owner:'IE',repo:'Boards',token:'x'}))")
  A.reload(); A.wait_for_timeout(1800)
  check('Alte GitHub-Zugangsdaten werden gelöscht',A.evaluate("()=>localStorage.getItem('blackboard-sync')")is None)
  check('Kein GitHub-Abgleich mehr im Menü',A.locator('#syncSec').count()==0)
  check('Doppelter Schlüssel zusammengeführt',sum(1 for b in boards(A) if b.get('live')==k)==1,str(boards(A)))
  # Gerät B: anmelden, Board kommt von selbst
  B_ctx,B=geraet(); B.reload(); B.wait_for_timeout(700)
  login(B)
  ok_b=warte(lambda: any(b.get('live')==k for b in boards(B)))
  check('Gerät B bekommt das Board ohne Link',bool(ok_b),str(boards(B)))
  bid=next((b['id'] for b in boards(B) if b.get('live')==k),None)
  if bid:
      openFile(B); B.click(f'#boardList [data-b="{bid}"]'); B.wait_for_timeout(500)
      check('Inhalt auf Gerät B',B.evaluate("()=>[...document.querySelectorAll('#items text')].some(t=>t.textContent.includes('Vom PC'))"))
  # Das eigene Board von B landet auch bei A
  nB=len(boards(B)); sync(A)
  check('Boards von Gerät B kommen zu Gerät A',warte(lambda: len(boards(A))==nB),f'{len(boards(A))} / {nB}')

  # Umbenennen auf A erscheint auf B
  aid=next(b['id'] for b in boards(A) if b.get('live')==k)
  if A.evaluate("()=>JSON.parse(localStorage.getItem('blackboard-boards')).cur")!=aid:
      openFile(A); A.click(f'#boardList [data-b="{aid}"]'); A.wait_for_timeout(400)
  A.fill('#boardName','Projekt X'); A.wait_for_timeout(3500)
  sync(B); check('Neuer Name erscheint auf Gerät B',warte(lambda: any(b.get('live')==k and b['name']=='Projekt X' for b in boards(B))),str([b['name'] for b in boards(B)]))

  # Neues Board auf B erscheint auf A
  menu(B,'new'); B.wait_for_timeout(1500); n=len(boards(B)); sync(A)
  check('Neues Board erscheint auf Gerät A',warte(lambda: len(boards(A))==n),f'{len(boards(A))} / {n}')

  # Löschen auf B entfernt es auf A
  openFile(B); B.click('#delBoard'); B.click('#delBoard'); B.wait_for_timeout(1200)
  n=len(boards(B)); sync(A)
  check('Gelöschtes Board verschwindet auch auf Gerät A',warte(lambda: len(boards(A))==n),f'{len(boards(A))} / {n}')

  # Mehrere auf einmal löschen (Dialog „Boards verwalten“) wird auf Gerät A übernommen
  menu(B,'new'); menu(B,'new'); B.wait_for_timeout(1500); sync(A); warte(lambda: len(boards(A))==len(boards(B)))
  menu(B,'manage'); r=B.locator('#bmList .bmRow input'); r.nth(0).check(); r.nth(1).check(); B.click('#bmDel'); B.click('#bmDel'); B.wait_for_timeout(1200); B.click('#bmClose')
  n=len(boards(B)); sync(A)
  check('Mehrfach-Löschen verschwindet auch auf Gerät A',warte(lambda: len(boards(A))==n),f'{len(boards(A))} / {n}')

  # Neu laden: bleibt angemeldet; abgelaufenes Token wird still erneuert
  A.evaluate("()=>{const s=JSON.parse(localStorage.getItem('skizix-konto')); s.expires_at=0; localStorage.setItem('skizix-konto',JSON.stringify(s))}")
  A.reload(); A.wait_for_timeout(1500)
  check('Nach Neuladen weiter angemeldet','ich@test.de' in info(A))
  check('Abgelaufene Anmeldung still erneuert',any(l[0]=='refresh' for l in state()['log']))

  # Live beenden gibt es für eigene Boards nicht, Besitzer-Link auch nicht
  openFile(A); check('Kein „Live beenden“ bei eigenen Boards',not A.is_visible('#liveStopBtn')); A.keyboard.press('Escape')
  check('Kein Link für eigene Geräte mehr',A.locator('#lvOwn').count()==0)

  # Abmelden
  A.click('#ktBtn'); A.click('#ktPopOut'); A.wait_for_timeout(500)
  check('Abgemeldet',info(A).startswith('Anmelden') and not A.evaluate("()=>!!localStorage.getItem('skizix-konto')"))
  check('Boards bleiben nach Abmelden auf dem Gerät',len(boards(A))>=1)

  # Ohne „Angemeldet bleiben“: nur für diese Sitzung
  login(A,keep=False)
  check('Ohne „Angemeldet bleiben“ nur sessionStorage',A.evaluate("()=>!localStorage.getItem('skizix-konto')&&!!sessionStorage.getItem('skizix-konto')"))
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally:
  srv.terminate(); mock.terminate()
