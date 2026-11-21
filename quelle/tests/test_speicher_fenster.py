import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
import subprocess,time,json,re
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','--directory',DIST],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(0.8)
S=lambda id,kind,x,y,w,h,text='',**o: dict(dict(id=id,type='shape',kind=kind,x=x,y=y,w=w,h=h,text=text,fill='#cfe8ff',stroke='#1c2a2e',sw=2),**o)
READ="async()=>{await new Promise(r=>setTimeout(r,400));const b=JSON.parse(localStorage.getItem('blackboard-boards'));const db=await new Promise(r=>{const q=indexedDB.open('blackboard',1);q.onsuccess=()=>r(q.result)});const v=await new Promise(r=>{const q=db.transaction('docs').objectStore('docs').get(b.cur);q.onsuccess=()=>r(q.result)});db.close();return JSON.parse(v)}"
res=[]
def ok(n,c,x=''): res.append(c); print(('PASS ' if c else 'FAIL ')+n,x)
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':1500,'height':900},accept_downloads=True); pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    # --- 3: Umzug aus localStorage
    pg.goto(URL); pg.wait_for_timeout(300)
    pg.evaluate("()=>{indexedDB.deleteDatabase('blackboard')}"); pg.wait_for_timeout(200)
    pg.evaluate("(d)=>{localStorage.setItem('blackboard-boards',JSON.stringify({cur:'b1',list:[{id:'b1',name:'Alt'},{id:'b2',name:'Zwei'}],del:[],v:2}));localStorage.setItem('blackboard-b-b1',JSON.stringify(d));localStorage.setItem('blackboard-b-b2',JSON.stringify({items:[],n:0}));}",{'items':[S('a','rect',0,0,140,80,'Alt-Daten')],'n':5})
    pg.reload(); pg.wait_for_timeout(700)
    d=pg.evaluate(READ); ls=pg.evaluate("()=>Object.keys(localStorage).filter(k=>k.startsWith('blackboard-b-'))")
    ok('Umzug: Board in IndexedDB',d['items'][0]['text']=='Alt-Daten'); ok('Umzug: localStorage geräumt',ls==[],str(ls))
    ok('Dauerhafter Speicher angefragt / IDB aktiv',pg.evaluate("async()=>!!(await navigator.storage.estimate()).quota"))
    # --- großes Board (über 5 MB) speichern
    big={'items':[S('s%d'%i,'rect',i%50*160,i//50*100,140,80,'Element %d '%i+'x'*200) for i in range(25000)],'n':30000}
    pg.evaluate("(d)=>{localStorage.removeItem('blackboard-b-b1');}",None)
    pg.evaluate("async(d)=>{const db=await new Promise(r=>{const q=indexedDB.open('blackboard',1);q.onsuccess=()=>r(q.result)});await new Promise(r=>{const t=db.transaction('docs','readwrite');t.objectStore('docs').put(JSON.stringify(d),'b2');t.oncomplete=r});db.close();}",big)
    pg.reload(); pg.wait_for_timeout(500)
    openFile(pg); pg.click('#boardList [data-b="b2"]'); pg.wait_for_timeout(2500)
    n=pg.evaluate("()=>document.querySelectorAll('#items > g').length"); size=len(json.dumps(big))//1024//1024
    ok(f'Board mit {size} MB geladen (über altem Limit)',n>=5000,f'{n} gezeichnet')
    openFile(pg); pg.click('#boardList [data-b="b1"]'); pg.wait_for_timeout(500)
    # --- 1: zwei Fenster
    pg2=ctx.new_page(); pg2.on('pageerror',lambda e: errs.append('W2:'+str(e))); pg2.goto(URL); pg2.wait_for_timeout(600)
    pg.focus('.pal[data-kind="ellipse"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(900)
    n2=pg2.evaluate("()=>document.querySelectorAll('#items > g').length"); ok('Fenster 2 sieht Änderung aus Fenster 1',n2==2,str(n2))
    pg2.evaluate("()=>{for(const h of document.querySelectorAll('.gh')) if(h.dataset.g==='Allgemein'&&h.getAttribute('aria-expanded')==='false') h.click();}")
    pg2.focus('.pal[data-kind="note"]'); pg2.keyboard.press('Enter'); pg2.wait_for_timeout(900)
    d=pg.evaluate(READ); kinds=sorted(i['kind'] for i in d['items'])
    ok('Beide Änderungen bleiben erhalten',kinds==['ellipse','note','rect'],str(kinds))
    ok('Fenster 1 zeigt Änderung aus Fenster 2',pg.evaluate("()=>document.querySelectorAll('#items > g').length")==3)
    pg2.close()
    # --- 2: Vorwärtskompatibilität
    fut={'items':[S('a','rect',0,0,140,80,'A',neuFeld={'x':1},farbe2='#123456'),S('z','hologramm',200,0,120,90,'Zukunft',tiefe=3),{'id':'k1','type':'kommentar','text':'Hallo'}],'n':5,'fmt':4}
    pg.evaluate("(d)=>{localStorage.setItem('blackboard-b-b1',JSON.stringify(d));}",fut); pg.reload(); pg.wait_for_timeout(700)
    ph=pg.evaluate("()=>document.querySelector('#items [data-id=\"z\"]').textContent"); ok('Unbekannte Form als Platzhalter',ph=='Neuere Version nötig',ph)
    t=pg.evaluate("()=>document.getElementById('toast').textContent"); ok('Warnung „neuere Version“',"neueren App-Version" in t,t[:60])
    # etwas ändern und prüfen, dass alles erhalten bleibt
    pg.focus('.pal[data-kind="rect"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    d=pg.evaluate(READ); a=[i for i in d['items'] if i['id']=='a'][0]; z=[i for i in d['items'] if i['id']=='z']
    ok('Unbekannte Felder erhalten',a.get('neuFeld')=={'x':1} and a.get('farbe2')=='#123456')
    ok('Unbekannte Form erhalten',len(z)==1 and z[0]['kind']=='hologramm' and z[0].get('tiefe')==3)
    ok('Unbekannter Elementtyp erhalten',d.get('extra')==[{'id':'k1','type':'kommentar','text':'Hallo'}])
    ok('Format-Version bleibt 4',d.get('fmt')==4)
    # --- 4: Folie duplizieren / kopieren
    pg.evaluate("(d)=>{localStorage.setItem('blackboard-b-b1',JSON.stringify(d));}",{'items':[S('f','frame',0,0,640,360,fill='none',ord=1),S('a','rect',100,100,140,80,'Inhalt'),S('t','text',100,40,300,40,'Titel',fill='none'),S('c','round',300,200,140,60,'Zwei'),{'id':'k','type':'conn','from':'a','to':'c','p1':{'x':0,'y':0},'p2':{'x':0,'y':0},'text':'','stroke':'#1c2a2e','sw':2,'style':'ortho','dash':False,'head':'arrow'},S('o','rect',800,100,100,60,'Außen')],'n':10})
    pg.reload(); pg.wait_for_timeout(500); einpassen(pg); pg.wait_for_timeout(150); pg.keyboard.press('Escape')
    def clickW(x,y):
        t=pg.evaluate("()=>document.getElementById('world').getAttribute('transform')"); m=re.match(r'translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)',t)
        rc=pg.evaluate("()=>{const r=document.getElementById('board').getBoundingClientRect();return [r.left,r.top]}")
        pg.mouse.click(rc[0]+float(m[1])+x*float(m[3]), rc[1]+float(m[2])+y*float(m[3])); pg.wait_for_timeout(450)
    clickW(320,0); pg.keyboard.press('Control+d'); pg.wait_for_timeout(200)
    d=pg.evaluate(READ); F=sorted([i for i in d['items'] if i.get('kind')=='frame'],key=lambda f:f['ord'])
    ok('Duplizieren: 2 Folien',len(F)==2); f2=F[1]
    inside=[i for i in d['items'] if i.get('fr')==f2['id']]
    ok('Duplizieren: Inhalt mitkopiert (3 Formen)',len(inside)==3,str([i['text'] for i in inside]))
    ok('Duplizieren: Pfeil mitkopiert',sum(1 for i in d['items'] if i['type']=='conn')==2)
    ok('Duplizieren: neben letzter Folie, keine Überlappung',f2['x']>=F[0]['x']+F[0]['w'],f"x={f2['x']}")
    ok('Außenform nicht mitkopiert',sum(1 for i in d['items'] if i.get('text')=='Außen')==1)
    pg.keyboard.press('Escape'); clickW(320,0); pg.keyboard.press('Control+c'); pg.keyboard.press('Control+v'); pg.wait_for_timeout(200)
    d=pg.evaluate(READ); F=[i for i in d['items'] if i.get('kind')=='frame']
    ov=any(a['x']<c['x']+c['w'] and a['x']+a['w']>c['x'] and a['y']<c['y']+c['h'] and a['y']+a['h']>c['y'] for i,a in enumerate(F) for c in F[i+1:])
    ok('Kopieren+Einfügen: 3 Folien ohne Überlappung',len(F)==3 and not ov, str(sorted(f['ord'] for f in F)))
    # --- 5: Text einpassen nach Laden
    pg.evaluate("(d)=>{localStorage.setItem('blackboard-b-b1',JSON.stringify(d));}",{'items':[S('n','round',0,0,130,50,'Donaudampfschifffahrtsgesellschaftskapitän'),S('q','text',200,0,300,90,'Kurz',fill='none'),dict(S('t','table',300,200,240,72),colW=[120,120],rowH=[36,36],cells=[['K','K'],['Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz','x']])],'n':5})
    pg.reload(); pg.wait_for_timeout(900); d={i['id']:i for i in pg.evaluate(READ)['items']}
    ok('Form wächst, bis der Text passt',d['n']['h']>50,str(d['n']['h'])); ok('Tabellenzeile wächst',d['t']['rowH'][1]>36,str(d['t']['rowH'])); ok('Textfeld schrumpft nicht',d['q']['h']==90)
    # --- 6: Tastenkürzel
    pg.keyboard.press('Escape'); pg.keyboard.press('?'); pg.wait_for_timeout(150)
    ok('Tastenkürzel mit ?',pg.evaluate("()=>!document.getElementById('keysDlg').hidden")); pg.screenshot(path='/tmp/bb-tests/keys.png')
    pg.keyboard.press('Escape'); ok('Schließen mit Esc',pg.evaluate("()=>document.getElementById('keysDlg').hidden"))
    # --- 9: Beispiel
    openFile(pg); pg.click('#menu [data-m="example"]'); pg.wait_for_timeout(300); pg.screenshot(path='/tmp/bb-tests/example.png')
    ok('ERR leer',not errs,str(errs))
    ctx.close()
    # --- 7: Touch-Griffe
    c2=b.new_context(viewport={'width':820,'height':1180},has_touch=True,is_mobile=True); p2=c2.new_page(); p2.goto(URL); p2.wait_for_timeout(400)
    w=p2.evaluate("()=>[document.getElementById('palHandle').getBoundingClientRect().width,document.getElementById('propsToggle').getBoundingClientRect().width]")
    hit=p2.evaluate("()=>{const h=document.getElementById('palHandle').getBoundingClientRect(), t=document.getElementById('propsToggle').getBoundingClientRect(); return [document.elementFromPoint(h.left+43,h.top+h.height/2)===document.getElementById('palHandle'), document.elementFromPoint(t.right-43,t.top+t.height/2)===document.getElementById('propsToggle')]}")
    ok('Touch-Griffe: Tippfläche ≥ 44 px',all(hit),str(w)+' '+str(hit)); p2.screenshot(path='/tmp/bb-tests/tablet_new.png'); c2.close()
    b.close()
finally: srv.terminate()
print('RESULT',sum(res),'/',len(res))
