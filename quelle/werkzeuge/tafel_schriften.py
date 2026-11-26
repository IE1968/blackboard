#!/usr/bin/env python3
"""Erzeugt die eingebetteten Board-Schriften (statische Schnitte, WOFF), damit der PDF-Export sie
als echte Schriften einbetten kann: css/schrift-zusatz.css (Klar, Serifen, Schulschrift, Plakativ)
und css/schrift-hand.css (Handschrift).
Quelle: ein Checkout von github.com/google/fonts (Pfad als 1. Argument, Standard /tmp/gf).
Ohne GSUB/GPOS: keine Unterschneidung/Ligaturen – so stimmen Bildschirm und PDF Zeichen für Zeichen überein."""
import sys,os,io,base64
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
G=(sys.argv[1] if len(sys.argv)>1 else '/tmp/gf')+'/ofl/'
HIER=os.path.dirname(os.path.abspath(__file__)); CSS=os.path.join(HIER,'..','css')
TXT=''.join(chr(c) for c in list(range(0x20,0x7f))+list(range(0xa0,0x180)))+'–—„“”‚‘’…•€→←↑↓✓✗·×÷±°²³½¼¾'
def face(fam,pfad,gewicht,wght=None):
    f=TTFont(pfad)
    if 'fvar' in f: f=instancer.instantiateVariableFont(f,{'wght':wght or gewicht},updateFontNames=False)
    o=subset.Options(); o.flavor='woff'; o.layout_features=[]; o.drop_tables+=['GSUB','GPOS','GDEF','STAT','kern']; o.name_IDs=[0,1,2,3,4,5,6]; o.notdef_outline=True; o.hinting=False
    s=subset.Subsetter(o); s.populate(text=TXT); s.subset(f)
    b=io.BytesIO(); f.flavor='woff'; f.save(b); d=b.getvalue()
    print(f'{fam} {gewicht}: {len(d)//1024} KB')
    return f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{gewicht};font-display:swap;src:url(data:font/woff;base64,{base64.b64encode(d).decode()}) format('woff')}}\n"
zus=(face('Skizix Klar',G+'plusjakartasans/PlusJakartaSans[wght].ttf',400)+face('Skizix Klar',G+'plusjakartasans/PlusJakartaSans[wght].ttf',600)
    +face('Lora',G+'lora/Lora[wght].ttf',400)+face('Lora',G+'lora/Lora[wght].ttf',600)
    +face('Andika',G+'andika/Andika-Regular.ttf',400)+face('Andika',G+'andika/Andika-Bold.ttf',700)
    +face('Archivo Black',G+'archivoblack/ArchivoBlack-Regular.ttf',400))
open(os.path.join(CSS,'schrift-zusatz.css'),'w').write(zus)
open(os.path.join(CSS,'schrift-hand.css'),'w').write(face('Caveat',G+'caveat/Caveat[wght].ttf',400)+face('Caveat',G+'caveat/Caveat[wght].ttf',600))
