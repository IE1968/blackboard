"""PDF-Export: alle sechs Board-Schriften (auch fett und kursiv) werden als echte Schriften eingebettet, Text ist durchsuchbar."""
import sys,os,subprocess; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
from playwright.sync_api import sync_playwright
FF=['mono','sans','serif','school','display','hand']
srv=server()
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME); pg=br.new_page(viewport={'width':1440,'height':900},accept_downloads=True); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(600)
  its=[]
  for i,f in enumerate(FF):
    o={'id':f'a{i}','type':'shape','kind':'text','x':0,'y':i*60,'w':520,'h':50,'text':f'Schrift {f} Äpfel ß €','fill':'none','stroke':'#1c2a2e','sw':2,'fs':24}
    if f!='mono': o['ff']=f
    its.append(o)
    b=dict(o,id=f'b{i}',x=600,text=f'Fett {f}',bold=True); its.append(b)
    k=dict(o,id=f'c{i}',x=1000,text=f'Kursiv {f}',it=True,ul=True); its.append(k)
  pg.evaluate(LOAD,{'items':its,'n':40,'fmt':2}); pg.reload(); pg.wait_for_timeout(1200)
  with pg.expect_download(timeout=40000) as d: exportiere(pg,'pdf')
  pdf=d.value.path()
  fonts=subprocess.run(['pdffonts',pdf],capture_output=True,text=True).stdout
  for nm in ('RobotoMono','SkizixKlar','Lora','Andika','ArchivoBlack','Caveat'):
    check(f'{nm} als Schrift eingebettet',nm in fonts and 'yes' in fonts,fonts[-300:])
  check('Fette Schnitte eingebettet',all(x in fonts for x in ('Lora-600','Andika-700','SkizixKlar-600','Caveat-600')),fonts)
  txt=subprocess.run(['pdftotext',pdf,'-'],capture_output=True,text=True).stdout
  check('Text im PDF durchsuchbar (alle Schriften, Umlaute)',all(f'Schrift {f}' in txt for f in FF) and 'Äpfel' in txt and 'Kursiv hand' in txt,txt[:300])
  imgs=subprocess.run(['pdfimages','-list',pdf],capture_output=True,text=True).stdout.strip().split('\n')[2:]
  check('Keine Text-Bilder mehr',len(imgs)==0,str(len(imgs)))
  check('Keine Fehler',not errs,str(errs))
  br.close()
finally: srv.terminate()
