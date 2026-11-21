#!/usr/bin/env python3
"""Erzeugt die Oberflächen-Strukturen (Used-Look, Stein, Textil, Schiefer) als SVG-Daten-Adressen
und schreibt sie in css/aussehen.css zwischen die Markierungen /*texturen{*/ und /*}texturen*/.
Die Strukturen entstehen aus Rauschfiltern (feTurbulence), es werden keine Bilder geladen."""
import os,re,urllib.parse
Q=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def flt(i,freq,oct_,seed,rgb,a,b):
    r,g,bb=rgb
    return (f"<filter id='{i}' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='{freq}' numOctaves='{oct_}' seed='{seed}' stitchTiles='stitch'/>"
            f"<feColorMatrix values='0 0 0 0 {r} 0 0 0 0 {g} 0 0 0 0 {bb} {a} 0 0 0 {b}'/></filter>")
def svg(size,layers,big=False):
    w,h=(1800,1200) if big else (size,size)   # große Flächen ohne Kacheln: keine sichtbaren Nahtstellen
    f=''.join(flt(*l[:7]) for l in layers); rects=''.join(f"<rect width='{w}' height='{h}' filter='url(#{l[0]})' opacity='{l[7]}'/>" for l in layers)
    s=f"<svg xmlns='http://www.w3.org/2000/svg' width='{w}' height='{h}' viewBox='0 0 {w} {h}' preserveAspectRatio='xMidYMid slice'>{f}{rects}</svg>"
    return "url(\"data:image/svg+xml,"+urllib.parse.quote(s,safe="=:/' ")+"\")"
DK=(0.24,0.2,0.15); LT=(1,1,0.97)
T={
 # Vintage hell: fleckig verblasst, feine Körnung, ein paar Kratzer
 'used':  [svg(480,[('a','0.006',4,3,DK,1.5,-0.6,.42),('b','0.035',3,8,DK,1.6,-0.78,.30),('c','0.9',1,5,DK,1.2,-0.5,.32),('d','0.002 0.45',2,11,DK,2.2,-1.45,.35)],True),
           'radial-gradient(ellipse at center,transparent 55%,rgba(70,52,30,.20) 100%)'],
 # Vintage dunkel: kohlschwarz mit helleren Wolken, Staub und Kratzern
 'usedd': [svg(480,[('a','0.006',4,4,LT,1.5,-0.62,.16),('b','0.04',3,9,LT,1.6,-0.8,.12),('c','0.9',1,6,LT,1.3,-0.62,.16),('d','0.002 0.5',2,12,LT,2.4,-1.6,.22)],True),
           'radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.35) 100%)'],
 # Stein: gesprenkelt mit Poren
 'stone': [svg(420,[('a','0.012',5,2,DK,1.4,-0.55,.35),('b','0.11',3,7,DK,1.5,-0.62,.28),('c','0.55',1,13,DK,2.6,-1.75,.55),('d','0.55',1,17,LT,2.6,-1.8,.6)],True),
           'radial-gradient(ellipse at center,transparent 60%,rgba(40,40,40,.12) 100%)'],
 # Textil: grobes Gewebe in beiden Richtungen
 'cloth': [svg(300,[('a','0.95 0.06',2,4,DK,1.7,-0.75,.32),('b','0.06 0.95',2,9,DK,1.7,-0.75,.28),('c','0.02',3,3,DK,1.3,-0.55,.22),('d','1.2',1,6,LT,1.4,-0.6,.35)]),
           'repeating-linear-gradient(0deg,rgba(70,60,45,.07) 0 1px,transparent 1px 4px)','repeating-linear-gradient(90deg,rgba(70,60,45,.07) 0 1px,transparent 1px 4px)'],
 # Schiefer verwaschen: helle Kreidereste und Wischspuren
 'slate': [svg(480,[('a','0.003',4,5,LT,1.5,-0.55,.15),('b','0.0025 0.018',3,10,LT,1.5,-0.68,.08),('c','0.04',3,14,LT,1.5,-0.7,.06),('d','0.9',1,7,LT,1.2,-0.55,.09)],True),
           'radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.28) 100%)'],
}
BIG={'used','usedd','stone','slate'}
css='\n'.join(f'#stage[data-surf="{k}"],.vpChip.s-{k}{{background-image:{",".join(v)}!important;background-size:{"cover" if k in BIG else "auto"}!important;background-position:center!important}}' for k,v in T.items())
p=os.path.join(Q,'css','aussehen.css'); s=open(p,encoding='utf-8').read()
block='/*texturen{*/\n'+css+'\n/*}texturen*/'
s=re.sub(r'/\*texturen\{\*/.*?/\*\}texturen\*/',lambda m:block,s,flags=re.S) if '/*texturen{*/' in s else s+'\n/* Strukturen der Tafel, erzeugt von werkzeuge/texturen.py */\n'+block+'\n'
open(p,'w',encoding='utf-8').write(s); print('Strukturen geschrieben:',', '.join(T))
