#!/usr/bin/env python3
"""Erzeugt Vorschaubilder der App-Vorlagen für die Website (website/bilder/vorlagen/*.webp).
Fügt jede Vorlage in der echten App ein und exportiert das Board als PNG. Aufruf: python3 quelle/website/vorlagen_bilder.py"""
import os, sys, io, re, json
HIER=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,os.path.join(HIER,'..','tests'))
from hilfe import server, CHROME, URL, openFile, exportiere, leeren
from playwright.sync_api import sync_playwright
from PIL import Image
ZIEL=os.path.join(HIER,'..','..','website','bilder','vorlagen'); os.makedirs(ZIEL,exist_ok=True)
def slug(n): return re.sub(r'[^a-z0-9]+','-',n.lower().replace('ä','ae').replace('ö','oe').replace('ü','ue').replace('ß','ss')).strip('-')
srv=server(); liste=[]
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
  pg=br.new_page(viewport={'width':1600,'height':1000},accept_downloads=True); pg.goto(URL); pg.wait_for_timeout(1200)
  def leeren_(): leeren(pg); pg.wait_for_timeout(150); pg.keyboard.press('Escape')
  def sichern(name):
      pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
      with pg.expect_download(timeout=20000) as dl: exportiere(pg,'png')
      im=Image.open(dl.value.path()).convert('RGB'); w=900; im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)
      f=slug(name)+'.webp'; im.save(os.path.join(ZIEL,f),'WEBP',quality=82); liste.append({'name':name,'datei':f,'w':im.width,'h':im.height}); print(name,im.size)
  pg.evaluate("()=>document.querySelector('[data-tpl]').click()"); pg.wait_for_timeout(300)
  namen=pg.locator('#tplGrid .tc b').all_text_contents(); pg.keyboard.press('Escape')
  for i,n in enumerate(namen):
      leeren_(); pg.evaluate("()=>document.querySelector('[data-tpl]').click()"); pg.wait_for_timeout(250)
      pg.locator('#tplGrid .tc').nth(i).click(); pg.wait_for_timeout(500); sichern(n)
  leeren_(); pg.evaluate("()=>{for(let i=0;i<14;i++){const h=[...document.querySelectorAll('.gh')].find(h=>h.getAttribute('aria-expanded')==='false'); if(!h) break; h.click();}}")
  pg.focus('.pal[data-kind="quiz"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(300); sichern('Quiz')
  br.close()
finally: srv.terminate()
json.dump(liste,open(os.path.join(ZIEL,'liste.json'),'w'),ensure_ascii=False,indent=1)
