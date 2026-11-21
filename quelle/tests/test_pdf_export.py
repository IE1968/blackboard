import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Vektor-PDF: eine Seite pro Folie, echter Text, eingebettete Schrift, gültige Datei."""
import json,subprocess,shutil
from playwright.sync_api import sync_playwright
srv=server(); errs=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
  pg=b.new_context(viewport={'width':1400,'height':900},accept_downloads=True).new_page()
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(600)
  pg.evaluate(LOAD,json.load(open(DATEN+'/BPMN-2.0-Tutorial.json',encoding='utf-8'))); pg.reload(); pg.wait_for_timeout(900)
  openFile(pg)
  with pg.expect_download(timeout=60000) as dl: pg.click('#menu [data-m="pdf"]')
  f=OUT+'/tutorial.pdf'; dl.value.save_as(f)
  pdf=open(f,'rb').read()
  check('PDF erzeugt',pdf.startswith(b'%PDF-1.5'))
  check('Vektor statt Bild (Schrift eingebettet)',b'/FontFile2' in pdf and b'/DCTDecode' not in pdf)
  check('Größe unter 600 KB',len(pdf)<600_000,f'{len(pdf)//1024} KB')
  if shutil.which('pdfinfo'):
    info=subprocess.run(['pdfinfo',f],capture_output=True,text=True).stdout
    check('20 Seiten (eine pro Folie)','Pages:           20' in info)
  if shutil.which('pdftotext'):
    t=subprocess.run(['pdftotext','-f','3','-l','3',f,'-'],capture_output=True,text=True).stdout
    check('Text ist durchsuchbar (Umlaute)','Die fünf Elementgruppen' in t and 'Aktivität' in t,t[:80])
  if shutil.which('qpdf'):
    r=subprocess.run(['qpdf','--check',f],capture_output=True,text=True); check('Datei fehlerfrei (qpdf)',r.returncode==0,r.stdout[-120:])
  check('keine Fehler',not errs,str(errs))
  b.close()
finally: srv.terminate()
