"""Echte Handschrift für das Vorführvideo: Text in der Schrift Caveat zeichnen, auf eine Linie
(Skelett) verdünnen und daraus Stiftstriche in Schreibreihenfolge machen."""
import math
from PIL import Image,ImageDraw,ImageFont
import numpy as np
from skimage.morphology import skeletonize
import os
FONT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','website','schriften','Caveat.ttf')
N8=[(-1,-1),(0,-1),(1,-1),(-1,0),(1,0),(-1,1),(0,1),(1,1)]
def _rdp(P,eps):
    if len(P)<3: return P
    a,b=P[0],P[-1]; dx,dy=b[0]-a[0],b[1]-a[1]; L=math.hypot(dx,dy) or 1e-9
    i,dm=0,0
    for k in range(1,len(P)-1):
        d=abs(dy*P[k][0]-dx*P[k][1]+b[0]*a[1]-b[1]*a[0])/L
        if d>dm: i,dm=k,d
    if dm>eps: return _rdp(P[:i+1],eps)[:-1]+_rdp(P[i:],eps)
    return [a,b]
def strokes(text,x0,base,hoehe,gewicht=520,px=220):
    f=ImageFont.truetype(FONT,px)
    try: f.set_variation_by_axes([gewicht])
    except Exception: pass
    m=40; w=int(f.getlength(text))+2*m; h=int(px*1.6)
    im=Image.new('L',(w,h),255); d=ImageDraw.Draw(im); bl=int(px*1.05)
    d.text((m,bl),text,font=f,fill=0,anchor='ls')
    sk=skeletonize(np.array(im)<128)
    pts={(x,y) for y,x in zip(*np.nonzero(sk))}
    nb=lambda p:[(p[0]+a,p[1]+b) for a,b in N8 if (p[0]+a,p[1]+b) in pts]
    besucht=set(); linien=[]
    def frei(p): return [q for q in nb(p) if q not in besucht]
    while True:
        rest=[p for p in pts if p not in besucht]
        if not rest: break
        ends=[p for p in rest if len(frei(p))<=1]
        start=min(ends or rest,key=lambda p:(p[0],p[1]))
        L=[start]; besucht.add(start); richt=None
        while True:
            c=frei(L[-1])
            if not c: break
            if richt: c.sort(key=lambda q:-((q[0]-L[-1][0])*richt[0]+(q[1]-L[-1][1])*richt[1]))
            q=c[0]; richt=(q[0]-L[-1][0],q[1]-L[-1][1]); L.append(q); besucht.add(q)
        if len(L)>=6: linien.append(_rdp([(float(x),float(y)) for x,y in L],1.1))
    # zusammengehörige Stücke verbinden: Ende eines Strichs nahe Anfang/Ende eines anderen
    linien.sort(key=lambda L:min(p[0] for p in L))
    s=hoehe/px
    out=[[(x0+(x-m)*s, base+(y-bl)*s) for x,y in L] for L in linien]
    return out
if __name__=='__main__':
    from PIL import Image as I
    im=I.new('RGB',(1100,360),'white'); d=ImageDraw.Draw(im)
    for L in strokes('Hallo',40,140,110): d.line(L,fill='black',width=4,joint='curve')
    for L in strokes('Danke für Ihre Aufmerksamkeit!',40,300,60): d.line(L,fill='black',width=3,joint='curve')
    im.save('/tmp/caveat.png'); print(len(strokes('Hallo',0,0,100)),len(strokes('Danke für Ihre Aufmerksamkeit!',0,0,100)))
