import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Stift: Druck verändert die Strichbreite (Stift und Pinsel), Stufen unter „Ansicht“, Finger verschiebt nach Stifterkennung."""
from playwright.sync_api import sync_playwright
srv=server(); errs=[]
DRAW="""async ([type,press,x0])=>{ const s=document.getElementById('board'), r=s.getBoundingClientRect();
  const ev=(t,x,y,p)=>s.dispatchEvent(new PointerEvent(t,{pointerId:type==='pen'?7:9,pointerType:type,isPrimary:true,clientX:r.left+x,clientY:r.top+y,pressure:p,button:0,buttons:t==='pointerup'?0:1,bubbles:true,cancelable:true}));
  ev('pointerdown',x0,300,press[0]); for(let i=1;i<press.length;i++){ ev('pointermove',x0+i*6,300+Math.sin(i/3)*20,press[i]); await new Promise(q=>setTimeout(q,5)); } ev('pointerup',x0+press.length*6,300,0); }"""
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox']); pg=br.new_page(viewport={'width':1400,'height':900})
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(800)
  leeren(pg); pg.wait_for_timeout(200)
  pg.click('#tools [data-tool="pen"]')
  ramp=[0.05+0.9*i/40 for i in range(41)]
  pg.evaluate(DRAW,['pen',ramp,300]); pg.wait_for_timeout(400)
  paths=[i for i in pg.evaluate(READ)['items'] if i['type']=='path']
  w=paths[-1].get('ws') if paths else None
  check('Stift mit Druck: Breite gespeichert',bool(w) and len(w)==len(paths[-1]['pts']),str(w)[:80])
  check('Mehr Druck = dickerer Strich',bool(w) and w[-1]>w[2]*2.5,f'{w[2] if w else None} -> {w[-1] if w else None}')
  ui=pg.evaluate("()=>JSON.parse(localStorage.getItem('blackboard-ui'))")
  check('Stift erkannt: Finger zeichnet nicht mehr',ui.get('finger') is False)
  # Finger verschiebt statt zu zeichnen
  n=len(paths); pg.evaluate(DRAW,['touch',[0.5]*20,600]); pg.wait_for_timeout(300)
  check('Finger zeichnet nicht, verschiebt',len([i for i in pg.evaluate(READ)['items'] if i['type']=='path'])==n)
  # Stufe „Stark“ spreizt mehr als „Leicht“
  def spread(level):
      pg.click('#viewBtn'); pg.click('#viewPop [data-vt=\"geraet\"]'); pg.click(f'#pressRow [data-press="{level}"]'); pg.keyboard.press('Escape')
      pg.evaluate(DRAW,['pen',ramp,300]); pg.wait_for_timeout(300)
      w=[i for i in pg.evaluate(READ)['items'] if i['type']=='path'][-1]['ws']; return w[-1]/w[2]
  sl,ss=spread('soft'),spread('strong')
  check('„Stark“ reagiert stärker als „Leicht“',ss>sl*2,f'leicht {sl:.2f} stark {ss:.2f}')
  pg.click('#viewBtn'); pg.click('#viewPop [data-vt=\"geraet\"]'); pg.click('#pressRow [data-press="off"]'); pg.keyboard.press('Escape')
  pg.evaluate(DRAW,['pen',ramp,300]); pg.wait_for_timeout(300)
  check('Druck aus: gleichmäßiger Strich','ws' not in [i for i in pg.evaluate(READ)['items'] if i['type']=='path'][-1])
  pg.click('#viewBtn'); pg.click('#viewPop [data-vt=\"geraet\"]'); pg.click('#pressRow [data-press="normal"]'); pg.click('#fingerBtn'); pg.keyboard.press('Escape')
  n=len([i for i in pg.evaluate(READ)['items'] if i['type']=='path']); pg.evaluate(DRAW,['touch',[0.5]*20,600]); pg.wait_for_timeout(300)
  check('Finger wieder eingeschaltet: zeichnet',len([i for i in pg.evaluate(READ)['items'] if i['type']=='path'])==n+1)
  pg.click('#viewBtn'); pg.wait_for_timeout(200); pg.screenshot(path=OUT+'/stift.png')
  # Glatter Umriss: keine Zacken (Kurvenstücke statt vieler Geradenstücke)
  pg.keyboard.press('Escape'); pg.click('#viewBtn'); pg.click('#viewPop [data-vt=\"geraet\"]'); pg.click('#pressRow [data-press="normal"]'); pg.keyboard.press('Escape')
  import random; random.seed(1); jitter=[0.4+random.uniform(-0.15,0.15) for _ in range(60)]
  pg.evaluate(DRAW,['pen',jitter,200]); pg.wait_for_timeout(300)
  d=pg.evaluate("()=>{const g=[...document.querySelectorAll('#items g.it')].pop(); const p=g.querySelectorAll('path')[1]; return p?p.getAttribute('d'):''}")
  check('Umriss aus weichen Kurven',d.count('Q')>20 and d.count('L')==0,d[:60])
  w=[i for i in pg.evaluate(READ)['items'] if i['type']=='path'][-1].get('ws',[])
  jumps=max(abs(w[i]-w[i-1]) for i in range(1,len(w))) if len(w)>2 else 0
  check('Breite schwankt bei zittrigem Druck kaum',jumps<0.12,f'größter Sprung {jumps:.3f}')
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
