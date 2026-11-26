#!/usr/bin/env python3
"""Baut die Website von Skizix (Ordner website/ im Hauptordner des Repos).

Aufbau wie die App: oben Logo und Slogan, links die Navigation mit farbigen Symbolen, in der Mitte der Inhalt,
rechts passende Hinweise zur Seite. Hell als Standard, dunkel umschaltbar. Beispiel-Boards zeigen die App in #18181A.

Texte von Anleitung, Datenschutz und Impressum stehen in inhalt/*.html und werden hier nur eingesetzt.
Aufruf:  python3 quelle/website/baue.py
"""
import os, re, base64, shutil, json
HIER = os.path.dirname(os.path.abspath(__file__)); INH = os.path.join(HIER, 'inhalt')
ZIEL = os.path.join(os.path.dirname(os.path.dirname(HIER)), 'website')
lies = lambda f: open(os.path.join(INH, f), encoding='utf-8').read()
V = '29'   # Versionsnummer an CSS/JS, damit Handys die neue Gestaltung sofort laden

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
 'pause':'<path d="M9 5v14M15 5v14"/>', 'playi':'<path d="M7 5l12 7-12 7z"/>',
 'heart':'<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"/>', 'folder':'<path d="M3 6h7l2 2h9v11H3z"/>',
}
def ic(n, cls='ic'): return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true">{P[n]}</svg>'
def ichip(n, c, cls=''): return f'<span class="ichip {cls}" style="--c:{c}">{ic(n)}</span>'
def knopf(t, art='haupt', icon=None, href='#'): return f'<a class="knopf {art}" href="{href}">{ic(icon) if icon else ""}<span>{t}</span></a>'
def karte(inner, cls=''): return f'<section class="karte {cls}">{inner}</section>'
def box(titel, inner, icon=None, c=BLUE): return f'<section class="karte kbox"><h2 class="kt">{ichip(icon,c,"klein") if icon else ""}{titel}</h2>{inner}</section>'
BESCHR = {'hero':'Beispiel-Board in vier Szenen: eine Zeichnung, ein Quiz im Unterricht, ein Prozess im Beruf und eine Einkaufsliste zu Hause',
          'unterricht':'Beispiel-Board: Quiz „Welches Gerät verbindet Netze?“ mit Ergebnis als Säulen, Antwort B liegt vorn',
          'beruf':'Beispiel-Board: BPMN-Prozess mit zwei Bahnen von „Störung melden“ bis „Lösung prüfen“',
          'alltag':'Beispiel-Board: Wochenplan und Einkaufsliste mit Häkchen und Namen'}
def board(name):   # Beispiel-Board in App-Optik (fest 440 × 320, wird per JS auf die Breite skaliert); Animation per Knopf anhaltbar
    inn = re.sub(r'<div class="row" style="position:absolute;left:10px;right:10px;bottom:10px;.*?0:10</span></div>', '', lies("board-"+name+".html"), flags=re.S)
    return (f'<div class="buehne"><div class="buehne-in" role="img" aria-label="{BESCHR.get(name,"Beispiel-Board")}">{inn}</div>'
            f'<button type="button" class="anhalten" aria-pressed="false">{ic("pause")}<span>Anhalten</span></button></div>')

WORT = '<svg class="wort" viewBox="5 -695 3490 690" role="img" aria-label="skizix"><path fill="currentColor" d="M106 -495Q105 -495 105.0 -495.0Q105 -495 105 -494V-406Q105 -405 105.0 -405.0Q105 -405 106 -405H194Q195 -405 195.0 -405.0Q195 -405 195 -406V-494Q195 -495 195.0 -495.0Q195 -495 194 -495ZM206 -495Q205 -495 205.0 -495.0Q205 -495 205 -494V-406Q205 -405 205.0 -405.0Q205 -405 206 -405H294Q295 -405 295.0 -405.0Q295 -405 295 -406V-494Q295 -495 295.0 -495.0Q295 -495 294 -495ZM306 -495Q305 -495 305.0 -495.0Q305 -495 305 -494V-406Q305 -405 305.0 -405.0Q305 -405 306 -405H394Q395 -405 395.0 -405.0Q395 -405 395 -406V-494Q395 -495 395.0 -495.0Q395 -495 394 -495ZM6 -395Q5 -395 5.0 -395.0Q5 -395 5 -394V-306Q5 -305 5.0 -305.0Q5 -305 6 -305H94Q95 -305 95.0 -305.0Q95 -305 95 -306V-394Q95 -395 95.0 -395.0Q95 -395 94 -395ZM106 -295Q105 -295 105.0 -295.0Q105 -295 105 -294V-206Q105 -205 105.0 -205.0Q105 -205 106 -205H194Q195 -205 195.0 -205.0Q195 -205 195 -206V-294Q195 -295 195.0 -295.0Q195 -295 194 -295ZM206 -295Q205 -295 205.0 -295.0Q205 -295 205 -294V-206Q205 -205 205.0 -205.0Q205 -205 206 -205H294Q295 -205 295.0 -205.0Q295 -205 295 -206V-294Q295 -295 295.0 -295.0Q295 -295 294 -295ZM306 -295Q305 -295 305.0 -295.0Q305 -295 305 -294V-206Q305 -205 305.0 -205.0Q305 -205 306 -205H394Q395 -205 395.0 -205.0Q395 -205 395 -206V-294Q395 -295 395.0 -295.0Q395 -295 394 -295ZM406 -195Q405 -195 405.0 -195.0Q405 -195 405 -194V-106Q405 -105 405.0 -105.0Q405 -105 406 -105H494Q495 -105 495.0 -105.0Q495 -105 495 -106V-194Q495 -195 495.0 -195.0Q495 -195 494 -195ZM6 -95Q5 -95 5.0 -95.0Q5 -95 5 -94V-6Q5 -5 5.0 -5.0Q5 -5 6 -5H94Q95 -5 95.0 -5.0Q95 -5 95 -6V-94Q95 -95 95.0 -95.0Q95 -95 94 -95ZM106 -95Q105 -95 105.0 -95.0Q105 -95 105 -94V-6Q105 -5 105.0 -5.0Q105 -5 106 -5H194Q195 -5 195.0 -5.0Q195 -5 195 -6V-94Q195 -95 195.0 -95.0Q195 -95 194 -95ZM206 -95Q205 -95 205.0 -95.0Q205 -95 205 -94V-6Q205 -5 205.0 -5.0Q205 -5 206 -5H294Q295 -5 295.0 -5.0Q295 -5 295 -6V-94Q295 -95 295.0 -95.0Q295 -95 294 -95ZM306 -95Q305 -95 305.0 -95.0Q305 -95 305 -94V-6Q305 -5 305.0 -5.0Q305 -5 306 -5H394Q395 -5 395.0 -5.0Q395 -5 395 -6V-94Q395 -95 395.0 -95.0Q395 -95 394 -95Z M606 -695Q605 -695 605.0 -695.0Q605 -695 605 -694V-606Q605 -605 605.0 -605.0Q605 -605 606 -605H694Q695 -605 695.0 -605.0Q695 -605 695 -606V-694Q695 -695 695.0 -695.0Q695 -695 694 -695ZM606 -595Q605 -595 605.0 -595.0Q605 -595 605 -594V-506Q605 -505 605.0 -505.0Q605 -505 606 -505H694Q695 -505 695.0 -505.0Q695 -505 695 -506V-594Q695 -595 695.0 -595.0Q695 -595 694 -595ZM606 -495Q605 -495 605.0 -495.0Q605 -495 605 -494V-406Q605 -405 605.0 -405.0Q605 -405 606 -405H694Q695 -405 695.0 -405.0Q695 -405 695 -406V-494Q695 -495 695.0 -495.0Q695 -495 694 -495ZM1006 -495Q1005 -495 1005.0 -495.0Q1005 -495 1005 -494V-406Q1005 -405 1005.0 -405.0Q1005 -405 1006 -405H1094Q1095 -405 1095.0 -405.0Q1095 -405 1095 -406V-494Q1095 -495 1095.0 -495.0Q1095 -495 1094 -495ZM606 -395Q605 -395 605.0 -395.0Q605 -395 605 -394V-306Q605 -305 605.0 -305.0Q605 -305 606 -305H694Q695 -305 695.0 -305.0Q695 -305 695 -306V-394Q695 -395 695.0 -395.0Q695 -395 694 -395ZM906 -395Q905 -395 905.0 -395.0Q905 -395 905 -394V-306Q905 -305 905.0 -305.0Q905 -305 906 -305H994Q995 -305 995.0 -305.0Q995 -305 995 -306V-394Q995 -395 995.0 -395.0Q995 -395 994 -395ZM606 -295Q605 -295 605.0 -295.0Q605 -295 605 -294V-206Q605 -205 605.0 -205.0Q605 -205 606 -205H694Q695 -205 695.0 -205.0Q695 -205 695 -206V-294Q695 -295 695.0 -295.0Q695 -295 694 -295ZM706 -295Q705 -295 705.0 -295.0Q705 -295 705 -294V-206Q705 -205 705.0 -205.0Q705 -205 706 -205H794Q795 -205 795.0 -205.0Q795 -205 795 -206V-294Q795 -295 795.0 -295.0Q795 -295 794 -295ZM806 -295Q805 -295 805.0 -295.0Q805 -295 805 -294V-206Q805 -205 805.0 -205.0Q805 -205 806 -205H894Q895 -205 895.0 -205.0Q895 -205 895 -206V-294Q895 -295 895.0 -295.0Q895 -295 894 -295ZM606 -195Q605 -195 605.0 -195.0Q605 -195 605 -194V-106Q605 -105 605.0 -105.0Q605 -105 606 -105H694Q695 -105 695.0 -105.0Q695 -105 695 -106V-194Q695 -195 695.0 -195.0Q695 -195 694 -195ZM906 -195Q905 -195 905.0 -195.0Q905 -195 905 -194V-106Q905 -105 905.0 -105.0Q905 -105 906 -105H994Q995 -105 995.0 -105.0Q995 -105 995 -106V-194Q995 -195 995.0 -195.0Q995 -195 994 -195ZM606 -95Q605 -95 605.0 -95.0Q605 -95 605 -94V-6Q605 -5 605.0 -5.0Q605 -5 606 -5H694Q695 -5 695.0 -5.0Q695 -5 695 -6V-94Q695 -95 695.0 -95.0Q695 -95 694 -95ZM1006 -95Q1005 -95 1005.0 -95.0Q1005 -95 1005 -94V-6Q1005 -5 1005.0 -5.0Q1005 -5 1006 -5H1094Q1095 -5 1095.0 -5.0Q1095 -5 1095 -6V-94Q1095 -95 1095.0 -95.0Q1095 -95 1094 -95Z M1406 -695Q1405 -695 1405.0 -695.0Q1405 -695 1405 -694V-606Q1405 -605 1405.0 -605.0Q1405 -605 1406 -605H1494Q1495 -605 1495.0 -605.0Q1495 -605 1495 -606V-694Q1495 -695 1495.0 -695.0Q1495 -695 1494 -695ZM1306 -495Q1305 -495 1305.0 -495.0Q1305 -495 1305 -494V-406Q1305 -405 1305.0 -405.0Q1305 -405 1306 -405H1394Q1395 -405 1395.0 -405.0Q1395 -405 1395 -406V-494Q1395 -495 1395.0 -495.0Q1395 -495 1394 -495ZM1406 -495Q1405 -495 1405.0 -495.0Q1405 -495 1405 -494V-406Q1405 -405 1405.0 -405.0Q1405 -405 1406 -405H1494Q1495 -405 1495.0 -405.0Q1495 -405 1495 -406V-494Q1495 -495 1495.0 -495.0Q1495 -495 1494 -495ZM1406 -395Q1405 -395 1405.0 -395.0Q1405 -395 1405 -394V-306Q1405 -305 1405.0 -305.0Q1405 -305 1406 -305H1494Q1495 -305 1495.0 -305.0Q1495 -305 1495 -306V-394Q1495 -395 1495.0 -395.0Q1495 -395 1494 -395ZM1406 -295Q1405 -295 1405.0 -295.0Q1405 -295 1405 -294V-206Q1405 -205 1405.0 -205.0Q1405 -205 1406 -205H1494Q1495 -205 1495.0 -205.0Q1495 -205 1495 -206V-294Q1495 -295 1495.0 -295.0Q1495 -295 1494 -295ZM1406 -195Q1405 -195 1405.0 -195.0Q1405 -195 1405 -194V-106Q1405 -105 1405.0 -105.0Q1405 -105 1406 -105H1494Q1495 -105 1495.0 -105.0Q1495 -105 1495 -106V-194Q1495 -195 1495.0 -195.0Q1495 -195 1494 -195ZM1306 -95Q1305 -95 1305.0 -95.0Q1305 -95 1305 -94V-6Q1305 -5 1305.0 -5.0Q1305 -5 1306 -5H1394Q1395 -5 1395.0 -5.0Q1395 -5 1395 -6V-94Q1395 -95 1395.0 -95.0Q1395 -95 1394 -95ZM1406 -95Q1405 -95 1405.0 -95.0Q1405 -95 1405 -94V-6Q1405 -5 1405.0 -5.0Q1405 -5 1406 -5H1494Q1495 -5 1495.0 -5.0Q1495 -5 1495 -6V-94Q1495 -95 1495.0 -95.0Q1495 -95 1494 -95ZM1506 -95Q1505 -95 1505.0 -95.0Q1505 -95 1505 -94V-6Q1505 -5 1505.0 -5.0Q1505 -5 1506 -5H1594Q1595 -5 1595.0 -5.0Q1595 -5 1595 -6V-94Q1595 -95 1595.0 -95.0Q1595 -95 1594 -95Z M1806 -495Q1805 -495 1805.0 -495.0Q1805 -495 1805 -494V-406Q1805 -405 1805.0 -405.0Q1805 -405 1806 -405H1894Q1895 -405 1895.0 -405.0Q1895 -405 1895 -406V-494Q1895 -495 1895.0 -495.0Q1895 -495 1894 -495ZM1906 -495Q1905 -495 1905.0 -495.0Q1905 -495 1905 -494V-406Q1905 -405 1905.0 -405.0Q1905 -405 1906 -405H1994Q1995 -405 1995.0 -405.0Q1995 -405 1995 -406V-494Q1995 -495 1995.0 -495.0Q1995 -495 1994 -495ZM2006 -495Q2005 -495 2005.0 -495.0Q2005 -495 2005 -494V-406Q2005 -405 2005.0 -405.0Q2005 -405 2006 -405H2094Q2095 -405 2095.0 -405.0Q2095 -405 2095 -406V-494Q2095 -495 2095.0 -495.0Q2095 -495 2094 -495ZM2106 -495Q2105 -495 2105.0 -495.0Q2105 -495 2105 -494V-406Q2105 -405 2105.0 -405.0Q2105 -405 2106 -405H2194Q2195 -405 2195.0 -405.0Q2195 -405 2195 -406V-494Q2195 -495 2195.0 -495.0Q2195 -495 2194 -495ZM2206 -495Q2205 -495 2205.0 -495.0Q2205 -495 2205 -494V-406Q2205 -405 2205.0 -405.0Q2205 -405 2206 -405H2294Q2295 -405 2295.0 -405.0Q2295 -405 2295 -406V-494Q2295 -495 2295.0 -495.0Q2295 -495 2294 -495ZM2106 -395Q2105 -395 2105.0 -395.0Q2105 -395 2105 -394V-306Q2105 -305 2105.0 -305.0Q2105 -305 2106 -305H2194Q2195 -305 2195.0 -305.0Q2195 -305 2195 -306V-394Q2195 -395 2195.0 -395.0Q2195 -395 2194 -395ZM2006 -295Q2005 -295 2005.0 -295.0Q2005 -295 2005 -294V-206Q2005 -205 2005.0 -205.0Q2005 -205 2006 -205H2094Q2095 -205 2095.0 -205.0Q2095 -205 2095 -206V-294Q2095 -295 2095.0 -295.0Q2095 -295 2094 -295ZM1906 -195Q1905 -195 1905.0 -195.0Q1905 -195 1905 -194V-106Q1905 -105 1905.0 -105.0Q1905 -105 1906 -105H1994Q1995 -105 1995.0 -105.0Q1995 -105 1995 -106V-194Q1995 -195 1995.0 -195.0Q1995 -195 1994 -195ZM1806 -95Q1805 -95 1805.0 -95.0Q1805 -95 1805 -94V-6Q1805 -5 1805.0 -5.0Q1805 -5 1806 -5H1894Q1895 -5 1895.0 -5.0Q1895 -5 1895 -6V-94Q1895 -95 1895.0 -95.0Q1895 -95 1894 -95ZM1906 -95Q1905 -95 1905.0 -95.0Q1905 -95 1905 -94V-6Q1905 -5 1905.0 -5.0Q1905 -5 1906 -5H1994Q1995 -5 1995.0 -5.0Q1995 -5 1995 -6V-94Q1995 -95 1995.0 -95.0Q1995 -95 1994 -95ZM2006 -95Q2005 -95 2005.0 -95.0Q2005 -95 2005 -94V-6Q2005 -5 2005.0 -5.0Q2005 -5 2006 -5H2094Q2095 -5 2095.0 -5.0Q2095 -5 2095 -6V-94Q2095 -95 2095.0 -95.0Q2095 -95 2094 -95ZM2106 -95Q2105 -95 2105.0 -95.0Q2105 -95 2105 -94V-6Q2105 -5 2105.0 -5.0Q2105 -5 2106 -5H2194Q2195 -5 2195.0 -5.0Q2195 -5 2195 -6V-94Q2195 -95 2195.0 -95.0Q2195 -95 2194 -95ZM2206 -95Q2205 -95 2205.0 -95.0Q2205 -95 2205 -94V-6Q2205 -5 2205.0 -5.0Q2205 -5 2206 -5H2294Q2295 -5 2295.0 -5.0Q2295 -5 2295 -6V-94Q2295 -95 2295.0 -95.0Q2295 -95 2294 -95Z M2606 -695Q2605 -695 2605.0 -695.0Q2605 -695 2605 -694V-606Q2605 -605 2605.0 -605.0Q2605 -605 2606 -605H2694Q2695 -605 2695.0 -605.0Q2695 -605 2695 -606V-694Q2695 -695 2695.0 -695.0Q2695 -695 2694 -695ZM2506 -495Q2505 -495 2505.0 -495.0Q2505 -495 2505 -494V-406Q2505 -405 2505.0 -405.0Q2505 -405 2506 -405H2594Q2595 -405 2595.0 -405.0Q2595 -405 2595 -406V-494Q2595 -495 2595.0 -495.0Q2595 -495 2594 -495ZM2606 -495Q2605 -495 2605.0 -495.0Q2605 -495 2605 -494V-406Q2605 -405 2605.0 -405.0Q2605 -405 2606 -405H2694Q2695 -405 2695.0 -405.0Q2695 -405 2695 -406V-494Q2695 -495 2695.0 -495.0Q2695 -495 2694 -495ZM2606 -395Q2605 -395 2605.0 -395.0Q2605 -395 2605 -394V-306Q2605 -305 2605.0 -305.0Q2605 -305 2606 -305H2694Q2695 -305 2695.0 -305.0Q2695 -305 2695 -306V-394Q2695 -395 2695.0 -395.0Q2695 -395 2694 -395ZM2606 -295Q2605 -295 2605.0 -295.0Q2605 -295 2605 -294V-206Q2605 -205 2605.0 -205.0Q2605 -205 2606 -205H2694Q2695 -205 2695.0 -205.0Q2695 -205 2695 -206V-294Q2695 -295 2695.0 -295.0Q2695 -295 2694 -295ZM2606 -195Q2605 -195 2605.0 -195.0Q2605 -195 2605 -194V-106Q2605 -105 2605.0 -105.0Q2605 -105 2606 -105H2694Q2695 -105 2695.0 -105.0Q2695 -105 2695 -106V-194Q2695 -195 2695.0 -195.0Q2695 -195 2694 -195ZM2506 -95Q2505 -95 2505.0 -95.0Q2505 -95 2505 -94V-6Q2505 -5 2505.0 -5.0Q2505 -5 2506 -5H2594Q2595 -5 2595.0 -5.0Q2595 -5 2595 -6V-94Q2595 -95 2595.0 -95.0Q2595 -95 2594 -95ZM2606 -95Q2605 -95 2605.0 -95.0Q2605 -95 2605 -94V-6Q2605 -5 2605.0 -5.0Q2605 -5 2606 -5H2694Q2695 -5 2695.0 -5.0Q2695 -5 2695 -6V-94Q2695 -95 2695.0 -95.0Q2695 -95 2694 -95ZM2706 -95Q2705 -95 2705.0 -95.0Q2705 -95 2705 -94V-6Q2705 -5 2705.0 -5.0Q2705 -5 2706 -5H2794Q2795 -5 2795.0 -5.0Q2795 -5 2795 -6V-94Q2795 -95 2795.0 -95.0Q2795 -95 2794 -95Z M3006 -495Q3005 -495 3005.0 -495.0Q3005 -495 3005 -494V-406Q3005 -405 3005.0 -405.0Q3005 -405 3006 -405H3094Q3095 -405 3095.0 -405.0Q3095 -405 3095 -406V-494Q3095 -495 3095.0 -495.0Q3095 -495 3094 -495ZM3406 -495Q3405 -495 3405.0 -495.0Q3405 -495 3405 -494V-406Q3405 -405 3405.0 -405.0Q3405 -405 3406 -405H3494Q3495 -405 3495.0 -405.0Q3495 -405 3495 -406V-494Q3495 -495 3495.0 -495.0Q3495 -495 3494 -495ZM3106 -395Q3105 -395 3105.0 -395.0Q3105 -395 3105 -394V-306Q3105 -305 3105.0 -305.0Q3105 -305 3106 -305H3194Q3195 -305 3195.0 -305.0Q3195 -305 3195 -306V-394Q3195 -395 3195.0 -395.0Q3195 -395 3194 -395ZM3306 -395Q3305 -395 3305.0 -395.0Q3305 -395 3305 -394V-306Q3305 -305 3305.0 -305.0Q3305 -305 3306 -305H3394Q3395 -305 3395.0 -305.0Q3395 -305 3395 -306V-394Q3395 -395 3395.0 -395.0Q3395 -395 3394 -395ZM3206 -295Q3205 -295 3205.0 -295.0Q3205 -295 3205 -294V-206Q3205 -205 3205.0 -205.0Q3205 -205 3206 -205H3294Q3295 -205 3295.0 -205.0Q3295 -205 3295 -206V-294Q3295 -295 3295.0 -295.0Q3295 -295 3294 -295ZM3106 -195Q3105 -195 3105.0 -195.0Q3105 -195 3105 -194V-106Q3105 -105 3105.0 -105.0Q3105 -105 3106 -105H3194Q3195 -105 3195.0 -105.0Q3195 -105 3195 -106V-194Q3195 -195 3195.0 -195.0Q3195 -195 3194 -195ZM3306 -195Q3305 -195 3305.0 -195.0Q3305 -195 3305 -194V-106Q3305 -105 3305.0 -105.0Q3305 -105 3306 -105H3394Q3395 -105 3395.0 -105.0Q3395 -105 3395 -106V-194Q3395 -195 3395.0 -195.0Q3395 -195 3394 -195ZM3006 -95Q3005 -95 3005.0 -95.0Q3005 -95 3005 -94V-6Q3005 -5 3005.0 -5.0Q3005 -5 3006 -5H3094Q3095 -5 3095.0 -5.0Q3095 -5 3095 -6V-94Q3095 -95 3095.0 -95.0Q3095 -95 3094 -95ZM3406 -95Q3405 -95 3405.0 -95.0Q3405 -95 3405 -94V-6Q3405 -5 3405.0 -5.0Q3405 -5 3406 -5H3494Q3495 -5 3495.0 -5.0Q3495 -5 3495 -6V-94Q3495 -95 3495.0 -95.0Q3495 -95 3494 -95Z"/></svg>'
LOGO = '<svg class="logo" viewBox="0 0 34 30" aria-hidden="true"><rect x="3" y="3" width="28" height="18" rx="3" fill="#3B6FE8" stroke="currentColor" stroke-width="2.2"/><path transform="translate(17 12) rotate(30) scale(0.31) translate(-49.95 -41.25)" d="M56.50 18.00 L55.58 18.49 L54.71 19.03 L53.84 19.58 L52.99 20.13 L52.14 20.69 L51.29 21.26 L50.45 21.83 L49.61 22.40 L48.78 22.97 L47.94 23.55 L47.11 24.13 L46.28 24.71 L45.45 25.29 L44.62 25.87 L43.87 26.53 L43.16 27.24 L42.46 27.94 L41.72 28.68 L41.01 29.44 L40.35 30.24 L39.78 31.08 L39.29 31.96 L38.92 32.89 L38.67 33.88 L38.58 34.92 L38.68 35.97 L38.96 36.98 L39.40 37.92 L39.98 38.76 L40.65 39.51 L41.41 40.16 L42.25 40.75 L43.15 41.27 L44.07 41.73 L44.64 41.99 L45.16 42.23 L45.68 42.46 L46.20 42.70 L46.72 42.94 L47.24 43.18 L47.76 43.41 L48.28 43.65 L48.80 43.89 L49.32 44.13 L49.84 44.36 L50.35 44.60 L50.87 44.84 L51.39 45.07 L51.91 45.31 L52.43 45.55 L52.95 45.79 L53.43 46.00 L54.12 46.34 L54.63 46.64 L55.03 46.91 L55.29 47.14 L55.44 47.30 L55.50 47.38 L55.50 47.38 L55.48 47.31 L55.48 47.25 L55.48 47.24 L55.45 47.34 L55.35 47.53 L55.15 47.82 L54.84 48.19 L54.42 48.62 L53.86 49.12 L53.01 49.82 L52.14 50.56 L51.26 51.29 L50.43 52.07 L49.67 52.94 L48.91 53.81 L48.14 54.67 L47.38 55.54 L46.63 56.42 L45.87 57.29 L45.12 58.17 L44.37 59.05 L43.62 59.93 L42.87 60.82 L42.13 61.72 L41.40 62.62 L40.68 63.54 L40.00 64.50 L40.00 64.50 L41.07 64.00 L42.10 63.45 L43.12 62.89 L44.13 62.32 L45.13 61.74 L46.13 61.16 L47.13 60.58 L48.13 59.99 L49.12 59.40 L50.12 58.81 L51.11 58.21 L52.09 57.61 L53.08 57.02 L54.07 56.42 L54.99 55.74 L55.86 55.00 L56.74 54.27 L57.64 53.51 L58.41 52.82 L59.14 52.09 L59.78 51.32 L60.33 50.49 L60.78 49.61 L61.11 48.64 L61.27 47.60 L61.23 46.54 L60.98 45.50 L60.55 44.54 L59.99 43.70 L59.31 42.96 L58.56 42.31 L57.74 41.74 L56.85 41.22 L55.93 40.77 L55.36 40.51 L54.84 40.27 L54.32 40.04 L53.80 39.80 L53.28 39.56 L52.76 39.32 L52.24 39.09 L51.72 38.85 L51.20 38.61 L50.68 38.37 L50.16 38.14 L49.65 37.90 L49.13 37.66 L48.61 37.43 L48.09 37.19 L47.57 36.95 L47.05 36.71 L46.58 36.50 L45.89 36.16 L45.37 35.86 L44.97 35.58 L44.68 35.33 L44.51 35.14 L44.42 35.02 L44.39 34.96 L44.39 34.94 L44.38 34.92 L44.39 34.85 L44.43 34.70 L44.53 34.46 L44.71 34.14 L44.98 33.73 L45.37 33.27 L45.88 32.72 L46.56 32.04 L47.26 31.34 L47.97 30.63 L48.63 29.88 L49.21 29.05 L49.79 28.22 L50.37 27.39 L50.95 26.56 L51.53 25.72 L52.10 24.89 L52.67 24.05 L53.24 23.21 L53.81 22.36 L54.37 21.51 L54.92 20.66 L55.47 19.79 L56.01 18.92 L56.50 18.00Z" fill="#fff"/><path d="M3 27h28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
NAV = [('index.html','Start','home',BLUE),('funktionen.html','Funktionen','spark',VIOLET),('vorlagen.html','Vorlagen','grid',GOLD),('anleitung.html','Anleitung','book',MINT)]
NAV2 = [('datenschutz.html','Datenschutz','shield',MINT),('impressum.html','Impressum','info',BLUE)]
APP = '../'
BASIS = 'https://ie1968.github.io/blackboard/website/'   # Adresse der Website (bei eigener Domain hier ändern)

def seite(datei, titel, aktiv, haupt, kontext, beschreibung, breit=''):
    def nv(f, l, n, c): return f'<a href="{f}"{" aria-current=\"page\"" if l==aktiv else ""}>{ichip(n,c)}<span>{l}</span></a>'
    html = f'''<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'sha256-ocfdhT+urYrxV9FiXf0yRlqZ1YuoEcAx8rsZ8QqhKlA='; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'">
<meta name="robots" content="noindex,nofollow">
<title>{titel} – Skizix</title>
<meta name="description" content="{beschreibung}">
<link rel="canonical" href="{BASIS}{'' if datei=='index.html' else datei}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Skizix">
<meta property="og:locale" content="de_DE">
<meta property="og:title" content="{titel} – Skizix">
<meta property="og:description" content="{beschreibung}">
<meta property="og:url" content="{BASIS}{'' if datei=='index.html' else datei}">
<meta property="og:image" content="{BASIS}bilder/vorschau.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Skizix – digitales Whiteboard">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#3B6FE8">
<link rel="icon" type="image/png" href="../icon-192.png">
<link rel="stylesheet" href="stil.css?v={V}">
<script>try{{if(localStorage.getItem('skizix-web-thema')==='dunkel')document.documentElement.dataset.thema='dunkel'}}catch(e){{}}</script>
</head>
<body>
<a class="sprung" href="#inhalt">Zum Inhalt</a>
<header class="kopf">
  <a class="marke" href="index.html" aria-label="Skizix – Startseite">{LOGO}{WORT}</a>
  <span class="trenner" aria-hidden="true"></span>
  <p class="slogan">Zeichnen, planen, gemeinsam denken – <b class="hand-s">auf jedem Gerät.</b></p>
  <span class="platz"></span>
  <button class="rund" type="button" id="thema" aria-label="Dunkle Ansicht einschalten" title="Hell / Dunkel">{ic("moon")}</button>
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
  </nav>
  <main id="inhalt">
{haupt}
  </main>
{('  <div class="breit">'+breit+'</div>') if breit else ''}
  <footer class="fuss">
    <span>© 2026 Skizix</span>
    <span class="platz"></span>
    <a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a>
  </footer>
</div>
<script src="menue.js?v={V}"></script>
</body>
</html>
'''
    open(os.path.join(ZIEL, datei), 'w', encoding='utf-8').write(html)

def haken(liste, c=MINT): return '<ul class="haken" style="--c:%s">%s</ul>' % (c, ''.join(f'<li>{ic("check")}<span>{x}</span></li>' for x in liste))
def chips(liste): return '<p class="chips">' + ''.join(f'<span>{x}</span>' for x in liste) + '</p>'

# ---------------------------------------------------------------- Startseite
def start():
    hero = karte(f'''<h1>Ein Board für alles, was du im Kopf hast.</h1>
<div class="zwei">
  <div class="text">
    <ul class="hand-liste"><li class="hs-schwarz">Ohne Installation</li><li class="hs-orange">Daten in der EU</li><li class="hs-blau">Gäste ohne Konto</li></ul>
    <p class="knoepfe">{knopf("Kostenlos ausprobieren","haupt","arrow",APP)}</p>
  </div>
  {board("hero")}
</div>''', 'held')
    def bereich(icon, c, name_b, titel, lead, punkte, board_name, link, href, links):
        tafel = f'<div class="b-tafel">{board(board_name)}</div>'
        text = f'''<div class="b-text">
    <p class="lead">{lead}</p>
    {haken(punkte, c)}
    <p class="b-aktion">{knopf("In der App ausprobieren","weich",None,APP)}</p>
  </div>'''
        kopf = f'<div class="b-oben"><p class="b-name">{ichip(icon,c,"klein")}{name_b}</p><h2>{titel}</h2></div>'
        return f'<section class="karte bereich{" links" if links else ""}" style="--c:{c}">{kopf}<div class="b-reihe">{tafel+text if links else text+tafel}</div></section>'
    haupt = hero
    breit = '' \
      + bereich('users',BLUE,'Unterricht &amp; Kurse','Tafelbild, Quiz und Gruppen – <span class="hand-a hs-rot">alle machen per Handy mit.</span>','Teilnehmende treten per <b class="akz">QR-Code</b> bei, ohne Konto, nur mit Spitznamen.',
        ['Live-Quiz mit Ergebnis als Säulen und Rangliste','Gruppen arbeiten gleichzeitig auf eigenen Bereichen','Präsentieren mit Folien, Tafelbild als PDF'],'unterricht','Für den Unterricht','funktionen.html#unterricht',True) \
      + bereich('flow',VIOLET,'Beruf &amp; Projekte','Prozesse zeichnen, Aufgaben verfolgen, <span class="hand-a hs-gruen">Workshops leiten.</span>','<b class="akz">BPMN, Kanban und Retro</b> auf einem Board – live mit dem ganzen Team.',
        ['Pfeile docken magnetisch an Formen an','BPMN 2.0 mit Bahnen und Gateways','Kanban und Scrum als fertige Bausteine'],'beruf','Für Teams','funktionen.html#formen',False) \
      + bereich('heart',CORAL,'Alltag &amp; Familie','Einkauf, Wochenplan und To-dos – <span class="hand-a hs-orange">gemeinsam auf allen Handys.</span>','Wer etwas <b class="akz">abhakt</b>, sieht jeder sofort. Vorlagen für Einkaufsliste, Wochenplaner und To-do-Liste sind schon dabei.',
        ['Einkaufsliste mit Häkchen und Namen','Wochenplaner für die ganze Familie','Notizen und Zeichnungen direkt daneben'],'alltag','Für zu Hause','vorlagen.html',True)
    cta = f'''<section class="karte cta-band">
  <div class="cta-text">
    <h2>Bereit für dein erstes Board? <span class="hand-a hs-blau">Leg einfach los.</span></h2>
    <p class="lead">Im Browser, auf Tablet, PC und Handy – ohne Installation und ohne Anmeldung. Deine Boards bleiben bei dir.</p>
    <p class="b-aktion">{knopf("Kostenlos ausprobieren","haupt","arrow",APP)}</p>
  </div>
  <ul class="cta-punkte">
    <li style="--c:{CORAL}">{ichip("pen",CORAL)}<b>Zeichnen &amp; Formen</b><span>Stifte, Pinsel, über 100 Formen, Pfeile, die andocken</span></li>
    <li style="--c:{BLUE}">{ichip("live",BLUE)}<b>Live mit allen</b><span>Board per Link teilen, Live-Quiz per QR-Code</span></li>
    <li style="--c:{GOLD}">{ichip("grid",GOLD)}<b>Über 20 Vorlagen</b><span>Einkaufsliste bis Business Model Canvas</span></li>
    <li style="--c:{VIOLET}">{ichip("play",VIOLET)}<b>Präsentieren</b><span>Folien, Übergänge, Laserpointer</span></li>
  </ul>
</section>'''
    breit = breit + cta
    kontext = ''
    seite('index.html','Das Whiteboard für Unterricht und Alltag','Start',haupt,kontext,'Skizix: digitales Whiteboard zum Zeichnen, Planen und gemeinsamen Arbeiten – im Unterricht, im Team und mit der Familie.',breit)


# ---------------------------------------------------------------- Wortwolke (Vorlagen)
WOLKE=[('Einkaufsliste',34,'#FF8E7A',-3,1),('Kanban',44,'#7FA6FF',0,0),('Mindmap',30,'#4CC98A',4,1),('Wochenplaner',26,'#F2C94C',0,0),('Scrum',30,'#A898FF',0,0),
       ('SWOT',38,'#F2C94C',-4,1),('BPMN',28,'#7FA6FF',0,0),('To-do-Liste',30,'#4CC98A',0,1),('Retrospektive',22,'#D5DDE2',0,0),('Gantt',32,'#FF8E7A',3,0),
       ('Zeitstrahl',26,'#A898FF',0,1),('Eisenhower',24,'#7FA6FF',-2,0),('Quiz',40,'#4CC98A',0,1),('Roadmap',24,'#F2C94C',0,0),('Ishikawa',20,'#D5DDE2',0,0),
       ('Organigramm',22,'#FF8E7A',0,0),('PDCA',26,'#A898FF',3,0),('RACI',22,'#7FA6FF',0,0),('Empathy Map',20,'#4CC98A',0,0),('5-Why',24,'#F2C94C',-3,1),
       ('Business Model Canvas',18,'#D5DDE2',0,0),('Zahlenstrahl',22,'#FF8E7A',0,0),('Flussdiagramm',24,'#7FA6FF',2,0),('Projektsteckbrief',18,'#A898FF',0,0),('Stakeholder',20,'#4CC98A',0,0)]
worte=''.join(f'<span class="w{" hand" if h else ""}" style="font-size:{z}px;color:{c};transform:rotate({r}deg)">{t}</span>' for t,z,c,r,h in WOLKE)
wolke = f'<div class="b-tafel"><div class="wolke-tafel" role="img" aria-label="Wortwolke mit Vorlagen: Einkaufsliste, Kanban, Mindmap, Wochenplaner, Scrum, SWOT, BPMN, To-do-Liste, Retrospektive, Gantt und viele mehr"><div class="wt-kopf">{LOGO}<span>Vorlagen</span><em>über 20</em></div><div class="wt-worte" aria-hidden="true">{worte}</div></div></div>'
vtext = f'''<div class="b-text">
<p class="lead">Fertige Boards für typische Methoden – vom <b class="akz">Wochenplaner</b> bis zum Business Model Canvas. Alles lässt sich frei anpassen.</p>
{haken(['Alltag: Einkaufsliste, Wochenplaner, To-do-Liste','Unterricht: Quiz, Mindmap, Zahlenstrahl','Beruf: Kanban, SWOT, Gantt, BPMN, Retro'], GOLD)}
<p class="b-aktion">{knopf("Kostenlos ausprobieren","haupt","arrow",APP)}<a class="weiter" href="anleitung.html#vorlagen">So findest du sie {ic("arrow")}</a></p>
  </div>'''
vorl = f'<section class="karte bereich" style="--c:{GOLD}"><div class="b-oben"><p class="b-name">{ichip("grid",GOLD,"klein")}Vorlagen</p><h2>Über 20 Vorlagen – <span class="hand-a hs-blau">ein Klick, und los.</span></h2></div><div class="b-reihe">{vtext}{wolke}</div></section>'

# ---------------------------------------------------------------- Funktionen
GRUPPEN = [('zeichnen','Zeichnen &amp; Schreiben',CORAL,'pen',['Bleistift, Kugelschreiber, Füller und Formstift','Aquarell, Borstenpinsel, Kreide, Kalligrafie und Sprühpinsel','Digitale Stifte mit hoher Druckempfindlichkeit','Text auf dem Board, Absätze einzeln formatierbar','Stifte gleichen sich zwischen deinen Geräten ab']),
           ('formen','Formen &amp; Diagramme',VIOLET,'flow',['Über 100 Formen zum Hineinziehen, mit Suche','BPMN 2.0, Flussdiagramm, UML, ER-Diagramm, Netzwerk, Struktogramm','Pfeile docken magnetisch an','Hilfslinien und Einrasten am Raster']),
           ('bausteine','Bausteine',GOLD,'kanban',['Tabellen','Kanban- und Scrum-Boards','Checklisten zum Abhaken, Aufzählungen und Mindmaps','Vorlagen: Einkaufsliste, Wochenplaner, SWOT, Retro und mehr']),
           ('zusammen','Zusammenarbeit',MINT,'live',['Live auf mehreren Geräten gleichzeitig','Gäste per Link – ohne Konto','Nur-ansehen-Links','Links laufen auf Wunsch automatisch ab']),
           ('unterricht','Unterricht',BLUE,'quiz',['Live-Quiz per Handy: QR-Code scannen, antworten, Rangliste','Quiz-Folien mit Lösung, auch als Umfrage ohne Punkte','Präsentieren mit Folienübergängen, Einblenden und Laserpointer','Tafelflächen wie Tafelgrün, Schiefer, Nacht']),
           ('geraete','Geräte &amp; Daten',MINT,'device',['Läuft im Browser und als App, auch offline','Konto: Boards und Ordner auf allen Geräten','Export als PNG, SVG, PDF und Sicherung','Oberfläche dunkel oder hell'])]
STIFT = {'zeichnen':'#C8321F','formen':'#2F5FD0','bausteine':'#C9601A','zusammen':'#1D1D1F','unterricht':'#1A7F45','geraete':'#7B3FC4'}
def funktionen():
    notizen = ''.join(f'<div class="pi" id="{i}"><div class="notiz gross"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" style="stroke:{STIFT[i]}">{P[n]}</svg><h2 style="color:{STIFT[i]}">{h}</h2><ul>{"".join(f"<li>{x}</li>" for x in p)}</ul></div></div>' for i,h,c,n,p in GRUPPEN)
    haupt = karte('<p class="marker" style="--c:var(--violett)">' + ic('spark') + 'Funktionen</p><h1>Alles, was ein gutes Whiteboard braucht – <span class="hand-a hs-schwarz">schnell verstanden.</span></h1><p class="lead">Sechs Zettel, alles drauf – und ein paar Dinge, die andere nicht haben.</p>') \
      + f'<section class="karte bereich" style="--c:{VIOLET}"><div class="notiz-flaeche"><div class="notizen">{notizen}</div><p class="b-aktion mitte">{knopf("Kostenlos ausprobieren","haupt","arrow",APP)}</p></div></section>'
    kontext = ''
    seite('funktionen.html','Funktionen','Funktionen',haupt,kontext,'Alle Funktionen von Skizix: Zeichnen, Formen, BPMN, Kanban, Live-Zusammenarbeit, Präsentieren und mehr.')

# ---------------------------------------------------------------- Anleitung
def anleitung():
    s = lies('anleitung.html')
    toc = re.search(r'<nav class="toc"[^>]*>.*?</nav>', s, re.S).group(0)
    inhalt = re.sub(r'<nav class="toc"[^>]*>.*?</nav>', '', s, flags=re.S)
    inhalt = re.sub(r'^\s*<div class="wrap layout">\s*', '', inhalt); inhalt = re.sub(r'</div>\s*</div>\s*$', '</div>', inhalt.strip())
    inhalt = inhalt.replace('<div>\n    <h1>Anleitung</h1>', f'<div><p class="marker" style="--c:var(--mint)">{ic("book")}Anleitung</p>\n    <h1>Anleitung</h1>', 1)
    toc2 = toc.replace('class="toc"', 'class="toc oben" aria-label="Inhalt der Anleitung"')
    inhalt = re.sub(r'(<p class="meta">.*?</p>)', lambda m: m.group(1) + '\n    ' + toc2, inhalt, count=1)
    haupt = karte(inhalt, 'text-seite')
    kontext = ''
    seite('anleitung.html','Anleitung','Anleitung',haupt,kontext,'Anleitung zu Skizix: installieren, zeichnen, Formen, Text, Präsentieren, Live teilen, Konto und Ordner.')

# ---------------------------------------------------------------- Vorlagen
# Vorlagen der App: Vorschaubilder erzeugt quelle/website/vorlagen_bilder.py (website/bilder/vorlagen/)
VKAT = {'Einkaufsliste':'Alltag','Wochenplaner':'Alltag','To-do-Liste':'Alltag',
        'Quiz':'Unterricht','Mindmap':'Unterricht','Zahlenstrahl 0–20':'Unterricht','Zahlenstrahl 0–100':'Unterricht','Zeitstrahl':'Unterricht','Zeitstrahl senkrecht':'Unterricht','PDCA-Zyklus':'Unterricht','5-Why-Analyse':'Unterricht','Ishikawa-Diagramm':'Unterricht'}
VINFO_EXTRA = {'Quiz':'Frage mit Antworten – live per Handy oder mit „Lösung“ in der Präsentation','Kanban-Board':'To Do, In Arbeit, Erledigt','Scrum-Board':'Backlog, Sprint, Review','Mindmap':'Thema mit Zweigen, per „+ Zweig“ erweiterbar'}
def vorlagen_infos():
    js = open(os.path.join(HIER,'..','js','14-vorlagen.js'),encoding='utf-8').read()
    return dict(re.findall(r"\{name:'([^']+)',info:'([^']+)'", js))
def vorlagen():
    KAT={'Alltag':CORAL,'Unterricht':BLUE,'Beruf':VIOLET}
    liste = json.load(open(os.path.join(ZIEL,'bilder','vorlagen','liste.json'),encoding='utf-8'))
    infos = vorlagen_infos(); infos.update(VINFO_EXTRA)
    reihen = {'Alltag':0,'Unterricht':1,'Beruf':2}
    liste.sort(key=lambda v: reihen[VKAT.get(v['name'],'Beruf')])
    def kachel(v):
        k = VKAT.get(v['name'],'Beruf')
        return (f'<a class="vk karte" href="{APP}" data-kat="{k}" style="--c:{KAT[k]}"><span class="vbild"><img src="bilder/vorlagen/{v["datei"]}" width="{v["w"]}" height="{v["h"]}" loading="lazy" alt="Vorlage {v["name"]} in der App"><em>{k}</em></span>'
                f'<span class="vname">{v["name"]}{ic("arrow")}</span><span class="vinfo">{infos.get(v["name"],"")}</span></a>')
    kacheln = ''.join(kachel(v) for v in liste)
    filt = ''.join(f'<button type="button" class="filter" data-kat="{k}" aria-pressed="{str(i==0).lower()}" style="--c:{c}">{k if k!="*" else "Alle"}</button>' for i,(k,c) in enumerate([('*',BLUE),('Alltag',CORAL),('Unterricht',BLUE),('Beruf',VIOLET)]))
    haupt = karte(f'<p class="marker" style="--c:var(--gold)">{ic("grid")}Vorlagen</p><h1>Vorlagen</h1><p class="lead">So sehen die {len(liste)} Vorlagen in der App aus. Du findest sie links in der Formenleiste unter <b>Vorlagen → Alle Vorlagen</b> – alles lässt sich frei anpassen.</p><p class="filterzeile" role="group" aria-label="Vorlagen filtern">{filt}</p>') + vorl + f'<div class="raster3" id="vorlagen">{kacheln}</div>'
    kontext = ''
    seite('vorlagen.html','Vorlagen','Vorlagen',haupt,kontext,'Vorlagen für Skizix: Einkaufsliste, Wochenplaner, Kanban, SWOT, Mindmap, Gantt, Retro und mehr – so sehen sie in der App aus.')

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
    start(); funktionen(); anleitung(); vorlagen()
    recht('datenschutz.html','Datenschutz','Datenschutz','shield',MINT, '', 'Datenschutzerklärung von Skizix: welche Daten das Whiteboard speichert, wo sie liegen (EU) und welche Rechte du hast.')
    recht('impressum.html','Impressum','Impressum','info',BLUE, '', 'Impressum von Skizix, dem digitalen Whiteboard für Unterricht, Beruf und Alltag.')
    css()
    shutil.copy(os.path.join(HIER,'menue.js'), os.path.join(ZIEL,'menue.js'))
    # Sitemap für Suchmaschinen (wirkt erst, wenn „noindex“ entfernt ist)
    import datetime
    heute = datetime.date.today().isoformat()
    urls = ''.join(f'<url><loc>{BASIS}{"" if f=="index.html" else f}</loc><lastmod>{heute}</lastmod></url>' for f in ['index.html','funktionen.html','vorlagen.html','anleitung.html','datenschutz.html','impressum.html'])
    open(os.path.join(ZIEL,'sitemap.xml'),'w',encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls+'</urlset>\n')
    for alt in ['stil-hell.css','testphase.html']:
        p = os.path.join(ZIEL, alt)
        if os.path.exists(p): os.remove(p)
    print('Website gebaut:', ', '.join(sorted(f for f in os.listdir(ZIEL) if f.endswith('.html'))))
