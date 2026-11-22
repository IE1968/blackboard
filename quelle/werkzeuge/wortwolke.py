"""Wortwolke der Vorlagen und Methoden für die Website – auf einer großen Tafel (Monitor mit Fuß).
Aufruf: python3 quelle/werkzeuge/wortwolke.py  → website/bilder/vorlagen-wolke.svg
Die Wörter werden als Pfade aus Roboto Mono (fett) geschrieben, damit sie überall gleich aussehen."""
import os, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
HIER=os.path.dirname(os.path.abspath(__file__)); WURZEL=os.path.join(HIER,'..','..')
TTF=os.path.join(WURZEL,'RobotoMono-VariableFont_wght.ttf')
ZIEL=os.path.join(WURZEL,'website','bilder','vorlagen-wolke.svg')
WOERTER={'Kanban':10,'Mindmap':10,'Scrum':9,'Gantt':9,'SWOT':8,'Zeitstrahl':8,'Roadmap':7,'BPMN':7,'Retrospektive':6,'Eisenhower':6,
 'Brainstorming':5,'Flussdiagramm':6,'Präsentation':6,'Zahlenstrahl':5,'Ishikawa':5,'Organigramm':5,'PDCA':5,'RACI':5,'Canvas':5,'Sprint':5,
 'Backlog':4,'Meilensteine':4,'Stakeholder':4,'Steckbrief':4,'Empathy Map':4,'5-Why':4,'UML':4,'ER-Diagramm':4,'Struktogramm':4,'Netzwerk':4,
 'Prozesslandkarte':4,'Tabelle':3,'Quiz':3,'Folien':3,'Ideen':3,'Aufgaben':3,'Team':3,'Workshop':3,'Unterricht':3,'Projekt':3,'Planung':3,
 'Notizen':3,'Ziele':2,'Review':2,'Daily':2,'To-do':2,'Prozess':2,'Analyse':2,'Entscheidung':2,'Feedback':2,'Lernen':2,'kreativ':2,'Struktur':2,
 'Agenda':2,'Pfeile':2,'Formen':2,'Skizze':2,'live':2,'Kunde':2,'Risiken':2,'Chancen':2,'Stärken':2,'Termin':2,'Wochenplan':2,'Sprintziel':2,
 'Timeline':2,'Aktivität':1,'Lane':1,'Gateway':1,'Ereignis':1,'Klasse':1,'Entität':1,'Schleife':1,'Router':1,'Server':1,'Cloud':1,'Start':1,
 'Ende':1,'Ja':1,'Nein':1,'Phase':1,'Woche':1,'Quartal':1,'Version':1,'Test':1,'Abnahme':1,'Konzept':1,'Design':1,'Daten':1,'Rollen':1,'Ursache':1,
 'Wirkung':1,'Lösung':1,'Frage':1,'Antwort':1,'Folie':1,'Laser':1,'Stift':1,'Marker':1,'Pinsel':1,'Tafel':1}
FARBEN=['#f25022','#7fba00','#00a4ef','#ffb900']; KLEIN='#8c969c'
W,H=900,560; RAND=3
def main(seed=7):
    random.seed(seed)
    f=TTFont(TTF); gf=instantiateVariableFont(f,{'wght':700}); gs=gf.getGlyphSet(); cmap=gf.getBestCmap(); upm=gf['head'].unitsPerEm
    belegt=np.zeros((H,W),bool); teile=[]
    for i,(wort,g) in enumerate(sorted(WOERTER.items(),key=lambda x:-x[1])):
        fs=round(12+g*8.2); senk=g<=6 and random.random()<0.22
        font=ImageFont.truetype(TTF,fs)
        try: font.set_variation_by_axes([700])
        except Exception: pass
        bb=font.getbbox(wort,anchor='ls'); tw,th=bb[2]-bb[0]+2*RAND, bb[3]-bb[1]+2*RAND
        im=Image.new('L',(tw,th),0); ImageDraw.Draw(im).text((RAND-bb[0],RAND-bb[1]),wort,font=font,fill=255,anchor='ls')
        m=np.array(im)>40
        m=np.pad(m,RAND)[:, :]  # Abstand
        from scipy.ndimage import binary_dilation
        m=binary_dilation(m,iterations=RAND)
        if senk: m=np.rot90(m)
        mh,mw=m.shape; platz=None
        for k in range(9000):
            a=k*0.11; r=2.2*a
            x=int(W/2+r*math.cos(a)*1.6-mw/2); y=int(H/2+r*math.sin(a)-mh/2)
            if x<0 or y<0 or x+mw>W or y+mh>H: continue
            if not (belegt[y:y+mh,x:x+mw]&m).any(): platz=(x,y); break
        if not platz: continue
        x,y=platz; belegt[y:y+mh,x:x+mw]|=m
        farbe=FARBEN[i%4] if g>=3 else (FARBEN[i%4] if random.random()<.55 else KLEIN)
        # Pfad aus der Schrift: Grundlinie im unverdrehten Bild bei (2*RAND-bb[0], 2*RAND-bb[1])
        s=fs/upm; px=0; d=[]
        for ch in wort:
            gn=cmap.get(ord(ch));
            if gn is None: continue
            pen=SVGPathPen(gs); gs[gn].draw(TransformPen(pen,(s,0,0,-s,px*s,0))); import re; d.append(re.sub(r'-?\d+\.\d+',lambda m_:f'{float(m_.group()):.1f}'.rstrip('0').rstrip('.'),pen.getCommands())); px+=gs[gn].width
        bx,by=2*RAND-bb[0],2*RAND-bb[1]
        if not senk: tr=f'translate({x+bx:.1f} {y+by:.1f})'
        else: tr=f'translate({x+by:.1f} {y+mh-bx:.1f}) rotate(-90)'   # 90° gegen den Uhrzeigersinn
        teile.append(f'<path transform="{tr}" fill="{farbe}" d="{"".join(d)}"/>')
    # Tafel: Monitor mit Fuß wie im Logo, groß
    TX,TY=50,50
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 790" role="img" aria-label="Wortwolke mit Vorlagen und Methoden: Kanban, Mindmap, Scrum, Gantt, SWOT, Zeitstrahl, Roadmap, BPMN und viele mehr">
<rect x="22" y="22" width="956" height="616" rx="40" fill="#101617" stroke="#16202a" stroke-width="20"/>
<path d="M500 650V722M70 744H930" stroke="#16202a" stroke-width="20" stroke-linecap="round"/>
<g transform="translate({TX} {TY})">{"".join(teile)}</g></svg>'''
    open(ZIEL,'w').write(svg); print('Wörter platziert:',len(teile),'von',len(WOERTER),'·',os.path.getsize(ZIEL)//1024,'KB')
if __name__=='__main__': main()
