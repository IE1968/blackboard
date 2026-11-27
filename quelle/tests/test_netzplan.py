import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Vorlagen Netzplan, Netzplan – Präsentation und Netzplan – Quiz: Werte stimmen, Folien und Quizfragen sind vollständig."""
import re,subprocess,time
from playwright.sync_api import sync_playwright

# 1) Die vorgerechneten Werte im Quelltext nachrechnen (Vorwärts- und Rückwärtsrechnung)
src=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','js','14-vorlagen.js'),encoding='utf-8').read()
rows=re.findall(r"\['([A-G])','[^']*',(\d+),'([^']*)',(\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\]",src)
check('Vorgangsliste gefunden',len(rows)==7,str(len(rows)))
V={r[0]:dict(d=int(r[1]),vor=[x.strip() for x in r[2].split(',') if x.strip() not in ('–','')],w=list(map(int,r[3:]))) for r in rows}
faz,fez,saz,sez={},{},{},{}
for k in 'ABCDEFG':
  faz[k]=max([fez[v] for v in V[k]['vor']],default=0); fez[k]=faz[k]+V[k]['d']
nach={k:[x for x in V if k in V[x]['vor']] for k in V}; ende=max(fez.values())
for k in reversed('ABCDEFG'):
  sez[k]=min([saz[n] for n in nach[k]],default=ende); saz[k]=sez[k]-V[k]['d']
fehler=[]
for k in V:
  gp=saz[k]-faz[k]; fp=min([faz[n] for n in nach[k]],default=ende)-fez[k]
  if V[k]['w']!=[faz[k],fez[k],saz[k],sez[k],gp,fp]: fehler.append((k,V[k]['w'],[faz[k],fez[k],saz[k],sez[k],gp,fp]))
check('Alle Knotenwerte richtig gerechnet',not fehler,str(fehler))
check('Projektdauer 8 Tage, kritischer Weg A-D-E-F-G',ende==8 and [k for k in V if saz[k]==faz[k]]==list('ADEFG'))

srv=server(); errs=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
  pg=b.new_page(viewport={'width':1400,'height':900})
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(700)
  READ="async()=>{await new Promise(r=>setTimeout(r,400));const b=JSON.parse(localStorage.getItem('blackboard-boards'));const db=await new Promise(r=>{const q=indexedDB.open('blackboard',1);q.onsuccess=()=>r(q.result)});const v=await new Promise(r=>{const q=db.transaction('docs').objectStore('docs').get(b.cur);q.onsuccess=()=>r(q.result)});db.close();return JSON.parse(v)}"
  def vorlage(name):
    leeren(pg); pg.evaluate("()=>document.querySelector('[data-tpl]').click()"); pg.wait_for_timeout(300)
    pg.locator('#tplGrid .tc',has=pg.locator('b',has_text=re.compile('^'+re.escape(name)+'$'))).click(); pg.wait_for_timeout(400)
    return pg.evaluate(READ)['items']
  pg.evaluate("()=>document.querySelector('[data-tpl]').click()"); pg.wait_for_timeout(300)
  namen=pg.evaluate("()=>[...document.querySelectorAll('#tplGrid .tc')].filter(b=>b.dataset.kat==='Unterricht').map(b=>b.querySelector('b').textContent)")
  check('Drei Netzplan-Vorlagen unter Unterricht',all(n in namen for n in ['Netzplan','Netzplan – Präsentation','Netzplan – Quiz']),str(namen))
  pg.keyboard.press('Escape')

  its=vorlage('Netzplan')
  txt=[str(i.get('text','')) for i in its]
  check('Netzplan: Legende und Formeln',any('Legende' in t for t in txt) and any('FEZ = FAZ + D' in t for t in txt) and any('GP = SAZ − FAZ' in t for t in txt))
  check('Netzplan: alle Abkürzungen erklärt',all(any(a in t for t in txt) for a in ['frühester Anfangszeitpunkt','frühester Endzeitpunkt','spätester Anfangszeitpunkt','spätester Endzeitpunkt','Gesamtpuffer','freier Puffer']))
  rot=[i for i in its if i.get('type')=='conn' and i.get('stroke')=='#c94040']
  check('Netzplan: 6 Pfeile, davon 4 auf dem kritischen Weg rot',len([i for i in its if i.get('type')=='conn'])==6 and len(rot)==4,str(len(rot)))
  pg.screenshot(path='/tmp/bb-tests/netzplan.png')

  its=vorlage('Netzplan – Präsentation')
  fr=[i for i in its if i.get('kind')=='frame']
  check('Präsentation: 9 Folien in Reihenfolge',len(fr)==9 and [f.get('ord') for f in sorted(fr,key=lambda f:f['ord'])]==list(range(1,10)))
  frei=[i for i in its if i.get('kind')!='frame' and not (i.get('type')=='conn') and not i.get('fr')]
  check('Präsentation: alles liegt innerhalb einer Folie',not frei,str([i.get('text','')[:30] for i in frei]))
  pg.screenshot(path='/tmp/bb-tests/netzplan_praes.png')

  its=vorlage('Netzplan – Quiz')
  fr=[i for i in its if i.get('kind')=='frame']
  ans={}
  for i in its:
    if i.get('kind')=='check': ans.setdefault(i.get('fr'),[]).append(bool(i.get('ok')))
  check('Quiz: Titelfolie und 8 Fragen',len(fr)==9 and len(ans)==8,f"{len(fr)} Folien, {len(ans)} Fragen")
  check('Quiz: je Frage 3 Antworten, genau eine richtig',all(len(a)==3 and sum(a)==1 for a in ans.values()))
  pg.screenshot(path='/tmp/bb-tests/netzplan_quiz.png')
  check('Keine Fehler auf der Seite',not errs,str(errs[:3]))
  b.close()
finally: srv.terminate()
