"""Drehbücher der Anleitungs-Videos. Aufruf: python3 drehbuch.py [name ...]"""
import sys
from film import Film, leeren_board, lade, leer, zoom
F={}
def film(f): F[f.__name__]=f; return f
def mitte(pg,sel,n=0):
    b=pg.locator(sel).nth(n).bounding_box(); return b['x']+b['width']/2,b['y']+b['height']/2
def item(f,n): return mitte(f.pg,'#items > [data-id]',n)
def S(id,kind,x,y,w,h,text='',fill='#cfe8ff',**k):
    d=dict(id=id,type='shape',kind=kind,x=x,y=y,w=w,h=h,text=text,fill=fill,stroke='#1c2a2e',sw=2); d.update(k); return d
def pal(f,kind):
    """Form in der Formenleiste sichtbar machen (Gruppe aufklappen, hinscrollen)."""
    f.pg.evaluate("k=>{const p=document.querySelector('.pal[data-kind=\"'+k+'\"]'); if(p.offsetParent) return; for(const h of document.querySelectorAll('.gh')){ if(h.getAttribute('aria-expanded')==='false'){ h.click(); if(document.querySelector('.pal[data-kind=\"'+k+'\"]').offsetParent) return; h.click(); } } }",kind)
    f.pg.locator(f'.pal[data-kind="{kind}"]').scroll_into_view_if_needed(); f.pause(200)
    return f'.pal[data-kind="{kind}"]'

@film
def ueberblick():
    def s(pg):
        pg.evaluate("()=>{ if(!document.querySelector('main').classList.contains('props-closed')) document.getElementById('propsToggle').click() }")
        pg.mouse.click(1400,880); pg.keyboard.press('Shift+Digit1'); pg.wait_for_timeout(300)
    with Film('ueberblick',s) as f:
        f.bild()
        f.cap('<b>Oben:</b> die Werkzeuge – Auswahl, Form, Stift, Pinsel, Marker, Text, Radierer, Bewegen')
        for t in ('select','shape','pen','brush','marker','text','erase','pan'): f.gehe(f'#tools [data-tool="{t}"]',260); f.pause(120)
        f.cap('Rechts daneben: <b>Hilfe, Export, Präsentieren, Ansicht, Zoom, Teilen</b> und <b>Konto</b>')
        for s in ('#keysBtn','#expBtn','#playBtn','#viewBtn','#zoomLabel','#liveBtn','#ktBtn'): f.gehe(s,260); f.pause(150)
        f.pause(300)
        f.cap('<b>Links:</b> die Formenleiste mit Suche und Gruppen'); f.gehe('#palQ',600); f.pause(600); f.gehe('.pal[data-kind="ellipse"]',500); f.pause(700)
        f.cap('Element anklicken – darüber erscheint die <b>Optionsleiste</b>'); f.klick(item(f,2),danach=1600)
        f.cap('<b>Rechts:</b> deine Boards und Ordner – mit dem Griff aus- und einklappen'); f.klick('#propsToggle',danach=1700); f.klick('#propsToggle',danach=600)
        f.cap('Die Formenleiste klappt genauso ein und aus'); f.klick('#palHandle',danach=900); f.klick('#palHandle',danach=600)
        f.cap('<b>Ansicht → Einstellungen:</b> hell, dunkel oder automatisch'); f.klick('#viewBtn',danach=500); f.klick('#viewPop [data-vt="geraet"]',danach=600)
        f.klick('#appRow [data-app="light"]',danach=1400); f.klick('#appRow [data-app="dark"]',danach=900)
        f.pg.keyboard.press('Escape'); f.pause(500)

@film
def formen():
    with Film('formen',leer(4)) as f:
        f.cap('Form aus der linken Leiste <b>auf das Board ziehen</b>'); f.ziehe('.pal[data-kind="rect"]',(600,360),1100,300); f.pg.keyboard.press('Escape'); f.pause(400)
        f.cap('Oder <b>antippen</b> – dann erscheint sie in der Mitte'); f.klick('.pal[data-kind="ellipse"]',danach=300); f.pg.keyboard.press('Escape'); f.pause(700)
        f.cap('<b>Verschieben:</b> anfassen und ziehen'); f.ziehe(item(f,1),(1080,360),1000,600)
        f.cap('<b>Größe ändern:</b> an den kleinen Quadraten ziehen'); f.ziehe('#overlay [data-h="rs:se"] >> nth=1',(1190,450),900,700)
        f.cap('<b>Pfeil ziehen:</b> am blauen Punkt ziehen und über der Zielform loslassen')
        f.klick(item(f,0),danach=500); f.bild(); f.ziehe('#overlay [data-h="cn:0"] >> nth=3',item(f,1),1300,900)
        f.cap('Der Pfeil dockt an – und läuft beim Verschieben mit'); f.ziehe(item(f,1),(1080,640),1200,900)
        f.cap('<b>Mehrere auswählen:</b> einen Rahmen aufziehen'); f.klick((800,820),danach=300); f.ziehe((420,230),(1300,800),1100,1200)

@film
def text():
    with Film('text',leer(7)) as f:
        f.ziehe('.pal[data-kind="rect"]',(640,330),900,200); f.pg.keyboard.press('Escape'); f.pg.mouse.click(1300,820); f.pause(300)
        f.cap('<b>Text in Formen:</b> doppelt antippen und losschreiben'); f.klick(item(f,0),doppelt=True,danach=300); f.tippe('Idee sammeln'); f.pause(500)
        f.cap('<b>Fertig:</b> daneben tippen oder Esc'); f.taste('Escape','Esc'); f.pause(300)
        f.cap('<b>Freier Text:</b> Text-Werkzeug wählen und aufs Board tippen'); f.klick('#tools [data-tool="text"]',danach=300); f.klick((560,520),danach=300)
        f.tippe('Einkauf'); f.taste('Enter','Enter',400); f.tippe('Milch'); f.taste('Enter','Enter',400); f.tippe('Brot'); f.pause(400); f.bild()
        f.cap('Absätze markieren, dann oben <b>„Aa“</b>: Fett, Aufzählung, Checkliste …')
        f.pg.keyboard.press('Shift+ArrowUp'); f.pause(150); f.pg.keyboard.press('Shift+Home'); f.pause(400)
        f.klick('#props [data-drop="text"]',danach=700); f.klick('#colorPop [data-act="list"]',danach=900)
        f.cap('<b>Enter</b> am Ende eines Listenpunkts – der neue Absatz ist auch ein Listenpunkt')
        f.pg.keyboard.press('Control+End'); f.pause(200); f.taste('Enter','Enter',300); f.tippe('Äpfel'); f.pause(600)
        f.taste('Escape','Esc',500)
        f.cap('Ganze Texte formatieren: Text anklicken, oben <b>„Aa“</b>'); f.klick(item(f,1),danach=400); f.klick('#props [data-drop="text"]',danach=700)
        f.klick('#colorPop [data-act="fsup"]',danach=400); f.klick('#colorPop [data-act="fsup"]',danach=400); f.klick('#colorPop [data-act="bold"]',danach=900)
        f.pg.keyboard.press('Escape'); f.pause(400)

@film
def checkliste():
    with Film('checkliste',leer(8)) as f:
        f.cap('<b>Neue Checkliste:</b> links unter Allgemein „Checkliste“ aufs Board ziehen')
        f.ziehe(pal(f,'checklist'),(760,380),1100,300); f.pg.keyboard.press('Escape'); f.pg.mouse.click(1300,820); f.pause(500)
        f.cap('<b>Abhaken:</b> das Kästchen antippen – Erledigtes wird grün und durchgestrichen')
        f.klick('#items .ckBox >> nth=0',danach=800); f.klick('#items .ckBox >> nth=1',danach=900); f.bild()
        f.cap('Noch einmal antippen macht es wieder offen'); f.klick('#items .ckBox >> nth=1',danach=1000)
        f.cap('<b>Neue Zeile:</b> beim Schreiben Enter – sie bekommt automatisch ein Kästchen')
        f.klick(item(f,0),doppelt=True,danach=300); f.pg.keyboard.press('Control+End'); f.pause(200); f.taste('Enter','Enter',300)
        f.cap('<b>Wer besorgt was?</b> Einfach mit Strich dahinter schreiben'); f.tippe('Kuchen – Sam'); f.pause(700)
        f.taste('Escape','Esc',600)
        f.cap('<b>Vorhandenen Text umwandeln:</b> antippen, „Aa“ → Checkliste')
        f.klick('#tools [data-tool="text"]',danach=200); f.klick((560,640),danach=200); f.tippe('Müll rausbringen'); f.pg.keyboard.press('Enter'); f.tippe('Blumen gießen'); f.pause(300); f.pg.keyboard.press('Escape'); f.pause(300)
        f.klick(item(f,1),danach=400); f.klick('#props [data-drop="text"]',danach=600); f.klick('#colorPop [data-act="chk"]',danach=1300)
        f.pg.keyboard.press('Escape'); f.pause(300)

@film
def zeichnen():
    with Film('zeichnen',leer(0)) as f:
        f.cap('<b>Stift</b> für feine Linien'); f.klick('#tools [data-tool="pen"]',danach=400)
        f.pfad([(450,300),(500,250),(560,320),(620,250),(680,320),(740,260)],1300,500)
        f.cap('Farbe und Stärke oben in der <b>Optionsleiste</b>'); f.klick('#props [data-drop="stroke"]',danach=600); f.klick('#colorPop [data-act="stroke"] >> nth=6',danach=500)
        f.pfad([(450,400),(540,360),(640,420),(740,380)],1100,500)
        f.cap('<b>Pinsel</b> für kräftige Striche'); f.klick('#tools [data-tool="brush"]',danach=400)
        f.pfad([(860,280),(930,350),(1000,300),(1080,380),(1150,320)],1300,600)
        f.cap('<b>Marker</b> zum Hervorheben'); f.klick('#tools [data-tool="marker"]',danach=400)
        f.pfad([(440,520),(760,520)],1000,600); f.bild()
        f.cap('Der <b>Radierer</b> löscht alles, worüber du wischst'); f.klick('#tools [data-tool="erase"]',danach=400)
        f.pfad([(500,420),(540,380),(600,430),(660,380)],1200,800)
        f.cap('Druck und Zeichnen mit dem Finger: <b>Ansicht → Einstellungen → Stift</b>')
        f.klick('#viewBtn',danach=400); f.klick('#viewPop [data-vt="geraet"]',danach=400); f.gehe('#pressRow',500); f.pause(1600)
        f.pg.keyboard.press('Escape'); f.klick('#tools [data-tool="select"]',danach=300)

@film
def bearbeiten():
    its=[S('a','rect',0,0,180,90,'Planen'),S('b','rect',260,60,180,90,'Umsetzen',fill='#d6f5e3'),S('c','ellipse',520,-20,180,90,'Prüfen',fill='#fde2d6')]
    with Film('bearbeiten',lade(its,zoomstufen=4)) as f:
        f.cap('<b>Farben:</b> Füllung, Linie und Schrift öffnen ein Farbfeld'); f.klick(item(f,0),danach=500)
        f.klick('#props [data-drop="fill"]',danach=600); f.klick('#colorPop [data-act="fill"] >> nth=10',danach=900)
        f.cap('<b>Drehen:</b> am runden Griff ziehen – rastet in 15°-Schritten ein'); f.klick(item(f,2),danach=400)
        b=f.pg.locator('#overlay circle[data-h="rot:0"]').last.bounding_box(); cx,cy=item(f,2)
        f.ziehe((b['x']+b['width']/2,b['y']+b['height']/2),(cx+90,cy+40),1200,900)
        f.cap('<b>Mehrere wählen</b>, dann ausrichten'); f.klick((800,860),danach=200); f.ziehe((330,180),(1350,760),1000,500)
        f.klick('#props [data-drop="al"]',danach=600); f.klick('#colorPop [data-act="al"] >> nth=4',danach=1000); f.bild()
        f.cap('<b>Gruppieren:</b> die Gruppe bewegt sich gemeinsam'); f.klick('#props [data-act="group"]',danach=500); f.ziehe(item(f,1),(800,560),1000,700)
        f.cap('<b>Duplizieren</b> und <b>Löschen</b> direkt in der Leiste'); f.klick('#props .pgQuick [data-act="dup"]',danach=900); f.klick('#props .pgQuick [data-act="del"]',danach=700)
        f.cap('Unter <b>„Mehr“</b>: nach vorn, nach hinten, kopieren, sperren …'); f.klick(item(f,0),danach=300); f.klick('#props [data-drop="elem"]',danach=1500); f.pg.keyboard.press('Escape'); f.pause(200)
        f.cap('<b>Rückgängig:</b> oben „Zurück“ oder Strg + Z'); f.klick('#undo',danach=700); f.klick('#undo',danach=700); f.taste('Control+z','Strg + Z',800)

@film
def tafel():
    its=[S('a','note',0,0,200,140,'Ideen',fill='#fff3a8'),S('b','rect',280,20,180,90,'Plan'),S('c','ellipse',140,200,180,90,'Ziel',fill='#d6f5e3')]
    with Film('tafel',lade(its)) as f:
        f.cap('<b>Ansicht</b>, Reiter „Tafel“: Fläche wählen'); f.klick('#viewBtn',danach=500)
        for n in ('Tafelgrün','Blaupause','Schulheft','Leinen','Schiefer'): f.klick(f'#vpSurf button[title="{n}"]',350,700)
        f.cap('… und das Muster: Punkte, Karos, Linien, Millimeter'); 
        for n in ('Kariert','Liniert','Millimeter','Punkte'): f.klick(f'#vpPat button[title="{n}"]',350,650)
        f.klick('#vpSurf button[title="Nacht"]',350,500); f.bild()
        f.cap('Reiter <b>„Einstellungen“</b>: Größe, hell/dunkel, Kontrast, Hilfslinien'); f.klick('#viewPop [data-vt="geraet"]',danach=1800); f.pg.keyboard.press('Escape'); f.pause(300)
        f.cap('<b>Zoom:</b> mit − und + – ein Klick auf die Zahl springt auf 100 %'); f.klick('#zoomIn',danach=350); f.klick('#zoomIn',danach=350); f.klick('#zoomIn',danach=600); f.klick('#zoomLabel',danach=900)
        f.cap('Strg + Mausrad zoomt um den Mauszeiger'); f.gehe(item(f,1)); f.pg.keyboard.down('Control'); f.pg.evaluate("()=>window.__key('Strg + Mausrad')")
        for _ in range(3): f.pg.mouse.wheel(0,-25); f.pause(300)
        f.pg.keyboard.up('Control'); f.pg.evaluate("()=>window.__key(null)"); f.pause(600)
        f.cap('<b>Verschieben:</b> mit dem Werkzeug „Bewegen“ …'); f.klick('#tools [data-tool="pan"]',danach=300); f.ziehe((900,500),(700,420),900,500)
        f.klick('#tools [data-tool="select"]',danach=200); f.klick('#zoomLabel',danach=300); f.pg.keyboard.press('Shift+Digit1'); f.pause(800)

@film
def vorlagen():
    with Film('vorlagen',leer(0)) as f:
        f.cap('Links unter <b>Vorlagen</b>: Kanban, Scrum und Mindmap zum Reinziehen')
        f.ziehe(pal(f,'mindmap'),(760,400),1100,600); f.pg.keyboard.press('Escape'); f.pause(300)
        f.cap('<b>Mindmap:</b> Knoten antippen und „+ Zweig“'); f.klick(item(f,0),danach=500); f.klick('#props [data-act="branch"]',danach=500); f.tippe('Neue Idee',60); f.pause(300); f.pg.keyboard.press('Enter'); f.pause(800)
        f.cap('<b>„Alle Vorlagen“</b> öffnet die ganze Sammlung'); f.klick(pal(f,'mindmap').replace('data-kind="mindmap"','data-tpl="1"'),danach=1000)
        f.cap('Oben nach <b>Alltag, Unterricht</b> und <b>Beruf</b> filtern'); f.klick('#tplFilt [data-k="Alltag"]',danach=900); f.klick('#tplFilt [data-k="Unterricht"]',danach=900); f.klick('#tplFilt [data-k="Beruf"]',danach=900); f.klick('#tplFilt [data-k="Alltag"]',danach=600)
        f.cap('Antippen – schon liegt die Vorlage auf dem Board'); f.klick('#tplGrid .tc:visible >> nth=1',danach=1800); f.bild()
        f.pg.keyboard.press('Shift+Digit1'); f.pause(1200)

@film
def praesentieren():
    its=[S('t1','text',0,0,420,60,'Unser Projekt',fill='none',fs=40),S('a','rect',0,100,180,90,'Planen'),S('b','rect',240,100,180,90,'Umsetzen',fill='#d6f5e3'),
         S('t2','text',700,0,420,60,'Nächste Schritte',fill='none',fs=40),S('c','note',700,100,200,140,'Termin festlegen',fill='#fff3a8'),S('d','note',940,100,200,140,'Team einladen',fill='#fde2d6')]
    with Film('praesentieren',lade(its)) as f:
        def id_(i): return mitte(f.pg,f'#items > [data-id="{i}"]')
        def bb(i): return f.pg.locator(f'#items > [data-id="{i}"]').bounding_box()
        def rahmen(a,b):
            A,B=bb(a),bb(b); f.ziehe((A['x']-30,A['y']-30),(B['x']+B['width']+30,B['y']+B['height']+30),1000,400)
        f.cap('Inhalt einer Folie auswählen …'); rahmen('t1','b')
        f.cap('… dann <b>Präsentieren → Folienübersicht</b> und <b>„+ Folie“</b>'); f.klick('#playBtn',danach=400); f.klick('#presPop [data-m="slides"]',danach=500); f.klick('#slAdd',danach=1100)
        f.cap('Die Folie legt sich mit etwas Rand um die Auswahl'); f.pause(700)
        f.pg.mouse.click(1420,90); f.pg.keyboard.press('Shift+Digit1'); f.pause(700)
        f.cap('Zweite Folie: auswählen und wieder <b>„+ Folie“</b>'); rahmen('t2','d'); f.klick('#slAdd',danach=1300); f.bild()
        f.klick('#slList .st >> nth=0',danach=500); f.pg.keyboard.press('Escape'); f.pause(200)
        f.cap('<b>Präsentieren → „Präsentation starten“</b>'); f.klick('#playBtn',danach=400); f.klick('#presPop [data-m="play"]',danach=1500)
        f.cap('Weiter mit → oder Leertaste, zurück mit ←'); f.taste('ArrowRight','→',1500); f.taste('ArrowLeft','←',1200); f.taste('ArrowRight','→',1200)
        f.cap('<b>Laserpointer:</b> Taste L'); f.taste('l','L',300); f.pfad([(500,500),(700,450),(900,520),(1000,460)],1500,600)
        f.cap('Beenden mit Esc'); f.taste('Escape','Esc',900)

@film
def live():
    def s(pg):
        pg.evaluate("u=>localStorage.setItem('skizix-test-sb',u)",'http://127.0.0.1:8767'); pg.reload(); pg.wait_for_timeout(800)
        lade([S('a','checklist',0,0,240,160,'Milch\nBrot\nÄpfel',fill='#d6f5e3')])(pg)
    with Film('live',s) as f:
        f.cap('Oben auf <b>Teilen</b> tippen'); f.klick('#liveBtn',danach=700)
        f.cap('<b>„Board teilen …“</b> wählen'); f.klick('#liveStartBtn',danach=900)
        f.cap('Festlegen, wie lange der Link gilt …'); f.gehe('#lvExp',500); f.pause(200); f.pg.select_option('#lvExp','7d'); f.pause(900); f.bild()
        f.cap('… und einen Link zum <b>Mitzeichnen</b> oder zum <b>Ansehen</b> erstellen'); f.gehe('#lvView',500); f.pause(600); f.klick('#lvEdit',danach=1500)
        f.cap('Den Link verschicken – wer ihn öffnet, ist ohne Anmeldung dabei'); f.pause(1800)
        f.klick('#lvClose',danach=500)
        f.cap('<b>Mitmachen:</b> Link oder 6-stelligen Quiz-Code eingeben und Beitreten'); f.klick('#liveBtn',danach=500); f.klick('#liveJoinIn',danach=300); f.tippe('K7XP3M',120); f.pause(500); f.gehe('#liveJoinForm button',500); f.pause(1200)
        f.pg.keyboard.press('Escape'); f.pause(300)

@film
def konto():
    def s(pg):
        pg.evaluate("u=>localStorage.setItem('skizix-test-sb',u)",'http://127.0.0.1:8767'); pg.reload(); pg.wait_for_timeout(800)
        lade([S('a','note',0,0,200,140,'Mathe Klasse 7',fill='#fff3a8')])(pg)
    with Film('konto',s) as f:
        f.cap('<b>Konto</b> oben rechts: einmal anmelden …'); f.klick('#ktBtn',danach=600); f.klick('#ktMail',danach=200); f.tippe('ich@test.de',45); f.klick('#ktPw',danach=200); f.tippe('geheim123',45); f.pause(300)
        f.cap('… dann sind deine Boards auf jedem Gerät da'); f.klick('#ktGo',danach=1800); f.pg.keyboard.press('Escape'); f.pause(300)
        f.cap('Rechts: <b>+ Neues Board</b>, Boards verwalten, Board laden'); f.klick('#propsToggle',danach=700); f.klick('#menu [data-m="new"]',danach=900)
        f.cap('<b>Ordner:</b> „+ Ordner“ und einen Namen eingeben'); f.klick('#newFolder',danach=400); f.tippe('Unterricht 7b',60); f.pg.keyboard.press('Enter'); f.pause(800)
        f.cap('<b>„⋯“ an jedem Board:</b> umbenennen, in Ordner verschieben, duplizieren …'); f.klick('#boardList .bM >> nth=1',danach=900); f.bild()
        f.klick('#boardList [data-bact="fold"]',danach=700); f.klick('#boardList [data-bto="Unterricht 7b"]',danach=1000)
        f.cap('Ordner auf- und zuklappen'); f.klick('#boardList .fhT >> nth=0',danach=900); f.klick('#boardList .fhT >> nth=0',danach=700)
        f.cap('<b>Boards verwalten:</b> mehrere auf einmal verschieben oder löschen'); f.klick('#manageBtn',danach=1800); f.pg.keyboard.press('Escape'); f.pause(400)
        f.cap('Den Namen änderst du oben links im Namensfeld'); f.klick('#boardName',danach=200); f.pg.keyboard.press('Control+a'); f.tippe('Projektwoche',70); f.pg.keyboard.press('Enter'); f.pause(1000)

@film
def export():
    its=[S('a','rect',0,0,180,90,'Planen'),S('b','rect',260,0,180,90,'Umsetzen',fill='#d6f5e3'),S('c','rect',520,0,180,90,'Prüfen',fill='#fde2d6')]
    with Film('export',lade(its,zoomstufen=4)) as f:
        f.cap('Über <b>Export</b> (Pfeil nach unten) speicherst du das Board'); f.klick('#expBtn',danach=900); f.bild()
        f.cap('<b>Bild (PNG)</b> – zum Einfügen in Dokumente und Chats'); f.gehe('#expPop [data-m="png"]',500); f.pause(1200)
        f.cap('<b>Vektor (SVG)</b> – gestochen scharf in jeder Größe'); f.gehe('#expPop [data-m="svg"]',400); f.pause(1200)
        f.cap('<b>PDF (A4)</b> – zum Drucken, Folien als einzelne Seiten'); f.gehe('#expPop [data-m="pdf"]',400); f.pause(1200)
        f.cap('<b>Sicherung (.json)</b> – die komplette Datei'); f.gehe('#expPop [data-m="json"]',400); f.pause(900); f.klick('#expPop [data-m="json"]',100,1400)
        f.cap('Wieder öffnen: rechts <b>„Board laden …“</b>'); f.klick('#propsToggle',danach=600); f.gehe('#menu [data-m="open"]',500); f.pause(1800)

if __name__=='__main__':
    import subprocess,os,time
    mock=subprocess.Popen([sys.executable,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','tests','supabase_attrappe.py')]); time.sleep(0.8)
    try:
        for n in (sys.argv[1:] or F):
            try: F[n]()
            except Exception as e: print('FEHLER',n,str(e).splitlines()[0])
    finally: mock.terminate()
