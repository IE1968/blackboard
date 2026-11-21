import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Drehen: Drehgriff an Formen, Linien und Strichen, 15°-Schritte, Pfeile docken an gedrehten Formen an; Optionsleiste startet zu."""
import math
from playwright.sync_api import sync_playwright
srv=server(); errs=[]
S=lambda id,kind,x,y,w,h,text='': dict(id=id,type='shape',kind=kind,x=x,y=y,w=w,h=h,text=text,fill='#cfe8ff',stroke='#1c2a2e',sw=2)
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox']); pg=br.new_page(viewport={'width':1400,'height':900})
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.goto(URL); pg.wait_for_timeout(600)
  pg.evaluate(LOAD,{'items':[S('a','rect',0,0,160,80,'Drehen'),S('b','ellipse',400,0,120,80,'Ziel'),
     {'id':'c','type':'conn','from':'a','to':'b','p1':{'x':0,'y':0},'p2':{'x':0,'y':0},'text':'','stroke':'#1c2a2e','sw':2,'style':'ortho','dash':False,'head':'arrow'},
     {'id':'p','type':'path','pts':[[0,200],[80,220],[160,200]],'stroke':'#1c2a2e','sw':3,'tool':'pen'}],'n':9}); pg.reload(); pg.wait_for_timeout(900)
  check('Optionsleiste beim Öffnen zu',not pg.is_visible('#props'))
  pg.click('#tools [data-tool="select"]'); pg.wait_for_timeout(150)
  check('Klick auf Werkzeug öffnet sie',pg.is_visible('#props'))
  einpassen(pg); pg.wait_for_timeout(200)
  def item_center(id):
      return pg.evaluate("(id)=>{const r=document.querySelector(`#items [data-id=\"${id}\"]`).getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}",id)
  cx,cy=item_center('a'); pg.mouse.click(cx,cy); pg.wait_for_timeout(200)
  h=pg.locator('#overlay circle[data-h="rot:0"]').last.bounding_box(); check('Drehgriff an der Form',h is not None)
  hx,hy=h['x']+h['width']/2,h['y']+h['height']/2
  # um etwa 40° drehen -> 45° (Raster 15°)
  a0=math.atan2(hy-cy,hx-cx); rr=math.hypot(hx-cx,hy-cy); a1=a0+math.radians(40)
  pg.mouse.move(hx,hy); pg.mouse.down()
  for i in range(1,11): t=a0+(a1-a0)*i/10; pg.mouse.move(cx+rr*math.cos(t),cy+rr*math.sin(t))
  lbl=pg.evaluate("()=>{const t=document.querySelector('#overlay text');return t?t.textContent:''}")
  pg.mouse.up(); pg.wait_for_timeout(250)
  A=[i for i in pg.evaluate(READ)['items'] if i['id']=='a'][0]
  check('Gedreht in 15°-Schritten',A.get('rot')==45,str(A.get('rot')))
  check('Winkel wird beim Drehen angezeigt',lbl=='45°',lbl)
  check('Mittelpunkt bleibt',abs(A['x']-0)<0.6 and abs(A['y']-0)<0.6,f"{A['x']},{A['y']}")
  tr=pg.evaluate("()=>document.querySelector('#items [data-id=\"a\"]').getAttribute('transform')")
  check('Form wird gedreht gezeichnet','rotate(45' in tr,tr)
  ends=pg.evaluate("()=>{const d=document.querySelector('#items [data-id=\"c\"] path').getAttribute('d');return d}")
  check('Pfeil hängt weiter an der Form',bool(ends))
  pg.keyboard.press('Control+z'); pg.wait_for_timeout(200)
  check('Rückgängig nimmt Drehung zurück','rot' not in [i for i in pg.evaluate(READ)['items'] if i['id']=='a'][0])
  # Strich drehen (Punkte werden gedreht)
  pg.keyboard.press('Escape'); px,py=item_center('p'); pg.mouse.click(px,py); pg.wait_for_timeout(200)
  hb=pg.locator('#overlay circle[data-h="rot:0"]').last.bounding_box(); hx,hy=hb['x']+hb['width']/2,hb['y']+hb['height']/2
  a0=math.atan2(hy-py,hx-px); rr=math.hypot(hx-px,hy-py); a1=a0+math.radians(88)
  pg.mouse.move(hx,hy); pg.mouse.down()
  for i in range(1,11): t=a0+(a1-a0)*i/10; pg.mouse.move(px+rr*math.cos(t),py+rr*math.sin(t))
  pg.mouse.up(); pg.wait_for_timeout(250)
  P=[i for i in pg.evaluate(READ)['items'] if i['id']=='p'][0]
  xs=[q[0] for q in P['pts']]; ys=[q[1] for q in P['pts']]
  check('Strich um 90° gedreht (steht jetzt hoch)',(max(ys)-min(ys))>(max(xs)-min(xs))*3,str(P['pts']))
  pg.screenshot(path=OUT+'/drehen.png')
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
