import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
import json,subprocess,time,base64,struct,zlib
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','--directory',DIST],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(0.8)
errs=[]; R=[]
def ok(n,c,x=''): R.append(bool(c)); print(('PASS ' if c else 'FAIL ')+n,x)
# PNG 40x20 rot
def png(w,h,a=255):
    raw=b''.join(b'\x00'+bytes([220,40,40,a])*w for _ in range(h))
    ch=lambda t,d: struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d))
    return b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+ch(b'IDAT',zlib.compress(raw))+ch(b'IEND',b'')
open('/tmp/bb-tests/a.png','wb').write(png(2400,1200))
open('/tmp/bb-tests/b.png','wb').write(png(100,100,120))
READ="async()=>{await new Promise(r=>setTimeout(r,400));const b=JSON.parse(localStorage.getItem('blackboard-boards'));const db=await new Promise(r=>{const q=indexedDB.open('blackboard',1);q.onsuccess=()=>r(q.result)});const v=await new Promise(r=>{const q=db.transaction('docs').objectStore('docs').get(b.cur);q.onsuccess=()=>r(q.result)});db.close();return JSON.parse(v)}"
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
  pg=b.new_page(viewport={'width':1400,'height':900})
  pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None); pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(700)
  def menu(m): openFile(pg); pg.click(f'#menu [data-m="{m}"]'); pg.wait_for_timeout(200)
  menu('clear')
  # Bild über Menü
  with pg.expect_file_chooser() as fc: menu('img')
  fc.value.set_files('/tmp/bb-tests/a.png'); pg.wait_for_timeout(800)
  d=pg.evaluate(READ); im=[i for i in d['items'] if i.get('kind')=='image']
  ok('Bild eingefügt',len(im)==1)
  if im:
    i=im[0]; ok('JPEG, verkleinert',i['src'].startswith('data:image/jpeg'),f"{i['w']}x{i['h']} len={len(i['src'])}")
    ok('Seitenverhältnis 2:1',abs(i['w']/i['h']-2)<0.02)
    ok('im DOM',pg.locator('#items image').count()==1)
  # transparentes Bild per Drop
  data=base64.b64encode(open('/tmp/bb-tests/b.png','rb').read()).decode()
  pg.evaluate("""(d)=>{const bin=atob(d),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
    const f=new File([u],'b.png',{type:'image/png'}),dt=new DataTransfer();dt.items.add(f);
    const s=document.getElementById('board');s.dispatchEvent(new DragEvent('dragover',{dataTransfer:dt,bubbles:true,cancelable:true,clientX:400,clientY:300}));
    s.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true,clientX:400,clientY:300}));}""",data)
  pg.wait_for_timeout(800); d=pg.evaluate(READ); im=[i for i in d['items'] if i.get('kind')=='image']
  ok('Drop: 2 Bilder, PNG mit Transparenz',len(im)==2 and im[1]['src'].startswith('data:image/png'))
  # Paste-Ereignis
  pg.evaluate("""(d)=>{const bin=atob(d),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
    const f=new File([u],'c.png',{type:'image/png'}),dt=new DataTransfer();dt.items.add(f);
    document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}));}""",data)
  pg.wait_for_timeout(800); d=pg.evaluate(READ)
  ok('Einfügen aus Zwischenablage',len([i for i in d['items'] if i.get('kind')=='image'])==3)
  # Undo
  pg.keyboard.press('Control+z'); pg.wait_for_timeout(300); d=pg.evaluate(READ)
  ok('Rückgängig entfernt Bild',len([i for i in d['items'] if i.get('kind')=='image'])==2)
  # Reload: Bild bleibt
  pg.reload(); pg.wait_for_timeout(800); ok('Bild nach Neuladen da',pg.locator('#items image').count()==2)
  # Ungültige src wird verworfen
  bad={'items':[{'id':'i1','type':'shape','kind':'image','x':0,'y':0,'w':100,'h':80,'text':'','fill':'none','stroke':'#000','sw':0,'src':'javascript:alert(1)'}],'n':1}
  pg.evaluate("(d)=>{const b=JSON.parse(localStorage.getItem('blackboard-boards'));localStorage.setItem('blackboard-b-'+b.cur,JSON.stringify(d))}",bad)
  pg.reload(); pg.wait_for_timeout(900); d=pg.evaluate(READ)
  ok('böse src wird entfernt',d['items'] and 'src' not in d['items'][0] and pg.locator('#items image').count()==0,str(d['items'])[:120])
  # ---------- Vorlagen
  menu('clear'); menu('tpl'); pg.wait_for_timeout(300)
  n=pg.locator('#tplGrid .tc').count(); ok('Vorlagen-Galerie',n>=17,str(n))
  pg.screenshot(path='/tmp/bb-tests/tpl.png')
  names=pg.evaluate("()=>[...document.querySelectorAll('#tplGrid .tc b')].map(b=>b.textContent)")
  for k,nm in enumerate(names):
    if k: menu('clear'); menu('tpl')
    pg.click(f'#tplGrid [data-t="{k}"]'); pg.wait_for_timeout(250)
    d=pg.evaluate(READ); its=d['items']
    sel=pg.locator('#overlay *').count()
    ok('Vorlage '+nm,len(its)>0 and pg.evaluate("()=>document.getElementById('tplDlg').hidden"),f"{len(its)} Elemente, sel={sel}")
    if nm in ('Eisenhower-Matrix','RACI-Matrix','Ishikawa-Diagramm','Business Model Canvas'): pg.screenshot(path=f'/tmp/bb-tests/tpl_{k}.png')
  # ---------- Folienübersicht
  menu('clear')
  menu('slides'); ok('Übersicht offen',pg.evaluate("()=>!document.getElementById('slides').hidden"))
  for i in range(3): pg.click('#slAdd'); pg.wait_for_timeout(300)
  d=pg.evaluate(READ); fr=sorted([i for i in d['items'] if i.get('kind')=='frame'],key=lambda f:f.get('ord',0))
  for i,f in enumerate(fr): d['items'].append({'id':'z%d'%i,'type':'shape','kind':'rect','x':f['x']+40,'y':f['y']+60,'w':200,'h':80,'text':'Folie %d'%(i+1),'fill':'#cfe8ff','stroke':'#000','sw':2})
  d['n']=d.get('n',0)+10
  pg.evaluate("(d)=>{const b=JSON.parse(localStorage.getItem('blackboard-boards'));localStorage.setItem('blackboard-b-'+b.cur,JSON.stringify(d))}",d)
  pg.reload(); pg.wait_for_timeout(900); menu('slides'); pg.wait_for_timeout(300)
  ok('3 Vorschaubilder',pg.locator('#slList .st').count()==3)
  ok('Inhalt in Vorschau',pg.locator('#slList .st').nth(1).locator('rect').count()>=2)
  pg.screenshot(path='/tmp/bb-tests/slides.png')
  ids=[x.get_attribute('data-f') for x in pg.locator('#slList .st').all()]
  a=pg.locator('#slList .st').nth(0).bounding_box(); c=pg.locator('#slList .st').nth(2).bounding_box()
  pg.mouse.move(a['x']+40,a['y']+40); pg.mouse.down()
  for st in range(1,15): pg.mouse.move(a['x']+40+(c['x']+c['width']-10-a['x']-40)*st/14,a['y']+40)
  pg.mouse.up(); pg.wait_for_timeout(700)
  ids2=[x.get_attribute('data-f') for x in pg.locator('#slList .st').all()]
  ok('Umsortieren per Ziehen',ids2==[ids[1],ids[2],ids[0]],f"{ids}->{ids2}")
  d=pg.evaluate(READ); o={i['id']:i.get('ord') for i in d['items'] if i.get('kind')=='frame'}
  ok('ord gespeichert',o[ids[0]]==3 and o[ids[1]]==1,str(o))
  pg.keyboard.press('Control+z'); pg.wait_for_timeout(700)
  ok('Umsortieren rückgängig',[x.get_attribute('data-f') for x in pg.locator('#slList .st').all()]==ids)
  pg.locator('#slList .st').nth(2).click(); pg.wait_for_timeout(300)
  ok('Klick markiert Folie',pg.locator('#slList .st').nth(2).get_attribute('aria-selected')=='true')
  pg.click('#slPlay'); pg.wait_for_timeout(600)
  pg.screenshot(path='/tmp/bb-tests/play.png')
  txt=pg.evaluate("()=>document.body.innerText")
  ok('Zeigen startet bei Folie 3','3 / 3' in txt or '3/3' in txt, [l for l in txt.split('\n') if '/' in l][:3])
  pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
  pg.click('#slClose'); ok('Übersicht schließt',pg.evaluate("()=>document.getElementById('slides').hidden"))
  # Palette-Knöpfe vorhanden
  ok('Palette: Übersicht + Vorlagen',pg.locator('[data-slides]').count()==1 and pg.locator('[data-tpl]').count()==1)
  ok('Palette: Bild',pg.locator('.pal[data-kind="image"]').count()==1)
  g=pg.evaluate("()=>[...document.querySelectorAll('#palette .gh')].map(h=>h.dataset.g)")
  ok('Gruppen: Allgemein, Vorlagen, …',g[:3]==['Allgemein','Vorlagen','Präsentation'] and 'Tabellen & Boards' not in g,str(g))
  allg=pg.evaluate("()=>[...document.querySelectorAll('#palette .gh[data-g=\"Allgemein\"] + .palgrid [data-kind]')].map(b=>b.dataset.kind)")
  ok('Tabelle und Aufgabenkarte unter Allgemein','table' in allg and 'card' in allg)
  vl=pg.evaluate("()=>[...document.querySelectorAll('#palette .gh[data-g=\"Vorlagen\"] + .palgrid > button')].map(b=>b.dataset.kind||(b.dataset.tpl?'galerie':''))")
  ok('Vorlagen: Galerie zuerst, dann Kanban, Scrum, Mindmap',vl==['galerie','kanban','scrum','mindmap'],str(vl))
  pg.evaluate("()=>{for(const h of document.querySelectorAll('#palette .gh')) if(h.dataset.g==='Vorlagen'&&h.getAttribute('aria-expanded')==='false') h.click()}")
  pg.screenshot(path='/tmp/bb-tests/palette.png',clip={'x':0,'y':60,'width':140,'height':840})
finally: srv.kill()
print('ERRS',errs[:5]); print(sum(R),'/',len(R))
