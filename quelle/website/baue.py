#!/usr/bin/env python3
"""Baut die Website von Skizix (Ordner website/ im Hauptordner des Repos).

Aufbau wie die App: oben Logo und Slogan, links die Navigation mit farbigen Symbolen, in der Mitte der Inhalt,
rechts passende Hinweise zur Seite. Hell als Standard, dunkel umschaltbar. Beispiel-Boards zeigen die App in #18181A.

Texte von Anleitung, Datenschutz und Impressum stehen in inhalt/*.html und werden hier nur eingesetzt.
Aufruf:  python3 quelle/website/baue.py
"""
import os, re, base64, shutil
HIER = os.path.dirname(os.path.abspath(__file__)); INH = os.path.join(HIER, 'inhalt')
ZIEL = os.path.join(os.path.dirname(os.path.dirname(HIER)), 'website')
lies = lambda f: open(os.path.join(INH, f), encoding='utf-8').read()
V = '4'   # Versionsnummer an CSS/JS, damit Handys die neue Gestaltung sofort laden

BLUE, CORAL, MINT, GOLD, VIOLET = 'var(--blau)', 'var(--koralle)', 'var(--mint)', 'var(--gold)', 'var(--violett)'
P = {
 'home':'<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',
 'spark':'<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
 'book':'<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5M8 7h7"/>',
 'grid':'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 'flask':'<path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3"/><path d="M7 15h10"/>',
 'quiz':'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 'users':'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><path d="M16 4.5a3.5 3.5 0 010 7M18 14.5c2.4.6 4 2.4 4 5.5"/>',
 'shield':'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
 'info':'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
 'mail':'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
 'arrow':'<path d="M5 12h14M13 6l6 6-6 6"/>', 'check':'<path d="M5 12l5 5 9-10"/>',
 'pen':'<path d="M4 20l4-1 11-11-3-3L5 16z"/>', 'live':'<circle cx="12" cy="12" r="2"/><path d="M8 8a5.5 5.5 0 000 8M16 8a5.5 5.5 0 010 8M5 5a10 10 0 000 14M19 5a10 10 0 010 14"/>',
 'flow':'<rect x="2" y="9" width="6" height="6" rx="3"/><path d="M8 12h4"/><rect x="12" y="8" width="10" height="8" rx="2"/>',
 'play':'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M10 8l5 2.5-5 2.5zM8 21h8M12 17v4"/>',
 'device':'<rect x="2" y="4" width="14" height="11" rx="1.5"/><rect x="17" y="8" width="5" height="12" rx="1"/><path d="M6 19h6"/>',
 'key':'<circle cx="8" cy="14" r="4"/><path d="M11 11l9-9M17 5l2 2"/>',
 'menu':'<path d="M4 7h16M4 12h16M4 17h16"/>', 'x':'<path d="M6 6l12 12M18 6L6 18"/>',
 'moon':'<path d="M20 14A8 8 0 1110 4a6 6 0 0010 10z"/>', 'chev':'<path d="M9 5l7 7-7 7"/>', 'list':'<path d="M4 6h1M4 12h1M4 18h1M9 6h11M9 12h11M9 18h11"/>',
 'cal':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', 'chat':'<path d="M4 5h16v11H10l-5 4v-4H4z"/>',
 'cart':'<path d="M3 4h2l2 12h11l2-8H6"/><circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>',
 'kanban':'<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/>',
 'mind':'<circle cx="12" cy="12" r="3"/><circle cx="4" cy="5" r="2"/><circle cx="20" cy="5" r="2"/><circle cx="4" cy="19" r="2"/><circle cx="20" cy="19" r="2"/><path d="M6 6l4 4M18 6l-4 4M6 18l4-4M18 18l-4-4"/>',
 'heart':'<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"/>', 'folder':'<path d="M3 6h7l2 2h9v11H3z"/>',
}
def ic(n, cls='ic'): return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true">{P[n]}</svg>'
def ichip(n, c, cls=''): return f'<span class="ichip {cls}" style="--c:{c}">{ic(n)}</span>'
def knopf(t, art='haupt', icon=None, href='#'): return f'<a class="knopf {art}" href="{href}">{ic(icon) if icon else ""}<span>{t}</span></a>'
def karte(inner, cls=''): return f'<section class="karte {cls}">{inner}</section>'
def box(titel, inner, icon=None, c=BLUE): return f'<section class="karte kbox"><h2 class="kt">{ichip(icon,c,"klein") if icon else ""}{titel}</h2>{inner}</section>'
def board(name):   # Beispiel-Board in App-Optik (fest 440 × 320, wird per JS auf die Breite skaliert)
    return f'<div class="buehne" role="img" aria-label="Animiertes Beispiel-Board"><div class="buehne-in">{lies("board-"+name+".html")}</div></div>'

LOGO = '<svg class="logo" viewBox="0 0 34 30" aria-hidden="true"><rect x="3" y="3" width="28" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M21 8c-2.5-2.5-8-1.5-7 1.5s7.5 1 6 4.5-6 2.5-8 0" fill="none" stroke="#4D9FFF" stroke-width="2.6" stroke-linecap="round"/><path d="M3 27h28" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
NAV = [('index.html','Start','home',BLUE),('funktionen.html','Funktionen','spark',VIOLET),('anleitung.html','Anleitung','book',MINT),('vorlagen.html','Vorlagen','grid',GOLD),('testphase.html','Testphase','flask',CORAL)]
NAV2 = [('datenschutz.html','Datenschutz','shield',MINT),('impressum.html','Impressum','info',BLUE)]
APP = '../'

def seite(datei, titel, aktiv, haupt, kontext, beschreibung):
    def nv(f, l, n, c): return f'<a href="{f}"{" aria-current=\"page\"" if l==aktiv else ""}>{ichip(n,c)}<span>{l}</span></a>'
    html = f'''<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>{titel} – Skizix</title>
<meta name="description" content="{beschreibung}">
<meta name="theme-color" content="#3B6FE8">
<link rel="icon" type="image/png" href="../icon-192.png">
<link rel="stylesheet" href="stil.css?v={V}">
<script>try{{if(localStorage.getItem('skizix-web-thema')==='dunkel')document.documentElement.dataset.thema='dunkel'}}catch(e){{}}</script>
</head>
<body>
<a class="sprung" href="#inhalt">Zum Inhalt</a>
<header class="kopf">
  <a class="marke" href="index.html" aria-label="Skizix – Startseite">{LOGO}<span class="wort">skizix</span></a>
  <span class="trenner" aria-hidden="true"></span>
  <p class="slogan">Zeichnen, planen, gemeinsam denken – <b>auf jedem Gerät.</b></p>
  <span class="platz"></span>
  <button class="rund" type="button" id="thema" aria-label="Dunkle Ansicht einschalten" title="Hell / Dunkel">{ic("moon")}</button>
  <a class="knopf rand nur-breit" href="{APP}">{ic("key")}<span>Mit Code beitreten</span></a>
  <a class="knopf haupt" href="{APP}">{ic("arrow")}<span>App öffnen</span></a>
  <button class="rund burger" type="button" aria-expanded="false" aria-controls="navi" aria-label="Menü öffnen">{ic("menu","ic zu")}{ic("x","ic auf")}</button>
</header>
<div class="rahmen">
  <nav class="navi karte" id="navi" aria-label="Hauptmenü">
    <p class="nk">Entdecken</p>
    {"".join(nv(*x) for x in NAV)}
    <hr>
    <p class="nk">Rechtliches</p>
    {"".join(nv(*x) for x in NAV2)}
    <div class="beta"><b>Beta · kostenlos</b><span>Skizix ist in der Testphase. Alles kostenlos, kein Gewerbe, keine Werbung.</span></div>
  </nav>
  <main id="inhalt">
{haupt}
  </main>
  <aside class="kontext" aria-label="Passend zur Seite">
{kontext}
  </aside>
</div>
<footer class="fuss karte">
  <a class="marke klein" href="index.html">{LOGO}<span class="wort">skizix</span></a><span>© 2026 Skizix · Testphase</span>
  <span class="platz"></span>
  <a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a><span>Board-Daten in der EU · keine Werbung</span>
</footer>
<script src="menue.js?v={V}"></script>
</body>
</html>
'''
    open(os.path.join(ZIEL, datei), 'w', encoding='utf-8').write(html)

def haken(liste, c=MINT): return '<ul class="haken" style="--c:%s">%s</ul>' % (c, ''.join(f'<li>{ic("check")}<span>{x}</span></li>' for x in liste))
def chips(liste): return '<p class="chips">' + ''.join(f'<span>{x}</span>' for x in liste) + '</p>'
def code_kasten(): return '<div class="code" aria-hidden="true">' + '<span>·</span>'*6 + '</div>'

# ---------------------------------------------------------------- Startseite
def start():
    hero = karte(f'''<div class="zwei">
  <div class="text">
    <p class="marker" style="--c:{CORAL}">{ic("flask")}Jetzt in der Testphase</p>
    <h1>Ein Board für alles,<br>was du im Kopf hast.</h1>
    <p class="lead">Zeichnen, Abläufe skizzieren, Listen führen und live mit anderen arbeiten – im Kurs, im Team oder mit der Familie.</p>
    <p class="knoepfe">{knopf("Kostenlos ausprobieren","haupt","arrow",APP)}{knopf("So funktioniert's","weich","play","anleitung.html")}</p>
    <ul class="vertrauen"><li>{ic("check")}Ohne Installation</li><li>{ic("check")}Board-Daten in der EU</li><li>{ic("check")}Gäste ohne Konto</li></ul>
  </div>
  {board("hero")}
</div>''', 'held')
    def bereich(icon, c, titel, lead, punkte, tags, name, link, href):
        return karte(f'''<div class="zwei">
  <div class="text">
    <h2 class="bt">{ichip(icon,c)}{titel}</h2>
    <p>{lead}</p>
    {haken(punkte, c)}
    {chips(tags)}
    <a class="weiter" style="--c:{c}" href="{href}">{link} {ic("arrow")}</a>
  </div>
  {board(name)}
</div>''')
    haupt = hero + bereich('users',BLUE,'Unterricht &amp; Kurse','Tafelbild, Gruppenarbeit und Quiz auf einem Board. Teilnehmende machen per Handy mit – ohne Konto, nur mit Spitznamen.',
        ['Live-Quiz mit Ergebnis als Säulen','Gruppen arbeiten gleichzeitig auf eigenen Bereichen','Tafel-Modus für Beamer, Tafelbild als PDF'],['Live-Quiz','Gruppen','Tafel-Modus','PDF'],'unterricht','Für den Unterricht','funktionen.html#unterricht') \
      + bereich('flow',VIOLET,'Beruf &amp; Projekte','Prozesse sauber in BPMN zeichnen, Aufgaben im Kanban verfolgen und Workshops live mit dem Team gestalten.',
        ['Pfeile docken magnetisch an Formen an','BPMN 2.0 mit Bahnen und Gateways','Kanban und Scrum als fertige Bausteine'],['BPMN','Kanban','Workshops','Retro'],'beruf','Für Teams','funktionen.html#formen') \
      + bereich('heart',CORAL,'Alltag &amp; Familie','Einkaufsliste, Wochenplan und To-dos gemeinsam auf allen Handys – wer etwas abhakt, sieht jeder sofort.',
        ['Einkaufsliste mit Häkchen und Namen','Wochenplaner für die ganze Familie','Notizen und Zeichnungen direkt daneben'],['Einkauf','Planer','To-do','Teilen'],'alltag','Für zu Hause','vorlagen.html')
    kontext = box('Testphase läuft', f'<p>Wir suchen Lehrkräfte, Dozierende und Familien, die Skizix im Alltag testen und ehrlich Rückmeldung geben.</p>{knopf("Mitmachen","haupt",None,"testphase.html")}', 'flask', CORAL) \
      + box('Einem Board beitreten', f'<p>Code von der Tafel eingeben – ohne Konto.</p>{code_kasten()}{knopf("Zur App","weich","arrow",APP)}', 'key', MINT) \
      + box('Neu in Skizix', '<ul class="neu"><li style="--c:var(--violett)"><b>Ordner für Boards</b><span>November 2026</span></li><li style="--c:var(--blau)"><b>Neues Design, hell und dunkel</b><span>November 2026</span></li><li style="--c:var(--gold)"><b>Stifte auf allen Geräten</b><span>November 2026</span></li></ul>', 'spark', VIOLET) \
      + box('Alle Funktionen', f'<p>Live zusammen, Stift wie auf Papier, Formen, Quiz, Präsentieren – alles auf einen Blick.</p>{knopf("Ansehen","rand","arrow","funktionen.html")}', 'grid', BLUE)
    seite('index.html','Das Whiteboard für Unterricht und Alltag','Start',haupt,kontext,'Skizix: digitales Whiteboard zum Zeichnen, Planen und gemeinsamen Arbeiten – im Unterricht, im Team und mit der Familie.')

# ---------------------------------------------------------------- Funktionen
GRUPPEN = [('zeichnen','Zeichnen &amp; Schreiben',BLUE,'pen',['Stift, Pinsel, Marker und Radierer','Druckstufen und Apple Pencil','Text auf dem Board, Absätze einzeln formatierbar','Stifte gleichen sich zwischen deinen Geräten ab']),
           ('formen','Formen &amp; Diagramme',VIOLET,'flow',['Über 100 Formen zum Hineinziehen, mit Suche','BPMN 2.0, Flussdiagramm, UML, ER-Diagramm, Netzwerk, Struktogramm','Pfeile docken magnetisch an','Hilfslinien und Einrasten am Raster']),
           ('bausteine','Bausteine',GOLD,'kanban',['Tabellen','Kanban- und Scrum-Boards','Aufzählungen und Mindmaps','Vorlagen: SWOT, Retro, Zeitstrahl und mehr']),
           ('zusammen','Zusammenarbeit',MINT,'live',['Live auf mehreren Geräten gleichzeitig','Gäste per Link – ohne Konto','Nur-ansehen-Links','Links laufen auf Wunsch automatisch ab']),
           ('unterricht','Unterricht',CORAL,'quiz',['Quiz-Bausteine mit Lösung in der Präsentation','Präsentieren mit Folien und Laserpointer','Tafelflächen wie Tafelgrün, Schiefer, Nacht','Live-Quiz per Handy – kommt in der Testphase']),
           ('geraete','Geräte &amp; Daten',BLUE,'device',['Läuft im Browser und als App, auch offline','Konto: Boards und Ordner auf allen Geräten','Export als PNG, SVG, PDF und Sicherung','Oberfläche dunkel oder hell'])]
def funktionen():
    karten = ''.join(f'<section class="karte fk" id="{i}"><h2 class="bt">{ichip(n,c)}{h}</h2>{haken(p,c)}</section>' for i,h,c,n,p in GRUPPEN)
    haupt = karte('<p class="marker" style="--c:var(--violett)">' + ic('spark') + 'Funktionen</p><h1>Alles, was ein Whiteboard braucht</h1><p class="lead">– und ein paar Dinge, die andere nicht haben.</p>') + f'<div class="raster2">{karten}</div>'
    kontext = box('Auf dieser Seite', '<nav class="toc">' + ''.join(f'<a href="#{i}">{h}</a>' for i,h,c,n,p in GRUPPEN) + '</nav>', 'list', BLUE) \
      + box('Selbst ausprobieren', f'<p>Die App startet mit einem Beispiel-Board. Einfach öffnen und loslegen – ohne Anmeldung.</p>{knopf("App öffnen","haupt","arrow",APP)}', 'spark', VIOLET)
    seite('funktionen.html','Funktionen','Funktionen',haupt,kontext,'Alle Funktionen von Skizix: Zeichnen, Formen, BPMN, Kanban, Live-Zusammenarbeit, Präsentieren und mehr.')

# ---------------------------------------------------------------- Anleitung
def anleitung():
    s = lies('anleitung.html')
    toc = re.search(r'<nav class="toc"[^>]*>.*?</nav>', s, re.S).group(0)
    inhalt = re.sub(r'<nav class="toc"[^>]*>.*?</nav>', '', s, flags=re.S)
    inhalt = re.sub(r'^\s*<div class="wrap layout">\s*', '', inhalt); inhalt = re.sub(r'</div>\s*</div>\s*$', '</div>', inhalt.strip())
    inhalt = inhalt.replace('<div>\n    <h1>Anleitung</h1>', f'<div><p class="marker" style="--c:var(--mint)">{ic("book")}Anleitung</p>\n    <h1>Anleitung</h1>', 1)
    haupt = karte(inhalt, 'text-seite')
    kontext = box('Auf dieser Seite', toc.replace('class="toc"', 'class="toc" aria-label="Inhalt der Anleitung"'), 'list', BLUE) \
      + box('Noch Fragen?', f'<p>Schreib uns – in der Testphase antworten wir meist am selben Tag.</p>{knopf("Frage stellen","rand","mail","impressum.html")}', 'chat', MINT)
    seite('anleitung.html','Anleitung','Anleitung',haupt,kontext,'Anleitung zu Skizix: installieren, zeichnen, Formen, Text, Präsentieren, Live teilen, Konto und Ordner.')

# ---------------------------------------------------------------- Vorlagen
VORL = [('Einkaufsliste','Alltag',MINT,'cart'),('Wochenplaner','Alltag',CORAL,'cal'),('To-do-Liste','Alltag',GOLD,'list'),('Quiz','Unterricht',BLUE,'quiz'),
        ('Gruppenarbeit','Unterricht',VIOLET,'users'),('Mindmap','Unterricht',CORAL,'mind'),('BPMN-Prozess','Beruf',BLUE,'flow'),('Kanban','Beruf',GOLD,'kanban'),
        ('Retro','Beruf',MINT,'chat'),('Lernplan','Unterricht',VIOLET,'book'),('SWOT-Analyse','Beruf',CORAL,'grid'),('Präsentation','Beruf',BLUE,'play')]
def vorlagen():
    kacheln = ''.join(f'<a class="vk karte" href="{APP}" data-kat="{k}" style="--c:{c}"><span class="vbild">{ic(n,"ic gross")}<em>{k}</em></span><span class="vname">{t}{ic("arrow")}</span></a>' for t,k,c,n in VORL)
    filt = ''.join(f'<button type="button" class="filter" data-kat="{k}" aria-pressed="{str(i==0).lower()}" style="--c:{c}">{k if k!="*" else "Alle"}</button>' for i,(k,c) in enumerate([('*',BLUE),('Alltag',CORAL),('Unterricht',MINT),('Beruf',VIOLET)]))
    haupt = karte(f'<p class="marker" style="--c:var(--gold)">{ic("grid")}Vorlagen</p><h1>Vorlagen</h1><p class="lead">Ein Klick, und das Board ist vorbereitet. Alle Vorlagen lassen sich frei anpassen.</p><p class="filterzeile" role="group" aria-label="Vorlagen filtern">{filt}</p>') + f'<div class="raster3" id="vorlagen">{kacheln}</div>'
    kontext = box('So findest du sie', '<p>In der App liegen die Vorlagen links in der Formenleiste unter <b>Vorlagen</b>. „Alle Vorlagen“ öffnet die Übersicht.</p>', 'grid', GOLD) \
      + box('Vorlage wünschen', f'<p>Dir fehlt etwas? Die meistgewünschten Vorlagen bauen wir als Nächstes.</p>{knopf("Wunsch senden","rand","mail","impressum.html")}', 'spark', VIOLET)
    seite('vorlagen.html','Vorlagen','Vorlagen',haupt,kontext,'Vorlagen für Skizix: Einkaufsliste, Wochenplaner, Kanban, BPMN, Mindmap, Retro und mehr.')

# ---------------------------------------------------------------- Testphase
def testphase():
    wer = ''.join(f'<div class="wer" style="--c:{c}">{ic(n)}<b>{h}</b><span>{d}</span></div>' for n,c,h,d in [('users',BLUE,'Lehrkräfte &amp; Dozierende','Im eigenen Kurs mit Gruppenarbeit und Quiz – mit Erlaubnis der Einrichtung.'),('heart',CORAL,'Familien &amp; Freunde','Einkauf, Wochenplan, Planung – gemeinsam auf allen Handys.'),('flow',VIOLET,'Teams','Prozesse und Kanban im kleinen Team ausprobieren.')])
    schritte = ''.join(f'<li style="--c:{c}"><b>{h}</b><span>{d}</span></li>' for c,h,d in [(BLUE,'Melden','Kurze E-Mail mit Name und wofür du Skizix nutzen möchtest.'),(MINT,'Loslegen','Du bekommst den Link und kannst sofort starten.'),(GOLD,'Ausprobieren','Ein paar Wochen im echten Alltag nutzen.'),(CORAL,'Rückmeldung geben','Kurzer Fragebogen, gern auch ein Gespräch.')])
    haupt = karte(f'<p class="marker" style="--c:var(--koralle)">{ic("flask")}Testphase · bis März 2027</p><h1>Hilf mit, Skizix besser zu machen</h1><p class="lead">Skizix ist noch jung. In der Testphase ist alles kostenlos – im Gegenzug wünschen wir uns ehrliche Rückmeldung.</p>') \
      + karte(f'<h2>Für wen?</h2><div class="raster3 wer-raster">{wer}</div>') \
      + karte(f'<h2>So läuft es ab</h2><ol class="schritte">{schritte}</ol>') \
      + karte(f'<div class="zeile">{ichip("shield",MINT)}<div><h2>Datenschutz in Kursen</h2><p>Teilnehmende brauchen kein Konto und nutzen nur Spitznamen. Links zum Mitmachen laufen auf Wunsch automatisch ab. Für den Einsatz im Unterricht braucht es die Erlaubnis der Einrichtung.</p></div></div>')
    kontext = box('Jetzt mitmachen', f'<p>Schreib uns eine kurze E-Mail – die Adresse steht im Impressum.</p>{knopf("Zum Kontakt","haupt","mail","impressum.html")}', 'flask', CORAL) \
      + box('Häufige Fragen', '<details><summary>Kostet das etwas?</summary><p>Nein. In der Testphase ist alles kostenlos.</p></details><details><summary>Brauche ich ein Konto?</summary><p>Nein. Ein Konto brauchst du nur, wenn deine Boards auf mehreren Geräten erscheinen sollen.</p></details><details><summary>Was passiert nach der Testphase?</summary><p>Die Grundfunktionen bleiben kostenlos. Deine Boards bleiben erhalten.</p></details><details><summary>Darf ich es im Kurs nutzen?</summary><p>Ja, mit Erlaubnis der Einrichtung. Teilnehmende brauchen kein Konto.</p></details>', 'info', BLUE)
    seite('testphase.html','Testphase','Testphase',haupt,kontext,'Skizix-Testphase bis März 2027: kostenlos mitmachen und Rückmeldung geben.')

def recht(datei, titel, aktiv, icon, c, kontext, besch):
    s = lies(datei)
    s = re.sub(r'^\s*<div class="wrap">\s*', '', s); s = re.sub(r'</div>\s*$', '', s.strip())
    haupt = karte(f'<p class="marker" style="--c:{c}">{ic(icon)}{titel}</p>' + s, 'text-seite')
    seite(datei, titel, aktiv, haupt, kontext, besch)

def css():
    k = lies('animationen.css')
    open(os.path.join(ZIEL,'stil.css'),'w',encoding='utf-8').write(open(os.path.join(HIER,'stil.css'),encoding='utf-8').read() + '\n/* Animationen der Beispiel-Boards */\n' + k + '\n')

if __name__ == '__main__':
    os.makedirs(ZIEL, exist_ok=True)
    start(); funktionen(); anleitung(); vorlagen(); testphase()
    recht('datenschutz.html','Datenschutz','Datenschutz','shield',MINT, box('Das Wichtigste', haken(['Board-Daten bei Supabase in der EU','Keine Werbung, keine Analyse-Dienste','Gäste ohne Konto','Boards jederzeit löschbar']), 'shield', MINT), 'Datenschutzerklärung von Skizix.')
    recht('impressum.html','Impressum','Impressum','info',BLUE, box('Schreib uns', '<p>Fragen, Ideen oder einen Fehler gefunden? Wir freuen uns über jede Nachricht.</p>', 'mail', BLUE), 'Impressum von Skizix.')
    css()
    shutil.copy(os.path.join(HIER,'menue.js'), os.path.join(ZIEL,'menue.js'))
    for alt in ['stil-hell.css']:
        p = os.path.join(ZIEL, alt)
        if os.path.exists(p): os.remove(p)
    print('Website gebaut:', ', '.join(sorted(f for f in os.listdir(ZIEL) if f.endswith('.html'))))
